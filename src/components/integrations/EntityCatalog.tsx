import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Smartphone,
  Zap,
  Users,
  Shield,
  Wallet,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Check,
  Loader2,
  TestTube,
  Unplug,
  Info,
  KeyRound,
  Rocket,
  Globe,
} from "lucide-react";
import {
  IntegrationEntity,
  entityTypeOrder,
  getEntityTypeLabel,
  getEntitiesByCountry,
} from "./countryIntegrationRegistry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CredentialInputDialog from "./CredentialInputDialog";

interface EntityCatalogProps {
  country: string;
  integrations: any[];
  onRefresh: () => void;
  onEntitySelect?: (entity: IntegrationEntity) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  bank: Building2,
  mno: Smartphone,
  utility: Zap,
  credit_union: Users,
  bureau: Shield,
  fintech: Wallet,
};

const statusStyles: Record<string, string> = {
  disconnected: "bg-muted/50 text-muted-foreground border-border",
  connecting: "bg-warning/20 text-warning border-warning/30",
  sandbox_testing: "bg-accent/20 text-accent border-accent/30",
  connected: "bg-success/20 text-success border-success/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
};

const EntityCatalog = ({ country, integrations, onRefresh, onEntitySelect }: EntityCatalogProps) => {
  const [expandedTypes, setExpandedTypes] = useState<string[]>(["bank", "mno"]);
  const [loadingEntity, setLoadingEntity] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});
  const [expandedTests, setExpandedTests] = useState<string | null>(null);
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credEntity, setCredEntity] = useState<IntegrationEntity | null>(null);
  const [credLoading, setCredLoading] = useState(false);

  const entities = getEntitiesByCountry(country);
  const grouped = entityTypeOrder
    .map((type) => ({
      type,
      items: entities.filter((e) => e.type === type),
    }))
    .filter((g) => g.items.length > 0);

  const getIntegration = (entityName: string, env = "sandbox") => {
    return integrations.find((i: any) => i.entity_name === entityName && i.environment === env);
  };

  const getIntegrationStatus = (entityName: string) => {
    const found = integrations.find((i: any) => i.entity_name === entityName && i.environment === "sandbox");
    return found?.status || "disconnected";
  };

  const getIntegrationId = (entityName: string) => {
    return integrations.find((i: any) => i.entity_name === entityName && i.environment === "sandbox")?.id;
  };

  const hasProductionConfig = (entityName: string) => {
    const prod = integrations.find((i: any) => i.entity_name === entityName && i.environment === "production");
    return prod?.status === "connected";
  };

  const hasCredentials = (entityName: string) => {
    const config = integrations.find((i: any) => i.entity_name === entityName && i.environment === "sandbox");
    const creds = config?.credentials_encrypted;
    return creds && typeof creds === "object" && Object.keys(creds).length > 0;
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleConnect = async (entity: IntegrationEntity) => {
    setLoadingEntity(entity.name);
    try {
      const { data, error } = await supabase.functions.invoke("integration-agent", {
        body: { action: "connect", entity_name: entity.name, entity_type: entity.type, country },
      });
      if (error) throw error;
      toast({ title: "Connected", description: `${entity.name} sandbox connection established.` });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingEntity(null);
    }
  };

  const handleTest = async (entity: IntegrationEntity) => {
    const integrationId = getIntegrationId(entity.name);
    if (!integrationId) return;
    setLoadingEntity(entity.name);
    try {
      const { data, error } = await supabase.functions.invoke("integration-agent", {
        body: { action: "test", integration_id: integrationId },
      });
      if (error) throw error;
      const tests = data?.tests || [];
      toast({
        title: `✅ All ${tests.length} Sandbox Tests Passed — ${entity.name}`,
        description: `${tests.length} tests completed successfully`,
      });
      setTestResults((prev) => ({ ...prev, [entity.name]: tests }));
      onRefresh();
    } catch (e: any) {
      toast({ title: "Test Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingEntity(null);
    }
  };

  const handleDisconnect = async (entity: IntegrationEntity) => {
    const integrationId = getIntegrationId(entity.name);
    if (!integrationId) return;
    setLoadingEntity(entity.name);
    try {
      await supabase.functions.invoke("integration-agent", {
        body: { action: "disconnect", integration_id: integrationId },
      });
      toast({ title: "Disconnected", description: `${entity.name} has been disconnected.` });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingEntity(null);
    }
  };

  const handleOpenCredentials = (entity: IntegrationEntity) => {
    setCredEntity(entity);
    setCredDialogOpen(true);
  };

  const handleSaveCredentials = async (credentials: Record<string, string>, apiBaseUrl: string) => {
    if (!credEntity) return;
    const integrationId = getIntegrationId(credEntity.name);
    if (!integrationId) return;
    setCredLoading(true);
    try {
      const { error } = await supabase.functions.invoke("integration-agent", {
        body: {
          action: "save_credentials",
          integration_id: integrationId,
          credentials,
          api_base_url: apiBaseUrl,
          entity_name: credEntity.name,
        },
      });
      if (error) throw error;
      toast({
        title: "🔐 Credentials Saved",
        description: `${Object.keys(credentials).length} credentials encrypted and stored for ${credEntity.name}.`,
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCredLoading(false);
    }
  };

  const handlePromote = async (entity: IntegrationEntity) => {
    const integrationId = getIntegrationId(entity.name);
    if (!integrationId) return;
    setLoadingEntity(entity.name);
    try {
      const { data, error } = await supabase.functions.invoke("integration-agent", {
        body: { action: "promote", integration_id: integrationId },
      });
      if (error) throw error;
      toast({
        title: "🚀 Promoted to Production",
        description: `${entity.name} is now live at ${data?.api_base_url}`,
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Promotion Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingEntity(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {grouped.map((group) => {
          const Icon = typeIcons[group.type] || Building2;
          const isExpanded = expandedTypes.includes(group.type);
          const connectedCount = group.items.filter(
            (e) => getIntegrationStatus(e.name) === "connected" || getIntegrationStatus(e.name) === "sandbox_testing"
          ).length;
          const prodCount = group.items.filter((e) => hasProductionConfig(e.name)).length;

          return (
            <div key={group.type} className="border border-border rounded-xl overflow-hidden bg-card/50">
              <button
                onClick={() => toggleType(group.type)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground flex-1 text-left">
                  {getEntityTypeLabel(group.type)}
                </span>
                <Badge variant="outline" className="text-[10px] bg-muted/30">
                  {connectedCount}/{group.items.length}
                </Badge>
                {prodCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    {prodCount} live
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border/50">
                  {group.items.map((entity) => {
                    const status = getIntegrationStatus(entity.name);
                    const isLoading = loadingEntity === entity.name;
                    const isProd = hasProductionConfig(entity.name);
                    const hasCreds = hasCredentials(entity.name);
                    const sandboxConfig = getIntegration(entity.name, "sandbox");

                    return (
                      <div key={entity.name}>
                        <div
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group cursor-pointer"
                          onClick={() => {
                            if (testResults[entity.name]?.length) {
                              setExpandedTests(expandedTests === entity.name ? null : entity.name);
                            }
                          }}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{entity.name}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground/60 shrink-0 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">{entity.description}</p>
                                  <p className="text-[10px] mt-1 text-muted-foreground">
                                    API: {entity.apiType} · {entity.endpoints.length} endpoints · Credentials: {entity.requiredCredentials.join(", ")}
                                  </p>
                                  {sandboxConfig?.api_base_url && (
                                    <p className="text-[10px] mt-1 text-primary font-mono">
                                      Base URL: {sandboxConfig.api_base_url}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] text-muted-foreground truncate">{entity.category}</p>
                              {sandboxConfig?.api_base_url && (
                                <Globe className="h-2.5 w-2.5 text-primary/60" />
                              )}
                            </div>
                          </div>

                          {/* Status badges */}
                          <Badge variant="outline" className={`text-[10px] ${statusStyles[status]}`}>
                            {status === "connected" && <Check className="h-2.5 w-2.5 mr-1" />}
                            {status.replace("_", " ")}
                          </Badge>

                          {isProd && (
                            <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30 font-semibold">
                              <Rocket className="h-2.5 w-2.5 mr-1" /> LIVE
                            </Badge>
                          )}

                          {hasCreds && !isProd && (
                            <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                              <KeyRound className="h-2.5 w-2.5 mr-1" /> creds
                            </Badge>
                          )}

                          {testResults[entity.name]?.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                              {testResults[entity.name].length} tests ✓
                            </Badge>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {status === "disconnected" && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleConnect(entity)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Connect"}
                              </Button>
                            )}
                            {(status === "connecting" || status === "sandbox_testing") && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleTest(entity)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><TestTube className="h-3 w-3" /> Test</>}
                              </Button>
                            )}
                            {status === "connected" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleTest(entity)} disabled={isLoading}>
                                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><TestTube className="h-3 w-3" /> Re-test</>}
                                </Button>
                                {!isProd && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] gap-1 border-warning/50 text-warning hover:bg-warning/10"
                                      onClick={() => handleOpenCredentials(entity)}
                                      disabled={isLoading}
                                    >
                                      <KeyRound className="h-3 w-3" /> {hasCreds ? "Update" : "Creds"}
                                    </Button>
                                    {hasCreds && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] gap-1 border-primary/50 text-primary hover:bg-primary/10"
                                        onClick={() => handlePromote(entity)}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Rocket className="h-3 w-3" /> Go Live</>}
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-muted-foreground" onClick={() => handleDisconnect(entity)} disabled={isLoading}>
                                  <Unplug className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded test results panel */}
                        {expandedTests === entity.name && testResults[entity.name]?.length > 0 && (
                          <div className="px-4 pb-3 bg-muted/10">
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                              <div className="px-3 py-2 bg-muted/30 border-b border-border/50">
                                <span className="text-[11px] font-semibold text-foreground">
                                  Sandbox Test Results — {entity.name}
                                </span>
                              </div>
                              <div className="divide-y divide-border/30">
                                {testResults[entity.name].map((t: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 px-3 py-1.5">
                                    <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[11px] font-medium text-foreground">{t.test}</span>
                                      <p className="text-[10px] text-muted-foreground">{t.detail}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{t.latency_ms}ms</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CredentialInputDialog
        open={credDialogOpen}
        onOpenChange={setCredDialogOpen}
        entity={credEntity}
        onSave={handleSaveCredentials}
        loading={credLoading}
      />
    </>
  );
};

export default EntityCatalog;
