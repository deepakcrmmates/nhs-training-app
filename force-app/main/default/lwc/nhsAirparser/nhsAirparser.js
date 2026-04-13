import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getConfig from '@salesforce/apex/AirparserController.getConfig';
import testConnection from '@salesforce/apex/AirparserController.testConnection';
import listInboxes from '@salesforce/apex/AirparserController.listInboxes';
import getSchema from '@salesforce/apex/AirparserController.getSchema';
import setupSchema from '@salesforce/apex/AirparserController.setupSchema';
import fetchRawDocuments from '@salesforce/apex/AirparserController.fetchRawDocuments';
import getMappings from '@salesforce/apex/AirparserController.getMappings';
import saveMappings from '@salesforce/apex/AirparserController.saveMappings';
import createDefaultMappings from '@salesforce/apex/AirparserController.createDefaultMappings';
import getTargetFieldOptions from '@salesforce/apex/AirparserController.getTargetFieldOptions';
import createApplicationFromParsed from '@salesforce/apex/AirparserController.createApplicationFromParsed';
import applyMappingsPreview from '@salesforce/apex/AirparserController.applyMappingsPreview';
import createApplicationFromForm from '@salesforce/apex/AirparserController.createApplicationFromForm';
import getHouseBuilderRtId from '@salesforce/apex/AirparserController.getHouseBuilderRtId';
import uploadAndParse from '@salesforce/apex/AirparserController.uploadAndParse';
import parseDocument from '@salesforce/apex/AirparserController.parseDocument';
import getDocumentFileUrl from '@salesforce/apex/AirparserController.getDocumentFileUrl';
import getPreviewPage from '@salesforce/apex/AirparserController.getPreviewPage';
import userId from '@salesforce/user/Id';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default class NhsAirparser extends LightningElement {
    @track apiKeyDisplay = 'Not configured';
    @track inboxId = '';
    @track isLoading = false;
    @track isLoadingDoc = false;
    @track isBusy = false;
    @track statusMessage = '';
    @track statusType = '';

    // Navigation
    @track currentView = 'none';
    @track inboxes = [];
    @track selectedInbox = null;
    @track documents = [];
    @track selectedDoc = null;
    @track schemaFields = [];
    @track showSchema = false;

    // Mappings
    @track mappingRows = [];
    @track targetFieldOptions = [];

    // Application creation
    @track createdAppId = null;

    // Form data (right side)
    @track formVendor1 = {};
    @track formVendor2 = {};
    @track formProperty = {};
    @track formAgent = {};
    @track formApp = {};
    @track isLoadingForm = false;
    @track hasFormData = false;
    @track hbMatchedId = '';
    @track hbParsedName = '';
    @track houseBuilderRtId = '';
    get hasVendor2() { return this.formVendor2 && (this.formVendor2.firstname1 || this.formVendor2.lastname1); }

    // Upload & Preview
    @track isParsing = false;
    @track showPreview = false;
    @track previewUrl = '';
    @track previewTitle = '';
    @track previewPageUrls = [];  // Raw API URLs
    @track previewPageCache = {}; // Cached base64 by index
    @track currentPageIndex = 0;
    @track currentPageImage = '';
    @track isLoadingPage = false;
    get acceptedFormats() { return ['.pdf', '.eml', '.html', '.txt', '.docx']; }
    get uploadRecordId() { return userId; }
    get hasPreviewUrl() { return this.previewPageUrls.length > 0; }
    get hasMultiplePages() { return this.previewPageUrls.length > 1; }
    get currentPreviewUrl() { return this.currentPageImage; }
    get currentPreviewPage() { return this.currentPageIndex + 1; }
    get totalPreviewPages() { return this.previewPageUrls.length; }
    get isPrevPageDisabled() { return this.currentPageIndex <= 0 || this.isLoadingPage; }
    get isNextPageDisabled() { return this.currentPageIndex >= this.previewPageUrls.length - 1 || this.isLoadingPage; }

    get viewInboxes() { return this.currentView === 'inboxes'; }
    get viewDocuments() { return this.currentView === 'documents'; }
    get viewDocDetail() { return this.currentView === 'docDetail'; }
    get viewMappings() { return this.currentView === 'mappings'; }
    get showBreadcrumb() { return this.currentView !== 'none' && this.currentView !== 'mappings'; }

    get hasInboxes() { return this.inboxes.length > 0; }
    get hasDocuments() { return this.documents.length > 0; }
    get hasSchemaFields() { return this.schemaFields.length > 0; }
    get hasMappingRows() { return this.mappingRows.length > 0; }
    get statusClass() { return 'ap-status-msg ap-status-' + this.statusType; }
    get inboxCrumbClass() { return 'ap-crumb' + (this.currentView === 'documents' ? ' ap-crumb-current' : ' ap-crumb-link'); }
    get createdAppUrl() { return this.createdAppId ? '/' + this.createdAppId : ''; }

    connectedCallback() {
        this.loadConfig();
        this.loadTargetOptions();
        this.loadHouseBuilderRtId();
    }

    async loadHouseBuilderRtId() {
        try {
            this.houseBuilderRtId = await getHouseBuilderRtId();
        } catch (e) { /* silent */ }
    }

    async loadConfig() {
        try {
            const config = await getConfig();
            this.apiKeyDisplay = config.apiKeyMasked || 'Not configured';
            this.inboxId = config.inboxId || '';
        } catch (e) { /* silent */ }
    }

    async loadTargetOptions() {
        try {
            this.targetFieldOptions = await getTargetFieldOptions();
        } catch (e) { /* silent */ }
    }

    setStatus(msg, type) {
        this.statusMessage = msg;
        this.statusType = type;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
            d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }

    // ══ Test Connection ══
    async handleTestConnection() {
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const result = await testConnection();
            this.setStatus(result.message, result.status === 'success' ? 'ok' : 'err');
        } catch (e) {
            this.setStatus(e.body?.message || 'Connection failed.', 'err');
        }
        this.isBusy = false;
    }

    // ══ List Inboxes ══
    async handleListInboxes() {
        this.isBusy = true;
        this.isLoading = true;
        this.setStatus('', '');
        this.currentView = 'none';
        this.selectedInbox = null;
        this.selectedDoc = null;
        this.showSchema = false;
        this.createdAppId = null;
        try {
            const result = await listInboxes();
            if (result.status === 'success') {
                const raw = result.inboxes || [];
                let inboxList;
                if (Array.isArray(raw)) {
                    inboxList = raw;
                } else if (raw && typeof raw === 'object') {
                    inboxList = raw.data || raw.docs || raw.inboxes || [];
                } else {
                    inboxList = [];
                }
                if (!Array.isArray(inboxList)) inboxList = [];
                this.inboxes = inboxList.map(ib => ({
                    id: ib._id || ib.id || '',
                    name: ib.name || 'Unnamed',
                    email: ib.email || ib.inbox_email || '',
                    engine: ib.llm_engine || ib.engine || '',
                    createdDisplay: this.formatDate(ib.created_at || ib.createdAt)
                }));
                this.currentView = 'inboxes';
                this.setStatus('Found ' + this.inboxes.length + ' inbox(es)', 'ok');
            } else {
                this.currentView = 'inboxes';
                this.inboxes = [];
                this.setStatus(result.message || 'No data returned', 'err');
            }
        } catch (e) {
            this.currentView = 'inboxes';
            this.inboxes = [];
            this.setStatus(e.body?.message || 'Failed to list inboxes.', 'err');
        }
        this.isLoading = false;
        this.isBusy = false;
    }

    // ══ Click Inbox → Load Documents ══
    async handleInboxClick(event) {
        const inboxId = event.currentTarget.dataset.id;
        const inbox = this.inboxes.find(i => i.id === inboxId);
        if (!inbox) return;

        this.selectedInbox = inbox;
        this.selectedDoc = null;
        this.showSchema = false;
        this.createdAppId = null;
        this.isBusy = true;
        this.isLoading = true;
        this.setStatus('', '');

        try {
            const result = await fetchRawDocuments({ inboxId: inboxId });
            if (result.status === 'success') {
                this.documents = (result.documents || []).map(doc => {
                    const name = doc.name || doc.file_name || 'Document';
                    const lower = name.toLowerCase();
                    const isPdf = lower.endsWith('.pdf');
                    const isImg = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.bmp');
                    return {
                        id: doc.doc_id || doc._id || doc.id || '',
                        name,
                        status: doc.status || 'unknown',
                        statusClass: 'ap-badge ap-badge-' + (doc.status || 'unknown'),
                        createdDisplay: this.formatDate(doc.created_at || doc.createdAt),
                        iconClass: 'ap-doc-icon' + (isPdf ? ' ap-doc-icon-pdf' : (isImg ? ' ap-doc-icon-img' : '')),
                        fileUrl: doc.file_url || doc.source_url || doc.url || ''
                    };
                });
                this.currentView = 'documents';
                this.setStatus(this.documents.length + ' document(s) found', 'ok');
            } else {
                this.setStatus(result.message, 'err');
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to load documents.', 'err');
        }
        this.isLoading = false;
        this.isBusy = false;
    }

    // ══ Upload & Parse ══
    async handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;
        if (!this.selectedInbox) return;

        const contentDocId = uploadedFiles[0].documentId;
        const fileName = uploadedFiles[0].name;

        this.isParsing = true;
        this.setStatus('Uploading "' + fileName + '" to Airparser for parsing...', 'ok');

        try {
            const result = await uploadAndParse({
                inboxId: this.selectedInbox.id,
                contentDocumentId: contentDocId
            });

            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Parsed',
                    message: result.message,
                    variant: 'success'
                }));

                // If parsing complete, show the result as a document
                if (!result.parsingInProgress && result.document) {
                    const doc = result.document;
                    const jsonData = doc.json || {};
                    const fields = this.flattenJson(jsonData);

                    this.selectedDoc = {
                        id: doc.doc_id || doc._id || doc.id || '',
                        name: fileName,
                        status: doc.status || 'parsed',
                        statusClass: 'ap-badge ap-badge-parsed',
                        createdDisplay: this.formatDate(new Date().toISOString()),
                        json: doc.json,
                        fields,
                        hasFields: fields.length > 0
                    };
                    this.createdAppId = null;
                    this.currentView = 'docDetail';
                }

                this.setStatus(result.message, 'ok');
            } else {
                this.setStatus(result.message, 'err');
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Upload failed.', 'err');
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Upload failed', variant: 'error' }));
        }
        this.isParsing = false;
    }

    // ══ Parse Document (fetch parsed data on demand) ══
    async handleParseDoc(event) {
        event.stopPropagation();
        const docId = event.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        this.isBusy = true;
        this.isParsing = true;
        this.setStatus('Fetching parsed data for "' + doc.name + '"...', 'ok');

        try {
            const result = await parseDocument({ docId: docId });

            if (result.status === 'success' && result.document) {
                const docData = result.document;
                const jsonData = docData.json || docData;
                const fields = this.flattenJson(jsonData);

                // Build Airparser web URL for preview
                const inboxId = docData.inbox_id || (this.selectedInbox ? this.selectedInbox.id : '');
                this.previewUrl = inboxId ? 'https://app.airparser.com/' + inboxId + '/docs/' + docId : '';

                this.selectedDoc = {
                    ...doc,
                    json: docData.json || jsonData,
                    fields,
                    hasFields: fields.length > 0
                };
                this.createdAppId = null;
                this.currentView = 'docDetail';
                this.setStatus('Parsed ' + fields.length + ' field(s)', 'ok');

                // Apply transformation rules to pre-fill form
                this.loadFormData(docData.json || jsonData);
            } else {
                this.setStatus(result.message || 'No parsed data available.', 'err');
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to parse document.', 'err');
        }
        this.isParsing = false;
        this.isBusy = false;
    }

    // Flatten nested JSON into key-value pairs with dot notation
    flattenJson(obj, prefix) {
        const fields = [];
        if (!obj || typeof obj !== 'object') return fields;

        for (const key of Object.keys(obj)) {
            if (key.startsWith('__')) continue;
            const fullKey = prefix ? prefix + '.' + key : key;
            const val = obj[key];

            if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
                // Nested object — flatten recursively
                fields.push(...this.flattenJson(val, fullKey));
            } else {
                fields.push({
                    key: fullKey,
                    value: val !== null && val !== undefined ? String(val) : ''
                });
            }
        }
        return fields;
    }

    // ══ Preview ══
    async handlePreviewFromList(event) {
        event.stopPropagation();
        const docId = event.currentTarget.dataset.id;

        this.isBusy = true;
        try {
            const result = await getDocumentFileUrl({ docId });
            if (result.status === 'success' && result.webUrl) {
                window.open(result.webUrl, '_blank');
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to open preview.', 'err');
        }
        this.isBusy = false;
    }

    handlePreview() {
        if (this.previewUrl) {
            window.open(this.previewUrl, '_blank');
        }
    }

    handleStopProp(event) {
        event.stopPropagation();
    }

    // ══ Breadcrumb Navigation ══
    handleBackToInbox() {
        if (this.selectedInbox) {
            this.selectedDoc = null;
            this.createdAppId = null;
            this.currentView = 'documents';
            this.setStatus('', '');
        }
    }

    // ══ Get Schema ══
    async handleGetSchema() {
        if (!this.selectedInbox) return;
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const result = await getSchema({ inboxId: this.selectedInbox.id });
            if (result.status === 'success') {
                const schema = result.schema;
                if (schema && schema.fields && schema.fields.length > 0) {
                    this.schemaFields = schema.fields.map((f, idx) => {
                        const data = f.data || f;
                        return {
                            idx: idx + 1,
                            name: data.name || f.name || '',
                            dataType: data.type || f.type || 'scalar',
                            description: data.description || f.description || ''
                        };
                    });
                } else {
                    this.schemaFields = [];
                }
                this.showSchema = true;
            } else {
                this.setStatus(result.message, 'err');
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to get schema.', 'err');
        }
        this.isBusy = false;
    }

    // ══ Setup Schema ══
    async handleSetupSchema() {
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const result = await setupSchema();
            this.setStatus(result.message, result.status === 'success' ? 'ok' : 'err');
            if (result.status === 'success') this.handleGetSchema();
        } catch (e) {
            this.setStatus(e.body?.message || 'Schema setup failed.', 'err');
        }
        this.isBusy = false;
    }

    // ══════════════════════════════════════
    // ══ MAPPING RULES ══
    // ══════════════════════════════════════

    async handleShowMappings() {
        this.isBusy = true;
        this.isLoading = true;
        this.setStatus('', '');
        this.currentView = 'none';
        this.selectedInbox = null;
        this.selectedDoc = null;
        this.showSchema = false;
        this.createdAppId = null;
        try {
            const existing = await getMappings();
            this.mappingRows = existing.map((m, idx) => this.buildMappingRow(idx + 1, m.Airparser_Field__c, m.Target_Section__c, m.Target_Field__c, m.Target_Field_Label__c, m.Is_Active__c));
            this.currentView = 'mappings';
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to load mappings.', 'err');
        }
        this.isLoading = false;
        this.isBusy = false;
    }

    buildMappingRow(idx, airparserField, targetSection, targetField, targetFieldLabel, isActive) {
        const filteredOptions = this.targetFieldOptions
            .filter(o => o.section === targetSection)
            .map(o => ({ ...o, selected: o.fieldKey === targetField }));

        return {
            idx,
            airparserField: airparserField || '',
            targetSection: targetSection || '',
            targetField: targetField || '',
            targetFieldLabel: targetFieldLabel || '',
            isActive: isActive !== false,
            filteredOptions,
            noSection: !targetSection,
            isVendor1: targetSection === 'Vendor 1',
            isVendor2: targetSection === 'Vendor 2',
            isProperty: targetSection === 'Property',
            isAgent: targetSection === 'Agent',
            isApplication: targetSection === 'Application'
        };
    }

    handleMappingChange(event) {
        const idx = parseInt(event.currentTarget.dataset.idx, 10);
        const field = event.currentTarget.dataset.field;
        const value = event.target.value;

        this.mappingRows = this.mappingRows.map(r => {
            if (r.idx === idx) {
                const updated = { ...r, [field]: value };
                // If section changed, rebuild filtered options and clear target field
                if (field === 'targetSection') {
                    updated.targetField = '';
                    updated.targetFieldLabel = '';
                    updated.filteredOptions = this.targetFieldOptions
                        .filter(o => o.section === value)
                        .map(o => ({ ...o, selected: false }));
                    updated.noSection = !value;
                    updated.isVendor1 = value === 'Vendor 1';
                    updated.isVendor2 = value === 'Vendor 2';
                    updated.isProperty = value === 'Property';
                    updated.isAgent = value === 'Agent';
                    updated.isApplication = value === 'Application';
                }
                return updated;
            }
            return r;
        });
    }

    handleTargetFieldChange(event) {
        const idx = parseInt(event.currentTarget.dataset.idx, 10);
        const value = event.target.value;
        const selectedOpt = this.targetFieldOptions.find(o => o.fieldKey === value);

        this.mappingRows = this.mappingRows.map(r => {
            if (r.idx === idx) {
                return {
                    ...r,
                    targetField: value,
                    targetFieldLabel: selectedOpt ? selectedOpt.fieldLabel : '',
                    filteredOptions: r.filteredOptions.map(o => ({ ...o, selected: o.fieldKey === value }))
                };
            }
            return r;
        });
    }

    handleMappingToggle(event) {
        const idx = parseInt(event.currentTarget.dataset.idx, 10);
        const checked = event.target.checked;
        this.mappingRows = this.mappingRows.map(r =>
            r.idx === idx ? { ...r, isActive: checked } : r
        );
    }

    handleRemoveMapping(event) {
        const idx = parseInt(event.currentTarget.dataset.idx, 10);
        this.mappingRows = this.mappingRows
            .filter(r => r.idx !== idx)
            .map((r, i) => ({ ...r, idx: i + 1 }));
    }

    handleAddMapping() {
        const nextIdx = this.mappingRows.length + 1;
        this.mappingRows = [...this.mappingRows, this.buildMappingRow(nextIdx, '', '', '', '', true)];
    }

    async handleSaveMappings() {
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const data = this.mappingRows
                .filter(r => r.airparserField && r.targetSection && r.targetField)
                .map(r => ({
                    airparserField: r.airparserField,
                    targetSection: r.targetSection,
                    targetField: r.targetField,
                    targetFieldLabel: r.targetFieldLabel,
                    isActive: r.isActive
                }));

            const result = await saveMappings({ mappings: data });
            this.setStatus(result.message, result.status === 'success' ? 'ok' : 'err');
            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: result.message, variant: 'success' }));
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to save.', 'err');
        }
        this.isBusy = false;
    }

    async handleLoadDefaults() {
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const result = await createDefaultMappings();
            this.setStatus(result.message, result.status === 'success' ? 'ok' : 'err');
            if (result.status === 'success') {
                // Reload
                const existing = await getMappings();
                this.mappingRows = existing.map((m, idx) => this.buildMappingRow(idx + 1, m.Airparser_Field__c, m.Target_Section__c, m.Target_Field__c, m.Target_Field_Label__c, m.Is_Active__c));
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to load defaults.', 'err');
        }
        this.isBusy = false;
    }

    // ══════════════════════════════════════
    // ══ FORM: Apply mappings & edit ══
    // ══════════════════════════════════════

    async loadFormData(jsonData) {
        this.isLoadingForm = true;
        this.hasFormData = false;
        try {
            const jsonStr = JSON.stringify(jsonData);
            const result = await applyMappingsPreview({ parsedJsonStr: jsonStr });
            if (result.status === 'success') {
                // Default all fields to empty string to avoid "undefined" in inputs
                const defV1 = { firstname: '', lastname: '', email: '', mobilePhone: '' };
                const defV2 = { firstname1: '', lastname1: '', email1: '', mobilePhone1: '' };
                const defProp = { street: '', city: '', pcode: '', NumberofBedrooms: '', AgeofProperty: '' };
                const defAgent = { agentName: '', agentPhone: '', agentEmail: '' };
                const defApp = { housebuilderId: '', development: '', plot: '', PurchasePrice: '', ClientsEstimatedValuation: '', OutstandingMortgage: '', Region: '', salesAdvisor: '', scheme: '', notes: '' };

                this.formVendor1 = { ...defV1, ...(result.vendor1 || {}) };
                this.formVendor2 = { ...defV2, ...(result.vendor2 || {}) };
                this.formProperty = { ...defProp, ...(result.property || {}) };
                this.formAgent = { ...defAgent, ...(result.agent || {}) };
                this.formApp = { ...defApp, ...(result.application || {}) };
                this.hasFormData = true;

                // Housebuilder match
                const hb = result.housebuilder || {};
                this.hbParsedName = hb.name || this.formApp.housebuilderId || '';
                if (hb.matched) {
                    this.hbMatchedId = hb.id;
                    this.formApp = { ...this.formApp, housebuilderId: hb.id };
                } else {
                    this.hbMatchedId = '';
                }
            }
        } catch (e) {
            this.setStatus('Failed to apply mappings: ' + (e.body?.message || e.message), 'err');
        }
        this.isLoadingForm = false;
    }

    handleHousebuilderSelected(event) {
        const selected = event.detail;
        this.hbMatchedId = selected.id;
        this.formApp = { ...this.formApp, housebuilderId: selected.id };
    }

    handleRemap() {
        if (this.selectedDoc && this.selectedDoc.json) {
            this.loadFormData(this.selectedDoc.json);
        }
    }

    handleFormChange(event) {
        const section = event.currentTarget.dataset.section;
        const key = event.currentTarget.dataset.key;
        const value = event.target.value;

        if (section === 'vendor1') this.formVendor1 = { ...this.formVendor1, [key]: value };
        else if (section === 'vendor2') this.formVendor2 = { ...this.formVendor2, [key]: value };
        else if (section === 'property') this.formProperty = { ...this.formProperty, [key]: value };
        else if (section === 'agent') this.formAgent = { ...this.formAgent, [key]: value };
        else if (section === 'application') this.formApp = { ...this.formApp, [key]: value };
    }

    async handleAcceptAndCreate() {
        this.isBusy = true;
        this.setStatus('', '');
        try {
            // Build vendor data (merge vendor1 + vendor2 into single object as expected by saveData)
            const vendorData = { ...this.formVendor1, ...this.formVendor2 };

            const formData = {
                Vendor: vendorData,
                Property: this.formProperty,
                Agent: this.formAgent,
                Application: this.formApp
            };

            const result = await createApplicationFromForm({ formDataJson: JSON.stringify(formData) });
            if (result.status === 'success') {
                this.createdAppId = result.applicationId;
                this.dispatchEvent(new ShowToastEvent({ title: 'Application Created', message: result.message, variant: 'success' }));
                this.setStatus(result.message, 'ok');
            } else {
                this.setStatus(result.message, 'err');
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to create application.', 'err');
        }
        this.isBusy = false;
    }

    // ══ Legacy: direct create from parsed JSON (kept for backward compat) ══

    async handleCreateApplication() {
        if (!this.selectedDoc || !this.selectedDoc.json) return;
        this.isBusy = true;
        this.setStatus('', '');
        try {
            const jsonStr = JSON.stringify(this.selectedDoc.json);
            const result = await createApplicationFromParsed({ parsedJsonStr: jsonStr });

            if (result.status === 'success') {
                this.createdAppId = result.applicationId;
                this.dispatchEvent(new ShowToastEvent({ title: 'Application Created', message: result.message, variant: 'success' }));
                this.setStatus(result.message, 'ok');
            } else {
                this.setStatus(result.message, 'err');
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.setStatus(e.body?.message || 'Failed to create application.', 'err');
        }
        this.isBusy = false;
    }
}
