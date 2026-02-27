import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  country: string;
  products: number;
  status: string;
}

interface Props {
  institution: Institution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const InstitutionSettingsDialog = ({ institution, open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", status: "", products: 0 });

  useEffect(() => {
    if (institution) {
      setForm({
        name: institution.name,
        country: institution.country,
        status: institution.status,
        products: institution.products,
      });
    }
  }, [institution]);

  const handleSave = async () => {
    if (!institution) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("institutions")
        .update({
          name: form.name,
          country: form.country,
          status: form.status,
          products: form.products,
        })
        .eq("id", institution.id);
      if (error) throw error;
      toast({ title: "Institution updated", description: `${form.name} settings saved.` });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Institution Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Institution Name</Label>
            <Input
              className="mt-1 bg-muted/50 border-border"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Input
              className="mt-1 bg-muted/50 border-border"
              value={form.country}
              onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Number of Products</Label>
            <Input
              type="number"
              min={0}
              className="mt-1 bg-muted/50 border-border"
              value={form.products}
              onChange={(e) => setForm(f => ({ ...f, products: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionSettingsDialog;
