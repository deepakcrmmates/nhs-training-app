# NHS Training App - Comprehensive Project Audit

**Date:** March 26, 2026
**Repository:** NHS-Training-App
**Platform:** Salesforce (SFDX)

---

## 1. Executive Summary

The NHS-Training-App is a Salesforce-based property sales management system supporting three schemes: **Part Exchange**, **New Home**, and **Assisted Sale**. It manages the end-to-end lifecycle from application intake through agent valuations, vendor availability, offers, and completion.

### Key Metrics

| Metric | Count |
|--------|-------|
| Apex Classes | 119 |
| Lightning Web Components | 96 |
| Custom Fields (Opportunity) | 192 |
| Record Types | 13 |
| Business Processes | 11 |
| FlexiPages | 1 |
| External Integrations | 5 |

### Tech Stack
- **Backend:** Apex (controllers, services, batch jobs)
- **Frontend:** Lightning Web Components (LWC) — no Aura components
- **API Version:** 59.0 (project default), components range 52.0–66.0
- **Dev Tooling:** ESLint, Prettier (with Apex/XML plugins), Husky pre-commit hooks, LWC Jest
- **External APIs:** Dropbox, Ideal Postcodes, UK Property Data API, Street/UPRN API, TinyURL

### Overall Health: C+ (Needs Security Hardening)

**Top 3 Priorities:**
1. Remove hardcoded API keys and credentials from source code
2. Consolidate duplicate/versioned components (7 Kanban versions, duplicate calendars)
3. Refactor oversized methods (streetDataService, VendorAvailabilityService)

---

## 2. Project Configuration

### sfdx-project.json
- **Org Name:** NHS-Training-App
- **Package Directory:** `force-app` (default)
- **Source API Version:** 59.0
- **Namespace:** None (unmanaged)
- **Login URL:** https://login.salesforce.com

### Dev Tooling
- **package.json:** ESLint (LWC + Aura plugins), Prettier (Apex + XML), Husky, lint-staged, @salesforce/sfdx-lwc-jest
- **.prettierrc:** Configured with Apex and XML plugin support
- **.forceignore:** Excludes package.xml, jsconfig.json, .eslintrc.json, Jest `__tests__` dirs

### Scratch Org Definition (`config/project-scratch-def.json`)
- Edition: Developer
- Features: EnableSetPasswordInApi
- Lightning Experience enabled

---

## 3. Data Model

### Opportunity Object (Standard — Heavily Customized)

The project uses a single heavily customized standard object. No custom objects are tracked in this repository (NHS_Property__c, Valuation_Assessment__c, and Vendor_Availability__c are referenced in code but defined elsewhere).

#### 192 Custom Fields by Category

**Agent Management (3 agents x ~12 fields each = ~36 fields)**
| Field Pattern | Type | Description |
|---------------|------|-------------|
| `Agent_X__c` | Lookup(Account) | Agent account reference |
| `Agent_X_Appointment__c` | DateTime | Appointment date/time |
| `Agent_X_Email__c` / `Phone__c` | Text | Contact details |
| `Agent_X_Bottom_Line__c` / `Target_Sale__c` / `Initial_Asking_Price__c` | Currency | Valuation figures |
| `Agent_X_Logo__c` / `URL__c` / `Offer_Form_URL__c` | URL | Agent branding/links |
| `Agent_X_Valuation_Requested__c` / `Received__c` | DateTime | Valuation tracking |
| `Agent_X_Verbally_Confirmed__c` / `Emailed__c` | Checkbox | Confirmation status |

**Property Information (~25 fields)**
| Field | Type | Description |
|-------|------|-------------|
| `Property__c` | Lookup(NHS_Property__c) | Property record |
| `Property_Address__c` | Text | Full address |
| `UPRN__c` | Text | Unique Property Reference Number |
| `Current_Asking_Price__c` | Currency | Current listing price |
| `EPC_Rating__c` | Text | Energy Performance Certificate |
| `Council_Tax_Band__c` | Text | Council tax band |
| `Type_of_House__c` | Picklist | House type |
| `Tenure__c` | Picklist | Freehold/Leasehold |
| Various property descriptors | Checkbox | Mid_Terrace, No_Garden, Plot, Development, etc. |

**Vendor Management (~10 fields)**
| Field | Type | Description |
|-------|------|-------------|
| `Vendor_1__c` / `Vendor_2__c` | Lookup(Account) | Vendor accounts |
| `Vendor_X_Email__c` / `Phone__c` / `Mobile__c` | Text | Vendor contact |
| `Vendor_Last_Call_Datetime__c` | DateTime | Last contact |

**Availability (14 checkbox fields)**
- `Mon_AM__c` through `Sun_PM__c` — morning/afternoon availability for each day

**Process & Status (~20 fields)**
| Field | Type | Description |
|-------|------|-------------|
| `NHS_Process__c` | Picklist | Main process stage |
| `Archived__c` | Checkbox | Archive status |
| `Blacklisted__c` | Checkbox | Blacklist status |
| `Pinned__c` | Checkbox | Kanban pin (new, Mar 2026) |
| `SortOrder__c` | Number | Kanban card order (new, Mar 2026) |
| `Scheme__c` | Picklist | Assisted Sale / New Home / Part Exchange |

**Financial (~15 fields)**
- Client_Estimated_Valuation__c, Average_Bottom_Line__c, Average_Target_Sale__c, Purchase_Price__c, Outstanding_Mortgage__c, Ground_Rent__c, Service_Charge__c, etc.

**House Builder (~8 fields)**
- House_Builder__c (Lookup), House_Builder_Email__c, Housebuildeer_Name__c (typo in field name), House_Builder_Logo__c, House_Builder_Application_Pdf_URL__c

#### 13 Record Types
| # | Record Type | Description |
|---|-------------|-------------|
| 1 | Part_Exchange_Applications | Initial applications |
| 2 | Part_Exchange_Commission | Commission tracking |
| 3 | Part_Exchange_Sales_Progression | Sales progression |
| 4 | Part_Exchange_Instruction | Instruction stage |
| 5 | Part_Exchange_Availability_Report | Availability reports |
| 6 | Part_Exchange_Completed | Completed sales |
| 7 | Part_Exchange_Offers | Offer management |
| 8 | New_Home_Sales | New home scheme |
| 9 | Assisted_Sales | Assisted sale scheme |
| 10 | Events_and_Support | Events |
| 11 | Archived | Archived records |
| 12 | Unknown | Catch-all |
| 13 | Default | System default |

#### 11 Business Processes
Part Exchange has 8 dedicated processes (Sales, Progression, Instruction, Availability Report, Offers, Commission, Completed, Valuations In Process). Assisted Sales, New Home Sales, and Events each have 1 process.

#### 4 Validation Rules
- `Agent_1_Restrict_Past_Date_Appointment` — prevents past appointment dates
- `Agent_2_Restrict_Past_Date_Appointment` — same for Agent 2
- `Agent_3_Restrict_Past_Date_Appointment` — same for Agent 3
- `Next_Available_Date` — **inactive** — validates date >= today()

#### 19 List Views
Applications, Valuations In Process, Instruction, Availability Report, Offers, Sales Progression, Completed, Commission, Archived, All Opportunities, Closing This/Next Month, My Opportunities, New This Week, Won, Uncontacted Applications, Default Pipeline, Leeds Data Only

#### Other Metadata
- **Compact Layouts:** 1 (New_Awesome_Companct_Layout)
- **Web Links:** 4 (Calendar_Availability, Submit_Offers, test, testt)
- **Standard Value Sets:** OpportunityStage

---

## 4. Apex Classes Audit (119 files)

### 4.1 Controllers — Opportunity & Application

| Class | Purpose | Test Class | Notes |
|-------|---------|------------|-------|
| `OpportunityController` | CRUD, stage grouping, record types | `OpportunityControllerTest` | Clean, well-tested |
| `NhsApplicationKanbanController` | Kanban with filters, pinning (max 3), sort order | — | Dynamic SOQL (mitigated with escapeSingleQuotes) |
| `AllApplicationKanban` | Generic kanban with pagination | `AllApplicationKanbanTest`, `TestAllApplicationKanban` | Dynamic SOQL |
| `ApplicationFormController` | Multi-step form: creates Contact, Account, Property, Opportunity | `ApplicationFormControllerTest` | Uses Savepoint for rollback |
| `ArchivedApplicationKanbanController` | Archived records kanban | `ArchivedApplicationKanbanControllerTest` | — |
| `KanbanController` | Generic kanban | — | — |
| `houseBuilderApplication` | House builder application handling | `HouseBuilderApplicationTest` | — |

### 4.2 Controllers — Offers & Viewings

| Class | Purpose | Test Class | Notes |
|-------|---------|------------|-------|
| `OfferController` | Full offer management: search, create, file upload | `OfferControllerTest` | Large createOffer() method needs refactoring |
| `OfferKanbanController` | Offer stage kanban | `OfferKanbanControllerTest` | Complex stage transitions |
| `ViewingsOffersController` | Viewings and offers | `ViewingsOffersControllerTest` | — |
| `agentOfferController` | Agent-specific offers | `AgentOfferControllerTest` | — |
| `customOfferLayout` | Custom offer display | `CustomOfferLayoutTest` | — |

### 4.3 Controllers — Account & Property

| Class | Purpose | Test Class | Notes |
|-------|---------|------------|-------|
| `accountController` | Account data, logo URL, form creation | `accountControllerTest` | — |
| `propertyController` | Property data, images, primary image | `propertyControllerTest` | — |
| `AccountLogoUploader` | Logo upload | `AccountLogoUploaderTest` | — |
| `ImageController` | Image management | `ImageControllerTest` | — |

### 4.4 Controllers — Events & Vendor Availability

| Class | Purpose | Test Class | Notes |
|-------|---------|------------|-------|
| `EventController` | Events and availability with complex stage logic | `EventControllerTest` | HIGH complexity, duplicate methods |
| `VendorAvailabilityService` | Vendor availability, event creation, slot checking | `VendorAvailabilityServiceTest` | 470+ lines, SOQL in loops |
| `AvailabilityController` | Visualforce controller for availability reports | `AvailabilityControllerTest` | Constructor does too much |

### 4.5 Controllers — Address & Lookup

| Class | Purpose | Test Class | Notes |
|-------|---------|------------|-------|
| `AddressController` | Address lookup (dummy data) | `AddressControllerTest` | Placeholder implementation |
| `AddressFinderController` | Ideal Postcode API integration | `AddressFinderControllerTest` | Uses Custom Label for API key (good) |
| `IdealPostcodeController` | Postcode integration | `IdealPostcodeControllerTest` | Not fully implemented |
| `customLookupController` | Custom lookup | `customLookupControllerTest` | — |
| `LookupController` | Generic lookup | — | — |

### 4.6 Controllers — Authentication (Standard Salesforce)

| Class | Test Class |
|-------|------------|
| `SiteLoginController` | `SiteLoginControllerTest` |
| `ForgotPasswordController` | `ForgotPasswordControllerTest` |
| `LightningSelfRegisterController` | `LightningSelfRegisterControllerTest` |
| `LightningLoginFormController` | `LightningLoginFormControllerTest` |
| `LightningForgotPasswordController` | `LightningForgotPasswordControllerTest` |
| `CommunitiesLoginController` | `CommunitiesLoginControllerTest` |
| `CommunitiesSelfRegController` | `CommunitiesSelfRegControllerTest` |
| `ChangePasswordController` | `ChangePasswordControllerTest` |

### 4.7 Services & Integrations

| Class | Purpose | Test Class | Issues |
|-------|---------|------------|--------|
| `PropertyDataService` | UK Property Data API callout | `PropertyDataServiceTest` | **HARDCODED API KEY** |
| `PropertyService` | Property report API | `PropertyServiceTest` | **HARDCODED API KEY** |
| `PropertyReportService` | Property report fetching | `PropertyReportServiceTest` | **HARDCODED API KEY + BASE URL** |
| `streetDataService` | Street/UPRN data with complex mapping | — | 400+ line method, needs refactoring |
| `DropboxFileService` | Dropbox file upload, folder creation, token refresh | `DropboxFileServiceTest` | Complex folder path logic |
| `TinyURLShortenerQueueable` | URL shortening queueable job | `TinyURLShortenerQueueableTest` | Clean |
| `URLShortenerService` | Invocable URL shortener | — | Enqueues TinyURLShortenerQueueable |
| `ImageURLToFileObject` | Download images from URLs to ContentVersion | `ImageURLToFileObjectTest` | **HTTP calls in loops** |
| `ValuationAssessmentSharingService` | Manual record sharing | `ValuationAssessmentSharingServiceTest` | **HARDCODED USER ID** |

### 4.8 PDF & Email

| Class | Purpose | Issues |
|-------|---------|--------|
| `SendPDFonCreationHandler` | @future: generate PDF and email | **HARDCODED EMAIL** (akash@crmmates.com) |
| `SendValuationFormPdf` | Valuation PDF generation and email | **HARDCODED EMAIL**, commented code |
| `PdfGeneratorController` | HTML to PDF conversion | No test class |
| `HouseBuilderPdfController` | House builder PDF | — |
| `valuatonFormPdfController` | Visualforce PDF controller | Typo in name ("valuaton") |

### 4.9 Utility Classes

| Class | Purpose | Test Class |
|-------|---------|------------|
| `CommonUtil` | Generic SObject operations, picklists, file upload | `CommonUtilTest` |
| `NHS_FormSupport` | Form support utilities | `NHS_FormSupport_Tests` |
| `DropboxTestDataFactory` | Reusable test data factory | — |

### 4.10 Batch & Scheduled Jobs

| Class | Purpose | Schedule |
|-------|---------|----------|
| `OpportunityStageUpdaterBatch` | Updates stages based on appointment dates | Batch size 200 |
| `OpportunityStageUpdaterSchedule` | Scheduler for the batch | Runs OpportunityStageUpdaterBatch |

### 4.11 Test Coverage Summary

- **60+ test classes** covering most controllers and services
- **Well-tested:** DropboxFileService (6 tests with mocking), OpportunityController (7 tests), CommonUtil (7 tests)
- **Missing tests:** OpportunityStageUpdaterBatch, PdfGeneratorController, streetDataService, PropertyService (no dedicated test)
- **Test data factory:** DropboxTestDataFactory for reusable test data

---

## 5. Lightning Web Components Audit (96 components)

### 5.1 Form Components (10)

| Component | Lines | API | Apex Methods | Status |
|-----------|-------|-----|-------------|--------|
| `agentOfferForm` | 848 | 62.0 | 8 | Complete |
| `valuationForm` | 842 | 57.0 | 9 | Complete |
| `nHSApplicationForm` | 780 | 62.0 | 11 | Complete |
| `vFormTEST` | 760 | 62.0 | 6 | **TEST — has hardcoded IDs** |
| `houseBuilderApplicationForm` | 659 | 62.0 | 6 | Complete |
| `frontFacingAgentOfferForm` | 651 | 62.0 | 5 | Complete |
| `applicationForm` | 497 | 62.0 | 3 | Complete |
| `opportunityForm` | — | 52.0 | 1 | Complete |
| `createnewproperty` | — | 59.0 | 1 | Complete |
| `customOfferLayout` | — | 62.0 | 2 | Complete |

### 5.2 Kanban/Board Components (25+)

**Core Kanban Infrastructure (API 66.0):**
| Component | Purpose |
|-----------|---------|
| `kanbanBoard` | Core kanban engine with view switching |
| `kanbanColumn` | Column container |
| `kanbanCard` | Card display |
| `kanbanCards` | Card list |
| `kanbanToolbar` | UI controls (search, view switch) |
| `kanbanFilters` | Filter controls |

**NHS Application Kanban (7 versions):**
| Component | API | Status |
|-----------|-----|--------|
| `nhsApplicationKanban` | — | V1 — superseded |
| `nhsApplicationKanbanV2` | — | V2 — superseded |
| `nhsApplicationKanbanV3` | — | V3 — superseded |
| `nhsApplicationKanbanV4` | — | V4 — superseded |
| `nhsApplicationKanbanV5` | — | V5 — superseded |
| `nhsApplicationKanbanV6` | — | V6 — superseded |
| `nhsApplicationKanbanV7` | 66.0 | **V7 — CURRENT (787 lines, 9 Apex methods)** |

**Domain-specific Kanbans:**
- `kanbanAllApplication`, `kanbanAssistedSales`, `kanbanNewHome`, `kanbanValuationInProgress` (all 60.0)
- `allApplicationKanban` (60.0), `archivedApplicationKanban` (62.0)
- `offerKanbanView` (62.0, 423 lines)
- `mainKanbanScreen` (60.0), `opportunityKanbanDemo` (66.0)

### 5.3 Calendar/Availability Components (6)

| Component | Lines | API | Notes |
|-----------|-------|-----|-------|
| `calenderAvailability` | 583 | 60.0 | Vendor availability calendar |
| `newVendorAvailablityCalender` | 603 | 60.0 | Updated vendor calendar |
| `nHSCalendarApplication` | 270 | 61.0 | Application calendar |
| `calenderAvailabilty` | 297 | 60.0 | **Duplicate with spelling variant** |
| `calenderBookingSystem` | — | 61.0 | Booking system |
| `calendarParentKanbanComponent` | — | 60.0 | Parent orchestrator |

### 5.4 Address & Lookup Components (7)

| Component | API | Purpose |
|-----------|-----|---------|
| `idealaddresslookup` | 59.0 | Main address search |
| `addressAutocomplete` | 52.0 | Autocomplete search |
| `customLookup` | 59.0 | Generic lookup |
| `customLookupLwc` | 59.0 | Lookup variant |
| `idealPostcodeSearch` | 53.0 | Postcode search |
| `idealPostcodeAutocomplete` | 53.0 | Postcode autocomplete |
| `idealPostcodesComponent` | 52.0 | Postcode integration |

### 5.5 Vendor & Booking Components (4)

| Component | Lines | API |
|-----------|-------|-----|
| `vendorAvailabilityTable` | 484 | 60.0 |
| `vendorAvailabilityKanbanView` | 330 | 60.0 |
| `applicationVendorAvailability` | — | 61.0 |
| `bookingKanbanView` | 254 | 60.0 |

### 5.6 Chasing Components (5)

| Component | API | Purpose |
|-----------|-----|---------|
| `chasingForBookingSlot` | 60.0 | Booking slot chasing |
| `chasingSystem` | 60.0 | Chasing system |
| `chasingParentComponent` | 60.0 | Parent orchestrator |
| `chasingSlotOpportunity` | 60.0 | Slot chasing by opportunity |
| `bookingCancel` | 60.0 | Cancel bookings |

### 5.7 Image & Media Components (5)

| Component | API | Purpose |
|-----------|-----|---------|
| `propertyImageUpload` | 60.0 | Image upload + primary selection |
| `primaryImageDisplay` | 60.0 | Image preview |
| `customCarousel` | 57.0 | Image carousel |
| `lightbox` | 57.0 | Lightbox viewer |
| `customLoader` | 62.0 | Loading spinner |

### 5.8 Pipeline & Detailed Views (3)

| Component | Lines | API | Purpose |
|-----------|-------|-----|---------|
| `nhsPipelineBoard` | 252 | 66.0 | Pipeline board |
| `nhsOpportunityDetailedView` | 324 | 59.0 | Record page detail view |
| `opportunityList` | — | 60.0 | Opportunity list |

### 5.9 Service/Utility Components (7 — no UI)

| Component | API | Purpose |
|-----------|-----|---------|
| `configService` | 66.0 | Centralized config engine (merging, feature toggles, highlight rules, sort engine) |
| `toastService` | 66.0 | Toast notification dispatcher |
| `scrollService` | 66.0 | Throttled scroll + virtual scrolling |
| `dragDropService` | 66.0 | Drag-drop state management |
| `filterService` | 66.0 | Date filtering (weekly/monthly) |
| `kanbanDataAdapter` | 66.0 | Data transformation and stage grouping |
| `recordIds` | 60.0 | Record ID utility |

### 5.10 Other Components

- **Weekly Updates:** `weeklyUpdates` (52.0), `weeklyUpdateCmp` (57.0)
- **Valuation:** `valuationReportForm` (57.0)
- **Property/Data:** `propertySearchAPI` (52.0), `propertyData` (59.0), `callStreetAPI` (57.0), `streetData` (54.0), `postcodeChecker` (59.0), `mapViewer` (59.0), `dynamicEPC` (57.0), `ePCRating` (57.0)
- **UI Utilities:** `accountCircles` (60.0), `initialsCircle` (57.0), `filter` (60.0), `pagination2` (57.0), `searchableCombobox` (62.0), `dateRangeSlider` (59.0), `homeButton` (57.0), `navigateToRecordPage` (52.0)
- **Drag & Drop (legacy):** `dragAndDropLwc` (57.0), `dragAndDropCard` (57.0), `dragAndDropList` (57.0)
- **Finance:** `createLenderAndAdvisor` (62.0)
- **Test:** `test` (62.0), `vFormTEST` (62.0)

### 5.11 API Version Distribution

| API Version | Count | Era |
|-------------|-------|-----|
| 52.0 | 8 | ~2021 |
| 53.0 | 2 | ~2021 |
| 54.0 | 1 | ~2022 |
| 57.0 | 13 | ~2023 |
| 59.0 | 10 | ~2023 |
| 60.0 | 29 | ~2024 |
| 61.0 | 3 | ~2024 |
| 62.0 | 18 | ~2024 |
| 66.0 | 8 | ~2025 (latest) |

### 5.12 CSS Analysis

**Largest CSS files (300+ lines):**
1. `nHSApplicationForm` — 600 lines
2. `valuationForm` — 596 lines
3. `houseBuilderApplicationForm` — 536 lines
4. `nhsPipelineBoard` — 530 lines
5. `nhsApplicationKanbanV7` — 519 lines
6. `frontFacingAgentOfferForm` — 447 lines
7. `offerKanbanView` — 429 lines

**Design patterns used:** CSS custom properties (`--brand-primary`, etc.), Flexbox layouts, CSS Grid, sticky headers/footers, card shadows.

---

## 6. FlexiPages

| Name | Type | Object | Template | Components |
|------|------|--------|----------|------------|
| `NHS_Opportunity_Record_Page` | RecordPage | Opportunity | Single-column desktop | `nhsOpportunityDetailedView` |

---

## 7. What's Missing from the Repository

| Metadata Type | Status |
|---------------|--------|
| Permission Sets | Empty directory (0 files) |
| Profiles | Not in source control |
| Page Layouts | Empty directory |
| Tabs | Empty directory |
| Applications | Empty directory |
| Static Resources | Empty directory |
| Aura Components | None (empty) |
| Triggers | None |
| Flows | None |
| Custom Metadata Types | None |
| Custom Labels | None |
| Custom Objects | None (NHS_Property__c, Valuation_Assessment__c, Vendor_Availability__c referenced in code but not in repo) |

---

## 8. Critical Findings

### 8.1 SECURITY — CRITICAL

| Issue | Location | Risk |
|-------|----------|------|
| Hardcoded API key | `PropertyService.cls` line 11 | Credential exposure in source control |
| Hardcoded API key | `PropertyReportService.cls` lines 2-5 | Credential exposure in source control |
| Hardcoded API key | `PropertyDataService.cls` line 9 | Credential exposure in source control |
| Hardcoded email | `SendPDFonCreationHandler.cls` line 14 | akash@crmmates.com hardcoded as fallback |
| Hardcoded email | `SendValuationFormPdf.cls` line 122 | Same hardcoded email |
| Hardcoded user ID | `ValuationAssessmentSharingService.cls` line 10 | 0057Z00000ENrpAQAT hardcoded |
| Hardcoded test IDs | `vFormTEST` LWC | Test record IDs in component code |

### 8.2 CODE QUALITY — HIGH

**Oversized methods needing refactoring:**
| Method | Lines | Issue |
|--------|-------|-------|
| `streetDataService.updatePropertyData()` | 400+ | Single method with complex data mapping |
| `VendorAvailabilityService` (class) | 470+ | Too many responsibilities |
| `OfferController.createOffer()` | 130 | Complex JSON parsing and type conversion |
| `AvailabilityController` constructor | Large | Too much initialization logic |

**Commented-out code:**
- `SendValuationFormPdf.cls` lines 2-57 (large InvocableMethod block)
- `DropboxFileService.cls` lines 176-188, 318-350
- `VendorAvailabilityService.cls` lines 51-69

**Naming inconsistencies:**
- PascalCase vs camelCase: `OpportunityController` vs `accountController`, `houseBuilderApplication`
- Typo: `valuatonFormPdfController` (missing 'i' in "valuation")
- Duplicate casing: `frontFacingAgentController` / `FrontFacingAgentController`
- Field typo: `Housebuildeer_Name__c` (extra 'e')

### 8.3 TECHNICAL DEBT — HIGH

**Component versioning:**
- 7 versions of NHS Application Kanban (V1–V7) all still in the codebase
- Only V7 is current — V1–V6 should be archived or removed

**Duplicate components:**
- `calenderAvailability` vs `calenderAvailabilty` (spelling variant, both exist)
- `customLookup` vs `customLookupLwc` (overlapping functionality)
- Multiple address/postcode components (7 variants)

**Test component in production:**
- `vFormTEST` — 760 lines with hardcoded test IDs, should not be deployed

### 8.4 PERFORMANCE — MEDIUM

| Issue | Location |
|-------|----------|
| HTTP calls inside loops | `ImageURLToFileObject.storeImages()` |
| SOQL queries in loops | `VendorAvailabilityService.createEvents()` lines 338-340 |
| DML operations in loops | `OfferController.uploadFiles()` lines 425-455 |

### 8.5 MISSING FUNCTIONALITY

- No triggers (all logic in controllers/services — no real-time record-level automation)
- No Flows (no declarative automation)
- No permission sets in source (security may be managed manually in the org)
- Custom objects referenced in code not tracked in version control
- No custom metadata types (API keys stored in code instead)

---

## 9. External Integrations

| Integration | Service Class | Auth Method | Status |
|-------------|---------------|-------------|--------|
| **Dropbox** | `DropboxFileService` | OAuth refresh token | Working — complex folder logic |
| **Ideal Postcodes** | `AddressFinderController` | Custom Label (API key) | Working — best practice auth |
| **UK Property Data API** | `PropertyDataService`, `PropertyService` | **Hardcoded API key** | Working — needs credential fix |
| **Street/UPRN API** | `streetDataService` | Config reference | Working — needs refactoring |
| **TinyURL** | `TinyURLShortenerQueueable` | API call | Working — clean implementation |

---

## 10. Recent Development Activity (Last 5 Commits)

| Date | Commit | Description |
|------|--------|-------------|
| Mar 25 | `c316969` | Redesigned NHS Application Form (3-col grid, sticky footer, ALCD section) |
| Mar 24 | `4967ca8` | Implemented intra-column card reordering (SortOrder__c) |
| Mar 24 | `93b681f` | Implemented Kanban card pinning (3-record limit) |
| Mar 24 | `c3c3703` | Fixed Kanban stage name inconsistencies + unit tests |
| Mar 23 | `5eb5050` | Retrieved all LWCs from SandboxDev org |

**Current working changes (uncommitted):**
- Modified: `NhsApplicationKanbanController.cls`, `houseBuilderApplication.cls`, `customLookupLwc.js`, `nHSApplicationForm` (css/html/js), `nhsApplicationKanbanV7` (css/html/js)
- New: `flexipages/`, `nhsOpportunityDetailedView/`

---

## 11. Recommendations

### P1 — Critical (Security)
1. **Move all API keys to Custom Metadata Types or Named Credentials** — PropertyDataService, PropertyService, PropertyReportService all have hardcoded keys in source control
2. **Replace hardcoded emails** with Custom Settings or Organization-Wide Email Addresses
3. **Remove hardcoded User ID** from ValuationAssessmentSharingService — use parameterized lookup
4. **Remove vFormTEST component** or move to a test-only package

### P2 — High (Code Quality & Consolidation)
5. **Archive Kanban V1–V6** — only V7 is in use; remove or move old versions to reduce confusion
6. **Consolidate duplicate components** — pick one calendar spelling, merge address/lookup variants
7. **Refactor oversized methods** — streetDataService.updatePropertyData(), VendorAvailabilityService
8. **Remove all commented-out code** — it's in version control if needed
9. **Add missing tests** — OpportunityStageUpdaterBatch, PdfGeneratorController, streetDataService

### P3 — Medium (Standardization)
10. **Standardize API versions** — upgrade 52.0–57.0 components to at least 60.0
11. **Fix naming conventions** — adopt PascalCase for all Apex classes, fix typos
12. **Track custom objects in source** — NHS_Property__c, Valuation_Assessment__c, Vendor_Availability__c should be in the repo
13. **Fix performance anti-patterns** — bulkify HTTP calls, move SOQL/DML out of loops

### P4 — Low (Long-term Improvements)
14. **Add declarative automation** — consider Flows for simple automations instead of all-Apex
15. **Implement permission sets** in source control for auditable security
16. **Add custom metadata types** for configuration values currently hardcoded
17. **Create component library documentation** for reusable LWCs

---

## 12. Summary Statistics

```
Project Type:           Salesforce DX (Unmanaged)
API Version:            59.0 (project), 52.0-66.0 (components)

Apex Classes:           119 (59 production + 60 test)
  Controllers:          45+
  Services:             10+
  Batch/Scheduled:      2
  Test Classes:         60+

LWC Components:         96
  Form Components:      10
  Kanban/Board:         25+
  Calendar:             6
  Address/Lookup:       7
  Vendor/Booking:       9
  Image/Media:          5
  Service/Utility:      7
  Other:                27

Custom Fields:          192 (on Opportunity)
Record Types:           13
Business Processes:     11
Validation Rules:       4 (1 inactive)
List Views:             19
FlexiPages:             1

External Integrations:  5 (Dropbox, Ideal Postcodes, Property API, Street API, TinyURL)
Triggers:               0
Flows:                  0
Permission Sets:        0 (in repo)
Custom Objects:         0 (in repo; 3+ referenced)
```
