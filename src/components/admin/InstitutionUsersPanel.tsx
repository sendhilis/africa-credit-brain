import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import GlassCard from "@/components/GlassCard";
import { UserPlus, Users, Loader2, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface InstitutionUser {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-primary/15 text-primary border-primary/30" },
  credit_officer: { label: "Credit Officer", color: "bg-accent/15 text-accent border-accent/30" },
  underwriter: { label: "Underwriter", color: "bg-warning/15 text-warning border-warning/30" },
  viewer: { label: "Viewer", color: "bg-muted/50 text-muted-foreground border-border" },
};

const InstitutionUsersPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", password: "", display_name: "", role: "credit_officer" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-institution-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.password) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-institution-users", {
        body: { action: "invite", ...inviteForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User invited", description: `${inviteForm.email} added as ${ROLE_CONFIG[inviteForm.role]?.label || inviteForm.role}` });
      setInviteForm({ email: "", password: "", display_name: "", role: "credit_officer" });
      setInviteOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-institution-users", {
        body: { action: "update_role", user_id: userId, new_role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Role updated" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRemove = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-institution-users", {
        body: { action: "remove", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User removed", description: `${email} has been removed from the institution.` });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <GlassCard hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Institution Users
        </h2>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-glass-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Display Name</Label>
                <Input
                  placeholder="John Doe"
                  className="mt-1 bg-muted/50 border-border"
                  value={inviteForm.display_name}
                  onChange={(e) => setInviteForm(f => ({ ...f, display_name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email *</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  className="mt-1 bg-muted/50 border-border"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Temporary Password *</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  className="mt-1 bg-muted/50 border-border"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role *</Label>
                <Select value={inviteForm.role} onValueChange={(v) => setInviteForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_officer">Credit Officer</SelectItem>
                    <SelectItem value="underwriter">Underwriter</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2" onClick={handleInvite} disabled={inviting}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {inviting ? "Creating..." : "Create & Invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No users found. Invite your first team member.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User", "Email", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.viewer;
                const isSelf = u.user_id === user?.id;
                return (
                  <tr key={u.user_id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-foreground">
                      {u.display_name}
                      {isSelf && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                    </td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">
                      {isSelf ? (
                        <Badge variant="outline" className={rc.color}>{rc.label}</Badge>
                      ) : (
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.user_id, v)}>
                          <SelectTrigger className="h-7 w-[140px] text-xs bg-muted/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="credit_officer">Credit Officer</SelectItem>
                            <SelectItem value="underwriter">Underwriter</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3">
                      {!isSelf && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove <strong>{u.display_name}</strong> ({u.email}) from the institution. They will lose access to all data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleRemove(u.user_id, u.email)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
};

export default InstitutionUsersPanel;
