# New Home Solutions — Technical Documentation

**Platform:** Salesforce Lightning (LWC + Apex)
**Client:** New Home Solutions
**Development Partner:** CRM Mates Ltd, London
**Lead Salesforce Consultant:** Deepak K Rana
**Last Updated:** 20 April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [NHS Process Pipeline](#3-nhs-process-pipeline)
4. [Custom Objects & Fields](#4-custom-objects--fields)
5. [LWC Component Catalogue](#5-lwc-component-catalogue)
6. [Apex Class Catalogue](#6-apex-class-catalogue)
7. [External Integrations](#7-external-integrations)
8. [Final Checks Module](#8-final-checks-module)
9. [Communications Hub](#9-communications-hub)
10. [Deployment & Environments](#10-deployment--environments)
11. [Known Issues & Workarounds](#11-known-issues--workarounds)
12. [Change Log](#12-change-log)

---

## 1. Project Overview

New Home Solutions (NHS) is a property sales and valuation management platform built entirely on Salesforce Lightning. The platform manages the end-to-end lifecycle of property applications — from initial submission through agent valuations, final checks, and vendor discussions to completion and commission.

CRM Mates Ltd is the development partner responsible for the design, build, and ongoing enhancement of this platform.

### Key Statistics

| Metric | Count |
|---|---|
| Lightning Web Components | 116+ |
| Apex Classes (production) | 82 |
| Apex Test Classes | 30+ |
| External Integrations | 9 |
| Opportunity Custom Fields | 192 |
| Record Types (Opportunity) | 13 |
| NHS Process Stages | 9 |

### Business Context

New Home Solutions acts as an intermediary between house builders and property vendors. The platform enables NHS staff to:

- Receive and manage property applications from house builders
- Schedule vendor availability for agent valuations
- Book up to 3 estate agents per property for independent valuations
- Track valuation figures and generate NHS recommended pricing
- Perform final quality checks before vendor discussions
- Communicate with house builders via integrated email and SMS
- Generate and distribute PDF reports via Box cloud storage

---

## 2. Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Lightning Web Components (LWC) |
| Backend | Apex (Controllers, Services, Batch, Queueable) |
| PDF Generation | Visualforce Pages rendered to PDF |
| File Storage | Box (OAuth2 integration, replacing Dropbox) |
| Address Lookup | Ideal Postcodes API |
| Property Data | Street Data API, UK Property Data (RapidAPI) |
| Maps | Google Maps JavaScript API, Geocoding, Distance Matrix, Street View |
| PDF Parsing | Airparser (LLM-powered document extraction) |
| Email | Salesforce EmailMessage (Resend Email Relay planned) |
| SMS | Twilio Managed Package (TwilioSF v4.159) |
| API | Apex @RestResource endpoint (OpportunityService) |

### Design Patterns

- **Service Layer Architecture** — Business logic encapsulated in service classes (e.g., `VendorAvailabilityService`, `BoxFileService`, `PropertyReportService`)
- **Controller Pattern** — Each LWC feature area has a dedicated `@AuraEnabled` Apex controller
- **Batch Processing** — `OpportunityStageUpdaterBatch` for automated stage transitions when appointments pass
- **Queueable Jobs** — `TinyURLShortenerQueueable` for async URL shortening
- **Future Methods** — `@future(callout=true)` in `BoxFileService` for non-blocking API callouts
- **Custom Settings** — API credentials stored in Hierarchy Custom Settings (`Box_Config__c`). SMS via Twilio managed package (`TwilioSF__TwilioMetaData__c`)
- **Custom LWC Services** — Reusable service components: `toastService`, `scrollService`, `filterService`, `configService`, `dragDropService`

### Data Model Overview

The platform is **Opportunity-centric**. Each property application is an Opportunity record with:

- **Standard fields** extended with 192 custom fields
- **Lookups** to Account (House Builder, Agents 1-3), Contact (Vendors 1-2)
- **Related objects**: Vendor_Availability__c, Vendor_Note__c, NHS_Property__c, TwilioSF__Message__c (managed)
- **Custom Settings**: Box_Config__c (file storage credentials)
- **Managed Packages**: TwilioSF (SMS/Chat), Dropbox_for_SF (legacy)

---

## 3. NHS Process Pipeline

The `NHS_Process__c` picklist field on Opportunity drives the entire application workflow. It is a **restricted picklist** assigned to all 13 record types.

### Stage Definitions

| # | Stage (API Value) | Label | Description |
|---|---|---|---|
| 1 | `Application` | Applications | New application received. Vendor and property details captured. Default stage. |
| 2 | `Vendor Availability` | Vendor Availability | Vendor provides calendar availability slots for agent visits. |
| 3 | `Agents Booked` | Book Agents | Up to 3 agents booked for property valuations. |
| 4 | `Figures to chased` | Figures to Chase | Auto-triggered when appointment dates pass without valuations received. |
| 5 | `Valuations Ready` | Valuations Ready | All agent valuation forms completed and PDF reports generated. |
| 6 | `Figures returned` | Figures Returned | All 3 agents have submitted initial, target, and bottom line prices. |
| 7 | `Final Checks` | Final Checks | Expert cross-check of all application data before vendor discussions. |
| 8 | `Vendor Discussions` | Vendor Discussions | Direct discussions with vendors to finalise terms. |
| 9 | `Archived` | Archived | Completed or cancelled applications. |

### Stage Gate Validations

| Transition | Validation | Error Message |
|---|---|---|
| Any → Agents Booked | At least 1 vendor availability slot from tomorrow onwards | "At least 1 vendor availability slot (from tomorrow onwards) is required before moving to Book Agents." |
| Any → Final Checks | All 12 financial fields must be > 0: Agent 1/2/3 (Initial, Target, Bottom) + NHS (Market, Target, Forced) | "All financial values must be entered before moving to Final Checks." |

### Automated Stage Transitions

- **OpportunityStageUpdaterBatch** — Scheduled batch job queries Opportunities in "Agents Booked" stage. If appointment dates (`Agent_1/2/3_Appointment__c`) have passed and valuation not received, automatically updates `NHS_Process__c` to "Figures to Chased".
- **OpportunityStageUpdaterSchedule** — Scheduler class that runs the batch on a recurring basis.

---

## 4. Custom Objects & Fields

### Opportunity — Custom Field Groups

#### Application Details
| Field API Name | Type | Purpose |
|---|---|---|
| `Application_Reference_Number__c` | Text | Auto-generated reference |
| `Date_of_Application_Received__c` | Date | When application was received |
| `Development__c` | Text | Development/site name |
| `Plot__c` | Text | Plot number |
| `Property_Address__c` | Text | Full property address |
| `Scheme__c` | Picklist | Assisted Sale / New Home / Part Exchange |
| `NHS_Process__c` | Picklist (Restricted) | Current pipeline stage |

#### Vendor Details
| Field API Name | Type | Purpose |
|---|---|---|
| `Vendor_1__c` / `Vendor_2__c` | Contact Lookup | Vendor contacts |
| `Vendor_1_Email__c` | Email | Vendor email |
| `Vendor_1_Mobile__c` | Phone | Vendor mobile |

#### Agent Assignments (per agent, x3)
| Field API Name | Type | Purpose |
|---|---|---|
| `Agent_1__c` / `Agent_2__c` / `Agent_3__c` | Account Lookup | Estate agent companies |
| `Agent_X_Appointment__c` | DateTime | Scheduled appointment |
| `Agent_X_Initial_Asking_Price__c` | Currency | Agent's initial asking price |
| `Agent_X_Target_Sale__c` | Currency | Agent's target sale price |
| `Agent_X_Bottom_Line__c` | Currency | Agent's bottom line price |
| `Agent_X_Valuation_Recieved__c` | Checkbox | Whether valuation has been received |
| `Agent_X_Desktop_Valuation__c` | Checkbox | Desktop-only valuation (no visit) |
| `Agent_X_Emailed__c` | Text | Whether agent was emailed |
| `Agent_X_Verbally_Confirmed__c` | Text | Whether agent verbally confirmed |

#### NHS Recommended Pricing
| Field API Name | Type | Purpose |
|---|---|---|
| `Current_Asking_Price__c` | Currency | NHS recommended market value |
| `Target_Sale__c` | Currency | NHS recommended target sale |
| `Forced_Sale__c` | Currency | NHS recommended forced sale |

#### Final Checks (FC_ prefix)
| Field API Name | Type | Purpose |
|---|---|---|
| `FC_Agent_1_Report__c` | Checkbox | Agent 1 report verified |
| `FC_Agent_2_Report__c` | Checkbox | Agent 2 report verified |
| `FC_Agent_3_Report__c` | Checkbox | Agent 3 report verified |
| `FC_NHS_Pre_Will_Report__c` | Checkbox | NHS Pre-Will report verified |
| `FC_Will_Report__c` | Checkbox | Will report verified |
| `FC_Photos_Validated__c` | Checkbox | Property photos validated |
| `FC_Address_Validated__c` | Checkbox | Property address validated |

#### Kanban Management
| Field API Name | Type | Purpose |
|---|---|---|
| `Pinned__c` | Checkbox | Card pinned to top of kanban column (max 3) |
| `SortOrder__c` | Number | Custom sort order within kanban column |
| `Archived__c` | Checkbox | Application archived |
| `Blacklisted__c` | Checkbox | Blacklisted flag |

### Vendor_Availability__c

Stores vendor availability for agent booking. Auto-number name: `VA-{0000}`.

| Field | Type | Purpose |
|---|---|---|
| `Date__c` | Date | Availability date |
| `Vendor__c` | Contact Lookup | Vendor contact |
| `Agent__c` | Account Lookup | Agent account |
| `Application__c` | Opportunity Lookup | Related application |
| `AM__c` / `PM__c` | Checkbox | AM/PM availability toggle |
| `Hour_00__c` through `Hour_23__c` | Checkbox (x24) | Hourly slot availability |
| `Booked__c` | Checkbox | Slot has been booked |

### Vendor_Note__c

Communication notes linked to applications. Auto-number name: `VN-{0000}`.

| Field | Type | Purpose |
|---|---|---|
| `Application__c` | Opportunity Lookup | Related application |
| `Vendor__c` | Contact Lookup | Related vendor |
| `Notes__c` | Long Text | Note content |

### NHS_Property__c

Custom property object with detailed property characteristics.

| Field Group | Fields |
|---|---|
| Address | `Address__Street__s`, `Address__City__s`, `Address__PostalCode__s` |
| Type | `Detached__c`, `Semi_Detached__c`, `End_Terrace__c`, `Mid_Terrace__c`, `Apartment__c`, `Maisonette__c`, `Bungalow__c` |
| Features | `Number_Of_Bedrooms__c`, `Front_Garden__c`, `Back_Garden__c`, `Parking__c`, `Garage__c`, `Extension__c` |
| Tenure | `Freehold__c`, `Lease_Hold__c`, `Years_left_of_Lease__c`, `Service_Charge__c`, `Ground_Rent__c` |
| Other | `Type_of_Heating__c`, `Building_Regs_Planning_Permission__c`, `Principle_Residence__c` |

### Parsed_Application__c (Airparser Staging)

Staging records for PDF-parsed applications from Airparser. Auto-number name: `PA-{0000}`.

| Field Group | Fields |
|---|---|
| Status | `Status__c` (Picklist: New, Reviewing, Approved, Rejected, Created) |
| Airparser | `Airparser_Doc_Id__c` (External ID), `Airparser_Inbox_Id__c`, `Parsed_Date__c`, `Raw_JSON__c` (LongTextArea) |
| Vendor 1 | `Vendor_1_First_Name__c`, `Vendor_1_Last_Name__c`, `Vendor_1_Email__c`, `Vendor_1_Mobile__c` |
| Vendor 2 | `Vendor_2_First_Name__c`, `Vendor_2_Last_Name__c`, `Vendor_2_Email__c`, `Vendor_2_Mobile__c` |
| Property | `Property_Street__c`, `Property_City__c`, `Property_Postcode__c`, `Property_Type__c`, `Number_Of_Bedrooms__c` |
| Agent | `Agent_Name__c`, `Agent_Phone__c`, `Agent_Email__c` |
| Application | `Housebuilder_Name__c`, `Development__c`, `Plot__c`, `Purchase_Price__c`, `Client_Expectation__c`, `Scheme__c`, `Region__c`, `Notes__c` |
| Link | `Application__c` (Lookup → Opportunity) |

### Airparser_Field_Mapping__c (Transformation Rules)

Configurable field mapping rules for Airparser → Application conversion. Auto-number name: `MAP-{0000}`.

| Field | Type | Purpose |
|---|---|---|
| `Airparser_Field__c` | Text | Source field path (supports dot notation: `vendor_details.name`) |
| `Target_Section__c` | Picklist | Target: Vendor 1, Vendor 2, Property, Agent, Application |
| `Target_Field__c` | Text | Target field key (matches `houseBuilderApplication.saveData()` format) |
| `Target_Field_Label__c` | Text | Human-readable label |
| `Is_Active__c` | Checkbox | Active/inactive toggle |
| `Sort_Order__c` | Number | Processing order |

### TwilioSF__Message__c (Managed — SMS Tracking)

Managed by TwilioSF package. Key fields used by NHS CRM:

| Field | Type | Purpose |
|---|---|---|
| `TwilioSF__To_Number__c` | Text | Recipient phone number |
| `TwilioSF__From_Number__c` | Text | Sending phone number |
| `TwilioSF__Body__c` | Long Text | SMS message body |
| `TwilioSF__Direction__c` | Picklist | outbound-api / inbound |
| `TwilioSF__Status__c` | Picklist | queued / sent / delivered / failed |
| `TwilioSF__Date_Created__c` | DateTime | When SMS was created |
| `TwilioSF__Contact__c` | Contact Lookup | Vendor contact |
| `TwilioSF__SF_Parent_Record_Id__c` | Text | Opportunity ID (links to Comms Hub) |
| `TwilioSF__Message_SID__c` | Text | Twilio Message SID |

### Custom Settings

#### Box_Config__c (Hierarchy)

| Field | Purpose |
|---|---|
| `Client_Id__c` | Box OAuth Client ID |
| `Client_Secret__c` | Box OAuth Client Secret |
| `Refresh_Token__c` | Box OAuth Refresh Token (auto-rotated on each refresh) |
| `Root_Folder_Id__c` | Box root folder ID for account storage |
| `Access_Token__c` | Cached access token (avoids repeated token refreshes) |
| `Token_Expiry__c` | Access token expiry timestamp (50 min from refresh) |

#### Google_Maps_Config__c (Hierarchy)

| Field | Purpose |
|---|---|
| `API_Key__c` | Google Maps API key (Geocoding + Distance Matrix) |
| `Daily_Limit__c` | Max API requests per day (default 100) |
| `Requests_Today__c` | Counter for today's requests (auto-resets daily) |
| `Last_Reset_Date__c` | Date of last counter reset |
| `Distance_Method__c` | `"Distance Matrix"` (driving, default) or `"Geocoding"` (aerial) |

### Account — Geo & Agent Fields

| Field | Type | Purpose |
|---|---|---|
| `Geo_Latitude__c` | Number | Cached latitude from Google Maps geocoding |
| `Geo_Longitude__c` | Number | Cached longitude from Google Maps geocoding |
| `Rightmove_URL__c` | URL | Link to agent's Rightmove profile page |

### Opportunity — Box Integration

| Field | Type | Purpose |
|---|---|---|
| `Box_Folder_Id__c` | Text | Permanently links Opportunity to Box folder by ID |

### DropBox__mdt (Custom Metadata — Legacy)

Singleton configuration record (`DeveloperName = 'Drop_Box'`). Being replaced by `Box_Config__c`.

| Field | Purpose |
|---|---|
| `Client_Id__c` | Dropbox OAuth Client ID |
| `Client_Secret__c` | Dropbox OAuth Client Secret |
| `Refresh_Token__c` | Dropbox OAuth Refresh Token |

### Record Types (Opportunity)

| Record Type | Purpose |
|---|---|
| New_Home_Sales | Primary record type for new home sales applications |
| Assisted_Sales | Assisted sale scheme applications |
| Part_Exchange_Applications | Part exchange initial applications |
| Part_Exchange_Valuations_In_Process | Part exchange valuations in progress |
| Part_Exchange_Availability_Report | Part exchange availability reports |
| Part_Exchange_Offers | Part exchange offers |
| Part_Exchange_Instruction | Part exchange instructions |
| Part_Exchange_Sales_Progression | Part exchange sales progression |
| Part_Exchange_Commission | Part exchange commission tracking |
| Part_Exchange_Completed | Completed part exchanges |
| Events_and_Support | Events and support activities |
| Archived | Archived/completed applications |
| Unknown | Default/unclassified |

All 13 record types have the full set of 9 `NHS_Process__c` picklist values assigned.

---

## 5. LWC Component Catalogue

### Kanban & Pipeline Management

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsApplicationKanbanV7` | Main kanban board with 9-stage navigation, drag-drop, pin/archive, filtering | `NhsApplicationKanbanController` |
| `allApplicationKanban` | All applications kanban view | `AllApplicationKanban` |
| `archivedApplicationKanban` | Archived application management | `ArchivedApplicationKanbanController` |
| `mainKanbanScreen` | Parent container for kanban displays | — |
| `kanbanBoard` / `kanbanCard` / `kanbanColumn` | Reusable kanban sub-components | — |

### Application Forms

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsApplicationForm` | Main NHS application form (Create Application page) | `ApplicationFormController` |
| `nhsApplicationFormPro` | Professional version of application form | — |
| `houseBuilderApplicationForm` | House builder specific application form | `houseBuilderApplication` |

### View Application (Record Page)

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsOpportunityDetailedView` | Full opportunity record page with stage tracker, property details, agent valuations, and conditional section rendering | Multiple controllers |

### Vendor Availability & Scheduling

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsVendorAvailability` | Calendar interface with hourly slots, AM/PM toggles, week navigation | `VendorAvailabilityService` |
| `nhsVendorAvailabilityList` | List of vendor availability records | `VendorAvailabilityListController` |
| `nhsAgentBooking` | Agent booking interface | `EventController` |
| `nhsAgentBookedList` | List of agents with booked appointments | `AgentBookedListController` |

### Final Checks

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsFinalChecksList` | Kanban stage view — table of all Final Checks applications with inline checklist expansion | `FinalChecksController` |
| `nhsFinalChecksPanel` | Lightweight inline panel for record pages (uses LDS) | `FinalChecksController` |
| `nhsFinalChecksPage` | Full record page view with read-only application details, agent valuations, NHS recommendation, checkboxes, and integrated email send | `FinalChecksController`, `NHSCommunicationsController` |

### Communications

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsCommunicationsHub` | Central email and call management dashboard | `NHSCommunicationsController` |

### Document Management

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsBoxBrowser` | Box file browser on Application page — folder tree, upload, download, NHS folder structure, breadcrumb navigation | `BoxOAuthController` |
| `nhsBoxSetup` | Box OAuth setup, connection test, interactive file browser with folder/file management | `BoxOAuthController` |
| `nhsDropboxBrowser` | Legacy Dropbox file browser (being replaced by Box) | `DropboxBrowserController` |
| `nhsDropboxSetup` | Legacy Dropbox OAuth configuration | `DropboxOAuthController` |

### Chasing & Follow-ups

| Component | Purpose | Apex Dependency |
|---|---|---|
| `chasingSystem` / `chasingParentComponent` | Follow-up workflow for overdue valuations | `EventController` |
| `nhsFiguresToChaseList` | Outstanding figures requiring follow-up | `FiguresToChaseController` |
| `nhsFiguresReturnedList` | Valuations returned tracking | `FiguresReturnedController` |
| `nhsValuationsReadyList` | Valuations ready for review | `ValuationsReadyController` |

### Application Detail V2 (Record Page)

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsApplicationDetailV2` | Full application record page with pipeline view, property details, agent booking, valuations, final checks, vendor notes, Box storage | Multiple controllers |

**Stage-specific behaviour:**
- Stage 1 (Application): Property Details + Agent Details
- Stage 2 (Vendor Availability): AM/PM calendar with weekend toggles
- Stage 3 (Book Agents): 3 agent status cards + 15-min slot calendar + agent picker + Email Agent
- Stage 4 (Figures to Chase): Outstanding figures table with dynamic status
- Stage 5 (Valuations Ready): NHS Recommendations highlighted + Will Report upload
- Stage 7 (Final Checks): Read-only, only Final Checks checklist shown

### Home Dashboard

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsHomeDashboard` | Custom home page with greeting, KPI cards (active apps, new this month/week, appointments, properties/agents), pipeline bar chart, upcoming appointments, recent applications table | `HomeDashboardController` |

### Property Search

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsPropertySearch` | Google Maps property search by postcode + radius. Map with numbered pins, property cards with EPC/Tax/Flood icons, application history badges, snapshot filter stats | `PropertySearchController` |
| `PropertySearchMap` (VF) | Visualforce page hosting Google Maps JavaScript API in iframe (Locker Service workaround). Communicates with LWC via postMessage | — |

### List Views (Filtered Record Types)

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsAccountList` | Shared list component for Account/Contact record types. Search, sort, pagination, new record button | `AccountListController` |
| `nhsAgentsList` | Wrapper — Estate Agent accounts | `AccountListController` |
| `nhsHousebuildersList` | Wrapper — Housebuilder accounts | `AccountListController` |
| `nhsVendorsList` | Wrapper — Vendor contacts | `AccountListController` |
| `nhsExistingProperties` | NHS_Property__c list with two-line rows, EPC badges, all property fields | `AccountListController.getProperties` |

### Airparser Integration

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsAirparser` | PDF parsing integration — inbox browser, document viewer, schema management, transformation rules config, Create Application from parsed data | `AirparserController` |

### API Configuration

| Component | Purpose | Apex Dependency |
|---|---|---|
| `nhsApiConfig` | Centralised API key management with block/list view, edit modal, test connection, health status bulbs | `NHSApiConfigController`, `NHSApiHealthCheck` |

### Address & Property Lookup

| Component | Purpose | Apex Dependency |
|---|---|---|
| `idealPostcodeAutocomplete` | Ideal Postcodes API address autocomplete | `IdealPostcodeController` |
| `propertySearchAPI` | Street Data API for EPC ratings | `PropertySearchAPIController` |
| `mapViewer` | Property map visualisation | — |
| `callStreetAPI` | Google Street View images | `StreetViewController` |

### Offer Management

| Component | Purpose | Apex Dependency |
|---|---|---|
| `agentOfferForm` / `frontFacingAgentOfferForm` | Agent offer submission forms | `agentOfferController` |
| `offerKanbanView` | Offer management kanban | — |
| `viewingOffersTable` | Viewing and offer listings | `ViewingsOffersController` |

### Utility Components

| Component | Purpose |
|---|---|
| `customLookup` / `customLookupLwc` / `searchableCombobox` | Reusable lookup/search fields |
| `customLoader` | Loading spinner |
| `customCarousel` | Image carousel |
| `lightbox` | Image lightbox viewer |
| `toastService` / `scrollService` / `filterService` / `configService` / `dragDropService` | Shared LWC service components |
| `pagination2` | Pagination |
| `initialsCircle` / `accountCircles` | Avatar/initials display |
| `homeButton` | Home navigation |
| `dateRangeSlider` | Date range filtering |
| `ePCRating` / `dynamicEPC` | Energy Performance Certificate display |

---

## 6. Apex Class Catalogue

### Application & Opportunity Controllers

| Class | Sharing | Purpose |
|---|---|---|
| `NhsApplicationKanbanController` | with sharing | Kanban data retrieval, filtering, sorting, pin/archive, card ordering |
| `AllApplicationKanban` | with sharing | All applications kanban data |
| `ArchivedApplicationKanbanController` | — | Archived kanban functionality |
| `ApplicationFormController` | — | Application form data management |
| `OpportunityController` | — | General opportunity operations |
| `OpportunityService` | — | `@RestResource` endpoint for external opportunity creation |

### Final Checks

| Class | Sharing | Purpose |
|---|---|---|
| `FinalChecksController` | with sharing | `getFinalChecksApplications` — list view query; `getFinalChecks` — single record check values; `getFinalChecksPageData` — full page data with builder contacts; `saveFinalChecks` — update check values |

### Vendor & Agent Management

| Class | Sharing | Purpose |
|---|---|---|
| `VendorAvailabilityService` | — | Complex availability management: hourly slots, AM/PM, event creation, booking validation |
| `VendorAvailabilityListController` | — | List view of availability records |
| `EventController` | — | Event/appointment management, chasing count, valuation tracking |
| `VendorNoteController` | — | Vendor note CRUD |
| `AgentBookedListController` | — | Agents booked list data |

### Valuation & Figures

| Class | Sharing | Purpose |
|---|---|---|
| `FiguresToChaseController` | with sharing | Outstanding valuations list (Agents Booked + Figures to chased) |
| `FiguresReturnedController` | with sharing | All-figures-returned applications list |
| `ValuationsReadyController` | with sharing | Valuations ready for processing |

### Communications

| Class | Sharing | Purpose |
|---|---|---|
| `NHSCommunicationsController` | with sharing | Email send/receive with attachments, SMS via Twilio, template rendering, call logging. Methods: `getCommunications`, `getEmailTemplates`, `getRenderedTemplate`, `sendEmail`, `sendEmailWithAttachments`, `sendEmailWithBcc`, `sendSms`, `logCall` |

### Box Integration (File Storage)

| Class | Sharing | Purpose |
|---|---|---|
| `BoxFileService` | — | Core Box API: upload (multipart), shared links, folder management. Uses `@future(callout=true)` for async. Auto-creates folder structure: `/[Root]/[AccountName]/Application\|Valuation\|Logo/` |
| `BoxOAuthController` | with sharing | OAuth2 token exchange, refresh with auto-rotation, connection status check. Config from `Box_Config__c` Custom Setting |
| `BoxBrowserController` | with sharing | List folders/files, create property folder structure, download URLs |

### Dropbox Integration (Legacy)

| Class | Sharing | Purpose |
|---|---|---|
| `DropboxFileService` | — | Legacy Dropbox API. Being replaced by BoxFileService |
| `DropboxOAuthController` | — | Legacy OAuth2 for Dropbox |
| `DropboxBrowserController` | — | Legacy file browser |

### PDF Generation

| Class | Sharing | Purpose |
|---|---|---|
| `PdfGeneratorController` | — | Application PDF generation and attachment |
| `PdfGeneratorPageController` | — | Visualforce page controller for PDF rendering |
| `HouseBuilderPdfController` | — | House builder application PDFs |
| `valuationFormPdfController` | — | Valuation assessment report PDFs |
| `SendPDFonCreationHandler` | — | Trigger handler: auto-sends valuation PDF via email |

### Address & Property APIs

| Class | Sharing | Purpose |
|---|---|---|
| `AddressController` / `AddressFinderController` | — | Address validation and Ideal Postcodes integration |
| `IdealPostcodeController` | — | Postcode search and autocomplete |
| `PropertySearchAPIController` | — | Street Data API for EPC ratings |
| `StreetDataController` / `StreetDataService` | — | Street-level property data |
| `StreetViewController` | — | Google Street View metadata |
| `PropertyReportService` | — | UK Property Data (RapidAPI) reports |

### Property Search

| Class | Sharing | Purpose |
|---|---|---|
| `PropertySearchController` | with sharing | Google Maps geocoding, Haversine distance, property search by postcode + radius, application history counts (all-time, month, year), latest application ID per property |

### Home Dashboard

| Class | Sharing | Purpose |
|---|---|---|
| `HomeDashboardController` | with sharing | Dashboard KPIs: active applications, new this month/week, upcoming appointments, total properties/agents, pipeline by NHS Process, recent applications, upcoming events |

### List Views

| Class | Sharing | Purpose |
|---|---|---|
| `AccountListController` | with sharing | Filtered Account/Contact/Property list views with search, sort, pagination. Methods: `getAccounts`, `getContacts`, `getProperties` |

### Airparser Integration

| Class | Sharing | Purpose |
|---|---|---|
| `AirparserController` | with sharing | Full Airparser API integration: `listInboxes`, `getInboxDetails`, `getSchema`, `setupSchema` (nested object schema matching PDF structure), `fetchRawDocuments`, `testConnection`, `getMappings`, `saveMappings`, `createDefaultMappings` (45 rules), `createApplicationFromParsed` (applies transformation rules with dot-notation nested field access, name splitting, address splitting, currency parsing, housebuilder lookup) |

### API Configuration & Health Check

| Class | Sharing | Purpose |
|---|---|---|
| `NHSApiConfigController` | with sharing | Reads all Custom Settings (Box, Google Maps, NHS API, Twilio, Airparser), builds config cards with masked values, updates individual fields via dynamic SObject |
| `NHSApiHealthCheck` | — | Schedulable health checker for 8 APIs: Box, Google Maps, Ideal Postcodes, RapidAPI, Street Data, TinyURL, Twilio, Airparser. Saves compact status to NHS_API_Config__c |

### House Builder Applications

| Class | Sharing | Purpose |
|---|---|---|
| `houseBuilderApplication` | — | Creates vendors (Contact), property (NHS_Property__c), agents (Account), and application (Opportunity) with savepoint/rollback |

### Batch & Scheduled Jobs

| Class | Purpose |
|---|---|
| `OpportunityStageUpdaterBatch` | Queries "Agents Booked" opportunities, checks past appointments, auto-updates to "Figures to Chased" |
| `OpportunityStageUpdaterSchedule` | Scheduler for the batch job |

### Utilities

| Class | Purpose |
|---|---|
| `CommonUtil` | Shared utility functions |
| `URLShortenerService` / `TinyURLShortenerQueueable` | URL shortening |
| `ValuationAssessmentSharingService` | Valuation record sharing |
| `ImageController` / `ImageURLToFileObject` | Image handling |

### Authentication (Community/Site)

| Class | Purpose |
|---|---|
| `SiteRegisterController` / `SiteLoginController` | External site auth |
| `LightningLoginFormController` / `LightningSelfRegisterController` | Lightning login/registration |
| `ForgotPasswordController` / `ChangePasswordController` | Password management |
| `CommunitiesLoginController` / `CommunitiesSelfRegController` | Community portal |

---

## 7. External Integrations

### Custom Settings (API Configuration)

All custom development integrations are managed via Custom Settings:

| Custom Setting | Integration | Fields |
|---|---|---|
| `Box_Config__c` | Box File Storage | Client_Id, Client_Secret, Refresh_Token, Access_Token, Token_Expiry, Root_Folder_Id |
| `Google_Maps_Config__c` | Google Maps (Geocoding + Distance Matrix) | API_Key, Daily_Limit, Requests_Today, Last_Reset_Date, Distance_Method |
| `NHS_API_Config__c` | Ideal Postcodes, RapidAPI, Street Data, TinyURL, Airparser | Ideal_Postcodes_Key, RapidAPI_Key, Street_Data_Endpoint, TinyURL_Endpoint, Airparser_API_Key, Airparser_Inbox_Id |

### Managed Packages

| Package | Namespace | Version | Integration | Config |
|---|---|---|---|---|
| Twilio For Salesforce | `TwilioSF` | v4.159 | SMS / Chat | `TwilioSF__TwilioMetaData__c` (managed) |
| Jotform | `jotform` | v1.3 | Forms | Managed |
| Dropbox for Salesforce | `Dropbox_for_SF` | v1.707 | File Storage (Legacy) | **Deactivated** — replaced by Box |

### Full Integration List

| # | Integration | Provider | Type | Config | Apex Classes | Remote Sites | Status |
|---|---|---|---|---|---|---|---|
| 1 | **File Storage** | Box | Custom Dev | `Box_Config__c` | BoxOAuthController, BoxFileService, BoxBrowserController | Box_API, Box_Upload, Box_OAuth | **Active** |
| 2 | **SMS / Chat** | Twilio | Managed + Custom | `TwilioSF__TwilioMetaData__c` | NHSCommunicationsController.sendSms | 6 Twilio managed sites | **Active** (awaiting UK number) |
| 3 | **Agent Distance** | Google Maps Geocoding | Custom Dev | `Google_Maps_Config__c` | AgentFinderController | Google_Maps_API | **Active** |
| 4 | **Driving Distance** | Google Maps Distance Matrix | Custom Dev | `Google_Maps_Config__c` | AgentFinderController | Google_Maps_API (shared) | **Active** |
| 5 | **Address Lookup** | Ideal Postcodes | Custom Dev | `NHS_API_Config__c` | AddressFinderController, IdealPostcodesHandler | IdealPostCode | **Active** |
| 6 | **Property Reports** | UK Property Data (RapidAPI) | Custom Dev | `NHS_API_Config__c` + Named Credential | PropertyDataService, PropertyReportService | RapidAPI, RapidAPIDirect | **Active** |
| 7 | **EPC Ratings** | Street Data API | Custom Dev | `NHS_API_Config__c` + Custom Metadata `streetData__mdt` | streetDataService, PropertySearchAPIController | StreetData, img | **Active** |
| 8 | **Street View** | Google Maps Street View | Custom Dev | `Google_Maps_Config__c` (shared) | StreetViewController | Google_Maps_API (shared) | **Active** |
| 9 | **Email** | Salesforce Native | Native | — | NHSCommunicationsController | — | **Active** (Resend relay pending) |
| 10 | **Email Templates** | Salesforce Lightning | Native | NHS Email Templates folder | NHSCommunicationsController | — | **Active** (11 templates) |
| 11 | **URL Shortener** | TinyURL | Custom Dev | `NHS_API_Config__c` | TinyURLShortenerQueueable | tiny | **Active** |
| 12 | **Forms** | Jotform | Managed Package | Managed | — | jotform | **Installed** |
| 13 | **PDF Parsing** | Airparser | Custom Dev | `NHS_API_Config__c` | AirparserController | Airparser_API | **Active** |
| 14 | **Property Search Map** | Google Maps JavaScript API | Custom Dev | `Google_Maps_Config__c` | PropertySearchController + PropertySearchMap.page | Google_Maps_API (shared) | **Active** |
| 15 | **File Storage (Legacy)** | Dropbox | Custom Dev + Managed | `DropBox__mdt` | DropboxFileService, DropboxOAuthController | **6 sites deactivated** | **Deactivated** |

### Remote Site Settings

| Status | Count | Sites |
|---|---|---|
| **Active** | 21 | Box (3), Google Maps (1), Ideal Postcodes (1), Street Data (2), RapidAPI (2), Twilio managed (6), Jotform (1), TinyURL (1), CodeBuilder (2), OrgDomain (1), PropertyAPI (1) |
| **Deactivated** | 7 | Dropbox (6), Twilio_API (1) |

### API Key Management — Where to Change

| To change... | Go to |
|---|---|
| Box credentials | Setup > Custom Settings > **Box Config** |
| Google Maps API key / limits / distance method | Setup > Custom Settings > **Google Maps Config** |
| Ideal Postcodes API key | Setup > Custom Settings > **NHS API Config** |
| RapidAPI key (Property Data) | Setup > Custom Settings > **NHS API Config** |
| Street Data API endpoint | Setup > Custom Settings > **NHS API Config** |
| TinyURL endpoint | Setup > Custom Settings > **NHS API Config** |
| Twilio SID / Messaging Service | Twilio app > **TwilioMetaData** (managed) |
| Airparser API key / Inbox ID | Setup > Custom Settings > **NHS API Config** |
| Email templates | Setup > Email Templates > **NHS Email Templates** folder |

### Integration Details

#### Box (File Storage)

| Detail | Value |
|---|---|
| Auth | OAuth2 with refresh token flow (tokens auto-rotate) |
| API Endpoint | `https://api.box.com/2.0` |
| Upload Endpoint | `https://upload.box.com/api/2.0/files/content` |
| OAuth Endpoint | `https://account.box.com/api/oauth2/authorize` |
| Folder Structure | `[Root Folder]/[Property Address]/Application\|Valuations\|Photos\|Will Report/` |
| Folder Mapping | `Opportunity.Box_Folder_Id__c` — permanently links Opportunity to Box folder by ID (not name) |
| Token Caching | Access token cached in Custom Setting for 50 minutes. `ensureAccessToken()` refreshes only when expired |
| Tab | `Box_Setup` Lightning Tab in New Home Solutions app |

**Apex:** `BoxOAuthController`, `BoxFileService`, `BoxBrowserController`
**LWC:** `nhsBoxSetup` (OAuth + file browser), `nhsBoxBrowser` (Application page file manager)

#### Twilio (SMS / Chat)

| Detail | Value |
|---|---|
| Package | Twilio For Salesforce (TwilioSF v4.159) |
| Message Object | `TwilioSF__Message__c` (managed) |
| Sending | Insert `TwilioSF__Message__c` → managed package trigger handles API call |
| Features | Outbound SMS, inbound SMS, two-way chat, bulk SMS, opt-in management |

**Apex:** `NHSCommunicationsController.sendSms()` creates `TwilioSF__Message__c` with `SF_Parent_Record_Id__c` for Comms Hub history

#### Google Maps (Geocoding + Distance Matrix)

| Detail | Value |
|---|---|
| Distance Methods | **Distance Matrix** (driving distance + drive time, default) or **Geocoding** (aerial/Haversine) |
| Coordinate Caching | `Geo_Latitude__c` / `Geo_Longitude__c` on Account — each agent geocoded once permanently |
| Rate Limiting | Daily counter auto-resets. Default 100/day. Free tier: $200/month ≈ 40,000 requests |

**Distance Matrix Flow:** Pre-filter by aerial distance → 1 API call for up to 25 agents → driving miles + drive time

**Assign Agent Wizard:** 3-step LWC (Search → Select Agents → Confirm). Top 10 nearest with Rightmove links, phone/mobile, reassignment support.

#### Email (Salesforce Native)

| Detail | Value |
|---|---|
| Sending | `Messaging.SingleEmailMessage` with file attachments |
| Templates | 11 branded HTML templates (01–09, with 04 cloned x3 agents) |
| Planned | Resend SMTP Email Relay for reliable delivery |
| Pending | DNS records for `newhomesolutions.co.uk`, final system email address |

#### Ideal Postcodes

| Detail | Value |
|---|---|
| Endpoint | `https://api.ideal-postcodes.co.uk/v1/` |
| Config | `NHS_API_Config__c.Ideal_Postcodes_Key__c` |
| Apex | `AddressFinderController`, `IdealPostcodesHandler` |

#### UK Property Data (RapidAPI)

| Detail | Value |
|---|---|
| Endpoint | `https://api-ir7ctmwisa-ew.a.run.app/` |
| Config | `NHS_API_Config__c.RapidAPI_Key__c` + Named Credential `UKPropertyDataAPI` |
| Apex | `PropertyDataService`, `PropertyReportService` |

#### Street Data API

| Detail | Value |
|---|---|
| Endpoint | `https://api.data.street.co.uk/street-data-api/v2/` |
| Config | `NHS_API_Config__c.Street_Data_Endpoint__c` + Custom Metadata `streetData__mdt` |
| Apex | `streetDataService`, `PropertySearchAPIController` |

#### TinyURL

| Detail | Value |
|---|---|
| Endpoint | `http://tinyurl.com/api-create.php` |
| Config | `NHS_API_Config__c.TinyURL_Endpoint__c` |
| Apex | `TinyURLShortenerQueueable` |

#### Airparser (PDF Application Parsing)

| Detail | Value |
|---|---|
| API Base | `https://api.airparser.com` |
| Auth | `X-API-Key` header from `NHS_API_Config__c.Airparser_API_Key__c` |
| Inbox ID | `NHS_API_Config__c.Airparser_Inbox_Id__c` |
| Schema | Nested object structure: `vendor_details`, `description_of_property`, `details_of_current_agent`, `client_availability` + 12 top-level fields |
| Tab | `Airparser` Lightning Tab |
| Remote Site | `Airparser_API` |

**Flow:** Email with PDF → Airparser inbox → AI parses PDF → Salesforce fetches parsed data → User reviews in LWC → Clicks "Create Application" → Transformation rules map fields → `houseBuilderApplication.saveData()` creates full application (Opportunity + Property + Vendors + Agent)

**Transformation Rules:** 45 default mapping rules stored in `Airparser_Field_Mapping__c`. Support dot-notation for nested fields (e.g. `vendor_details.name`). Smart transformations:
- **Name splitting:** `"ANTHONY WHITWELL"` → First: `ANTHONY`, Last: `WHITWELL`
- **Address splitting:** `"9 HOLDEN ROAD BRIERFIELD BB9 5DR"` → Street + City + Postcode (UK postcode regex)
- **Currency parsing:** `"£495,000"` or `"Â£250,000"` → `495000` (removes symbols, commas, encoding artifacts)
- **Housebuilder lookup:** Name → Account ID (House_Builder record type)

**Apex:** `AirparserController` — listInboxes, getSchema, setupSchema, fetchRawDocuments, getMappings, saveMappings, createDefaultMappings, createApplicationFromParsed

#### Google Maps JavaScript API (Property Search)

| Detail | Value |
|---|---|
| Config | `Google_Maps_Config__c.API_Key__c` (shared with Geocoding/Distance Matrix) |
| Implementation | Visualforce page (`PropertySearchMap.page`) embedded in LWC iframe. LWC ↔ VF communication via `postMessage` |
| CSP Trusted Sites | `*.googleapis.com`, `*.gstatic.com`, `*.google.com`, `*.ggpht.com` |
| Features | Numbered green pins (NHS branding), search center marker, radius circle overlay, info windows, pin ↔ card click sync |

**Apex:** `PropertySearchController` — geocodes search postcode, queries NHS_Property__c with coordinates, Haversine distance filter, application history counts (all-time, this month, this year), per-property latest Opportunity ID

#### Dropbox (Legacy — Deactivated)

| Detail | Value |
|---|---|
| Config | Custom Metadata: `DropBox__mdt` |
| Status | Deactivated. 6 Remote Sites deactivated. Code remains for backward compatibility. PDF controllers now use BoxFileService |

### Pending Integrations

| Item | What's needed |
|---|---|
| Twilio UK phone number | Regulatory submission pending |
| Email Relay (Resend) | DNS records for newhomesolutions.co.uk + final system email |
| Dropbox uninstall | Can remove managed package + Apex classes once confirmed |
| Airparser schema refinement | Fine-tune parsing accuracy based on different PDF formats |

---

## 8. Final Checks Module

### Overview

The Final Checks module provides expert quality assurance before an application moves to Vendor Discussions. It consists of 7 validation checkpoints, read-only financial summaries, and integrated email to notify the house builder.

### Data Model

Seven checkbox fields on Opportunity, all prefixed `FC_`:

| Field | Label | Check Group |
|---|---|---|
| `FC_Agent_1_Report__c` | Agent 1 Report | Agent Reports |
| `FC_Agent_2_Report__c` | Agent 2 Report | Agent Reports |
| `FC_Agent_3_Report__c` | Agent 3 Report | Agent Reports |
| `FC_NHS_Pre_Will_Report__c` | NHS Pre-Will Report | Will Reports |
| `FC_Will_Report__c` | Will Report | Will Reports |
| `FC_Photos_Validated__c` | Photos Validated | Validation |
| `FC_Address_Validated__c` | Address Validated | Validation |

### Apex Controller: FinalChecksController

| Method | Cacheable | Purpose |
|---|---|---|
| `getFinalChecksApplications(searchTerm)` | No | Queries all applications in "Final Checks" stage with search |
| `getFinalChecks(opportunityId)` | No | Returns Map<String, Boolean> of 7 check values |
| `getFinalChecksPageData(opportunityId)` | No | Returns full page data: application details, 3 agents' valuations, NHS recommended pricing, check values, and builder contacts with emails |
| `saveFinalChecks(opportunityId, checks)` | No | Updates 7 checkbox fields from Map<String, Boolean> |

### LWC Components

#### nhsFinalChecksList (Kanban Stage View)
- Displayed when user clicks "Final Checks" tab in the kanban
- Table of all applications in Final Checks stage
- Each row shows progress bar (X/7) and status badge
- Click row to expand inline checklist panel
- Grouped checkboxes (Agent Reports, Will Reports, Validation)
- Save/Cancel per application
- Search and refresh

#### nhsFinalChecksPage (Record Page View)
Displayed on the Opportunity detail page when `NHS_Process__c = 'Final Checks'`. Hides all other sections (Property Details, Agent Details, Dropbox, Vendor Notes).

**Sections displayed:**

1. **Application Details** (read-only) — Application Name, Builder Name, Vendor Name, Email, Mobile
2. **Agent Valuations** (read-only) — 3-agent table with Initial/Target/Bottom prices + Average column. Agent headers colour-coded: Agent 1 green (#16a34a), Agent 2 blue (#2563eb), Agent 3 purple (#7c3aed)
3. **NHS Recommendation** (read-only) — Market Value, Target Sale, Forced Sale
4. **Final Checks** (editable) — 7 checkboxes in 3 groups with progress bar. Save button appears when dirty
5. **Final Email** (conditional) — Unlocked only when all 7 checks are complete

**Email Workflow:**

1. Template picker opens in a lightbox modal with search
2. Selected template is rendered with merge fields via `NHSCommunicationsController.getRenderedTemplate`
3. Recipients are builder contacts (auto-populated from House_Builder__c Account's Contacts with email). All pre-selected with toggle pills
4. Manual CC and BCC fields for additional comma-separated emails
5. Subject line is editable
6. Email body preview rendered as HTML (min-height 450px)
7. "Confirm & Send" button — first selected contact as To, remaining as CC, manual BCC as BCC
8. Sends via `NHSCommunicationsController.sendEmailWithBcc`

### Stage Gate Validation

Transition to "Final Checks" requires all 12 financial fields to have values > 0:

- Agent 1: `Agent_1_Initial_Asking_Price__c`, `Agent_1_Target_Sale__c`, `Agent_1_Bottom_Line__c`
- Agent 2: `Agent_2_Initial_Asking_Price__c`, `Agent_2_Target_Sale__c`, `Agent_2_Bottom_Line__c`
- Agent 3: `Agent_3_Initial_Asking_Price__c`, `Agent_3_Target_Sale__c`, `Agent_3_Bottom_Line__c`
- NHS: `Current_Asking_Price__c`, `Target_Sale__c`, `Forced_Sale__c`

Validation is enforced in `nhsOpportunityDetailedView.handleStageChange()` with a sticky error toast on failure.

---

## 9. Communications Hub

### Overview

The Communications Hub (`nhsCommunicationsHub` LWC + `NHSCommunicationsController` Apex) provides centralised multi-channel communication management per Opportunity. Opens as a right-side slide panel (1120px) from the bottom bar or Property Details Email button.

### 4-Tab Layout

| Tab | Layout | Features |
|---|---|---|
| **Email** | Split view: list left, detail right. Full-width compose mode | Inbox/Sent toggle, email detail with Reply/Forward, compose with template library, address book, CC/BCC, attachments |
| **Calls** | Call list with filter bar | All/Incoming/Outgoing/Missed filters, Call Now (tel: link), Log Call form with type/status/subject/notes |
| **SMS** | Sidebar + chat view | Conversation list, WhatsApp-style chat bubbles, inline send with character counter |
| **WhatsApp** | Full chat view | WhatsApp-style green bubbles with double-check marks, contact header with online status, inline send via Twilio whatsapp: prefix |

### Address Book

Loads related contacts for the opportunity via `getAddressBook()`:
- Vendor 1 & 2 (Contact email)
- Agent 1, 2, 3 (Account-level email + related contacts with titles)
- Housebuilder (Account-level email + related contacts)
- De-duplicated by email. Search/filter. "To" and "CC" quick-add buttons.

### Header Context

Shows Property Address, Vendor Name, and Housebuilder Name. Accepts `@api` props from parent with Apex fallback via `getOpportunityContext()`.

### Capabilities

| Feature | Detail |
|---|---|
| Email History | Queries `EmailMessage` records — full HtmlBody, sender, recipient, subject, status, timestamps |
| SMS History | Queries `TwilioSF__Message__c` records — auto-detects WhatsApp via `whatsapp:` number prefix |
| Call Logging | Creates `Task` records with CallType, duration, status |
| Email Templates | Loads from "NHS Email Templates" folder. Dynamic merge field rendering via `Messaging.renderStoredEmailTemplate` |
| Outbound Email | Sends via `Messaging.SingleEmailMessage` with file attachments, CC, and BCC |
| Email Attachments | Upload files via `lightning-file-upload`, attached as `EmailFileAttachment` from `ContentDocument` |
| SMS Send | Creates `TwilioSF__Message__c` record. Pre-fills vendor mobile |
| WhatsApp Send | Creates `TwilioSF__Message__c` with `whatsapp:` prefix on To number |
| CC/BCC Support | `sendEmailComplete` method supports CC, BCC, attachments in single call |
| Address Book | `getAddressBook()` returns all related contacts with role/category |
| Admin Check | `isAdminUser()` checks System Administrator or Super Admin profile |
| Box Attachments | "Attach from Box" button in Compose Email — browse the Opportunity's Box folder tree, select files, attach to email alongside uploaded files |

### Apex Methods

| Method | Purpose |
|---|---|
| `getCommunications(opportunityId)` | Returns email + SMS/WhatsApp + call history (EmailMessage, TwilioSF__Message__c, Task) |
| `getEmailTemplates()` | Lists active templates from NHS folder |
| `getRenderedTemplate(templateId, opportunityId)` | Renders template with vendor/opportunity merge fields |
| `sendEmail(...)` | Basic email send (delegates to sendEmailWithAttachments) |
| `sendEmailWithAttachments(...)` | Email send with file attachments from ContentDocument IDs |
| `sendEmailWithBcc(...)` | Email send with CC/BCC (no attachments) |
| `sendEmailComplete(...)` | Full email send with CC, BCC, and attachments |
| `sendSms(opportunityId, toNumber, body)` | Sends SMS via TwilioSF managed package |
| `sendWhatsApp(opportunityId, toNumber, body)` | Sends WhatsApp via TwilioSF with whatsapp: prefix |
| `logCall(opportunityId, vendorContactId, subject, description, callType, status)` | Log call activity as Task |
| `getOpportunityContext(opportunityId)` | Returns opp name, address, vendor/housebuilder details |
| `getAddressBook(opportunityId)` | Returns all related contacts (vendors, agents, housebuilder + their contacts) |
| `isAdminUser()` | Returns true if current user is System Administrator or Super Admin |
| `getBoxFilesForOpportunity(opportunityId)` | Returns Box folder contents for the Opportunity's property address (files grouped by subfolder) |
| `sendEmailWithBoxAttachments(...)` | Full email send with CC, BCC, ContentDocument attachments, AND Box file attachments (downloaded server-side via Box API) |

---

## 10. Deployment & Environments

### Target Orgs

| Org | Alias | Username |
|---|---|---|
| Training Sandbox | SandboxDev | deepak-nhs-ee@crmmates.com.training |

### Salesforce CLI Commands

**Deploy specific components:**
```bash
sf project deploy start \
  --source-dir force-app/main/default/lwc/componentName \
  --source-dir force-app/main/default/classes/ClassName.cls \
  --source-dir force-app/main/default/classes/ClassName.cls-meta.xml \
  --target-org SandboxDev
```

**Deploy all record types:**
```bash
sf project deploy start \
  --source-dir force-app/main/default/objects/Opportunity/recordTypes \
  --target-org SandboxDev
```

**Deploy picklist field:**
```bash
sf project deploy start \
  --source-dir force-app/main/default/objects/Opportunity/fields/NHS_Process__c.field-meta.xml \
  --target-org SandboxDev
```

**Check deploy status (when CLI shows locale error):**
```bash
sf project deploy report --job-id <DEPLOY_ID> --target-org SandboxDev
```

**Retrieve metadata from org:**
```bash
sf project retrieve start \
  --metadata "CustomField:Opportunity.NHS_Process__c" \
  --target-org SandboxDev \
  --output-dir /tmp/retrieve-output
```

### Project Structure

```
force-app/main/default/
├── classes/                    # Apex classes + meta XML
├── lwc/                        # Lightning Web Components
│   ├── nhsApplicationKanbanV7/ # Main kanban board
│   ├── nhsOpportunityDetailedView/ # Record detail page
│   ├── nhsFinalChecksList/     # Final Checks kanban view
│   ├── nhsFinalChecksPanel/    # Final Checks inline panel
│   ├── nhsFinalChecksPage/     # Final Checks full page
│   ├── nhsCommunicationsHub/   # Email + call management
│   ├── nhsHomeDashboard/       # Home dashboard
│   ├── nhsPropertySearch/      # Property search with Google Maps
│   ├── nhsExistingProperties/  # Property list view
│   ├── nhsAgentsList/          # Agents list (Estate Agents)
│   ├── nhsHousebuildersList/   # Housebuilders list
│   ├── nhsVendorsList/         # Vendors list
│   ├── nhsAccountList/         # Shared list component
│   ├── nhsAirparser/           # Airparser PDF parsing integration
│   ├── nhsApiConfig/           # API configuration manager
│   ├── nhsBoxBrowser/          # Box file browser (Application page)
│   ├── nhsBoxSetup/            # Box OAuth setup
│   ├── nhsDropboxBrowser/      # Dropbox file browser (legacy)
│   └── ...                     # 100+ other components
├── objects/
│   └── Opportunity/
│       ├── fields/             # 192 custom field definitions
│       ├── recordTypes/        # 13 record types
│       ├── validationRules/    # 4 validation rules (all inactive)
│       ├── listViews/          # Multiple list views
│       └── businessProcesses/  # Sales processes
├── pages/                      # Visualforce pages (PDF)
└── triggers/                   # Apex triggers
```

---

## 11. Known Issues & Workarounds

| Issue | Detail | Workaround |
|---|---|---|
| CLI Locale Error | `Missing message metadata.transfer:Finalizing for locale en_US` on deploy | Deploy succeeds despite error. Use `sf project deploy report --job-id <ID>` to verify |
| Picklist Typo | `Figures to chased` (API value) vs `Figures to chase` (label) | Maintained for backward compatibility — all code references the API value |
| FLS on New Fields | Newly deployed custom fields may not be visible via Lightning Data Service (getRecord) | Use Apex controllers instead of LDS for new fields. FinalChecksPanel was refactored from LDS to Apex for this reason |
| Restricted Picklist + Record Types | Adding new picklist values requires updating ALL 13 record types, not just the field definition | Always deploy record type changes alongside picklist changes |

---

## 12. Change Log

| Date | Change | Components Affected |
|---|---|---|
| 2026-04-07 | Added Final Checks and Vendor Discussions stages (7 & 8) | NHS_Process__c picklist, 13 record types, nhsApplicationKanbanV7 (TOP_STAGES), nhsOpportunityDetailedView (stages getter, nhsProcessOptions) |
| 2026-04-07 | Created 7 Final Checks checkbox fields | FC_Agent_1_Report__c, FC_Agent_2_Report__c, FC_Agent_3_Report__c, FC_NHS_Pre_Will_Report__c, FC_Will_Report__c, FC_Photos_Validated__c, FC_Address_Validated__c |
| 2026-04-07 | Built FinalChecksController Apex class | getFinalChecksApplications, getFinalChecks, getFinalChecksPageData, saveFinalChecks |
| 2026-04-07 | Built 3 Final Checks LWC components | nhsFinalChecksList (kanban view), nhsFinalChecksPanel (inline), nhsFinalChecksPage (full page with email) |
| 2026-04-07 | Added stage gate validation for Final Checks | nhsOpportunityDetailedView — validates 12 financial fields before allowing transition |
| 2026-04-07 | Added sendEmailWithBcc to NHSCommunicationsController | Supports comma-separated CC and BCC lists |
| 2026-04-07 | Updated View Application to hide sections during Final Checks | Property Details, Agent Details, Dropbox, Vendor Notes hidden; Final Checks page shown |
| 2026-04-07 | Improved View Application fonts and currency inputs | Consistent 12.5px fonts, no number spinners, centered £ values with 3px gap |
| 2026-04-07 | Created project presentation | presentation.html — 15 slides with NHS brand, 9-stage pipeline, contact details |
| 2026-04-08 | Created 9 branded email templates (01–09) | 11 templates deployed to "NHS Email Templates" folder (04 cloned x3 agents) |
| 2026-04-08 | Created formula fields for email templates | Vendor_1_Name__c, Property_Description__c, Agent_1/2/3_Name__c, Agent_1/2/3_Appt_Day/Date/Time__c |
| 2026-04-08 | Added email attachment support | lightning-file-upload in Comms Hub, ContentDocument→EmailFileAttachment in Apex |
| 2026-04-09 | Added SMS via Twilio REST API | Twilio_Config__c Custom Setting, Twilio_SMS__c tracking object, SMS compose in Comms Hub |
| 2026-04-09 | Built Box integration (replacing Dropbox) | BoxOAuthController, BoxFileService, BoxBrowserController, nhsBoxSetup, nhsBoxBrowser LWCs, Box_Config__c Custom Setting, 3 Remote Site Settings |
| 2026-04-09 | Updated PDF controllers for Box | HouseBuilderPdfController, valuatonFormPdfController, AccountLogoUploader now use BoxFileService |
| 2026-04-09 | Added vendor contact write-back | Editing Mobile/Phone/Email on Application page updates Contact record via updateVendorContact Apex |
| 2026-04-09 | Improved Application page typography | Aptos font, increased font sizes, centre-aligned values and agent lookups |
| 2026-04-10 | Migrated SMS from custom to Twilio managed package | Removed Twilio_SMS__c and Twilio_Config__c, sendSms now creates TwilioSF__Message__c records |
| 2026-04-10 | Built full Box integration with file browser | BoxOAuthController, BoxFileService, BoxBrowserController, nhsBoxSetup, nhsBoxBrowser LWCs |
| 2026-04-10 | Box Setup page with interactive file manager | OAuth setup, folder browser, create folders, upload/download files, upload progress |
| 2026-04-10 | Application page Box browser with NHS folder structure | Property folder tree with subfolders (Application, Valuations, Photos, Will Report), file counts, upload, download |
| 2026-04-10 | Box folder ID mapping on Opportunity | Box_Folder_Id__c permanently links Opportunity to Box folder, backfilled existing folders |
| 2026-04-10 | Access token caching for Box | Access_Token__c and Token_Expiry__c fields, ensureAccessToken() pattern to avoid DML-after-callout |
| 2026-04-10 | Box folder name sanitization | / and \ characters replaced with - to prevent Box API errors |
| 2026-04-10 | BoxCallback Visualforce page and Box_Setup tab | OAuth redirect handler, tab added to New Home Solutions app |
| 2026-04-10 | Migrated SMS to Twilio managed package | Removed custom Twilio_SMS__c and Twilio_Config__c, sendSms creates TwilioSF__Message__c, getCommunications queries managed object |
| 2026-04-10 | Built Assign Agent wizard | 3-step wizard: radius selection, nearest agents list with Google Maps Geocoding, agent assignment with duplicate prevention |
| 2026-04-10 | AgentFinderController with geocoding | Google Maps API for postcode geocoding, Haversine distance calculation, postcode area filtering, cached coordinates on Account |
| 2026-04-10 | Google_Maps_Config__c Custom Setting | API Key, Daily Limit (default 100), Requests Today counter with auto-reset, Remote Site Setting |
| 2026-04-10 | Geo caching on Account | Geo_Latitude__c and Geo_Longitude__c fields — one-time geocode per agent, subsequent searches use cached coordinates (1 API call per search) |
| 2026-04-10 | Rightmove_URL__c on Account | Links to agent Rightmove profile, auto-generated search URL if not set, shown in Assign Agent lightbox |
| 2026-04-10 | Quick Agent Create (+) button | Modal on Agent 1/2/3 lookups — creates Account (Estate Agent RT) + Contact with Company Name, First/Last Name, Email, Mobile, Phone |
| 2026-04-10 | Figures to Chase filter fix | Records in "Figures to chased" stage now always shown regardless of agent visit status |
| 2026-04-10 | Application page section reorder | Box File Storage and Vendor Notes always appear as last two sections |
| 2026-04-11 | Added Distance Matrix API for driving distances | Configurable via Distance_Method__c: "Distance Matrix" (driving + drive time) or "Geocoding" (aerial). 1 API call per search for up to 25 agents |
| 2026-04-11 | Assign Agent wizard improvements | Phone/Mobile shown in agent list, dropdown overflow fix, step labels (Search, Select Agents, Confirm) |
| 2026-04-11 | Created NHS_API_Config__c Custom Setting | Centralised API keys: Ideal Postcodes, RapidAPI, Street Data endpoint, TinyURL endpoint |
| 2026-04-11 | Migrated hardcoded API keys to Custom Settings | AddressFinderController, IdealPostcodesHandler, PropertyDataService, PropertyReportService, PropertySearchAPIController, TinyURLShortenerQueueable |
| 2026-04-11 | Integration cleanup | Deleted Box__mdt (empty), deleted unused NHSSalesforce Twilio config, deactivated 7 Remote Sites (6 Dropbox + 1 Twilio_API) |
| 2026-04-11 | Appointment booking lightbox | Read-only DD/MM/YYYY — HH:MM display, calendar icon opens slot picker, books via Vendor Availability, creates Event for Agent Booking sync |
| 2026-04-11 | Two-way booking sync | Calendar lightbox ↔ Agent Booking component auto-refresh via @api refreshData() and custom event onagentbooked |
| 2026-04-13 | Built Property Search with Google Maps | PropertySearchController, nhsPropertySearch LWC, PropertySearchMap VF page (iframe), numbered pins, EPC/Tax/Flood icons, application history badges, snapshot filter stats, CSP Trusted Sites |
| 2026-04-13 | Built Home Dashboard | HomeDashboardController, nhsHomeDashboard LWC — greeting, 4 KPI cards, pipeline bar chart, upcoming appointments, recent applications table, quick action buttons |
| 2026-04-13 | Reorganised app navigation | Tabs: Home, Create Application, New Applications, Search Property, Existing Properties, Agents, Housebuilders, Vendors, Airparser, Email Templates, Box Setup, API Config |
| 2026-04-13 | Created Agents, Housebuilders, Vendors list LWCs | nhsAccountList (shared), nhsAgentsList, nhsHousebuildersList, nhsVendorsList — filtered by record type with search, sort, pagination |
| 2026-04-13 | Created Existing Properties LWC | nhsExistingProperties — two-line rows, EPC colour badges, all property fields, search/sort/pagination |
| 2026-04-13 | Updated vendor creation to use Vendor record type | houseBuilderApplication.createVendors now assigns Vendors RT. Backfilled 164 existing contacts |
| 2026-04-13 | Built Airparser integration | AirparserController, nhsAirparser LWC, Parsed_Application__c staging object, Airparser_Field_Mapping__c transformation rules, Airparser_API Remote Site, NHS_API_Config__c fields (Airparser_API_Key, Airparser_Inbox_Id) |
| 2026-04-13 | Airparser features: inbox browser, doc viewer, schema push, transformation rules | Drill-down: List Inboxes → Click inbox → Documents → Click doc → Parsed fields. Mapping Rules: 45 default rules, dot-notation nested access, name/address splitting, currency parsing |
| 2026-04-13 | Added Airparser to API Config page and health check | NHSApiConfigController updated with Airparser block, NHSApiHealthCheck tests Airparser API connectivity |
| 2026-04-14 | Built Application Detail V2 (nhsApplicationDetailV2) | New Lightning Record Page with pipeline view (yellow current, green done, white future), two-column layout (main + 300px sticky sidebar), collapsible agent details, stage-specific card visibility |
| 2026-04-14 | V2 Property Details card | Green address box (5-column: Address, HouseBuilder lookup, Development, Plot, Scheme), blue vendor info box (4-column: Name, Mobile, Phone, Email), 3 metric cards (Vendor Expectations, Received Date, ALCD), action buttons (Call, Email, Notes with quick note popup, Get Directions via Google Maps) |
| 2026-04-14 | V2 Agent Details section | 3 color-coded columns (green/blue/lavender), colored headers, read-only appointments, Desktop Valuation toggle with "No visit required" badge, valuation figures as horizontal rows (£ prefix + input), NHS Recommendations section with underline inputs, Agent Last Emailed On read-only datetime display |
| 2026-04-14 | V2 Vendor Availability (AM/PM model) | 2-row calendar (AM/PM instead of hourly), bulk marks (All Day/AM/PM/Clear), per-day All toggle, weekend enable checkbox (persistent via data detection), past days disabled in sage, hourly slots synced from AM/PM on save via VendorAvailabilityService.syncHourlySlotsFromAmPm |
| 2026-04-14 | V2 Book Agents (inline) | 3 agent status cards with booking display, collapsible availability calendar with 15-min sub-slots (2x2 grid), agent picker popover (Book/Amend/Desktop states), Desktop Valuation blocks booking, future-only slots, cancel booking with double confirmation + reason saved to Vendor Notes |
| 2026-04-14 | V2 Email Agent | ✉️ Email Agent 1/2/3 buttons on Book Agents status cards, compose modal with HTML preview (lightning-formatted-rich-text), pre-populated templates (04a/04b/04c), stamps Last_Agent_X_Emailed_On__c on send |
| 2026-04-14 | V2 Figures to Chase | Amber Outstanding Figures table (Agent, Date, Time, Status), Desktop Valuation support (no visit needed, shows "Desktop Valuation" badge), dynamic status: ⏳ Figures Waiting vs ✓ Figures Available (appointment past + all 3 valuations > 0) |
| 2026-04-14 | V2 Valuations Ready stage | NHS Recommendations highlighted in light red with pulse animation, Will Report upload to Box (uploads to Will Report subfolder, auto-refreshes Box browser) |
| 2026-04-14 | V2 Final Checks stage | Shows nhsFinalChecksPage checklist, hides Property Details/Agent Details/Box/Vendor Notes/Save buttons, entire application read-only |
| 2026-04-14 | V2 Vendor Notes | Connected to VendorNoteController, add/display/paginate (5/10/25 per page with prev/next), quick note popup from Property Details header, booking cancellation notes with slot date/time |
| 2026-04-14 | V2 Bottom bar | Comms Hub, Generate PDF, Refresh (always visible), Cancel + Save Application with save animation (Saving.../✓ Saved), hidden on Final Checks |
| 2026-04-14 | V2 Quick Summary sidebar | Sticky with internal scroll, status badge, all application fields + vendor contact details, info divider |
| 2026-04-14 | New fields: Last Agent Emailed On | Last_Agent_1_Emailed_On__c, Last_Agent_2_Emailed_On__c, Last_Agent_3_Emailed_On__c (DateTime) on Opportunity |
| 2026-04-14 | Box Browser updates | Reactive propertyAddress loading (setter), ensureAccessToken before folder creation (DML fix), handleRefresh exposed as @api, sage header styling matching V2 cards |
| 2026-04-14 | uploadFileFromContentDoc Apex method | BoxOAuthController — reads ContentVersion, uploads to Box folder, cleans up ContentDocument |
| 2026-04-14 | VendorAvailabilityService.syncHourlySlotsFromAmPm | Private helper: AM=true sets Hour_08-11, PM=true sets Hour_12-16, clears all other slots |
| 2026-04-16 | Comms Hub rebuilt with 4-tab design | nhsCommunicationsHub — Email (split view + compose), Calls (filter + log), SMS (chat), WhatsApp (chat with green bubbles). Right-side slide panel (1120px) |
| 2026-04-16 | Address Book for email compose | NHSCommunicationsController.getAddressBook — returns vendors, agents, housebuilder + related contacts. "To" and "CC" quick-add buttons |
| 2026-04-16 | Comms Hub header with context | Shows Property Address, Vendor Name, Housebuilder Name. Accepts @api props with Apex fallback |
| 2026-04-16 | WhatsApp channel detection and send | getCommunications detects whatsapp: prefix in Twilio numbers. sendWhatsApp Apex method added |
| 2026-04-16 | sendEmailComplete Apex method | Full email send with CC, BCC, attachments, and template support in single call |
| 2026-04-16 | Quick Actions card (stages 1–3) | Conditional buttons above Quick Summary: Set Vendor Availability, Assign Agent 1/2/3. Disappears when all actions complete |
| 2026-04-16 | Vendor Availability lightbox | Opens from Quick Actions — full calendar modal with Mark buttons, week nav, AM/PM grid, Save button. Sets stage to Vendor Availability |
| 2026-04-16 | Quick Call popup | Property Details Call button shows all stakeholders (Vendor 1/2, Agent 1/2/3) with phone numbers and tel: call buttons |
| 2026-04-16 | Email button on Property Details | Opens Comms Hub with compose pre-opened via autoCompose @api prop |
| 2026-04-16 | Agent reassignment (edit icons) | Edit pencil on Agent 1/2/3 headers (both Agent Details and Book Agents sections). Opens Assign Agent modal in reassign mode with full rebooking flow (calendar + email + submit) |
| 2026-04-16 | Edit Application modal (admin only) | isAdminUser() Apex check. Editable fields: Vendor Expectations, ALCD, Received Date, Scheme, Development, Plot, Property Description, Property Address, Notes. Amber-themed modal |
| 2026-04-16 | Property Description in Quick Summary | PROPERTY_DESCRIPTION_FIELD imported, added to formData and Quick Summary card |
| 2026-04-16 | Property Description fixed in email templates | Templates 04a/04b/04c updated: replaced field ID reference (00NKG000003ykEj) with {{{Opportunity.Property_Description__c}}} |
| 2026-04-16 | Vendor_Contact_Display__c formula field | Comma-separated email, mobile, phone (blanks skipped). Used in templates 04a/04b/04c replacing hardcoded `/ ` separator |
| 2026-04-16 | Quick Notes card (side column) | Replaced Application Notes card with inline Quick Note textarea + Add Note button. Application Notes moved to Quick Summary as read-only |
| 2026-04-16 | Quick Summary scrollbar removed | card-summary overflow changed from auto to visible |
| 2026-04-16 | Agent email Step 4 redesign | Full-width TO with address book, CC/BCC side-by-side, proper SUBJECT and EMAIL PREVIEW layout |
| 2026-04-16 | 1-hour booking notice rule | Book Agents and Assign Agent calendars: slots locked if start time < current time + 1 hour |
| 2026-04-16 | NHS_Process__c picklist unrestricted | Changed restricted=false so stage changes work across all record types |
| 2026-04-16 | Dropbox integration fully removed | Deleted DropboxFileService, DropboxBrowserController, DropboxOAuthController, DropboxTestDataFactory, nhsDropboxBrowser, nhsDropboxSetup, DropBox__mdt, DropboxCallback page, Dropbox_Setup tab |
| 2026-04-20 | Box file attachments in Compose Email | New "Attach from Box" button opens file picker overlay. Loads Opportunity's Box folder (by Property Address), groups files by subfolder (Root/Application/Valuations/Photos/Will Report), multi-select with checkboxes, shows file size. Selected files marked with blue Box badge in attachment list |
| 2026-04-20 | getBoxFilesForOpportunity Apex method | NHSCommunicationsController — queries Opportunity.Property_Address__c, delegates to BoxBrowserController.getBoxFolder, returns files + subfolders |
| 2026-04-20 | sendEmailWithBoxAttachments Apex method | Downloads each selected Box file server-side via Box API (/files/{id}/content with 302 redirect handling), attaches as Messaging.EmailFileAttachment alongside uploaded files. Callouts performed before DML |
| 2026-04-20 | Box picker tree view redesign | Matches Box File Storage layout — root folder header, subfolder rows with `└─` connectors, folder icons, file count badges, click-to-drill-down navigation. Preferred folder order: Application, Valuations, Photos, Will Report. Back button to return to tree |
| 2026-04-20 | Switched Box lookup to Box_Folder_Id__c | getBoxFilesForOpportunity now uses the cached Box folder ID on Opportunity (same as Box File Storage) instead of searching by property address. Fixes failures when address contains special characters |
| 2026-04-20 | Split attachment layout in Compose Email | Left column: standard Upload Files with drop zone. Right column: "Browse Box Files" button. Vertical pipe divider. Responsive stacking on narrow screens |
| 2026-04-20 | Box Download CDN Remote Sites | Added Box_Download_CDN (dl.boxcloud.com) and Box_Download_Public (public.boxcloud.com) — Box redirects file downloads to these CDN domains via 302 |
| 2026-04-20 | Email attachments displayed in Comms Hub | getCommunications now queries ContentDocumentLinks and classic Attachments for all emails. Email detail view shows sage-themed chip list with file icon, name, size, download link |
| 2026-04-20 | Post-send attachment linking | After Messaging.sendEmail success, the controller finds the auto-created EmailMessage, saves Box file blobs as ContentVersions, and inserts ContentDocumentLinks linking both uploaded and Box files to the EmailMessage |
| 2026-04-20 | Email reply/forward format | Reply pre-fills body with separator + "On [date], [sender] wrote:" + original body as blockquote (left-border quote style). Forward includes "---------- Forwarded message ----------" header block with From/Date/Subject/To and original body |
| 2026-04-20 | Per-agent Valuation Report upload | New Opportunity fields Agent_1/2/3_Valuation_Report_Box_Id__c + _Name__c. BoxOAuthController.uploadValuationReport uploads to Valuations subfolder (prefixed "Agent N - filename"), stores Box file ID + name on Opportunity. UI placeholder below each agent's Valuation Figures with dashed upload button, uploading spinner, uploaded-state chip with file icon and remove button |
| 2026-04-20 | Assign Agent map view (list / map toggle) | Step 2 of Assign Agent modal now has List/Map radio toggle. Map view shows interactive map with property pin (sage), available agents (blue), assigned agents (orange). Radius circle drawn. Agents with no geocode are skipped. Overlapping pins at same postcode fan out in 50m circle |
| 2026-04-20 | NHS Project Plan object | Parent object NHS_Project_Plan__c (Title, Description, Status, Start/End Date) + Master-Detail child NHS_Project_Plan_Task__c (Title, Description, Priority, Status, Category, Assigned To, Due/Completed Date, Notes, Sort Order). Object Permissions via NHS_Project_Plan_Access Permission Set |
| 2026-04-20 | Project Plan Kanban LWC | nhsProjectPlanKanban — 4 priority columns (Critical/High/Medium/Low), drag-and-drop between columns, task cards tinted by category, Active/History tabs, inline quick-status buttons (Done, In Progress), task edit modal with all fields, seeded with 46 historical + current tasks |
| 2026-04-20 | NhsProjectPlanController Apex | getProjectPlans, getTasks (with includeClosed filter for History tab), saveTask, updateTaskPriority, updateTaskStatus, deleteTask, saveProjectPlan. Auto-stamps Completed_Date__c on status transition to Done/Cancelled |
| 2026-04-20 | Mapbox integration (dual-provider) | NHS_API_Config__c new fields: Map_Provider__c (Auto/Mapbox/Google Maps), Mapbox_Public_Token__c, Mapbox_Requests_Today__c, Mapbox_Daily_Limit__c (default 1500), Mapbox_Last_Reset_Date__c. Counters auto-reset daily |
| 2026-04-20 | MapProviderResolver Apex | resolve() returns active provider + token + usage stats. Logic: user preference first, auto-fallback to other provider on quota hit. incrementMapboxCounter() tracks daily usage |
| 2026-04-20 | nhsMap unified LWC | Dual-provider wrapper. Mapbox path uses VF iframe (`/apex/MapboxMap`) to bypass Lightning Web Security restrictions. Google Maps path uses standard lightning-map. Provider selected automatically via MapProviderResolver. Shows fallback reason banner if preferred provider unavailable |
| 2026-04-20 | MapboxMap Visualforce page | Loads Mapbox GL JS v3.8 from Mapbox CDN. Reads token/lat/lng/zoom/style/radius/routes/markers from URL query params (markers base64-encoded JSON). Renders property pin (sage teardrop), agent pins (blue/orange teardrops with numeric labels), dashed radius circle, dotted route lines from property to each agent. Auto-fits bounds. Overlapping pins fan out radially. Clickable pins post `markerclick` event to parent LWC |
| 2026-04-20 | Mapbox CSP + Remote Sites | CspTrustedSite: api.mapbox.com, events.mapbox.com. RemoteSiteSetting: api.mapbox.com (for Apex health check callout) |
| 2026-04-20 | Mapbox health checks | NHSApiHealthCheck.testMapbox calls api.mapbox.com geocoding endpoint to verify token + report usage. testMapProvider shows which provider is active + fallback reason + both quota counts. Both added to NHS Config page Test button + scheduled 6-hourly health check |
| 2026-04-20 | NHS Config bulb live update | After Test button click, card bulb turns green/amber/red instantly without page reload. Tooltip shows timestamp + message |
| 2026-04-20 | Map Provider settings UI on NHS Config | Two new cards on NHS API Config page: "Map Provider" (radio: Auto/Mapbox/Google Maps) and "Mapbox" (token, limit, usage). Edit Settings button opens inline edit with radio group. Generic pickerOptions on picklist fields so each picklist carries its own option set |
| 2026-04-20 | Housebuilder custom module — Apex controller | NhsHousebuilderController: createHousebuilder (Account + multiple Contacts + Box logo upload with public shared link, saved to Logo_URL__c and House_Builder_Logo__c), getHousebuilderDetail (cacheable — returns Account + Contacts + Applications via House_Builder__c + EmailMessages), addContactToHousebuilder, deleteContact. Logo uploaded to `/NHS Logos/{sanitizedName}/` folder with createSharedLink |
| 2026-04-20 | nhsHousebuilderNew LWC | Branded creation page: company logo dashed-upload zone (base64, <4MB, preview), Company Details grid (Name/Email/Phone/Website + full address), dynamic Contacts section with "+ Add Contact" (First Name/Last Name/Email/Mobile/Job Title per row, remove button). Dispatches `created` and `cancelled` events to parent |
| 2026-04-20 | nhsHousebuilderDetail LWC (record page) | Lightning record page for House Builder Account. Sage gradient hero header with logo box, address with Google Maps link, phone/email/website quick-action pills. Three tabs (Contacts / Applications / Comms History) with count badges and active underline. Contacts rendered as 5-column list (avatar+name / job title / email / mobile / phone / delete-on-hover). Applications list with color-coded stage pills per NHS_Process__c value (Application=blue, Vendor Availability=purple, Agents Booked=amber, Figures to chase=rose, Figures returned=teal, Valuations Ready=indigo, Final Checks=green, Vendor Discussions=pink, Archived=grey). Comms history with inbound/outbound direction badges. Add-Contact modal with sage gradient header |
| 2026-04-20 | NHS_Housebuilder_Record_Page FlexiPage | New Account Record Page containing only nhsHousebuilderDetail — assigned manually in Lightning App Builder to the House Builder record type |
| 2026-04-20 | Housebuilders list inline create | nhsAccountList "+ New Housebuilder" button dispatches `newhousebuilder` custom event instead of standard new-record navigation. nhsHousebuildersList toggles between list and creation form inline with Back-to-list button — avoids tab-permission navigation issues |
| 2026-04-20 | New_Housebuilder custom tab | CustomTab pointing to nhsHousebuilderNew LWC (kept as fallback entry point — primary path is via Housebuilders list) |
| 2026-04-21 | Fix Generate PDF button on Application page | HTML called `handleGeneratePdf` (lowercase df) but JS defined `handleGeneratePDF` — case-sensitive LWC binding made click a no-op. Also added missing `<template if:true={showPdfModal}>` markup + `.pdf-backdrop/.pdf-modal` CSS so the spinner + "Generating PDF..." status actually render |
| 2026-04-21 | Create Application manual address toggle | nHSApplicationForm Property Details section now has an "Enter Manually" pill button in the header. Toggles between the IdealAddress lookup and a 2-column grid (Street full-width / City / Postcode / Country full-width). Writes to the same hidden Address__*__s fields + formData.Property so the Save flow is unchanged |
| 2026-04-21 | Go to Application button on success screen | After application submission, the success card shows Download PDF (brand-outline) + Go to Application (brand, with forward arrow). Handler uses NavigationMixin to open the new Opportunity record |
| 2026-04-21 | Property Description self-healing derivation | nhsApplicationDetailV2 imports Property__r.{Detached, Semi_Detached, End_Terrace, Mid_Terrace, Apartment, Maisonette, Maisonette_Studio, Bungalow, Other, Number_Of_Bedrooms}__c. When Opportunity.Property_Description__c is blank, LWC derives the description ("Apartment 2 Bed") from the linked NHS_Property__c — fixes Quick Summary showing blank for records where type/bedrooms were set after creation |
| 2026-04-21 | Vendor Household model — create + backfill | createVendors (Apex) now creates a `{LastName} Household` Account (RecordType = Household) and links both vendor Contacts to it. Removed legacy `Contact.AccountId = opp.House_Builder__c` post-insert update. Backfill script `scripts/backfill_vendor_households.apex` re-parented 179 vendor Contacts across 137 Opportunities whose vendors were wrongly linked to House Builder accounts |
| 2026-04-21 | Housebuilder Detail — Edit modal | nhsHousebuilderDetail: sage Edit button in hero contact strip opens modal editing Name / Email / Phone / Website / Billing Address. NhsHousebuilderController.updateHousebuilder accepts JSON payload. Phone validation: 3 layers — keypress block, paste scrubber (`/[^0-9+()\-\s]/g`), save-time regex. Email format validated too. hbd-modal-wide variant for the larger form |
| 2026-04-21 | Vendors list — Account column | AccountListController.getContacts SELECTs Account.Name + AccountId; nhsAccountList template adds a conditional "Account" column (visible only for Contact-based lists). Clickable link to the Household Account |
| 2026-04-21 | Project Plan Kanban — cache fix (auto-load) | Removed `cacheable=true` from NhsProjectPlanController.getTasks. New tasks now appear instantly after save, drop actions persist in the UI, refresh works as expected. Cacheable breaks imperative-call reload because the cache wins |
| 2026-04-21 | Project Plan Kanban — drag & drop animation + optimistic update | Dragging: card ghost rotates and dims (`.task-dragging`). Drop target: column highlights with pale-green tint + dashed sage outline (`.drop-target-active`). Drop: card lands instantly via optimistic `this.tasks` mutation, plays `cardLand` cubic-bezier pop animation (0.45s). Server sync fire-and-forget with silent revert on failure |
| 2026-04-21 | Valuation Ready smart eligibility rules | ValuationsReadyController: Agent 1 unassigned → never qualifies. Agent 1 name = "New Home Solutions" (case-insensitive) → only Agents 2 & 3 need all 3 figures (Initial / Target / Bottom). Otherwise all 3 agents need all 3 figures. Case-insensitive trim on Agent_1__r.Name |
| 2026-04-21 | Twilio sync scheduler stopped | Aborted `Notify Message Sync Failure` + `Twilio Monthly Archive Messages` CronTriggers (Twilio package unused). Stops the hourly sync-failure email flood. `scripts/abort_twilio_jobs.apex` runnable if jobs re-appear |
| 2026-04-21 | Fix Create Application infinite-loop crash | `houseBuilderApplication.getAccountFileUrl` threw QueryException on null accountId — LWC @wire re-fired in a loop. Fix: Apex null-check returns null instead of querying. LWC added guarded getter `_wiredHousebuilderId` that returns `undefined` unless housebuilderId is a valid 18-char Id, preventing @wire from firing at all |
| 2026-04-21 | Quick Notes — latest note display | Below Add Note button, render most recent note in a sage-tinted card: "LATEST NOTE" label + date/time on right, note body (preserves line breaks), author attribution. vendorNotes already returned DESC by CreatedDate so vendorNotes[0] is the latest |
| 2026-04-21 | Refresh button — comprehensive reload + spinner | handleRefresh now parallels refreshApex(wiredRecord) + loadVendorNotes + loadVaData + loadBaSlots via Promise.all. Button shows "Refreshing..." label + spinning icon (`btnRefreshSpin` animation) while disabled; cursor `wait`. Fixes Notes/VA/BA staleness after refresh |
| 2026-04-21 | UK currency formatting on Valuation Figures | nhsApplicationDetailV2 adds `_fmtGB(v)` + `fmt` getter returning en-GB comma-separated strings for all 12 currency fields (Agent 1/2/3 × Initial/Target/Bottom + NHS Market/Target/Forced). Input bindings swapped from `{formData.*}` to `{fmt.*}`. `handleFieldChange` strips £, commas, spaces and casts to Number before updateRecord — raw numbers stored in Salesforce, formatted strings rendered in inputs |
| 2026-04-21 | Final Checks — blocker panel | nhsFinalChecksPage: email composer hidden until all 7 checks ticked AND all 12 valuation figures populated. New `missingValuations` getter scans Agent 1/2/3 figures + NHS Market/Target/Forced. Red blocker panel replaces the old locked card — lists exactly what's missing per agent and for NHS Recommendation. `showEmail` / `showMoveNext` now gate on both checks AND valuations |
| 2026-04-21 | Final Checks — configurable email template at NHS Config | New `NHS_API_Config__c.Final_Checks_Email_Template_Id__c` (Text 18). NHSApiConfigController adds "Final Checks Email" config card with `email-template` field type + derived Template Name readonly row. nhsApiConfig LWC loads email template options from `NHSCommunicationsController.getEmailTemplates` and wires them into pickOptions. FinalChecksController.getFinalChecksPageData returns `defaultTemplateId`. nhsFinalChecksPage `_applyDefaultTemplate()` auto-invokes pick-handler after templates load — subject + body render immediately. Bespoke health logic: green bulb when template mapped & exists, red when mapped Id not found, grey when blank |
| 2026-04-21 | Preview button on Property Address | Imports `Opportunity.Property__c`; new formData.propertyId + hasPropertyRecord getter. Eye-icon Preview button on the right of PROPERTY ADDRESS label (only when linked). Uses `NavigationMixin.GenerateUrl` + `window.open(url, '_blank', 'noopener')` so the NHS_Property__c record opens in a new browser tab, leaving the Application in place |
| 2026-04-21 | Companies House integration (Phase 1) | New `Companies_House_Config__c` Custom Setting (API_Key, Daily_Limit 7000, counters). New Account fields `Company_Number__c` (text 12, external Id) + `SIC_Codes__c`. Remote Site `Companies_House_API`. `NhsCompaniesHouseController.searchCompanies/getCompany/getSicGroups` with Basic Auth + daily counter auto-reset. Reusable LWC `nhsCompaniesHouseSearch` with sage-gradient modal, SIC group filter, debounced live search. Wired into `nhsHousebuilderNew` Company Details — "Find on Companies House" button auto-fills Name/Street/City/Postcode/Country + shows green "Imported #{number}" chip. NHS Config page adds "Companies House" card with green bulb when API key present |
| 2026-04-21 | Project Plan Kanban — Refresh button | Parallel refresh of `wiredPlans` (refreshApex) + `loadTasks()`. Button shows "Refreshing…" label + spinning icon (btnRefreshSpin animation) while disabled |
| 2026-04-21 | NHS_Preferred_Agent__c junction object | New custom object linking Housebuilder Account ↔ Estate Agent Account. Fields: `Housebuilder__c` (Lookup Account, Restrict delete), `Estate_Agent__c` (Lookup Account, Restrict delete), `Priority__c` (Number), `Status__c` (picklist: Active/Paused/Removed), `Notes__c` (Long Text 2000), `Added_Date__c` (Date, default TODAY), `Unique_Key__c` (formula). New CustomTab + Permission Set `NHS_Preferred_Agent_Access` (full CRUD + FLS + tab). `scripts/assign_preferred_agent_perms.apex` auto-assigns perm set to all System Administrator users (5 admins assigned) |
| 2026-04-21 | Housebuilder Detail — Preferred Agents 4th tab | New tab with live count. `NhsHousebuilderController.searchEstateAgents` (excludes already-preferred), `addPreferredAgent`, `updatePreferredAgent`, `deletePreferredAgent` Apex methods. Add-Agent modal with debounced live search + priority + notes. Edit modal keeps agent as read-only locked pill; Priority / Status / Notes editable. Table columns: Priority · Agent (name + email) · City · Phone · Status pill (green/amber/grey) · Added Date · edit/delete action icons |
| 2026-04-21 | Housebuilder Detail — unified list view pattern | Refactored Applications and Comms History tabs to use the same canonical `hbd-contact-list` grid as Contacts and Preferred Agents — sage-tinted header row, column-aligned grid rows, hover tint, consistent typography. Applications: Application · Development · Plot · Vendor · Received · **Stage** (moved to right, 180px col, nowrap). Comms History: Dir · Subject+preview · From · To · When (relative + absolute date stacked) |
| 2026-04-21 | Contacts — edit modal | Added ✎ edit icon (hover-reveal) alongside × delete on Contact rows. `NhsHousebuilderController.updateContact` accepts firstName/lastName/email/mobile/phone/jobTitle. Modal pre-populates fields; mobile + phone use same 3-layer phone validation (keypress block, input scrubber, save regex) as the Housebuilder Edit modal |
| 2026-04-21 | Comms History — Email viewer slide panel | Clicking a Comms History row now opens a right-side slide panel (720px, sage gradient header) instead of navigating away. `NhsHousebuilderController.getEmailMessage` returns full HtmlBody + TextBody + attachments (ContentDocumentLinks). Panel shows subject, inbound/outbound pill, From/To/Cc/Bcc metadata, Date + relative time, attachment chips with download URLs, and the full rendered HTML body (with blockquote styling for quoted replies). "Go to Application" header button still lets users jump to the Opp. Null-safe getters (`hasEmailViewer`, `emailHasOpp`, `emailHasAttachments`) prevent template errors during loading. `stopProp` handler added (was missing for existing Contact links too) |
| 2026-04-21 | Housebuilder Detail — Edit modal, phone validation, color-coded stage pills, improved Comms design | Sage Edit button in hero; modal edits Name/Email/Phone/Website/Address. Phone field 3-layer validation (keypress block, paste scrubber, save regex). Application stage pills colour-coded by NHS_Process value (blue/purple/amber/rose/teal/indigo/green/pink/grey). Comms History redesigned with circular channel icon + direction arrow badge, 2-line preview, From/To chips, stacked relative+absolute date |

---

**Document maintained by:** Deepak K Rana, Lead Salesforce Consultant, CRM Mates Ltd
**Contact:** deepak@crmmates.com | 07443 340401
