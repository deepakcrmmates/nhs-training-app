# HomeData API — POC Validation Report

**Author:** Deepak K Rana, Founder, CRM Mates Ltd (`deepak@crmmates.com`)
**Client:** New Home Solutions (NHS)
**Date:** 23 April 2026
**Status:** POC complete — partial proceed, one primary blocker awaiting vendor confirmation

---

## 1. Executive Summary

HomeData's UK property data API has been validated against **five real NHS application addresses** using the Free tier (100 calls/month) that Quinn Taylor enabled on special request.

**Outcome:**
- **7 endpoints confirmed working** — enough to ship two near-term features (Property Enrichment on Application Create, and Area Intel for Vendor Reports).
- **1 endpoint in spec but returning 404** (`/valuations/{uprn}/`) — pending clarification from HomeData; a workaround exists (`predicted_price` is returned by `/properties/{uprn}/`).
- **All `/map/*` layers 404** — not a blocker; `/postcode-profile/` already bundles flood-risk inline.
- **Listings endpoint does not exist** — the OpenAPI `Listings` tag has zero paths defined, and every probed URL returned 404. **This blocks the primary commercial use case (Market Conflict Detector).** Email sent to Quinn; awaiting roadmap/ETA.

**Calls consumed during POC:** ~30 of 100 monthly allowance.

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

### 4.4 Endpoint does NOT exist — Listings (primary blocker)

The OpenAPI spec defines a `Listings` **tag** (with description) but **zero paths**. All 10 URL variants probed returned 404:

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

**→ Market Conflict Detector cannot proceed against HomeData today.** Email sent to Quinn 23 April 2026; awaiting roadmap/ETA/tier-pricing.

### 4.5 Endpoint valid but no data for tested postcode

| Endpoint | Response |
|---|---|
| `GET /broadband/?postcode=DE24%205BD` | `{"error":{"code":"not_found","message":"No broadband data for postcode DE24 5BD"}}` (HTTP 404 — genuine "no data", not routing issue) |

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
| **Market Conflict Detector** (primary) | **BLOCKED** | Listings endpoint does not exist. Awaiting Quinn confirmation on roadmap. No workaround inside HomeData — would need a separate vendor (Rightmove API, Zoopla API, or a portal scraper). |
| **Valuation Tracker** (TSK-00047) | **Proceed with "lite" version** | Use `predicted_price` from `/properties/{uprn}/` as the AVM value. Skip `/valuations/{uprn}/` until HomeData clarifies the 404. |
| **Property Enrichment on Create** | **PROCEED** | `/properties/{uprn}/` returns everything we need in a single 1-weight call. |
| **Vendor Report Area Intel** | **PROCEED** | `/postcode-profile/` + `/schools/nearby/` + `/price-growth/{outcode}/` covers flood risk, schools, demographics, price trend. |

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

## 9. Open Questions with HomeData (Email sent to Quinn 23 April 2026)

1. **Listings endpoint** — is it shipped, roadmap, or internal-only? ETA and pricing tier?
2. **`/valuations/{uprn}/` 404** — is this gated off Free tier, or is our call pattern wrong? If tier-gated, is `predicted_price` from `/properties/{uprn}/` the same value under the hood?

---

## 10. Next Steps

| Priority | Action | Owner | Status |
|---|---|---|---|
| P1 | Await Quinn's reply on Listings + valuations | Quinn / Deepak | Email sent |
| P2 | Wire `/properties/{uprn}/` into NHS Application create flow (auto-enrichment) | Deepak | Not started |
| P2 | Add HomeData intel block to Vendor Report template | Deepak | Not started |
| P3 | Build Valuation Tracker "lite" using `predicted_price` | Deepak | Not started |
| P3 | Add NHS_API_Config__c fields for HomeData | Deepak | Not started |
| Parked | Market Conflict Detector | — | Blocked on Listings availability |

---

## 11. Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-23 | Initial POC validation. 5 UPRNs tested against 15+ endpoints. Report created. Quinn emailed. | Deepak K Rana |
