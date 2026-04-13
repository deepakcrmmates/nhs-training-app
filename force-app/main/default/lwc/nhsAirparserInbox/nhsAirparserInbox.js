import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getConfig from '@salesforce/apex/AirparserController.getConfig';
import fetchRawDocuments from '@salesforce/apex/AirparserController.fetchRawDocuments';
import parseDocument from '@salesforce/apex/AirparserController.parseDocument';
import getDocumentFileUrl from '@salesforce/apex/AirparserController.getDocumentFileUrl';
import applyMappingsPreview from '@salesforce/apex/AirparserController.applyMappingsPreview';
import createApplicationFromForm from '@salesforce/apex/AirparserController.createApplicationFromForm';
import getHouseBuilderRtId from '@salesforce/apex/AirparserController.getHouseBuilderRtId';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default class NhsAirparserInbox extends NavigationMixin(LightningElement) {
    @track documents = [];
    @track selectedDoc = null;
    @track isLoading = false;
    @track isBusy = false;
    @track errorMessage = '';
    @track currentView = 'list'; // 'list' or 'review'

    // Form
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
    @track createdAppId = null;

    inboxId = '';

    get viewList() { return this.currentView === 'list'; }
    get viewReview() { return this.currentView === 'review'; }
    get hasDocuments() { return this.documents.length > 0; }
    get hasVendor2() { return this.formVendor2 && (this.formVendor2.firstname1 || this.formVendor2.lastname1); }
    get createdAppUrl() { return this.createdAppId ? '/' + this.createdAppId : ''; }

    connectedCallback() {
        this.init();
    }

    async init() {
        try {
            const [config] = await Promise.all([
                getConfig(),
                this.loadHbRtId()
            ]);
            this.inboxId = config.inboxId || '';
            if (this.inboxId) {
                this.loadDocuments();
            } else {
                this.errorMessage = 'Airparser inbox not configured. Please ask an administrator to set it up.';
            }
        } catch (e) {
            this.errorMessage = 'Failed to load configuration.';
        }
    }

    async loadHbRtId() {
        try { this.houseBuilderRtId = await getHouseBuilderRtId(); } catch (e) { /* */ }
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
            d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }

    async loadDocuments() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const result = await fetchRawDocuments({ inboxId: this.inboxId });
            if (result.status === 'success') {
                this.documents = (result.documents || []).map(doc => {
                    const name = doc.name || doc.file_name || 'Document';
                    const lower = name.toLowerCase();
                    const isPdf = lower.endsWith('.pdf');
                    const isImg = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
                    return {
                        id: doc.doc_id || doc._id || doc.id || '',
                        name,
                        status: doc.status || 'unknown',
                        statusClass: 'ib-badge ib-badge-' + (doc.status || 'unknown'),
                        createdDisplay: this.formatDate(doc.created_at || doc.createdAt),
                        iconClass: 'ib-doc-icon' + (isPdf ? ' ib-doc-icon-pdf' : (isImg ? ' ib-doc-icon-img' : ''))
                    };
                });
            } else {
                this.errorMessage = result.message;
            }
        } catch (e) {
            this.errorMessage = e.body?.message || 'Failed to load documents.';
        }
        this.isLoading = false;
    }

    // Preview — open in Airparser
    async handlePreview(event) {
        event.stopPropagation();
        const docId = event.currentTarget.dataset.id;
        try {
            const result = await getDocumentFileUrl({ docId });
            if (result.status === 'success' && result.webUrl) {
                window.open(result.webUrl, '_blank');
            }
        } catch (e) { /* */ }
    }

    // Review — parse and show split screen
    async handleReview(event) {
        const docId = event.currentTarget.dataset.id;
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        this.isBusy = true;
        this.isLoading = true;
        this.createdAppId = null;

        try {
            const result = await parseDocument({ docId });
            if (result.status === 'success' && result.document) {
                const docData = result.document;
                const jsonData = docData.json || docData;
                const fields = this.flattenJson(jsonData);

                const inboxId = docData.inbox_id || this.inboxId;

                this.selectedDoc = {
                    ...doc,
                    json: docData.json || jsonData,
                    fields,
                    hasFields: fields.length > 0,
                    previewUrl: 'https://app.airparser.com/' + inboxId + '/docs/' + docId
                };
                this.currentView = 'review';
                this.loadFormData(docData.json || jsonData);
            } else {
                this.errorMessage = result.message || 'Failed to parse document.';
            }
        } catch (e) {
            this.errorMessage = e.body?.message || 'Failed to parse document.';
        }
        this.isLoading = false;
        this.isBusy = false;
    }

    handleBackToList() {
        this.currentView = 'list';
        this.selectedDoc = null;
        this.hasFormData = false;
        this.createdAppId = null;
    }

    // Flatten nested JSON
    flattenJson(obj, prefix) {
        const fields = [];
        if (!obj || typeof obj !== 'object') return fields;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('__')) continue;
            const fullKey = prefix ? prefix + '.' + key : key;
            const val = obj[key];
            if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
                fields.push(...this.flattenJson(val, fullKey));
            } else {
                fields.push({ key: fullKey, value: val !== null && val !== undefined ? String(val) : '' });
            }
        }
        return fields;
    }

    // Apply mappings
    async loadFormData(jsonData) {
        this.isLoadingForm = true;
        this.hasFormData = false;
        try {
            const result = await applyMappingsPreview({ parsedJsonStr: JSON.stringify(jsonData) });
            if (result.status === 'success') {
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

                const hb = result.housebuilder || {};
                this.hbParsedName = hb.name || this.formApp.housebuilderId || '';
                if (hb.matched) {
                    this.hbMatchedId = hb.id;
                    this.formApp = { ...this.formApp, housebuilderId: hb.id };
                } else {
                    this.hbMatchedId = '';
                }
            }
        } catch (e) { /* */ }
        this.isLoadingForm = false;
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

    handleHousebuilderSelected(event) {
        const selected = event.detail;
        this.hbMatchedId = selected.id;
        this.formApp = { ...this.formApp, housebuilderId: selected.id };
    }

    async handleAcceptAndCreate() {
        this.isBusy = true;
        try {
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
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed', variant: 'error' }));
        }
        this.isBusy = false;
    }
}
