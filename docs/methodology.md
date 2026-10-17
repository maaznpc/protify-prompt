# Pricing and data contracts

Nearmint analyzes **observed asking prices**, in PKR. It does not infer transaction prices, confirmed availability, seller identity, or depreciation of an individual device.

## Normalization

Ordered, deterministic regex and token rules recognize supported model families. Aliases such as `ip12`, `i phone 13`, and `iphone12promax` are normalized before extracting suffixes. Storage picks the largest recognized GB/TB capacity so laptop RAM is not mistaken for SSD capacity. Missing fields remain unknown.

Non-PTA, JV, SIM-locked, and bypass terms take precedence over a positive substring match. Contradictory PTA claims are excluded even if a manual override tries to mark the phone approved. Device-damage terms cannot be overridden into a working-device condition. Common negations of cosmetic flaws are handled before condition matching. This is a bounded rule set, not general natural-language understanding.

Parts/repair, wanted, accessories-only, and installment/down-payment ads are excluded. Incomplete model, storage, city, condition, or phone PTA details are excluded. Original text remains available for inspection; parsing does not verify its truth.

## Identity and repeated observations

Canonical http/https URLs have fragments and common tracking parameters removed and query parameters sorted. URLs with embedded credentials and non-http schemes are rejected. A URL is the strongest listing identity. Without one, source, seller, city, and normalized original title form the identity; price is additionally used when seller is missing. Identity is hashed only to create a local key, not to prove anonymity or detect fraud.

Same-key observations merge in chronological order. An exact timestamp/price duplicate is skipped. A fresh import without a timestamp records a fresh observation. Different sellers with identical titles stay separate. Similar photos or differently worded cross-source reposts are not detected.

## Current comparable estimate

1. Match exact model, storage, PTA status, condition, and city.
2. Exclude the candidate itself and all ineligible ads.
3. Take each peer's latest observation at or before the evaluation time. Require it to be no older than 30 days.
4. For 8 or more peers, compute interpolated Q1 and Q3. Exclude prices below `Q1 − 1.5 × spread` or above `Q3 + 1.5 × spread`, where `spread = max(Q3 − Q1, 5% of the peer median)`. The floor avoids over-filtering identical round-number prices.
5. With at least 3 peers remaining, report their median and middle-50% range. Below that, do not report a market median.

Evidence is called limited for 3–4 peers, moderate for 5–9, and strong for 10 or more. These are sample-size descriptions, not statistical guarantees of representativeness.

A **below-market** label requires at least 5 peers and a discount of 12% or more. A price more than 45% below the median goes to review. A price more than 10% above is labeled above market. All remaining sufficiently evidenced prices are fairly priced. Older and incomplete observations have separate labels.

## Historical chart

Select the largest exact comparable cohort for the chosen model and city. Under All cities, a single cohort is still used and its city is displayed; cities are never silently pooled. Each day evaluates only observations available by that day. An observation carries forward for at most 14 days. Apply the same outlier method and require 3 listings per point. Missing evidence creates a chart gap.

The dashed line averages the available median points in the current and previous 6 calendar days, with at least 3 non-null points. It does not interpolate missing values. The percentage compares the first available median in the selected window to the latest day's median. All chart history is asking-price history.

## Alerts and resale estimates

Alerts match eligible, recent observations against model, city, storage, PTA selection, and a maximum asking price. Optional minimum-discount rules require at least 5 independent peers and reject discounts above 45%. A budget-only match does not require enough peers to call a listing a deal. Rules are evaluated in the browser when the app opens and on workspace updates. No background notifications, polling, or automated marketplace access occurs.

The resale calculator starts with the lower quartile of comparable asking prices, falling back to the candidate's price without evidence. The user can change it. Net profit is resale minus purchase, repairs, transport, and percentage selling fees. ROI divides this profit by those total costs. Actual transaction prices can be lower; this is a scenario calculator, not a forecast.

## Sample data and storage

The sample market is synthetic, generated around a stored sample date, with illustrative weekly observations. It is never mixed with personal data. Refreshing sample dates explicitly regenerates the demo. Personal data persists through IndexedDB and is exported with its full recorded timestamps. Storage failure is surfaced; the user is offered an export instead of a false saved confirmation.
