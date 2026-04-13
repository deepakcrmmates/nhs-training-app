# New Home Solutions — Salesforce CRM Platform

**Platform:** Salesforce Lightning (LWC + Apex)
**Client:** New Home Solutions
**Development Partner:** CRM Mates Ltd, London
**Lead Salesforce Consultant:** Deepak K Rana

---

## Overview

New Home Solutions (NHS) is a property sales and valuation management platform built on Salesforce Lightning. The platform manages the end-to-end lifecycle of property applications — from initial submission through agent valuations, final checks, and vendor discussions to completion.

NHS acts as an intermediary between house builders and property vendors, enabling staff to receive applications, schedule agent valuations, track pricing, perform quality checks, and communicate with all parties via integrated email and SMS.

## Key Statistics

| Metric | Count |
|---|---|
| Lightning Web Components | 115+ |
| Apex Classes (production) | 80+ |
| External Integrations | 9 |
| Opportunity Custom Fields | 192 |
| NHS Process Stages | 9 |

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Lightning Web Components (LWC) |
| Backend | Apex (Controllers, Services, Batch, Queueable) |
| File Storage | Box (OAuth2 integration) |
| Maps & Geocoding | Google Maps JavaScript API, Geocoding, Distance Matrix |
| Address Lookup | Ideal Postcodes API |
| Property Data | Street Data API, UK Property Data (RapidAPI) |
| Email | Salesforce Native (Resend Relay planned) |
| SMS | Twilio Managed Package (TwilioSF v4.159) |
| PDF Parsing | Airparser (LLM-powered document parsing) |
| PDF Generation | Visualforce Pages rendered to PDF |

## Application Navigation

| Tab | Description |
|---|---|
| Home | Dashboard with KPIs, pipeline overview, recent applications, appointments |
| Create Application | New application form (Vendor + Property + Agent + Housebuilder) |
| New Applications | Kanban board with 9-stage pipeline management |
| Search Property | Google Maps property search by postcode + radius with filters |
| Existing Properties | All NHS_Property__c records with search, sort, pagination |
| Agents | Estate Agent accounts (filtered by record type) |
| Housebuilders | Housebuilder accounts (filtered by record type) |
| Vendors | Vendor contacts (filtered by record type) |
| Airparser | PDF application parsing, transformation rules, auto-import |
| Email Templates | NHS branded email templates |
| Box Setup | Box OAuth configuration and file browser |
| API Config | Centralised API key management with health checks |

## NHS Process Pipeline

1. **Application** — New application received
2. **Vendor Availability** — Vendor provides calendar slots
3. **Agents Booked** — Up to 3 agents booked for valuations
4. **Figures to Chase** — Auto-triggered when appointments pass
5. **Valuations Ready** — All agent forms completed
6. **Figures Returned** — All 3 agents submitted prices
7. **Final Checks** — Expert quality assurance (7-point checklist)
8. **Vendor Discussions** — Direct vendor discussions
9. **Archived** — Completed or cancelled

## External Integrations

| Integration | Provider | Status |
|---|---|---|
| File Storage | Box | Active |
| SMS / Chat | Twilio (Managed Package) | Active |
| Agent Distance | Google Maps Geocoding + Distance Matrix | Active |
| Property Search Map | Google Maps JavaScript API | Active |
| Address Lookup | Ideal Postcodes | Active |
| Property Reports | UK Property Data (RapidAPI) | Active |
| EPC Ratings | Street Data API | Active |
| PDF Parsing | Airparser | Active |
| URL Shortener | TinyURL | Active |

## API Configuration

All API credentials are managed via Salesforce Custom Settings:

| Custom Setting | APIs |
|---|---|
| `Box_Config__c` | Box OAuth (Client ID, Secret, Tokens) |
| `Google_Maps_Config__c` | Google Maps (API Key, Daily Limit, Distance Method) |
| `NHS_API_Config__c` | Ideal Postcodes, RapidAPI, Street Data, TinyURL, Airparser |

## Custom Objects

| Object | Purpose |
|---|---|
| `NHS_Property__c` | Property details (address, type, bedrooms, EPC, tenure, features) |
| `Vendor_Availability__c` | Vendor calendar slots for agent bookings |
| `Vendor_Note__c` | Communication notes per application |
| `Offer__c` | Agent offers and valuations |
| `Chain_Details__c` | Property chain tracking |
| `Parsed_Application__c` | Airparser staging records for PDF-parsed applications |
| `Airparser_Field_Mapping__c` | Transformation rules for Airparser field mapping |

## Deployment

**Target Org:** Training Sandbox (`SandboxDev`)

```bash
# Deploy specific components
sf project deploy start \
  --source-dir force-app/main/default/lwc/componentName \
  --source-dir force-app/main/default/classes/ClassName.cls \
  --target-org SandboxDev

# Check deploy status
sf project deploy report --job-id <DEPLOY_ID> --target-org SandboxDev
```

## Documentation

- [Technical Document](docs/TECHNICAL_DOCUMENT.md) — Full system specification
- [Project Audit](docs/PROJECT_AUDIT.md) — Codebase audit and recommendations
- [Email Template Guidelines](docs/NHS_Email_Template_Guidelines.md) — Brand standards

---

**Maintained by:** CRM Mates Ltd | deepak@crmmates.com
