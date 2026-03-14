import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
  existingDocuments: any[];
  onDocumentAdded: () => void;
}

export default function AdditionalDocumentUpload({ applicationId, institutionId, existingDocuments, onDocumentAdded }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      setUploading(false);
      setExtracting(true);

      // 3. Run OCR extraction
      const { data: extractResult, error: extractError } = await supabase.functions.invoke("extract-document", {
        body: {
          application_id: applicationId,
          institution_id: institutionId,
          document_type: docType,
          storage_path: filePath,
        },
      });

      if (extractError) {
        console.error("Extraction error:", extractError);
        toast({ title: "Document uploaded", description: "File saved but OCR extraction failed. You can still re-score.", variant: "destructive" });
      } else {
        toast({
          title: "Document added successfully",
          description: `${DOCUMENT_TYPES.find(d => d.value === docType)?.label} uploaded and processed. Click Re-Score to include it.`,
        });
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
            {DOCUMENT_TYPES.map(dt => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
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
            className="flex-1 gap-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-3.5 w-3.5" />
            {selectedFile ? selectedFile.name : "Choose File"}
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
                Upload & Extract
              </>
            )}
          </Button>
        </div>

        {uploadStatus === "success" && (
          <div className="flex items-center gap-2 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Document added. Click <strong>Re-Score</strong> above to include it in the credit assessment.
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
