// Redact identifiers and free-text transaction labels, which can repeat them.
const SENSITIVE_KEY = /^(?:.*_)?(?:name|holder|beneficiary|counterparty|description|memo|narration|source|gender|dob|birth_date|date_of_birth|address|email|phone(?:_number)?|msisdn|national_id|id_number|passport_number|account_number|registration_number|tax_id|customer_id|meter_number|reference(?:_number)?)$/i;

export function redactPII(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPII);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      const normalized = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_");
      return [key, SENSITIVE_KEY.test(normalized) ? "[redacted]" : redactPII(item)];
    }));
  }
  return value;
}
