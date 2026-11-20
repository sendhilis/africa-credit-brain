# Project conventions

- Keep market-specific intake in country configuration and share deterministic affordability calculations between the wizard, officer review, and Edge Function so the same inputs produce the same results.
- Treat uncalibrated model probabilities and recommendations as advisory; do not turn scores or document extraction into automated eligibility or verified lender data.
- Share Gabon evidence-readiness rules between officer review and Grace; build Grace’s Gabon context from tenant-scoped records so both use the same current evidence.
- Keep production scorecard math, display weights, bands, and recommendation thresholds in the pure shared scorecard module so scoring, Grace, and regression tests use the same rules.
- Adapt local intake to standard scorecard inputs without adding country-specific score math, so net cash flow and repayment periods retain their meaning.
