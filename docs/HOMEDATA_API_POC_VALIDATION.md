# HomeData API — POC Validation Report

**Author:** Deepak K Rana, Founder, CRM Mates Ltd (`deepak@crmmates.com`)
**Client:** New Home Solutions (NHS)
**Version:** v2.1 — 24 April 2026 (multi-UPRN probe + NHS Sale-only decision)
**Date (v1):** 23 April 2026 · **Date (v2 / v2.1):** 24 April 2026
**Status:** POC v2.1 complete — **Market Conflict Detector UNBLOCKED** with Sale-only filter agreed; AVM has a server-side 500 bug pending Quinn.

---

## 1. Executive Summary

HomeData's UK property data API has been validated against **five real NHS application addresses** using the Free tier (100 calls/month) that Quinn Taylor enabled on special request. A second probing session on 24 April 2026 — after HomeData reopened access — reshaped the outcome materially.

**v2 outcome (24 April 2026):**
- **🎯 Primary blocker cleared.** `/api/property_listings/?uprn={uprn}` returns HTTP 200 with paginated listing history (live + historical, with `latest_status`, `latest_price`, `is_live`, `is_withdrawn`, `source`, `added_date`, portal description, images). **Market Conflict Detector is ready to build.** The original POC failed on this only because it probed the dash-form path-style URL (`/listings/{uprn}/`) rather than the underscore-form query-string URL (`/property_listings/?uprn=N`).
- **🟡 AVM endpoint exists but crashes.** `/api/avm/?uprn={uprn}` returns HTTP 500 (HTML error page) for all tested UPRNs. UPRN is accepted as a valid integer, so the bug is inside HomeData's AVM computation. Needs Quinn. Workaround: `predicted_price` inside `/api/properties/{uprn}/` remains usable.
- **❌ `/api/valuations/*` still 404**, despite being in HomeData's own allow-list. Looks deprecated — `/api/avm/*` appears to have replaced it.
- **🆕 20+ additional endpoints discovered** via a 403 allow-list probe on `/api/` itself. Notable: `/crime/*`, `/deprivation/*`, `/comparables/*`, `/agent_stats/*`, `/solar-assessment/*`, `/hmlr/*`, `/boundaries/*`, `/epc-checker/*`. Full list in section 4.6.

**v1 outcome (23 April 2026, for reference):**
- 7 endpoints confirmed working; 1 in-spec endpoint returning 404 (`/valuations/{uprn}/`); all `/map/*` layers 404; Listings endpoint appeared absent from the OpenAPI spec.

**Calls consumed:** ~30 in v1 · ~30 in v2 · **~60 of 100 monthly allowance** used.

---

## 2. Original NHS Use Cases

| Priority | Use Case | Description |
|---|---|---|
| 1 (primary) | **Market Conflict Detector** | Detect when a vendor brings a property to NHS for part-exchange valuation while *also* listing it via a traditional estate agent on Rightmove / Zoopla / OnTheMarket. Nightly sweep across open + archived applications. |
| 2 | **Valuation Tracker** (TSK-00047) | Track AVM drift over time for every property in the pipeline; flag material movements. |
| 3 | **Property Enrichment on Create** | Pre-fill bedrooms, EPC, build era, sold history, predicted price when a new application is created from a UPRN. |
| 4 | **Vendor Report Area Intel** | Inject flood risk, schools, demographics, local price trend into Agent/Vendor reports. |

---

## 3. Test Setup

### API credentials
- **Key (Free tier):** `PIswK2b1.TOGIfMSsAHDGGRh5ExTOPH5iAgMTOXOO`
- **Auth header:** `Authorization: Api-Key PREFIX.SECRET` (single header, dot-separated prefix + secret)
- **Tier allowance:** 100 calls/month, 2 req/sec, 120 req/min

### Base URL (critical)
- **Correct:** `https://api.homedata.co.uk/api/`
- **Trailing slash required on every path.** Without it the API returns HTTP 301 with `Location: /api/{path}/` — and the `Authorization` header is stripped on the redirect by Cloudflare, which means `curl -L` works but most HTTP clients (including Salesforce `HttpRequest`) will authenticate the second hop as anonymous.
- **Implication for Apex:** always build paths with a trailing slash; do not rely on follow-redirect behaviour.

### Test addresses (5 UPRNs across geographic diversity)

| UPRN | Address | Purpose |
|---|---|---|
| 10090306711 | 4 Skelton Close, Boulton Moor, Derby DE24 5BD | New-build estate |
| 10000904200 | Studio 89, 89 Main Street, Egremont CA22 2DJ | Pre-1919 rural flat |
| 200003320965 | 654 Queslett Road, Great Barr, Birmingham B43 7DU | Post-war suburban semi |
| 100080961272 | 123 Hillfield, Hatfield AL10 0TX | Commuter-belt flat (linked to live Opp 006KG000002EX6PYAW, Robinson Developments) |
| 10014057896 | Apartment 9, 9 Meadowgate, Wigan WN6 7QP | Modern flat with parking |

---

## 4. Endpoint Validation Matrix

### 4.1 Confirmed WORKING (HTTP 200)

| # | Endpoint | Call Weight | NHS Use | Sample Data Returned |
|---|---|---|---|---|
| 1 | `GET /address/find/?q={postcode\|partial}` | Free | Typeahead on application create | 5 UPRNs with address + town for DE24 5BD |
| 2 | `GET /address/retrieve/{uprn}/` | 5 | Canonical address block | UPRN, USRN, UDPRN, lat/lng, full address split |
| 3 | `GET /properties/{uprn}/` | 1 | **Full property enrichment — 50+ fields** | See section 5.1 |
| 4 | `GET /price-growth/{outcode}/` | 1 | YoY trend for vendor reports | DE24: −6.15%, B43: +3.13%, AL10: +7.16%, WN6: −3.02%, CA22: +25.00% |
| 5 | `GET /postcode-profile/?postcode=` | 1 | **One-shot area summary for vendor reports** | Flood risk, census, sold-price median, property breakdown, env risk |
| 6 | `GET /schools/nearby/?postcode=` | 1 | Schools block in vendor report | 20 schools within 3km, Ofsted ratings, distance km/miles, head teacher, website |
| 7 | `GET /demographics/?postcode=` | 1 | Census 2021 intel | Tenure, age bands, ethnicity, occupation, car ownership |

### 4.2 Endpoints in spec but returning 404

| Endpoint | Observation | Impact |
|---|---|---|
| `/valuations/{uprn}/` | 404 for all 5 UPRNs and all `type` variants (`sale`, `rent`, no param, query-string form). | **Pending Quinn clarification.** Workaround: `/properties/{uprn}/` already returns `predicted_price`, which appears to be the same AVM output. |
| `/map/flood-risk/` | 404 | Not a blocker — `/postcode-profile/` returns flood-risk band inline. |
| `/map/conservation-areas/` | 404 | Nice-to-have for due diligence; not a blocker. |
| `/map/listed-buildings/` | 404 | Nice-to-have for due diligence; not a blocker. |
| `/map/planning-designations/` | 404 | Nice-to-have; not a blocker. |
| `/map/landfill-sites/` | 404 | Nice-to-have; not a blocker. |
| `/map/schools/` | 404 | Redundant — `/schools/nearby/` works. |
| `/map/transport/` | 404 | Not a blocker. |

### 4.3 Endpoints explicitly blocked (HTTP 403)

| Endpoint | Response | Note |
|---|---|---|
| `GET /properties/?postcode=` | `{"code":"INVALID_API_KEY","message":"Properties unavailable as a list view","status":403}` | Bulk list view gated off Free tier — forces per-UPRN lookup. Matches per-call pricing model. |

### 4.4 Listings — original call pattern wrong (resolved in v2)

**⚠️ Superseded by section 4.6 — retained here for historical context.**

On 23 April 2026 the POC concluded that no Listings endpoint existed. All 10 probed URL variants returned 404:

```
GET /listings/                    → 404
GET /listings/{uprn}/             → 404
GET /listings/?uprn={uprn}         → 404
GET /listings/?postcode={pc}       → 404
GET /property-listings/            → 404
GET /property-listings/?uprn=...   → 404
GET /live-listings/                → 404
GET /listings/search/              → 404
GET /market-listings/              → 404
GET /market-activity/              → 404
```

The v2 retest on 24 April 2026 revealed the issue was a **naming-convention mismatch** — HomeData uses the underscore-form (`property_listings`) not the dash-form (`property-listings`), and only the query-string variant is supported (not path-style). See section 4.6 for the working call.

### 4.5 Endpoint valid but no data for tested postcode

| Endpoint | Response |
|---|---|
| `GET /broadband/?postcode=DE24%205BD` | `{"error":{"code":"not_found","message":"No broadband data for postcode DE24 5BD"}}` (HTTP 404 — genuine "no data", not routing issue) |

### 4.6 Session 2 Retest — 24 April 2026 (added in v2)

**Access confirmed restored.** Smoke-test of `/api/properties/10090306711/` returned HTTP 200 with full property data — the Free-tier key is active.

#### 4.6.1 Discovery mechanism — the 403 allow-list probe

Calling the base `/api/` path (with no endpoint) returned a 403 whose error message explicitly enumerates every endpoint the key is authorised for:

```
GET /api/
→ 403 {"error":{"code":"INVALID_API_KEY",
       "message":"API key not authorized for endpoint: /api/.
       Allowed: /api/flood-risk/*, /api/property_sale_events/*,
       /api/image/*, /api/address/*, /api/avm/*,
       /api/map/planning-designations/*, /api/map/conservation-areas/*,
       /api/property_listings/*, /api/valuations/*, /api/map/schools/*,
       /api/property_sales/*, /api/postcode-profile/*, /api/boundaries/*,
       /api/conservation-areas/*, /api/solar-assessment/*,
       /api/live-listings/*, /api/property_lr_titles/*, /api/calculators/*,
       /api/price_distributions/*, /api/map/landfill-sites/*, /api/crime/*,
       /api/council_tax_band/*, /api/price_trends/*, /api/schools/*,
       /api/risks/*, /api/properties/*, /api/price-growth/*,
       /api/listed-buildings/*, /api/planning-designations/*, /api/hmlr/*,
       /api/transport/*, /api/property/*, /api/deprivation/*,
       /api/epc-checker/*, /api/agent_stats/*, /api/broadband/*,
       /api/furniture/*, /api/amenities/*, /api/map/transport/*,
       /api/map/flood-risk/*, /api/planning/*, /api/comparables/*,
       /api/map/listed-buildings/*, /api/demographics/*, /api/schema/*,
       /api/postcode-profile/*"}}
```

**This is the authoritative list of endpoints available on the Free tier.** It supersedes the OpenAPI `/api/schema/yaml/` document (which timed out during the retest with HTTP 524).

#### 4.6.2 Listings — WORKING (primary blocker cleared)

| Call | Status | Notes |
|---|---|---|
| `GET /api/property_listings/?uprn=10090306711` | **HTTP 200** (11,803 bytes) | Paginated: `count=2`, 2 listings returned |
| `GET /api/property_listings/?uprn=100080961272` | **HTTP 200** (52 bytes) | `count=0` — Hatfield Opp is clean (no dual-listing) |
| `GET /api/property_listings/10090306711/` | 404 | Path-style not supported (query-string only) |
| `GET /api/live-listings/` (and variants) | 404 | Listed as allowed but returns 404 — may be the same data surfaced differently, or not yet shipped |

**Response shape** (trimmed):
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "51967c86-...",
      "property": 10090306711,
      "display_address": "Skelton Close, Boulton Moor",
      "postcode": "DE24 5BD",
      "transaction_type": "Sale",
      "added_date": "2025-05-19",
      "first_offer_date": null,
      "first_sold_or_let_date": null,
      "sale_cancelled_date": null,
      "withdrawn_date": null,
      "reduced_date": null,
      "is_withdrawn": true,
      "is_live": true,
      "latest_status": "For sale",
      "latest_price": 155000,
      "is_new_build": false,
      "listing_property_type": "Semi-Detached",
      "bedrooms": 3,
      "bathrooms": 2,
      "reception_rooms": null,
      "ownership": "Freehold",
      "description": "<b>FIRST TIME BUYERS ONLY</b> ...",
      "source": "Home.co.uk",
      "images": ["https://api.homedata.co.uk/api/images/p/...", "..."]
    }
  ]
}
```

#### Multi-UPRN probe — 24 April 2026 (5 UPRNs, v2.1 findings)

| UPRN | Property | `count` | `source` | Listings transaction type |
|---|---|---|---|---|
| 10090306711 | Derby, Skelton Close | 2 | `Home.co.uk` ×2 | Sale × 2 |
| 200003320965 | Birmingham, Queslett Rd | 0 | — | — |
| 10014057896 | Wigan, Meadowgate | 2 | `Home.co.uk` ×2 | **For rent × 2** |
| 10000904200 | Egremont, Main St | 0 | — | — |
| 100080961272 | Hatfield (live Opp 006KG…) | 0 | — | — |

**Confirmed patterns:**

1. **`source` is uniformly `"Home.co.uk"`** across all 4 listings returned. HomeData is pulling from this single aggregator feed — so the endpoint does **not** tell us which specific portal (Rightmove / Zoopla / OnTheMarket) the vendor listed on. Home.co.uk aggregates all three, so a match here means "appears on at least one of them." Worth asking Quinn whether paid tiers surface the underlying portal identity.

2. **`is_live` and `is_withdrawn` are BOTH `true` on every record.** These flags are NOT simple opposites — `is_live` likely means "in HomeData's current snapshot" and `is_withdrawn` means "portal flagged withdrawn at last crawl." The original proposed filter (`is_live && !is_withdrawn`) would match zero records. **Use `latest_status` as the source of truth** instead.

3. **Historical records included.** Wigan returned a 2008 listing (£425/mo rental) alongside a 2025 one. The API returns the full lifetime history per UPRN — must filter by `added_date` recency.

4. **Both Sale and Rent listings returned.** Wigan came back as `For rent` × 2. **Must filter `transaction_type == "Sale"`** to match NHS's conflict-detection use case. Decision confirmed with NHS (Deepak/Will, 2026-04-24): **rental conflicts are NOT in scope** — we only flag when a vendor is dual-listing for sale while part-exchanging with NHS.

5. **Agent data is patchy on older records.** The 2008 Wigan record has `agent_name: null`. Modern (~2020+) records have populated `agent_name`, `agent_branch_name`, `agent_sales_phone`, `agent_head_office_email`. Recency filter (≤180 days) naturally excludes the sparse historical rows.

6. **`count=0` is common** — 3 of 5 test UPRNs had zero listings. This means either (a) the property has never been publicly marketed, or (b) HomeData has no coverage. No way to distinguish from the response alone. For a Market Conflict Detector, `count=0` is a clean "no conflict" signal.

#### Extra fields returned (not in the trimmed example above)

The full response also includes **rich estate-agent detail** — arguably more useful than portal identity for NHS:

```json
{
  "agent_name":              "Hannells Estate Agents",
  "agent_branch_name":       "Chellaston",
  "agent_sales_phone":       "01332 705505",
  "agent_lettings_phone":    "01332 294396",
  "agent_head_office_email": "chellaston@hannells.co.uk",
  "agent_logo":              "agents/20735/logo.png",
  "agent_group_name":        "Hannells Estate Agents",
  "agent_branch_id":         53652,
  "loki_property_type":      "Semi-Detached",
  "audit_required":          false,
  "is_commercial":           false,
  "has_garden":              null,
  "has_parking":             null,
  "garden_details":          null,
  "parking_details":         null
}
```

**Redacted on Free tier** (upsell to paid):
```json
{
  "full_address": "Contact sales for full address data - hello@homedata.co.uk",
  "uprn":         "Contact sales for UPRN - hello@homedata.co.uk"
}
```
The `property` field already gives us the UPRN as an integer, so the redaction of the string `uprn` doesn't cost us anything.

**Market Conflict Detector — call pattern for nightly sweep (v2.1, NHS-confirmed Sale-only):**
```
for each open Opportunity with a UPRN:
    GET /api/property_listings/?uprn={uprn}
    candidates = results filtered by:
        • transaction_type == "Sale"               (NHS scope — excludes rental)
        • latest_status    == "For sale"           (reliable live-listing signal)
        • days_since(added_date) < 180             (recency guard against stale history)
    if candidates:
        flag Opportunity with:
          competitor_agent   = agent_name + " — " + agent_branch_name
          agent_phone        = agent_sales_phone
          agent_email        = agent_head_office_email
          agent_branch_id    = agent_branch_id   (for cross-ref vs NHS Preferred Agents)
          external_price     = latest_price
          listing_added_date = added_date
          source             = source   (currently always "Home.co.uk")
```

**Why agent identity beats portal identity for NHS:** a single listing appears on Rightmove + Zoopla + OnTheMarket simultaneously — knowing the portal tells us nothing new. Knowing *which estate agent* the vendor has engaged is the actionable signal for follow-up, and `agent_branch_id` lets us cross-reference against NHS's Preferred Estate Agent list in Salesforce.

#### 4.6.3 AVM — exists but server-side bug

| Call | Status | Body |
|---|---|---|
| `GET /api/avm/` | 400 | `{"error":{"code":"invalid_uprn","message":"uprn is required and must be an integer"}}` |
| `GET /api/avm/10090306711/` | 404 | Path-style not supported |
| `GET /api/avm/?uprn=10090306711` | **HTTP 500** | HTML error page — HomeData server-side crash |
| `GET /api/avm/?uprn=10090306711&postcode=DE24%205BD` | **HTTP 500** | Same |
| `POST /api/avm/` (JSON body) | 405 | `Method "POST" not allowed.` |

UPRN is accepted as valid (no 400 when supplied), so the bug is inside the AVM computation path. **This needs reporting to Quinn** — not a client-side call-pattern issue. Workaround: `predicted_price` inside `/api/properties/{uprn}/` remains available.

#### 4.6.4 `/api/valuations/*` — still 404 (likely deprecated)

Same behaviour as v1: every variant returns `RESOURCE_NOT_FOUND`. The path is in the allow-list but has no handler. Probable explanation: HomeData replaced `/valuations/` with `/avm/` but left the old path in the authorisation layer. Needs Quinn to confirm.

#### 4.6.5 Newly-discovered endpoints — not probed yet

20 endpoints surfaced by the 403 allow-list probe that were never tried in v1. These will need individual discovery (the OpenAPI schema endpoint was timing out during the retest):

| Endpoint | Likely use for NHS |
|---|---|
| `/api/crime/*` | Vendor report — area crime stats |
| `/api/deprivation/*` | Vendor report — IMD deprivation index |
| `/api/comparables/*` | Valuation support — classic AVM comps |
| `/api/agent_stats/*` | **Estate-agent quality scoring** — could drive NHS's agent-ranking logic |
| `/api/solar-assessment/*` | EPC / renewables section of vendor report |
| `/api/hmlr/*` | HM Land Registry — title data |
| `/api/boundaries/*` | Parcel boundary geometry (GeoJSON?) |
| `/api/epc-checker/*` | EPC lookup (complement to `/properties/{uprn}/`) |
| `/api/council_tax_band/*` | Area stats |
| `/api/price_trends/*` | YoY trend (richer than `/price-growth/{outcode}/`?) |
| `/api/price_distributions/*` | Price distribution bands per postcode |
| `/api/property_sales/*` | Sold history per UPRN or postcode |
| `/api/property_sale_events/*` | Individual sale events |
| `/api/property_lr_titles/*` | Land Registry title docs |
| `/api/planning/*` | Planning application history |
| `/api/calculators/*` | SDLT, yield, rental calculators |
| `/api/amenities/*` | Nearest shops, parks, transport |
| `/api/furniture/*` | Furnishings/layout — unclear use |
| `/api/risks/*` | Aggregate risk score |
| `/api/image/*` | Image-by-id (already used implicitly via `images[]` in listings) |

Recommend: ask Quinn for docs or ping each with a UPRN once the proper OpenAPI schema is available.

---

## 5. Sample Responses (Real NHS Addresses)

### 5.1 `/properties/10090306711/` — 4 Skelton Close, Derby

Trimmed highlights (full field list is 50+):

```json
{
  "uprn": 10090306711,
  "full_address": "4 SKELTON CLOSE, BOULTON MOOR, DERBY, DE24 5BD",
  "property_type": "Semi-Detached",
  "predicted_bedrooms": 3,
  "floors": 2,
  "construction_age_band": "2010-2019",
  "construction_material": "Brick Or Block Or Stone",
  "roof_material": "Tile Or Stone Or Slate",
  "has_solar_panels": false,
  "has_garden": true,
  "has_parking": true,
  "epc_floor_area": 63,
  "current_energy_efficiency": 82,
  "potential_energy_efficiency": 96,
  "epc_potential_renovations": "Solar water heating; Solar photovoltaic panels, 2.5 kWp",
  "last_sold_price": 130000,
  "last_sold_date": "2020-02-01",
  "last_sold_adjusted_price": 174962,
  "predicted_price": 174962,
  "latitude": 52.8811298,
  "longitude": -1.4123722
}
```

### 5.2 `/postcode-profile/?postcode=DE24%205BD`

```json
{
  "postcode": "DE24 5BD",
  "outcode": "DE24",
  "sold_prices": {
    "median_sold_price": 195000,
    "sale_count": 1390,
    "period_start": "2024-04-23",
    "period_end": "2026-02-20"
  },
  "census": { "population_total": 9295, "households_total": 3876, "...": "..." },
  "environmental_risk": {
    "flood": { "flood_surface_water": { "risk_band": "High" } },
    "overall_risk": "High"
  },
  "properties": {
    "total": 28774,
    "type_breakdown": {
      "Flat": 3456, "Semi-Detached": 10831, "Terraced": 7507,
      "Detached": 4563, "Unknown": 2417
    }
  }
}
```

### 5.3 `/price-growth/DE24/`

```json
{
  "outcode": "DE24",
  "current_period": { "from": "2025-04-23", "to": "2026-02-20",
                      "median_sold_price": 185000, "sale_count": 460 },
  "prior_period":   { "from": "2024-04-23", "to": "2025-04-17",
                      "median_sold_price": 197125, "sale_count": 930 },
  "yoy_change_pct": -6.15,
  "yoy_change_gbp": -12125,
  "trend": "falling",
  "data_quality": "good"
}
```

---

## 6. NHS Use-Case Impact

| Use Case | Status | Rationale |
|---|---|---|
| **Market Conflict Detector** (primary) | **✅ PROCEED — Sale-only scope** (v2.1) | Call pattern confirmed: `GET /api/property_listings/?uprn={uprn}`. Filter: `transaction_type == "Sale"` AND `latest_status == "For sale"` AND `added_date` within 180 days. NHS-confirmed (2026-04-24) that rental conflicts are NOT in scope — we flag only when a vendor is dual-listing for sale while part-exchanging. Key output fields: `agent_name`, `agent_branch_name`, `agent_branch_id` (cross-ref vs NHS Preferred Agents), `latest_price`, `agent_head_office_email`, `agent_sales_phone`. |
| **Valuation Tracker** (TSK-00047) | **Proceed with "lite" version** | Use `predicted_price` from `/properties/{uprn}/` as the AVM value. `/api/avm/?uprn=N` is in scope but currently 500s — use the properties-endpoint fallback until Quinn fixes. |
| **Property Enrichment on Create** | **PROCEED** | `/properties/{uprn}/` returns everything we need in a single 1-weight call. |
| **Vendor Report Area Intel** | **PROCEED (baseline)** | `/postcode-profile/` + `/schools/nearby/` + `/price-growth/{outcode}/` covers flood risk, schools, demographics, price trend. Section 4.6 identifies `/crime/`, `/deprivation/`, `/amenities/`, `/comparables/`, `/agent_stats/` as v2 enrichments worth probing. |

---

## 7. Recommended Salesforce Implementation

### 7.1 Named Credential
- **Label:** HomeData API
- **Name:** HomeData_API
- **URL:** `https://api.homedata.co.uk/api`
- **Identity Type:** Named Principal
- **Auth Protocol:** Password Authentication (or Custom Header)
- **Custom Header:** `Authorization: Api-Key {!$Credential.Password}` — store the full `PREFIX.SECRET` as password.

### 7.2 Remote Site Setting
- **Name:** HomeData_API
- **URL:** `https://api.homedata.co.uk`

### 7.3 Custom Setting (NHS_API_Config__c)
Add fields:
- `HomeData_Base_URL__c` (default `https://api.homedata.co.uk/api`)
- `HomeData_API_Key__c` (the full prefix.secret)
- `HomeData_Enabled__c` (Checkbox — kill-switch)
- `HomeData_Monthly_Call_Budget__c` (Number — default 100, to guard against tier overrun)

### 7.4 Apex Callout Skeleton

```apex
public with sharing class NHSHomeDataService {
    private static final String BASE_URL = 'https://api.homedata.co.uk/api';

    public static Map<String, Object> getProperty(String uprn) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BASE_URL + '/properties/' + uprn + '/');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Api-Key ' + getApiKey());
        req.setHeader('Accept', 'application/json');
        req.setTimeout(15000);
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            throw new CalloutException('HomeData /properties/' + uprn
                + '/ returned ' + res.getStatusCode() + ': ' + res.getBody());
        }
        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    }

    private static String getApiKey() {
        NHS_API_Config__c cfg = NHS_API_Config__c.getOrgDefaults();
        return cfg.HomeData_API_Key__c;
    }
}
```

**Important:** the path MUST end with `/`. Without it, the 301 redirect strips the `Authorization` header — Salesforce `Http` does not auto-follow redirects by default, so the call will fail with 301 rather than authenticating against the final URL.

### 7.5 Call-budget guard
Track monthly calls in a Custom Object (`HomeData_Call_Log__c`) and refuse callouts when the counter hits `HomeData_Monthly_Call_Budget__c`. Prevents silent overage charges once NHS upgrades beyond the Free tier.

---

## 8. Pricing (Tiers)

| Tier | Monthly | Calls/month | Rate limit |
|---|---|---|---|
| Free | £0 | 100 | 2 req/s, 120 req/min |
| Starter | £49 | 5,000 | — |
| Growth | £149 | 25,000 | — |
| Pro | £349 | 100,000 | — |
| Scale | £699 | 500,000 | — |

**Call weighting:** most endpoints = 1 call. `/address/retrieve/` = 5. Comparables = 10 (endpoint not currently exposed). Solar = 5.

**NHS projected monthly volume** (rough estimate, needs refinement):
- ~200 new applications/month × 1 call (properties) = 200
- ~600 active applications × 1 call/week (valuation tracker) = 2,400
- ~50 vendor reports × 3 calls (postcode-profile + schools + price-growth) = 150
- **Total: ~2,750/month → Starter tier (£49) sufficient for v1.**

If Market Conflict Detector is unblocked and sweeps all properties nightly: ~600 × 30 = 18,000/month → Growth tier (£149).

---

## 9. Open Questions with HomeData — v2 (to email Quinn, 24 April 2026)

The v1 questions (sent 23 April) are resolved or reframed by the v2 retest:

1. ~~Listings endpoint — is it shipped?~~ → **Resolved.** `/api/property_listings/?uprn={uprn}` works. Retest confirmed against 2 UPRNs.
2. ~~`/valuations/{uprn}/` 404 — tier-gated or call pattern wrong?~~ → **Superseded.** `/api/valuations/*` appears deprecated; `/api/avm/*` has taken its place. See new Q3.

**New questions for Quinn:**
1. **`/api/avm/?uprn={uprn}` returns HTTP 500** for every UPRN tested (Derby 10090306711, Hatfield 100080961272, Birmingham 200003320965). UPRN validates (400 if omitted) but the AVM computation crashes. Is this a known server-side issue? ETA for fix?
2. **`/api/valuations/*` is in the Free-tier allow-list but every variant 404s.** Safe to treat as deprecated, or is there a required call shape we're missing?
3. **`/api/live-listings/*` is in the allow-list but 404s.** Is this the same data as `/api/property_listings/` or a separate feed? If separate, documentation please.
4. **20 newly-surfaced endpoints in the allow-list** (full list in section 4.6.5) — please share OpenAPI docs or a concise schema. `/api/schema/yaml/` is currently returning HTTP 524 (Cloudflare timeout).
5. **`predicted_price` inside `/api/properties/{uprn}/`** — is this the same underlying AVM that `/api/avm/` will eventually surface, or a separate estimate?
6. **`is_live` and `is_withdrawn` semantics on `/api/property_listings/`.** Every record we probed (Derby × 2, Wigan × 2) has **both** flags set to `true` simultaneously. Our Market Conflict Detector logic originally assumed they were opposites (`is_live && !is_withdrawn`) but that would match zero records. Can you confirm the intended semantics? We're currently using `latest_status == "For sale"` as the reliable live-listing signal — is that the recommended approach?
7. **`source` field returns `"Home.co.uk"` on every record.** Do paid tiers surface the underlying portal identity (Rightmove / Zoopla / OnTheMarket), or is Home.co.uk the only feed HomeData ingests?

---

## 10. Next Steps (updated 24 April 2026)

| Priority | Action | Owner | Status |
|---|---|---|---|
| **P1** | **Build Market Conflict Detector against `/api/property_listings/?uprn={uprn}`** — nightly Schedulable Apex sweep across open Opportunities with a UPRN. Filter: `transaction_type == "Sale"` AND `latest_status == "For sale"` AND `added_date` within 180 days. Flag Opportunity with `agent_name`, `agent_branch_name`, `agent_branch_id` (for Preferred-Agent cross-ref), `latest_price`, `agent_sales_phone`, `agent_head_office_email`, `added_date`. Sale-only confirmed with NHS 2026-04-24. TSK-00082 parent. | Deepak | **Unblocked — ready to build** |
| P1 | Email Quinn with v2 questions (section 9) — AVM 500, `/valuations/*` deprecation, live-listings semantics, schema docs | Deepak | Draft pending |
| P2 | Wire `/properties/{uprn}/` into NHS Application create flow (auto-enrichment) | Deepak | Not started |
| P2 | Add HomeData intel block to Vendor Report template (`/postcode-profile/` + `/schools/nearby/` + `/price-growth/{outcode}/`) | Deepak | Not started |
| P2 | Probe `/api/crime/`, `/api/deprivation/`, `/api/comparables/`, `/api/agent_stats/` with a known UPRN — budget ~5 calls | Deepak | Not started |
| P3 | Build Valuation Tracker "lite" using `predicted_price` from `/properties/{uprn}/` (fallback until `/api/avm/` is fixed) | Deepak | Not started |
| P3 | Add `NHS_API_Config__c` fields for HomeData (base URL, API key, enabled kill-switch, monthly call budget) | Deepak | Not started |
| P4 | Upgrade from Free tier to Starter (£49) once Market Conflict Detector volume estimates are firm | Gina / Deepak | Pending v1 volume data |

---

## 11. Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-23 | Initial POC validation. 5 UPRNs tested against 15+ endpoints. Report v1 created. Quinn emailed. | Deepak K Rana |
| 2026-04-24 | **v2 retest after HomeData reopened API access.** Market Conflict Detector **unblocked** — correct path is `/api/property_listings/?uprn={uprn}` (underscore, query-string form). AVM endpoint discovered but server-side 500 bug. `/api/valuations/*` still 404 — appears deprecated. 20 additional Free-tier endpoints surfaced via a 403 allow-list probe on `/api/`. Calls used: ~30 in v2 (~60/100 total this month). | Deepak K Rana |
| 2026-04-24 | **v2.1 — multi-UPRN probe + Sale-only decision.** Probed 3 additional UPRNs (Birmingham, Wigan, Egremont) to confirm listings-endpoint behaviour. Key findings: (1) `source` is uniformly `"Home.co.uk"` — we do not get the specific portal (Rightmove/Zoopla/OnTheMarket). (2) `is_live` AND `is_withdrawn` are both `true` on every record — must use `latest_status` as the live-listing signal, not these booleans. (3) Endpoint returns full lifetime history; filter by `added_date` recency. (4) Both sale + rent listings returned. NHS confirmed rental conflicts are NOT in scope — Sale-only filter agreed. (5) Rich estate-agent fields available (`agent_name`, `agent_branch_name`, `agent_branch_id`, `agent_sales_phone`, `agent_head_office_email`) — more actionable than portal identity for NHS Preferred-Agent cross-ref. Revised MCD call pattern locked in. Calls used: ~3 in v2.1 (~63/100 total). | Deepak K Rana |
