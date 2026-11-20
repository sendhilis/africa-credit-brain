import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  LayoutGrid,
  MessageSquareText,
  Activity,
  Building2,
  Smartphone,
  Zap,
  Users,
  Shield,
  Wallet,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryOptions, getEntitiesByCountry, entityTypeOrder, getEntityTypeLabel } from "@/components/integrations/countryIntegrationRegistry";
import EntityCatalog from "@/components/integrations/EntityCatalog";
import IntegrationAIChat from "@/components/integrations/IntegrationAIChat";
import AgentObservationWindow from "@/components/integrations/AgentObservationWindow";

const typeIcons: Record<string, React.ElementType> = {
  bank: Building2,
  mno: Smartphone,
  utility: Zap,
  credit_union: Users,
  bureau: Shield,
  fintech: Wallet,
};

const Integrations = () => {
  const [country, setCountry] = useState("ZW");
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchIntegrations = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("integration-agent", {
        body: { action: "list" },
      });
      if (data && Array.isArray(data)) setIntegrations(data);
    } catch (e) {
      console.error("Failed to fetch integrations:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleRefresh = () => {
    fetchIntegrations();
    setRefreshTrigger((p) => p + 1);
  };

  const entities = getEntitiesByCountry(country);
  const countryIntegrations = integrations.filter((i) => i.country === country);
  const connectedCount = countryIntegrations.filter(
    (i) => i.status === "connected" || i.status === "sandbox_testing"
  ).length;

  // Stats by type
  const typeStats = entityTypeOrder
    .map((type) => {
      const total = entities.filter((e) => e.type === type).length;
      const connected = countryIntegrations.filter(
        (i) => i.entity_type === type && (i.status === "connected" || i.status === "sandbox_testing")
      ).length;
      return { type, total, connected };
    })
    .filter((s) => s.total > 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zero-code integration hub — connect to banks, MNOs, utilities & bureaus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <Globe className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getCountryOptions().map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-3 lg:grid-cols-6">
        {typeStats.map((stat) => {
          const Icon = typeIcons[stat.type] || Building2;
          return (
            <GlassCard key={stat.type} className="!p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {getEntityTypeLabel(stat.type)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{stat.connected}</span>
                <span className="text-xs text-muted-foreground">/ {stat.total}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Main content */}
      {country === "GA" ? (
        <section className="rounded-lg border border-border p-5 space-y-3" aria-label="Gabon data sources">
          <h2 className="font-display text-lg font-semibold">Gabon data sources</h2>
          <p className="text-sm text-muted-foreground">Gabon applications accept uploaded evidence. No live provider connections are configured.</p>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="font-medium">Mobile money</dt><dd className="text-muted-foreground">Airtel Money, Moov Money</dd></div>
            <div><dt className="font-medium">Utilities</dt><dd className="text-muted-foreground">SEEG electricity and water</dd></div>
            <div><dt className="font-medium">Banking and microfinance</dt><dd className="text-muted-foreground">Bank statements and licensed EMF repayment records</dd></div>
            <div><dt className="font-medium">Credit history</dt><dd className="text-muted-foreground">Reports obtained through authorized lender channels</dd></div>
          </dl>
        </section>
      ) : <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="catalog" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <LayoutGrid className="h-3.5 w-3.5" /> Entity Catalog
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <MessageSquareText className="h-3.5 w-3.5" /> AI Agent
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Activity className="h-3.5 w-3.5" /> Agent Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EntityCatalog
              country={country}
              integrations={countryIntegrations}
              onRefresh={handleRefresh}
            />
          )}
        </TabsContent>

        <TabsContent value="agent">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[600px]">
            <div className="lg:col-span-3 h-full">
              <IntegrationAIChat
                country={getCountryOptions().find((c) => c.code === country)?.name || country}
                selectedEntities={[]}
                currentIntegrations={countryIntegrations}
              />
            </div>
            <div className="lg:col-span-2 h-full overflow-auto">
              <AgentObservationWindow refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <AgentObservationWindow refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>}
    </DashboardLayout>
  );
};

export default Integrations;
