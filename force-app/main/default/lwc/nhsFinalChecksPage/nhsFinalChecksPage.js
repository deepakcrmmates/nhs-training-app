import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import NHS_PROCESS_FIELD from '@salesforce/schema/Opportunity.NHS_Process__c';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import getFinalChecksPageData from '@salesforce/apex/FinalChecksController.getFinalChecksPageData';
import saveFinalChecks from '@salesforce/apex/FinalChecksController.saveFinalChecks';
import getTemplates from '@salesforce/apex/NHSCommunicationsController.getEmailTemplates';
import renderTemplate from '@salesforce/apex/NHSCommunicationsController.getRenderedTemplate';
import sendEmailWithBcc from '@salesforce/apex/NHSCommunicationsController.sendEmailWithBcc';

const CHECK_ITEMS = [
    { key: 'agent1Report',     label: 'Agent 1 Report',      group: 'reports' },
    { key: 'agent2Report',     label: 'Agent 2 Report',      group: 'reports' },
    { key: 'agent3Report',     label: 'Agent 3 Report',      group: 'reports' },
    { key: 'nhsPreWillReport', label: 'NHS Pre-Will Report',  group: 'will' },
    { key: 'willReport',       label: 'Will Report',          group: 'will' },
    { key: 'photosValidated',  label: 'Photos Validated',     group: 'validation' },
    { key: 'addressValidated', label: 'Address Validated',    group: 'validation' },
];
const TOTAL = CHECK_ITEMS.length;
const fmt = v => v != null ? '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0 }) : '—';

export default class NhsFinalChecksPage extends LightningElement {
    @api recordId;
    @track d = {};
    @track checks = {};
    @track isLoaded = false;
    @track isSaving = false;
    @track isDirty = false;

    // Email
    @track templates = [];
    @track selectedTemplateId = '';
    @track selectedTemplateName = '';
    @track emailSubject = '';
    @track emailBody = '';
    @track emailLoading = false;
    @track isSending = false;
    @track emailReady = false;
    @track showTemplateLightbox = false;
    @track templateSearchTerm = '';

    // Builder contacts
    @track builderContacts = [];
    @track selectedContactIds = new Set();
    @track manualCc = '';
    @track manualBcc = '';
    @track builderApproved = false;
    @track isMoving = false;

    connectedCallback() { this.loadData(); }

    loadData() {
        getFinalChecksPageData({ opportunityId: this.recordId })
            .then(result => {
                this.d = result;
                this.checks = {
                    agent1Report:     result.agent1Report || false,
                    agent2Report:     result.agent2Report || false,
                    agent3Report:     result.agent3Report || false,
                    nhsPreWillReport: result.nhsPreWillReport || false,
                    willReport:       result.willReport || false,
                    photosValidated:  result.photosValidated || false,
                    addressValidated: result.addressValidated || false
                };
                // Builder approval
                this.builderApproved = result.builderApproved || false;

                // Builder contacts
                this.builderContacts = (result.builderContacts || []).map(c => ({
                    id: c.id, name: c.name, email: c.email
                }));
                // Pre-select all contacts
                this.selectedContactIds = new Set(this.builderContacts.map(c => c.id));

                this.isLoaded = true;
                this.isDirty = false;
                if (this.readyToSend) this.loadTemplates();
            })
            .catch(err => { console.error(err); this.isLoaded = true; });
    }

    // ── Read-only fields ──
    get appName()      { return this.d.name || ''; }
    get builderName()  { return this.d.builderName || '—'; }
    get vendorName()   { return this.d.vendorName || '—'; }
    get vendorEmail()  { return this.d.vendorEmail || '—'; }
    get vendorMobile() { return this.d.vendorMobile || '—'; }

    // ── Agent valuations ──
    get agent1Name() { return this.d.agent1Name || 'Agent 1'; }
    get agent2Name() { return this.d.agent2Name || 'Agent 2'; }
    get agent3Name() { return this.d.agent3Name || 'Agent 3'; }

    get a1Initial() { return fmt(this.d.agent1Initial); }
    get a1Target()  { return fmt(this.d.agent1Target); }
    get a1Bottom()  { return fmt(this.d.agent1Bottom); }
    get a2Initial() { return fmt(this.d.agent2Initial); }
    get a2Target()  { return fmt(this.d.agent2Target); }
    get a2Bottom()  { return fmt(this.d.agent2Bottom); }
    get a3Initial() { return fmt(this.d.agent3Initial); }
    get a3Target()  { return fmt(this.d.agent3Target); }
    get a3Bottom()  { return fmt(this.d.agent3Bottom); }

    get avgInitial() { return this._avg('Initial'); }
    get avgTarget()  { return this._avg('Target'); }
    get avgBottom()  { return this._avg('Bottom'); }

    _avg(type) {
        const key = type === 'Initial' ? 'Initial' : type === 'Target' ? 'Target' : 'Bottom';
        const vals = [1,2,3].map(n => this.d[`agent${n}${key}`]).filter(v => v != null && v > 0);
        if (vals.length === 0) return '—';
        return fmt(vals.reduce((s,v) => s + v, 0) / vals.length);
    }

    get nhsMarket() { return fmt(this.d.nhsMarket); }
    get nhsTarget() { return fmt(this.d.nhsTarget); }
    get nhsForced() { return fmt(this.d.nhsForced); }

    // ── Checks ──
    get agentReports() { return this._group('reports'); }
    get willReports()  { return this._group('will'); }
    get validations()  { return this._group('validation'); }

    _group(g) {
        return CHECK_ITEMS.filter(i => i.group === g).map(i => ({
            key: i.key, label: i.label,
            checked: this.checks[i.key] || false,
            boxClass: this.checks[i.key] ? 'fc-box checked' : 'fc-box',
            labelClass: this.checks[i.key] ? 'fc-label done' : 'fc-label'
        }));
    }

    get checkedCount() { return Object.values(this.checks).filter(v => v).length; }
    get progressPercent() { return Math.round((this.checkedCount / TOTAL) * 100); }
    get progressBarStyle() { return `width:${this.progressPercent}%`; }
    get progressText() { return `${this.checkedCount} of ${TOTAL}`; }
    get allChecked() { return this.checkedCount === TOTAL; }
    get barClass() { return this.allChecked ? 'bar fill complete' : 'bar fill'; }

    handleToggle(e) {
        const key = e.currentTarget.dataset.key;
        this.checks = { ...this.checks, [key]: !this.checks[key] };
        this.isDirty = true;
        if (this.readyToSend && this.templates.length === 0) this.loadTemplates();
    }

    async handleSave() {
        this.isSaving = true;
        try {
            await saveFinalChecks({ opportunityId: this.recordId, checks: this.checks });
            this.isDirty = false;
            this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: 'Final checks updated.', variant: 'success' }));
        } catch (err) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err.body?.message || 'Failed', variant: 'error' }));
        } finally { this.isSaving = false; }
    }

    // ── Email ──
    loadTemplates() {
        getTemplates()
            .then(result => {
                this.templates = (result || []).map(t => ({ label: t.name, value: t.id }));
                this._applyDefaultTemplate();
            })
            .catch(err => console.error(err));
    }

    _applyDefaultTemplate() {
        const defaultId = this.d && this.d.defaultTemplateId;
        if (!defaultId || this.selectedTemplateId) return;
        if (!this.templates.some(t => t.value === defaultId)) return;
        this.handlePickTemplate({ currentTarget: { dataset: { id: defaultId } } });
    }

    renderedCallback() {
        if (this.emailBody) {
            const container = this.template.querySelector('.email-body-preview');
            if (container) container.innerHTML = this.emailBody;
        }
    }

    get hasTemplates() { return this.templates.length > 0; }

    // Missing valuation figures (agent 1/2/3 Initial/Target/Bottom + NHS Market/Target/Forced)
    get missingValuations() {
        const missing = [];
        const need = (val) => val === null || val === undefined || val === 0;
        const d = this.d || {};
        const agents = [
            { num: 1, name: d.agent1Name || 'Agent 1', initial: d.agent1Initial, target: d.agent1Target, bottom: d.agent1Bottom },
            { num: 2, name: d.agent2Name || 'Agent 2', initial: d.agent2Initial, target: d.agent2Target, bottom: d.agent2Bottom },
            { num: 3, name: d.agent3Name || 'Agent 3', initial: d.agent3Initial, target: d.agent3Target, bottom: d.agent3Bottom }
        ];
        for (const a of agents) {
            const fields = [];
            if (need(a.initial)) fields.push('Initial Asking');
            if (need(a.target))  fields.push('Target Sale');
            if (need(a.bottom))  fields.push('Bottom Price');
            if (fields.length) missing.push({ key: 'a' + a.num, label: a.name, detail: fields.join(', ') });
        }
        const nhsFields = [];
        if (need(d.nhsMarket)) nhsFields.push('Market Value');
        if (need(d.nhsTarget)) nhsFields.push('Target Sale');
        if (need(d.nhsForced)) nhsFields.push('Forced Sale');
        if (nhsFields.length) missing.push({ key: 'nhs', label: 'NHS Recommendation', detail: nhsFields.join(', ') });
        return missing;
    }
    get hasMissingValuations() { return this.missingValuations.length > 0; }
    get missingChecksCount() { return TOTAL - this.checkedCount; }
    get hasMissingChecks() { return !this.allChecked; }
    get readyToSend() { return this.allChecked && !this.hasMissingValuations; }

    get showEmail() { return this.readyToSend; }
    get showMoveNext() { return this.readyToSend && this.builderApproved && !this.isDirty; }

    get blockerHeadline() {
        if (this.hasMissingChecks && this.hasMissingValuations) return 'Checks and valuation figures are incomplete';
        if (this.hasMissingChecks) return 'Checks are incomplete';
        return 'Valuation figures are incomplete';
    }
    get blockerChecksLabel() {
        return this.missingChecksCount + ' of ' + TOTAL + ' check' + (this.missingChecksCount === 1 ? '' : 's') + ' still outstanding';
    }

    async handleMoveNext() {
        this.isMoving = true;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[NHS_PROCESS_FIELD.fieldApiName] = 'Vendor Discussions';
        try {
            await updateRecord({ fields });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Moved to Vendor Discussions',
                message: 'Application has been moved to the Vendor Discussions stage.',
                variant: 'success'
            }));
            // Reload the page to reflect the new stage
            setTimeout(() => { location.reload(); }, 1000);
        } catch (err) {
            let msg = 'Failed to move.';
            if (err.body?.output?.errors?.length) {
                msg = err.body.output.errors.map(e => e.message).join('; ');
            } else if (err.body?.message) {
                msg = err.body.message;
            }
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: msg, variant: 'error' }));
        } finally { this.isMoving = false; }
    }
    get hasBuilderContacts() { return this.builderContacts.length > 0; }

    get contactList() {
        return this.builderContacts.map(c => ({
            ...c,
            selected: this.selectedContactIds.has(c.id),
            pillClass: this.selectedContactIds.has(c.id) ? 'contact-pill selected' : 'contact-pill'
        }));
    }

    get selectedEmails() {
        return this.builderContacts
            .filter(c => this.selectedContactIds.has(c.id))
            .map(c => c.email);
    }

    get selectedEmailsDisplay() {
        return this.selectedEmails.join(', ') || 'No recipients selected';
    }

    get selectedCount() { return this.selectedContactIds.size; }
    get hasSelectedContacts() { return this.selectedContactIds.size > 0; }

    handleToggleContact(e) {
        const id = e.currentTarget.dataset.id;
        const next = new Set(this.selectedContactIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.selectedContactIds = next;
    }

    handleSelectAllContacts() {
        this.selectedContactIds = new Set(this.builderContacts.map(c => c.id));
    }

    handleDeselectAllContacts() {
        this.selectedContactIds = new Set();
    }

    handleCcChange(e) { this.manualCc = e.target.value; }
    handleBccChange(e) { this.manualBcc = e.target.value; }
    get hasCc() { return this.manualCc && this.manualCc.trim().length > 0; }
    get hasBcc() { return this.manualBcc && this.manualBcc.trim().length > 0; }

    get filteredTemplates() {
        const term = (this.templateSearchTerm || '').toLowerCase();
        return this.templates
            .filter(t => !term || t.label.toLowerCase().includes(term))
            .map(t => ({
                ...t,
                isSelected: t.value === this.selectedTemplateId,
                itemClass: t.value === this.selectedTemplateId ? 'tpl-item selected' : 'tpl-item'
            }));
    }
    get hasFilteredTemplates() { return this.filteredTemplates.length > 0; }

    handleOpenTemplates() {
        this.templateSearchTerm = '';
        this.showTemplateLightbox = true;
    }
    handleCloseLightbox() { this.showTemplateLightbox = false; }
    handleModalClick(e) { e.stopPropagation(); }
    handleTemplateSearch(e) { this.templateSearchTerm = e.target.value; }

    handlePickTemplate(e) {
        const id = e.currentTarget.dataset.id;
        const tpl = this.templates.find(t => t.value === id);
        this.selectedTemplateId = id;
        this.selectedTemplateName = tpl ? tpl.label : '';
        this.showTemplateLightbox = false;
        this.emailLoading = true;
        this.emailReady = false;
        renderTemplate({ templateId: id, opportunityId: this.recordId })
            .then(result => {
                if (result.status === 'success') {
                    this.emailSubject = result.subject || '';
                    this.emailBody = result.body || '';
                    this.emailReady = true;
                } else {
                    this.dispatchEvent(new ShowToastEvent({ title: 'Template Error', message: result.message, variant: 'error' }));
                }
            })
            .catch(err => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err.body?.message || 'Failed to load template', variant: 'error' }));
            })
            .finally(() => { this.emailLoading = false; });
    }

    handleSubjectChange(e) { this.emailSubject = e.target.value; }

    async handleCommitSend() {
        if (this.isDirty) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Unsaved Changes', message: 'Save your checks before sending.', variant: 'warning' }));
            return;
        }
        if (!this.hasSelectedContacts) {
            this.dispatchEvent(new ShowToastEvent({ title: 'No Recipients', message: 'Select at least one contact to send to.', variant: 'warning' }));
            return;
        }
        this.isSending = true;
        const emails = this.selectedEmails;
        const toAddress = emails[0];
        // Combine remaining selected contacts + manual CC
        const autoCc = emails.slice(1);
        const manualCcList = (this.manualCc || '').split(',').map(s => s.trim()).filter(s => s);
        const ccAddress = [...autoCc, ...manualCcList].join(',');
        const bccAddress = (this.manualBcc || '').trim();
        try {
            const result = await sendEmailWithBcc({
                opportunityId: this.recordId,
                toAddress: toAddress,
                subject: this.emailSubject,
                body: this.emailBody,
                ccAddress: ccAddress,
                bccAddress: bccAddress,
                templateId: this.selectedTemplateId
            });
            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Sent', message: `Email sent to ${emails.length} recipient(s) at ${this.d.builderName}`, variant: 'success' }));
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (err) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err.body?.message || 'Failed to send', variant: 'error' }));
        } finally { this.isSending = false; }
    }
}
