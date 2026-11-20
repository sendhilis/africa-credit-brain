import { assessGabonAffordability } from "../../../supabase/functions/_shared/gabon-credit";

export default function GabonAffordability({ category, values }: { category: string; values: Record<string, unknown> }) {
  const result = assessGabonAffordability(category, values);
  const xaf = (value: number | null) => value === null ? "—" : `${new Intl.NumberFormat("fr-GA", { maximumFractionDigits: 0 }).format(value)} XAF`;
  return (
    <section aria-label="Gabon affordability" className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">Gabon affordability · {result.period === "cycle" ? "Production cycle" : "Monthly"}</h3>
      {result.missing.length > 0 ? (
        <p className="text-sm text-muted-foreground">Missing or invalid: {result.missing.join("; ")}.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[["Cash inflows", xaf(result.cashIn)], ["Cash costs before debt", xaf(result.cashCosts)], ["Total debt payments", xaf(result.debt)], ["Cash after debt payments", xaf(result.surplus)], ["Debt service coverage", result.dscr === null ? "—" : `${result.dscr.toFixed(2)}×`]].map(([label, value]) => (
            <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>
          ))}
        </dl>
      )}
      {result.timingRisk && <p className="text-sm font-medium text-warning">The first payment falls before expected farm receipts. Verify a bridge income source or revise the schedule.</p>}
      <p className="text-xs text-muted-foreground">Based on declared figures. Confirm costs, cash receipts and repayment terms before making a decision.</p>
    </section>
  );
}
