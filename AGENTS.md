# Project conventions

- Keep market-specific intake in country configuration and share deterministic affordability calculations between the wizard, officer review, and Edge Function so the same inputs produce the same results.
- Keep uncalibrated country scoring advisory; do not turn indicative scores or document extraction into automated eligibility or verified lender data.
- Share Gabon evidence-readiness rules between officer review and Grace; build Grace’s Gabon context from tenant-scoped records so both use the same current evidence.
