import { ReactNode, useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2 } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [institutionId, setInstitutionId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("user_id", user.id)
        .single();
      setInstitutionId(data?.institution_id ?? null);
    };
    check();
  }, [user]);

  const showWarning = institutionId === null;
  const checking = institutionId === undefined;

  return (
    <div className="min-h-screen africa-gradient continent-bg">
      <AppSidebar />
      <main className="ml-[240px] min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">
          {checking ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : showWarning ? (
            <div className="mx-auto max-w-lg mt-20">
              <Alert className="border-warning/30 bg-warning/10">
                <Building2 className="h-5 w-5 text-warning" />
                <AlertTitle className="text-warning font-semibold">No institution linked</AlertTitle>
                <AlertDescription className="text-warning/80 mt-1">
                  Your account is not linked to an institution yet. Please contact your administrator to be added to an institution and assigned a role (Credit Officer, Underwriter, or Viewer).
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
