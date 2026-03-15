import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, KeyRound, ShieldCheck, Eye, EyeOff, Globe } from "lucide-react";
import { IntegrationEntity } from "./countryIntegrationRegistry";

interface CredentialInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: IntegrationEntity | null;
  onSave: (credentials: Record<string, string>, apiBaseUrl: string) => Promise<void>;
  loading: boolean;
}

const CredentialInputDialog = ({
  open,
  onOpenChange,
  entity,
  onSave,
  loading,
}: CredentialInputDialogProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setCredentials({});
      setApiBaseUrl("");
      setShowFields({});
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    await onSave(credentials, apiBaseUrl);
    handleOpen(false);
  };

  const allFilled = entity?.requiredCredentials.every(
    (c) => credentials[c]?.trim()
  ) && apiBaseUrl.trim();

  if (!entity) return null;

  const formatLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <KeyRound className="h-5 w-5 text-primary" />
            Production Credentials — {entity.name}
          </DialogTitle>
          <DialogDescription>
            Enter your real API credentials for <strong>{entity.name}</strong>.
            These will be encrypted at rest and used only for production API calls.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* API Base URL */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Globe className="h-3.5 w-3.5 text-primary" />
              API Base URL
            </Label>
            <Input
              placeholder={`https://api.${entity.name.toLowerCase().replace(/\s+/g, "")}.co.zw/v1`}
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="font-mono text-xs bg-muted/30 border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              The root URL for {entity.name}'s production API (e.g. https://api.example.com)
            </p>
          </div>

          {/* Credential fields */}
          {entity.requiredCredentials.map((credKey) => (
            <div key={credKey} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {formatLabel(credKey)}
              </Label>
              <div className="relative">
                <Input
                  type={showFields[credKey] ? "text" : "password"}
                  placeholder={`Enter ${formatLabel(credKey)}`}
                  value={credentials[credKey] || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [credKey]: e.target.value }))
                  }
                  className="pr-10 font-mono text-xs bg-muted/30 border-border"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowFields((prev) => ({ ...prev, [credKey]: !prev[credKey] }))
                  }
                >
                  {showFields[credKey] ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Endpoint preview */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">
              Endpoints that will be available in production:
            </p>
            <div className="space-y-1">
              {entity.endpoints.map((ep) => (
                <div key={ep.name} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono w-12 justify-center ${
                      ep.method === "POST"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-accent/10 text-accent border-accent/30"
                    }`}
                  >
                    {ep.method}
                  </Badge>
                  <span className="text-[11px] font-mono text-foreground truncate">
                    {ep.path}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!allFilled || loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Save & Encrypt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialInputDialog;
