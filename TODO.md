# NHS Training App - To-Do List (20 April 2026)

## High Priority - Fixes & Core

- [ ] 3CX integration
- [ ] Fix Generate PDF
- [ ] Audit Twilio SMS — sending too many emails
- [ ] Test Refresh Button
- [ ] Vendor Availability top colors adjustments
- [ ] Latest notes should show up on the top

## Medium Priority - UI / UX Improvements

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
