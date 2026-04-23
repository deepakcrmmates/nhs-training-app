# Platform Images — Cloudflare CDN Integration

**Implementation Plan · TSK-00017**
**Status:** 🟡 *Awaiting client approval* · Proposal v1.0 sent to Gina & Will
**Proposal:** [`docs/PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf`](PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf)
**Owner:** Deepak K Rana — CRM Mates Ltd

---

## 🚦 Go / No-Go gate

Do **not** begin any checkbox below until all three are true:

- [ ] **Will & Gina have signed off** on the architecture described in `PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf` §5–§8
- [ ] **Cloudflare Images account** is active (NHS purchases the £5/month entry tier)
- [ ] **API Token + Account ID** shared with CRM Mates and saved into NHS Config by an admin

Once those are green, work through phases A → E in order.

---

## 🧭 Approach at a glance

Five upload channels converge on one Cloudflare Images account:

| # | Channel | Trigger | Phase |
|---|---|---|---|
| 1 | Box — `Photos/` subfolder | Schedulable sync (15 min) | Day 1 |
| 2 | Mobile App | Direct Creator Upload URL | Future (data model forward-compatible) |
| 3 | Housebuilder Logo | Real-time push on `replaceLogo()` | Day 1 |
| 4 | Property Data API | Real-time push on `storeImages()` | Day 1 |
| 5 | NHS Brand Logo | One-off admin upload | Day 1 |

Every downstream consumer (internal Lightning pages, PDFs, emails, Housebuilder Portal) renders from Cloudflare URLs with Box / Salesforce Files as silent fallbacks.

---

## Phase A — Account Setup (Client side · ~1 day)

> Owner: **NHS** · Blocker for everything else.

- [ ] Create/purchase a Cloudflare Images subscription (Cloudflare dashboard → Images → Start)
- [ ] Generate an **API Token** scoped to `Account.Cloudflare Images: Edit`
- [ ] Copy the **Account ID** from the Cloudflare dashboard sidebar
- [ ] Share token + account ID via NHS Config on request
- [ ] Confirm **variants** configured in Cloudflare UI: `public`, `hero` (1600×1200), `thumb` (400×300), `square` (600×600)
- [ ] Optional: configure **signed URLs** delivery (`Cloudflare Images → Variants → Require Signed URLs`) for sensitive images

**Gate to Phase B:** token saved into `NHS_API_Config__c.Cloudflare_API_Token__c` and Account ID saved into `Cloudflare_Account_Id__c`.

---

## Phase B — Schema + Dry-Run (½ day)

> Owner: **CRM Mates** · No live sync yet — just confirms the design works with real data.

### Custom object

- [ ] Create `Property_Image__c` custom object with fields:
  - `Property__c` — Lookup(NHS_Property__c)
  - `Application__c` — Lookup(Opportunity), optional
  - `Box_File_Id__c` — Text(32), **unique**, **external Id**
  - `Box_File_Name__c` — Text(255)
  - `Cloudflare_Image_Id__c` — Text(64), **unique**
  - `Cloudflare_Hero_URL__c` — URL(500)
  - `Cloudflare_Thumb_URL__c` — URL(500)
  - `Cloudflare_Square_URL__c` — URL(500)
  - `Source__c` — Picklist {`Box`, `Mobile App`, `HB Logo`, `Property API`, `NHS Brand`, `Backfill`}
  - `Is_Primary__c` — Checkbox
  - `Is_Public__c` — Checkbox (default true; false triggers signed URLs)
  - `Uploaded_At__c` — DateTime
  - `Uploaded_By_Box_User__c` — Text(255)
  - `Sync_Status__c` — Picklist {`Synced`, `Pending`, `Error`}
  - `Sync_Error__c` — Long Text(2000)
  - `Last_Sync_At__c` — DateTime
- [ ] Create Sharing Settings — Private with "Grant Access Using Hierarchies"
- [ ] Assign object + field permissions via new Permission Set `NHS_Cloudflare_Images_Access` (auto-assign to all admins)
- [ ] Add Related List to NHS_Property__c page layout (show latest 10 images)

### Custom Setting fields on `NHS_API_Config__c`

- [ ] `Cloudflare_API_Token__c` — Text(255), encrypted
- [ ] `Cloudflare_Account_Id__c` — Text(64)
- [ ] `Cloudflare_Delivery_URL__c` — URL(255) · e.g. `https://imagedelivery.net/<hash>`
- [ ] `Cloudflare_Last_Sync_At__c` — DateTime
- [ ] `Cloudflare_Daily_Quota__c` — Number · default 10000
- [ ] `Cloudflare_Sync_Enabled__c` — Checkbox · kill-switch
- [ ] `NHS_Brand_Logo_URL__c` — URL(255) · the one-off brand logo CF URL

### Logo field on `Account`

- [ ] `Cloudflare_Logo_Image_Id__c` — Text(64)
- [ ] `Cloudflare_Logo_URL__c` — URL(500)

### Apex — service layer

- [ ] Create `CloudflareImagesService.cls` with methods:
  - `uploadImage(Blob bytes, String filename)` → `{cloudflareImageId, variantUrls}`
  - `deleteImage(String imageId)` → Boolean
  - `getDirectUploadUrl()` → `{uploadURL, imageId}` (for mobile app future)
  - `generateSignedUrl(String imageId, String variant)` → String (for private images)
  - `testConnection()` → Map<String,String> (status, account name)
- [ ] Create `CloudflareImagesServiceTest.cls` with mocked HTTP responses
- [ ] Add `api.cloudflare.com` + `imagedelivery.net` to Remote Site Settings
- [ ] Add NHS Config card "Cloudflare Images" with token/account fields + `Test Connection` button + green/red/grey bulb

### Dry-run runner

- [ ] Build `BoxToCloudflareSync.cls` as `Schedulable + Queueable`
- [ ] Add a `DRY_RUN` boolean flag — when true, method logs what it *would* upload without hitting Cloudflare
- [ ] Deploy to sandbox, enable dry-run, run once manually via `Anonymous Apex`
- [ ] **Acceptance:** debug log shows the list of candidate files (Box Photos/ folder contents since last sync) across 5+ test properties

**Gate to Phase C:** dry-run verified; admin can see the candidate file list and counts look sensible.

---

## Phase C — Live Sync + Backfill (½ day + 2-hour backfill)

> Owner: **CRM Mates** · First live writes to Cloudflare.

### Flip the switch

- [ ] Remove `DRY_RUN` flag from `BoxToCloudflareSync` OR set it to false via the Custom Setting
- [ ] Schedule the Apex class every 15 min via `System.schedule()`
  - Cron: `0 0/15 * * * ?`
  - Job name: `NHS_CloudflareSync_Every15Min`
- [ ] Verify first scheduled run in Setup → Apex Jobs

### One-shot backfill

- [ ] Write `scripts/backfill_existing_property_images_to_cloudflare.apex`:
  - Queries existing ContentVersion rows linked to NHS_Property__c (1,220 JPGs)
  - For each: downloads the ContentVersion bytes, uploads to Cloudflare, creates Property_Image__c with `Source__c = 'Backfill'`
  - Idempotent (skips if Cloudflare_Image_Id already set)
  - Batched by 40 to stay under callout limits; chains Queueables
- [ ] Run backfill against sandbox first, verify counts match (1,220 expected)
- [ ] Run against production; measure elapsed time + failures
- [ ] **Acceptance:** 100% of existing property photos have matching `Property_Image__c` rows with `Cloudflare_Image_Id__c` populated

### Channel 3 — Housebuilder Logos

- [ ] Extend `NhsHousebuilderController.replaceLogo()` to:
  - After successful Box upload, call `CloudflareImagesService.uploadImage()` on the same bytes
  - Store returned id + URL on the Account record (`Cloudflare_Logo_Image_Id__c`, `Cloudflare_Logo_URL__c`)
  - Swallow CF errors gracefully — Box upload is primary, CF is secondary on this channel
- [ ] One-off backfill: re-upload every existing housebuilder logo from Box to Cloudflare (via anonymous Apex or a "Sync All Logos" admin action)
- [ ] **Acceptance:** 100% of housebuilders with a Box logo now also have a `Cloudflare_Logo_URL__c`

### Channel 4 — Property Data API

- [ ] Extend `ImageURLToFileObject.storeImages()`:
  - Keep the existing ContentVersion write (backward compat)
  - After each download, also call `CloudflareImagesService.uploadImage()` and insert a Property_Image__c with `Source__c = 'Property API'`
  - Idempotent: check for existing Property_Image__c with the same origin URL to avoid duplicates on re-run
- [ ] Trigger a test `streetDataService` call against a fresh Property to confirm both ContentVersion + Property_Image__c rows appear
- [ ] **Acceptance:** any new API-sourced image lands in both ContentVersion (legacy) and Cloudflare + Property_Image__c (new)

### Channel 5 — NHS Brand Logo

- [ ] Add an "Upload NHS Brand Logo" button to the NHS Config page next to `NHS_Brand_Logo_URL__c`
- [ ] When clicked, open a lightning-file-upload; on finish, call `CloudflareImagesService.uploadImage` and write the variant URL back to `NHS_API_Config__c.NHS_Brand_Logo_URL__c`
- [ ] Run `scripts/swap_nhs_logo_in_email_templates.py` — updates all 10 active email templates, replacing the ImgBB URL with the new Cloudflare URL (pattern mirrors `update_email_template_footer.py`)
- [ ] Send a test email from one template; verify the brand logo renders from `imagedelivery.net`
- [ ] **Acceptance:** zero email templates reference `i.ibb.co` anymore; all render the brand logo from Cloudflare

**Gate to Phase D:** every Property_Image__c row has a populated CF URL; no orphaned ContentVersions for freshly API-sourced images; NHS brand logo live on CF.

---

## Phase D — Display Layer (½ day)

> Owner: **CRM Mates** · User-visible changes.

### LWC updates

- [ ] `primaryImageDisplay` — query Property_Image__c where `Is_Primary__c = true` first; fallback to Primary_Image__c ContentVersion
- [ ] `customCarousel` — render all Property_Image__c CF URLs; show Box/ContentVersion fallback only when none exist
- [ ] `lightbox` — accept either a CF URL or a ContentVersion Id; renders both transparently
- [ ] New LWC `nhsCdnImage` — reusable wrapper: takes `cloudflareImageId` + `variant` (hero/thumb/square), handles signed-URL resolution if `Is_Public__c = false`

### Housebuilder logo renderers

- [ ] `nhsHousebuilderDetail` — swap hero logo source from base64 Box proxy to `Account.Cloudflare_Logo_URL__c`; fallback to Box proxy if blank
- [ ] `nhsApplicationDetailV2` — ditto for Quick Summary card
- [ ] `nHSApplicationForm` + `houseBuilderApplicationForm` — replace `data.Logo_URL__c` with the CF URL

### PDF generators

- [ ] `PdfGeneratorPage.page` / `HouseBuilderPdfController` — switch NHS brand logo + housebuilder logo sources from in-org to Cloudflare public URLs
- [ ] Regenerate a sample Valuation Report PDF; verify images still embed correctly (Salesforce VF `renderAs="pdf"` must be able to fetch the external URL — test thoroughly)

### Kill-switch test

- [ ] Un-tick `Cloudflare_Sync_Enabled__c`; verify all pages/PDFs still render via the fallback chain
- [ ] Re-tick; verify everything returns to CF delivery

**Acceptance:** cold-load of Application Detail V2 with a Wain Homes property renders the hero image in < 100 ms (baseline ~1 s before).

---

## Phase E — Portal Enablement (½ day)

> Owner: **CRM Mates** · Wires the Housebuilder Portal mockup to the live CF URLs.

- [ ] Port [`mockups/housebuilder-portal.html`](mockups/housebuilder-portal.html) into a real Experience Cloud page (Partner Community or Aura/LWR site — TBD with NHS)
- [ ] Create `HousebuilderPortalController.cls` — sharing-scoped: returns only applications where `Opportunity.House_Builder__c = runningUserAccountId`
- [ ] Property/application cards render from `Property_Image__c.Cloudflare_Hero_URL__c` — no Salesforce session needed for external users
- [ ] Housebuilder header badge renders from `Account.Cloudflare_Logo_URL__c`
- [ ] Login as a **Partner Community user** (not Internal) and verify images render correctly

**Acceptance:** an external test user with a Partner Community licence can view property photos on the Portal without any image failing to load.

---

## Post-rollout — QA & Soak Testing

- [ ] **Day-1 smoke test** — upload a fresh photo via Box, wait 15 min, confirm it appears as a Property_Image__c with populated CF URL
- [ ] **Day-1 smoke test** — replace a housebuilder logo, verify real-time CF push
- [ ] **Day-1 smoke test** — create a new property via API (street data), verify both channels fired
- [ ] **7-day soak test** — monitor `NHS_Sync_Log__c` records daily; zero unreported failures expected
- [ ] Review NHS Config Cloudflare health bulb — should stay green
- [ ] Check Cloudflare dashboard `Images → Usage` for request spikes / cost anomalies

---

## 📊 Observability & Monitoring

- [ ] Create `NHS_Sync_Log__c` custom object with: `Run_Start__c`, `Run_End__c`, `Files_Scanned__c`, `Files_Uploaded__c`, `Failures__c`, `Duration_Seconds__c`, `Error_Detail__c`
- [ ] Every `BoxToCloudflareSync` run writes one record
- [ ] Admin list view "Recent Cloudflare Syncs" in NHS Admin app
- [ ] List view "Failed Cloudflare Uploads" filtered on `Property_Image__c.Sync_Status__c = 'Error'`
- [ ] NHS Config Cloudflare card shows:
  - Green: last sync succeeded within last 30 min
  - Amber: last sync > 1 hour ago
  - Red: last 3 runs had ≥ 1 failure
  - Grey: `Cloudflare_Sync_Enabled__c = false` OR missing token

---

## Rollback Plan (emergency only)

If Cloudflare causes production issues:

1. [ ] Untick `NHS_API_Config__c.Cloudflare_Sync_Enabled__c`
2. [ ] `System.abortJob()` on the scheduled BoxToCloudflareSync
3. [ ] Display layer falls back to Box proxy / Salesforce Files automatically (no code change needed)
4. [ ] Existing Property_Image__c rows stay in place for later recovery
5. [ ] Report incident + diagnose; re-enable when fixed

**No data loss** — Box is the source of truth for photographer uploads; Salesforce Files retains the backfilled API photos.

---

## Success Criteria (signed off before we call it done)

| # | Criterion | Measurable as |
|---|---|---|
| 1 | Every photo uploaded to Box Photos/ appears as a Property_Image__c within 15 min | Smoke test 3× |
| 2 | Hero image rendering < 100 ms on Application Detail V2 | DevTools Network tab |
| 3 | Housebuilder Portal external user sees property photos | Manual test with Partner Community login |
| 4 | 7-day soak: zero unreported sync failures | `NHS_Sync_Log__c` audit |
| 5 | Existing properties without CF-synced photos still render via fallback | Regression test on pre-backfill Property |
| 6 | Kill-switch fully reverts behaviour | Untick `Cloudflare_Sync_Enabled__c`, retest |
| 7 | No email template references `i.ibb.co` | `grep` via `update_email_template_footer.py` audit |

---

## 📚 References

- **Proposal PDF:** [`docs/PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf`](PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf) — §1–§15 architecture + rationale
- **Existing sync pattern:** [`force-app/main/default/classes/NhsFolderSetupJob.cls`](../force-app/main/default/classes/NhsFolderSetupJob.cls) — template for Queueable + result map
- **Existing REST patterns:** [`scripts/create_lightning_email_template.py`](../scripts/create_lightning_email_template.py), [`scripts/update_email_template_footer.py`](../scripts/update_email_template_footer.py) — REST PATCH via sfdx creds
- **Related LWCs:** [`force-app/main/default/lwc/primaryImageDisplay/`](../force-app/main/default/lwc/primaryImageDisplay/), [`force-app/main/default/lwc/customCarousel/`](../force-app/main/default/lwc/customCarousel/), [`force-app/main/default/lwc/lightbox/`](../force-app/main/default/lwc/lightbox/), [`force-app/main/default/lwc/nhsBoxBrowser/`](../force-app/main/default/lwc/nhsBoxBrowser/)
- **Portal mockup:** [`mockups/housebuilder-portal.html`](../mockups/housebuilder-portal.html)
- **Cloudflare API docs:** https://developers.cloudflare.com/images/

---

## 🕐 Effort estimate (time-boxed)

| Phase | Duration | Active work |
|---|---|---|
| A — Account setup | 1 day elapsed | Client-side, ~30 min of admin work |
| B — Schema + dry-run | ½ day | CRM Mates |
| C — Live sync + backfill | ½ day + 2 hr backfill | CRM Mates |
| D — Display layer | ½ day | CRM Mates |
| E — Portal wiring | ½ day | CRM Mates |
| QA + soak | 7 days elapsed | NHS + CRM Mates |
| **Total engineering time** | **≈ 2 days** | |

---

## 🏁 Status Log (update as we go)

| Date | Phase | Note |
|---|---|---|
| 2026-04-23 | — | Plan drafted. Awaiting Will + Gina approval on proposal. |
| | | |
| | | |

---

**Document maintained by:** Deepak K Rana, Lead Salesforce Consultant, CRM Mates Ltd
**Contact:** deepak@crmmates.com · 07443 340401
