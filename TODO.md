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
- [ ] **HomeData API integration — BLOCKED on Listings endpoint** (POC complete 2026-04-23; 7 endpoints working on Free tier, 1 blocker, 3 features ready to ship)
  - POC validation report: [`docs/HOMEDATA_API_POC_VALIDATION.md`](docs/HOMEDATA_API_POC_VALIDATION.md)
  - PDF version: [`docs/HOMEDATA_API_POC_VALIDATION.pdf`](docs/HOMEDATA_API_POC_VALIDATION.pdf)
  - Generator: [`docs/generate_homedata_poc_pdf.py`](docs/generate_homedata_poc_pdf.py)
  - Kanban: TSK-00082 (parent) · related TSK-00047 (Valuation Tracker)
  - Can ship now: Property Enrichment on Create · Vendor Report Area Intel · Valuation Tracker "lite" (via `predicted_price`)
  - Gates: (1) Quinn confirms Listings endpoint roadmap/ETA, (2) Quinn clarifies `/valuations/{uprn}/` 404 + gating, (3) NHS decision on tier upgrade (Starter £49 → Growth £149 if nightly sweep)
