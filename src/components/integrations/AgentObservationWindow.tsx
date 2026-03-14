import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AgentObservationWindowProps {
  refreshTrigger: number;
}

const AgentObservationWindow = ({ refreshTrigger }: AgentObservationWindowProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data } = await supabase.functions.invoke("integration-agent", {
        body: { action: "tasks", limit: 15 },
      });
      if (data && Array.isArray(data)) setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running": return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const taskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      connect: "🔗 Connect",
      test: "🧪 Test",
      configure: "⚙️ Configure",
      diagnose: "🔍 Diagnose",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Agent Activity</h3>
        <Badge variant="outline" className="ml-auto text-[10px] bg-muted/30">
          {tasks.length} tasks
        </Badge>
      </div>

      <ScrollArea className="max-h-[400px]">
        {tasks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No agent activity yet. Start by connecting an entity.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {tasks.map((task) => (
              <div key={task.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon(task.status)}
                  <span className="text-xs font-medium text-foreground">{task.entity_name}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto bg-muted/30">
                    {taskTypeLabel(task.task_type)}
                  </Badge>
                </div>

                {/* Steps */}
                {task.steps && Array.isArray(task.steps) && task.steps.length > 0 && (
                  <div className="ml-5 mt-2 space-y-1">
                    {(task.steps as any[]).slice(0, 4).map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px]">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
                        ) : step.status === "running" ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-primary shrink-0" />
                        ) : (
                          <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-muted-foreground">{step.step}</span>
                        {step.detail && (
                          <span className="text-muted-foreground/60 truncate">— {step.detail}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Test results */}
                {task.result?.tests && (
                  <div className="ml-5 mt-2 space-y-0.5">
                    {(task.result.tests as any[]).map((test: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px]">
                        {test.status === "passed" ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5 text-destructive shrink-0" />
                        )}
                        <span className="text-muted-foreground">{test.test}</span>
                        <span className="text-muted-foreground/50 text-[10px]">{test.latency_ms}ms</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/50 mt-1 ml-5">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default AgentObservationWindow;
