# NHS CRM — Pre Go-Live Checklist

**Prepared:** 21 April 2026  •  **Target Go-Live:** TBC
**Owner:** Deepak K Rana, CRM Mates Ltd  •  **Sponsor:** Will Smith, NHS
**Version:** 1.3  •  **Last updated:** 2026-04-21

---

## How to use this document

- Tick the **Status** column as work progresses (`Done` / `In Progress` / `Pending` / `Blocked`).
- Each tester (Jordan / Gina / Will) uses their own column — `[x]` when they've verified the feature, `[ ]` while untested.
- Keep this file in sync with [TECHNICAL_DOCUMENT.md](TECHNICAL_DOCUMENT.md) — commit both when a feature moves status.

**Legend:** ✅ Done · 🟡 In Progress · ⬜ Pending · 🚫 Blocked

---

## Summary

| Total | ✅ Done | 🟡 In Progress | ⬜ Pending | 🚫 Blocked |
| :---: | :-----: | :------------: | :--------: | :--------: |
| **64** | **53** | **1** | **8** | **2** |

---

## 1. Application Lifecycle

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 1 | **Create Application form** — full multi-section form (housebuilder, property, vendor, agents, scheme, dates) | ✅ | [ ] | [ ] | [ ] |
| 2 | **Manual address entry toggle** — fallback when address lookup returns nothing | ✅ | [ ] | [ ] | [ ] |
| 3 | **Vendor Households** — auto-create Household Account on submit, vendors independent of Housebuilder | ✅ | [ ] | [ ] | [ ] |
| 4 | **Success screen** — Download PDF + Go to Application buttons | ✅ | [ ] | [ ] | [ ] |
| 5 | **Application Detail V2** — pipeline view, Quick Summary, stage-specific cards, collapsible agents | ✅ | [ ] | [ ] | [ ] |
| 6 | **Generate PDF** — Application Summary, uploads to Files, auto-downloads | ✅ | [ ] | [ ] | [ ] |
| 7 | **Edit Application** — admin-only edit modal | ✅ | [ ] | [ ] | [ ] |
| 8 | **Refresh button** — parallel refresh of Opportunity wire + Vendor Notes + VA slots + BA slots, with spinning icon and "Refreshing..." label | ✅ | [ ] | [ ] | [ ] |
| 9 | **Latest note visible in Quick Notes card** — shows most recent note under the Add Note button with date, time and author | ✅ | [ ] | [ ] | [ ] |
| 9a | **Preview button on Property Address** — eye-icon on the right of PROPERTY ADDRESS section; opens the linked `NHS_Property__c` record in a new browser tab | ✅ | [ ] | [ ] | [ ] |
| 9b | **UK currency formatting on Valuation Figures** — all 12 currency inputs (Agent 1/2/3 × Initial/Target/Bottom + NHS Market/Target/Forced) render with en-GB comma separators; handler strips commas/pound/spaces before save | ✅ | [ ] | [ ] | [ ] |

---

## 2. Pipeline Stages (NHS_Process__c)

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 10 | **Step 1 — Application** (default on create) | ✅ | [ ] | [ ] | [ ] |
| 11 | **Step 2 — Vendor Availability** — calendar with AM/PM slots, 1-hour booking notice | ✅ | [ ] | [ ] | [ ] |
| 12 | **Step 3 — Agents Booked** — Book Agent flow, agent editing, confirmation emails | ✅ | [ ] | [ ] | [ ] |
| 13 | **Step 4 — Figures to Chase / Figures Returned** | ✅ | [ ] | [ ] | [ ] |
| 14 | **Step 5 — Valuations Ready** — smart rules: NHS Agent 1 → A2+A3 figures; else all 3; unassigned A1 never qualifies | ✅ | [ ] | [ ] | [ ] |
| 15 | **Step 6 — Final Checks** — template auto-loads from NHS Config mapping; blocker panel lists missing checks / valuations; green bulb on Config page when template is actively mapped | ✅ | [ ] | [ ] | [ ] |
| 16 | **Step 7 — Vendor Discussions** | ✅ | [ ] | [ ] | [ ] |
| 17 | **Archived stage** | ✅ | [ ] | [ ] | [ ] |
| 18 | **Will Report button** on Valuation Ready Kanban | ⬜ | [ ] | [ ] | [ ] |

---

## 3. Kanban & List Views

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 19 | **All Applications Kanban (V7)** | ✅ | [ ] | [ ] | [ ] |
| 20 | **Vendor Availability list** | ✅ | [ ] | [ ] | [ ] |
| 21 | **Agents Booked list** | ✅ | [ ] | [ ] | [ ] |
| 22 | **Figures to Chase / Returned lists** | ✅ | [ ] | [ ] | [ ] |
| 23 | **Valuations Ready list** | ✅ | [ ] | [ ] | [ ] |
| 24 | **Project Plan Kanban** — drag & drop with drop animation, Active/History tabs, quick-status buttons | ✅ | [ ] | [ ] | [ ] |

---

## 4. Housebuilder Module

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 25 | **Housebuilders tab + search** | ✅ | [ ] | [ ] | [ ] |
| 26 | **+ New Housebuilder (inline form)** — logo to Box, company details, dynamic contacts | ✅ | [ ] | [ ] | [ ] |
| 27 | **Housebuilder Record Page** — hero header + 3 tabs (Contacts list, Applications with colour-coded stages, Comms History) | ✅ | [ ] | [ ] | [ ] |
| 28 | **Edit Housebuilder modal** — phone format validation | ✅ | [ ] | [ ] | [ ] |
| 29 | **Preferred Estate Agents tab** (4th tab) | ⬜ | [ ] | [ ] | [ ] |
| 30 | **Schemes** — conditional list per Housebuilder | ⬜ | [ ] | [ ] | [ ] |

---

## 5. Vendors & Contacts

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 31 | **Vendors tab** — Contact list with Account column (Household link) | ✅ | [ ] | [ ] | [ ] |
| 32 | **Household Account model** — 137 applications backfilled, 179 vendor contacts re-parented | ✅ | [ ] | [ ] | [ ] |
| 33 | **Vendor 1 & Vendor 2 full support on Applications** | ✅ | [ ] | [ ] | [ ] |

---

## 6. Agents Module

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 34 | **Agents tab + search** | ✅ | [ ] | [ ] | [ ] |
| 35 | **Assign Estate Agent — List / Map toggle** — property pin + agents with radial fan-out | ✅ | [ ] | [ ] | [ ] |
| 36 | **Per-agent Valuation Report upload** — Box Valuations / Agent N folder | ✅ | [ ] | [ ] | [ ] |
| 37 | **Phonebook icon on Assign Agents — Email page** | ⬜ | [ ] | [ ] | [ ] |
| 38 | **+ New Agent + Agent Record Page** — mirror of Housebuilder module | ⬜ | [ ] | [ ] | [ ] |

---

## 7. Property Management

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 39 | **Property Search** — postcode + radius | ✅ | [ ] | [ ] | [ ] |
| 40 | **Existing Properties list** | ✅ | [ ] | [ ] | [ ] |
| 41 | **Property Description auto-derivation** — "Apartment 2 Bed" from type + bedrooms | ✅ | [ ] | [ ] | [ ] |

---

## 8. Communications & Email

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 42 | **Comms Hub — 4-tab slide panel** (Email / Calls / SMS / WhatsApp) | ✅ | [ ] | [ ] | [ ] |
| 43 | **Compose email** — TO / CC / BCC, address book, wide subject | ✅ | [ ] | [ ] | [ ] |
| 44 | **Box file attachments in compose** — tree-view picker, multi-select, sizes | ✅ | [ ] | [ ] | [ ] |
| 45 | **Attachments visible in Comms History** — post-send linking saves Box + uploaded files to EmailMessage | ✅ | [ ] | [ ] | [ ] |
| 46 | **Reply / Forward quoted body formatting** | ✅ | [ ] | [ ] | [ ] |
| 47 | **9 NHS-branded email templates (#1–#9)** — #1 Agent 1 booking · #2/3 Agent 2/3 booking · #4 Vendor appt · #5 Valuation figures · #6–#8 Chasers · #9 Final Checks | 🟡 | [ ] | [ ] | [ ] |

---

## 9. Integrations

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 48 | **Box** — OAuth, folder structure (Application / Valuations / Photos / Will Report), file uploads | ✅ | [ ] | [ ] | [ ] |
| 49 | **Mapbox + Google Maps dual-provider** — auto-fallback, daily quota counter, health check | ✅ | [ ] | [ ] | [ ] |
| 50 | **Ideal Postcode lookup** (address auto-complete) | ✅ | [ ] | [ ] | [ ] |
| 51 | **Twilio SMS** — scheduler stopped. **Blocked:** card/billing issue + compliance review outstanding. Cannot reactivate until both resolved | 🚫 | [ ] | [ ] | [ ] |
| 52 | **3CX telephony integration** — 🚨 *Top Priority*. **Blocked:** awaiting Gradwell ticket update for Salesforce integration approval + API key details | 🚫 | [ ] | [ ] | [ ] |
| 53 | **Cloudflare Images API integration** | ⬜ | [ ] | [ ] | [ ] |

---

## 10. Admin & Configuration

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 54 | **NHS API Config page** — Map Provider, Mapbox token, Box, integrations central UI | ✅ | [ ] | [ ] | [ ] |
| 55 | **Custom Settings populated** — `NHS_API_Config__c`, `Box_Config__c`, `Google_Maps_Config__c` | ✅ | [ ] | [ ] | [ ] |
| 56 | **CSP Trusted Sites + Remote Site Settings** | ✅ | [ ] | [ ] | [ ] |
| 57 | **Permission Sets assigned to users** — `NHS_Project_Plan_Access`, `NHS_Account_Geo_Access`, etc. | 🟡 | [ ] | [ ] | [ ] |
| 58 | **Scheduled jobs** — health check only (Twilio stopped) | ✅ | [ ] | [ ] | [ ] |

---

## 11. Notifications & Observability

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 59 | **Toast notifications across LWCs** | ✅ | [ ] | [ ] | [ ] |
| 60 | **Notification system — Chatter analysis & rollout** | ⬜ | [ ] | [ ] | [ ] |

---

## 12. Go-Live Readiness

| # | Feature | Status | Jordan | Gina | Will |
| :-: | :-- | :-: | :-: | :-: | :-: |
| 61 | **Technical Document up to date** — every deploy logged in `docs/TECHNICAL_DOCUMENT.md` and pushed to GitHub | ✅ | [ ] | [ ] | [ ] |
| 62 | **Production cutover plan & training** — sandbox → prod deploy path, user training, fallback plan | ⬜ | [ ] | [ ] | [ ] |

---

## Sign-off

| Tester | Role | Sign-off Date | Signature |
| :-- | :-- | :-- | :-- |
| **Jordan** | User testing | ___________ | ___________ |
| **Gina** | Business owner | ___________ | ___________ |
| **Will** | Sponsor / Final approval | ___________ | ___________ |

---

## Change Log

| Date | Author | Change |
| :-- | :-- | :-- |
| 2026-04-21 | Deepak K Rana | Initial checklist v1.0 — 62 items across 12 sections |
| 2026-04-21 | Deepak K Rana | v1.1 — #8 Refresh button and #9 Latest note moved to ✅ Done. Summary: 50 Done · 2 In Progress · 10 Pending |
| 2026-04-21 | Deepak K Rana | v1.2 — #51 Twilio SMS blocked (card + compliance); #52 3CX blocked (Gradwell ticket pending). Summary: 50 Done · 2 In Progress · 8 Pending · 2 Blocked |
| 2026-04-21 | Deepak K Rana | v1.3 — #15 Final Checks template config flipped to Done (blocker panel + auto-load + green bulb). Added #9a Preview button on Property Address, #9b UK currency formatting on valuation inputs. Summary: 53 Done · 1 In Progress · 8 Pending · 2 Blocked |

---

**Document maintained by:** Deepak K Rana, Lead Salesforce Consultant, CRM Mates Ltd
**Contact:** deepak@crmmates.com · 07443 340401
