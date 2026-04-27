# NHS Training App - To-Do List (20 April 2026)

## High Priority - Fixes & Core

- [x] **Reassign Agent modal — hide [X] on other agents** — done 2026-04-23 · TSK-00085
- [ ] **Agent reassignment audit trail — Reason for Change + auto-Note + field reset** — in progress · TSK-00087
  - Blocks reassignment until reason captured; saves Vendor_Note with prev agent + last appt + last email + reason; clears stale appt/email fields on the swapped slot.
- [ ] **Book Appointment + Amend Booking email consistency** — in progress · TSK-00088
  - Part A: add CC/BCC/Phonebook/Edit to `nhsBookAppointmentModal`. Part B: trigger Email Agent modal after an Amend.
- [ ] **Amend Booking uses Book Appointment lightbox + Reason captured in Vendor Notes** — in progress · TSK-00089
  - Amend now opens the same modal; Step 1 requires a reason; Vendor Note auto-saved with previous/new times + reason before Step 2.
- [ ] **Cancel Booking does not persist** — in progress · TSK-00090
  - Apex `bookAppointment(null, null)` threw silently; LWC now clears via direct `updateRecord` on `Agent_N_Appointment__c` + `Last_Agent_N_Emailed_On__c`.
- [ ] 3CX integration
- [ ] Fix Generate PDF
- [ ] Audit Twilio SMS — sending too many emails
- [ ] Test Refresh Button
- [ ] Vendor Availability top colors adjustments
- [ ] Latest notes should show up on the top

## Medium Priority - UI / UX Improvements

- [x] **Merge Book Agents + Agent Details into single per-agent card (Stage 3)** — done 2026-04-23 · TSK-00083
- [x] **Book Appointment lightbox — vendor slot picker + agent booking email** — done 2026-04-23 · TSK-00084
  - Includes: calendar toggle with per-date dot indicators + date filter, sage-pill date headers, color-coded Morning/Afternoon strips, tinted body background.
- [ ] Assign Agents — Email page, show the phonebook icon
- [ ] Assign Estate agent — must have a list view and map view
- [ ] Placeholder for the Agent 1, 2, 3 Report upload with value
- [ ] Will Report button on the Kanban view on the "Valuation Ready"
- [ ] Final Checks — show template 9, configurable at NHS Config

## New Features & Integrations

- [ ] Housebuilder — new record creation page with contacts (+) and Lightning record page layout for detail view
- [ ] Agents — new record creation page with contacts (+) and Lightning record page layout for detail view
- [ ] Housebuilder Related Lists — Contact, Applications, Preferred Estate Agents, Comms History
- [ ] Notification system (analyse Chatter option)
- [ ] Schemes — conditional list (differs per Housebuilder)
- [ ] **Cloudflare Images integration — PARKED, awaiting Will + Gina approval** (5 upload channels: Box photographer, mobile app future, housebuilder logo, property API, NHS brand one-off)
  - Proposal: [`docs/PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf`](docs/PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf) (16 pages, 15 sections)
  - Implementation plan: [`docs/CLOUDFLARE_IMAGES_IMPLEMENTATION_PLAN.md`](docs/CLOUDFLARE_IMAGES_IMPLEMENTATION_PLAN.md) (phase-by-phase checklist)
  - Kanban: TSK-00017
  - Gates: (1) sign-off from Will + Gina, (2) Cloudflare Images account active, (3) token + account Id saved in NHS Config
- [ ] **Experience Cloud licensing — PARKED, Deepak to discuss with Gina first** (Housebuilder Portal needs Customer Community Plus; vendors + agents stay on Guest magic-link)
  - Kanban: TSK-00086
  - Gates: (1) Gina provides housebuilder user-count estimate, (2) Salesforce quote received (CCP member vs login-based), (3) Digital Experiences enabled in Setup on prod org `00D07000000ZgNDEA0`
  - Drafted Salesforce email kept in 2026-04-23 session transcript; fill placeholders once Gina's numbers are in
- [ ] **HomeData API integration — UNBLOCKED (v2.1 retest 2026-04-24)** · TSK-00082
  - POC v2.1 report: [`docs/HOMEDATA_API_POC_VALIDATION.md`](docs/HOMEDATA_API_POC_VALIDATION.md) · [PDF](docs/HOMEDATA_API_POC_VALIDATION.pdf) · [generator](docs/generate_homedata_poc_pdf.py)
  - Market Conflict Detector endpoint confirmed: `/api/property_listings/?uprn={uprn}` (Sale-only filter agreed with NHS)
  - Ready to ship now: Property Enrichment on Create · Vendor Report Area Intel · Market Conflict Detector (see sibling task)
  - Outstanding with Quinn: 7 v2.1 questions (AVM 500, `/valuations/*` deprecation, `/live-listings/*`, schema docs, `predicted_price` equivalence, `is_live`/`is_withdrawn` semantics, paid-tier portal identity) + 3 scale Qs (bulk UPRN endpoint, webhook push, watchlist subscription)
  - Tier decision pending: daily sweep of 11k watchlist UPRNs = ~330k calls/mo → Scale tier (£699/mo) on naive polling; batch/webhook availability would cut 100×+

- [ ] **Any of our Properties Gone On Market by Other Estate Agents — Daily Check** · TSK-TBD
  - Scope: **forever-watchlist**. Every UPRN NHS has ever touched stays subscribed indefinitely — ~1,000 active + ~10,000 historical, growing ~200/mo. Sold through NHS, sold elsewhere, or withdrawn — all remain on the watchlist.
  - Trigger: a Sale listing appears on HomeData for a subscribed UPRN where `agent_head_office_email` does NOT end `@newhomesolutions.co.uk` (excludes NHS's "New Home Agents" brand).
  - Cadence: **daily** (NHS decision 2026-04-24).
  - Data source: HomeData `/api/property_listings/?uprn={uprn}` · Sale-only. Real-world validation against 8 Meadowbarn Close PR4 0AG (POC v2.1 §4.6) — NHS's own listing correctly identified via email domain.
  - Two-stage flow: (1) one-off publication validation ~24h after NHS lists a property on Rightmove (assert it propagated to HomeData); (2) ongoing daily sweep for external agents.
  - Data-quality gate: HomeData's `is_live` / `is_withdrawn` flags are unreliable on older historical records (e.g. Clarkson Holden on 8 Meadowbarn still shows `is_live=true` post-NHS takeover). MVP must use temporal filter + human-review queue until auto-alerting is trusted.
  - Volume & cost: 11k × daily ≈ 330k/mo → HomeData Scale tier (£699/mo) naive polling. Pending Quinn on bulk/webhook/watchlist endpoint, which would flip architecture to push and collapse cost.
  - Salesforce data model: TBD — watchlist likely a custom object or derived view over `Opportunity` with a "listed on Rightmove" flag.
