import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { getGabonDocuments, requiresGabonOcr } from "./gabonDocuments";

const DOCUMENT_TYPES = [
  { value: "bank_statement", label: "Bank Statement" },
  { value: "pos_statement", label: "POS / Till Statement" },
  { value: "financial_statement", label: "Financial Statement" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "trade_license", label: "Trade / Business License" },
  { value: "id_copy", label: "ID Document" },
  { value: "ecocash_statement", label: "EcoCash Statement" },
  { value: "payslip", label: "Payslip" },
  { value: "other", label: "Other Supporting Document" },
];

interface Props {
  applicationId: string;
  institutionId: string;
  gabonCategory?: string;
  existingDocuments: any[];
  onDocumentAdded: () => void;
}

export default function AdditionalDocumentUpload({ applicationId, institutionId, gabonCategory, existingDocuments, onDocumentAdded }: Props) {
  const types = gabonCategory ? getGabonDocuments(gabonCategory).map(doc => ({ value: doc.key, label: doc.title })) : DOCUMENT_TYPES;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const shouldExtract = !gabonCategory || requiresGabonOcr(docType);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (gabonCategory && !/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
        toast({ title: "Unsupported file", description: "Upload a PDF, JPEG, PNG or WEBP document.", variant: "destructive" });
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setUploadStatus("idle");
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile || !docType) {
      toast({ title: "Missing info", description: "Select a document type and file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to storage
      const filePath = `${institutionId}/${applicationId}/${docType}_${Date.now()}.${selectedFile.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("application-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Append to application documents array
      const newDoc = { type: docType, storage_path: filePath, uploaded_at: new Date().toISOString(), is_additional: true };
      const updatedDocs = [...(existingDocuments || []), newDoc];

      const { error: updateError } = await supabase
        .from("applications")
        .update({ documents: updatedDocs as any })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      if (shouldExtract) {
        // 3. Create document_extractions row first (the edge function reads from it)
        const { data: extractionRow, error: insertExtError } = await supabase
          .from("document_extractions")
          .insert({
            application_id: applicationId,
            institution_id: institutionId,
            document_type: docType,
            storage_path: filePath,
            extraction_status: "pending",
          })
          .select("id")
          .single();

        if (insertExtError) throw insertExtError;

        setUploading(false);
        setExtracting(true);

        // 4. Run OCR extraction with the extraction_id
        const { data: extractResult, error: extractError } = await supabase.functions.invoke("extract-document", {
          body: { extraction_id: extractionRow.id },
        });

        if (extractError || extractResult?.success === false) {
          console.error("Extraction error:", extractError);
          toast({ title: "Document uploaded", description: extractResult?.error || extractResult?.validation_reason || "File saved but OCR extraction failed.", variant: "destructive" });
        } else {
          toast({
            title: "Document added successfully",
            description: `${types.find(d => d.value === docType)?.label} uploaded and processed.`,
          });
        }
      } else {
        toast({ title: "Document saved for officer review" });
      }
      setUploadStatus("success");
      setSelectedFile(null);
      setDocType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onDocumentAdded();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setUploadStatus("error");
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const isProcessing = uploading || extracting;

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <div className="flex items-center gap-2 mb-3">
        <FileUp className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Add Supporting Document</span>
        <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
          Post-Score
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <Select value={docType} onValueChange={setDocType} disabled={isProcessing}>
          <SelectTrigger className="bg-muted/50 border-border text-sm">
            <SelectValue placeholder="Select document type..." />
          </SelectTrigger>
          <SelectContent>
            {types.map(dt => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 flex-1 gap-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="truncate">{selectedFile ? selectedFile.name : "Choose File"}</span>
          </Button>

          <Button
            size="sm"
            className="gap-2"
            onClick={handleUploadAndExtract}
            disabled={!selectedFile || !docType || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {uploading ? "Uploading…" : "Extracting…"}
              </>
            ) : (
              <>
                <FileUp className="h-3.5 w-3.5" />
                {shouldExtract ? "Upload & Extract" : "Upload for Review"}
              </>
            )}
          </Button>
        </div>

        {uploadStatus === "success" && (
          <div className="flex items-center gap-2 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {gabonCategory ? "Document added to the evidence for officer review." : <>Document added. Click <strong>Re-Score</strong> above to include it in the credit assessment.</>}
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            Upload failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
