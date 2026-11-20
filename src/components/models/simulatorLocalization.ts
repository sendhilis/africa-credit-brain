import { countryConfigs } from "@/components/application/countryConfig";

/** Relabels simulator features for a market. WoE values and β are never changed, so scores stay comparable. */
export function localizeFeatures<T extends { key: string; label: string; bins: { label: string; woe: number }[] }>(
  features: T[],
  country: string,
): T[] {
  const cfg = countryConfigs[country];
  if (!cfg || country === "zimbabwe") return features;
  const wallet = cfg.wallets.slice(0, 2).join(" / ") || "Mobile money";
  const utility = cfg.utilities.slice(0, 2).join(" / ") || "utilities";
  const tax = cfg.taxId?.label ?? cfg.businessRegistration.label;
  const savings = country === "gabon" || country === "senegal" || country === "mali" ? "Tontine / Savings Group" : "Savings Group / Chama / ROSCA";
  const binOverrides: Record<string, string[]> = {
    geographic_risk: [`Urban — capital city CBD`, "Urban — secondary city", "Peri-urban / growth centre", "Rural — village / customary land", "Remote / settlement area"],
    climate_risk_region: ["High rainfall zone (>1000mm)", "Good rainfall zone (750-1000mm)", "Moderate rainfall (650-800mm)", "Semi-arid (450-650mm)", "Arid / drought-prone (<450mm)"],
    land_tenure: ["Title deed (freehold)", "Long-term registered lease", "Government allocation / permit", "Customary land (traditional allocation)", "Leased / rented land", "No formal tenure"],
  };
  return features.map((f) => {
    let label = f.label
      .replace(/ZimRA/g, tax)
      .replace(/ZESA\/TelOne/g, utility)
      .replace(/EcoCash/g, wallet)
      .replace(/Mukando \/ Savings Club/g, savings);
    const over = binOverrides[f.key];
    const bins = over && over.length === f.bins.length ? f.bins.map((b, i) => ({ ...b, label: over[i] })) : f.bins.map((b) => ({ ...b, label: b.label.replace(/EcoCash/g, wallet).replace(/Harare \/ Bulawayo/g, "capital city") }));
    if (label === f.label && !over) return { ...f, bins };
    return { ...f, label, bins };
  });
}

export const SIMULATOR_COUNTRIES = Object.entries(countryConfigs)
  .map(([value, c]) => ({ value, label: c.label, currency: c.currency }))
  .sort((a, b) => a.label.localeCompare(b.label));

