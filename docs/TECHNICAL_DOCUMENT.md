# New Home Solutions — Technical Documentation

**Platform:** Salesforce Lightning (LWC + Apex)
**Client:** New Home Solutions
**Development Partner:** CRM Mates Ltd, London
**Lead Salesforce Consultant:** Deepak K Rana
**Last Updated:** 11 April 2026

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
| Lightning Web Components | 107+ |
| Apex Classes (production) | 77 |
| Apex Test Classes | 30+ |
| External Integrations | 8 |
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
| Maps | Google Maps Street View API |
| Email | Salesforce EmailMessage (Resend Email Relay planned) |
| SMS | Twilio REST API |
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
| `NHS_API_Config__c` | Ideal Postcodes, RapidAPI, Street Data, TinyURL | Ideal_Postcodes_Key, RapidAPI_Key, Street_Data_Endpoint, TinyURL_Endpoint |

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
| 13 | **File Storage (Legacy)** | Dropbox | Custom Dev + Managed | `DropBox__mdt` | DropboxFileService, DropboxOAuthController | **6 sites deactivated** | **Deactivated** |

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

The Communications Hub (`nhsCommunicationsHub` LWC + `NHSCommunicationsController` Apex) provides centralised email and call management per Opportunity.

### Capabilities

| Feature | Detail |
|---|---|
| Email History | Queries `EmailMessage` records — sender, recipient, subject, status, timestamps |
| SMS History | Queries `Twilio_SMS__c` records linked to opportunity — body, status, direction |
| Call Logging | Creates `Task` records with CallType, duration, status |
| Email Templates | Loads from "NHS Email Templates" folder. Dynamic merge field rendering via `Messaging.renderStoredEmailTemplate` |
| Outbound Email | Sends via `Messaging.SingleEmailMessage` with file attachments |
| Email Attachments | Upload files via `lightning-file-upload`, attached as `EmailFileAttachment` from `ContentDocument` |
| SMS Send | Twilio REST API callout. Pre-fills vendor mobile. Character counter (1600 max) |
| CC/BCC Support | `sendEmailWithBcc` method parses comma-separated CC and BCC lists |

### Apex Methods

| Method | Purpose |
|---|---|
| `getCommunications(opportunityId)` | Returns email + SMS + call history (EmailMessage, Twilio_SMS__c, Task) |
| `getEmailTemplates()` | Lists active templates from NHS folder |
| `getRenderedTemplate(templateId, opportunityId)` | Renders template with vendor/opportunity merge fields |
| `sendEmail(...)` | Basic email send (delegates to sendEmailWithAttachments) |
| `sendEmailWithAttachments(...)` | Email send with file attachments from ContentDocument IDs |
| `sendEmailWithBcc(...)` | Full email send with CC/BCC parsing |
| `sendSms(opportunityId, toNumber, body)` | Sends SMS via Twilio API, creates Twilio_SMS__c tracking record |
| `logCall(opportunityId, vendorContactId, subject, description, callType, status)` | Log call activity as Task |

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
│   ├── nhsDropboxBrowser/      # Dropbox file browser
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

---

**Document maintained by:** Deepak K Rana, Lead Salesforce Consultant, CRM Mates Ltd
**Contact:** deepak@crmmates.com | 07443 340401
