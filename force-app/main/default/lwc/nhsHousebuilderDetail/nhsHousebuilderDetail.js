import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getHousebuilderDetail from '@salesforce/apex/NhsHousebuilderController.getHousebuilderDetail';
import addContactToHousebuilder from '@salesforce/apex/NhsHousebuilderController.addContactToHousebuilder';
import deleteContact from '@salesforce/apex/NhsHousebuilderController.deleteContact';
import updateContact from '@salesforce/apex/NhsHousebuilderController.updateContact';
import updateHousebuilder from '@salesforce/apex/NhsHousebuilderController.updateHousebuilder';
import searchEstateAgents from '@salesforce/apex/NhsHousebuilderController.searchEstateAgents';
import addPreferredAgent from '@salesforce/apex/NhsHousebuilderController.addPreferredAgent';
import deletePreferredAgent from '@salesforce/apex/NhsHousebuilderController.deletePreferredAgent';
import updatePreferredAgent from '@salesforce/apex/NhsHousebuilderController.updatePreferredAgent';
import getEmailMessage from '@salesforce/apex/NhsHousebuilderController.getEmailMessage';

export default class NhsHousebuilderDetail extends NavigationMixin(LightningElement) {
    @api recordId;
    @track data = null;
    @track activeTab = 'contacts';
    @track showAddContact = false;
    @track showEditHb = false;
    @track editHb = { name: '', phone: '', email: '', website: '', street: '', city: '', postcode: '', country: '' };
    @track newContact = this._blankContact();
    @track isLoading = true;
    @track error = '';
    _wired;

    @wire(getHousebuilderDetail, { accountId: '$recordId' })
    wiredData(result) {
        this._wired = result;
        if (result.data) {
            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.data = result.data;
            }
            this.isLoading = false;
        } else if (result.error) {
            this.error = result.error.body?.message || 'Failed to load';
            this.isLoading = false;
        }
    }

    _blankContact() {
        return { firstName: '', lastName: '', email: '', mobile: '', jobTitle: '' };
    }

    get hasLogo() { return !!(this.data?.logoUrl); }
    get hasAddress() {
        return !!(this.data?.street || this.data?.city || this.data?.postcode);
    }
    get fullAddress() {
        if (!this.data) return '';
        return [this.data.street, this.data.city, this.data.postcode, this.data.country].filter(Boolean).join(', ');
    }
    get googleMapsUrl() {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(this.fullAddress);
    }
    get phoneHref() { return this.data?.phone ? 'tel:' + this.data.phone : '#'; }
    get emailHref() { return this.data?.email ? 'mailto:' + this.data.email : '#'; }
    get websiteHref() {
        if (!this.data?.website) return '#';
        const w = this.data.website;
        return w.startsWith('http') ? w : 'https://' + w;
    }

    // Tabs
    get isContactsTab() { return this.activeTab === 'contacts'; }
    get isAppsTab() { return this.activeTab === 'apps'; }
    get isCommsTab() { return this.activeTab === 'comms'; }
    get isPrefAgentsTab() { return this.activeTab === 'prefagents'; }
    get contactsTabClass()  { return 'hbd-tab' + (this.activeTab === 'contacts'   ? ' hbd-tab-active' : ''); }
    get appsTabClass()      { return 'hbd-tab' + (this.activeTab === 'apps'       ? ' hbd-tab-active' : ''); }
    get commsTabClass()     { return 'hbd-tab' + (this.activeTab === 'comms'      ? ' hbd-tab-active' : ''); }
    get prefAgentsTabClass(){ return 'hbd-tab' + (this.activeTab === 'prefagents' ? ' hbd-tab-active' : ''); }

    get contactCount()    { return this.data?.contacts?.length || 0; }
    get appCount()        { return this.data?.applications?.length || 0; }
    get commsCount()      { return this.data?.commsHistory?.length || 0; }
    get prefAgentsCount() { return this.data?.preferredAgents?.length || 0; }

    get hasContacts() { return this.contactCount > 0; }
    get hasApps() { return this.appCount > 0; }
    get hasComms() { return this.commsCount > 0; }
    get hasPrefAgents() { return this.prefAgentsCount > 0; }

    get contactsDisplay() {
        return (this.data?.contacts || []).map(c => ({
            ...c,
            initials: this._initials(c.firstName, c.lastName),
            phoneHref: c.phone ? 'tel:' + c.phone : '',
            mobileHref: c.mobile ? 'tel:' + c.mobile : '',
            emailHref: c.email ? 'mailto:' + c.email : ''
        }));
    }

    get appsDisplay() {
        return (this.data?.applications || []).map(a => ({
            ...a,
            createdDateFormatted: this._fmtDate(a.createdDate),
            stageClass: 'hbd-stage hbd-stage-' + (a.nhsProcess || 'application').toLowerCase().replace(/\s+/g, '-')
        }));
    }

    get commsDisplay() {
        return (this.data?.commsHistory || []).map(c => {
            const isOutbound = c.direction !== 'Inbound';
            const isEmail = (c.channel || 'Email') === 'Email';
            return {
                ...c,
                isOutbound,
                isEmail,
                dateFormatted: this._fmtDateTime(c.date),
                relativeTime: this._relativeTime(c.date),
                dirPill: 'hbd-comms-dir ' + (isOutbound ? 'hbd-comms-dir-out' : 'hbd-comms-dir-in'),
                channelIconClass: 'hbd-comms-icon hbd-comms-icon-' + (isOutbound ? 'out' : 'in')
            };
        });
    }

    _relativeTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60)    return 'just now';
        if (diffSec < 3600)  return Math.floor(diffSec / 60) + 'm ago';
        if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
        if (diffSec < 604800) return Math.floor(diffSec / 86400) + 'd ago';
        if (diffSec < 2592000) return Math.floor(diffSec / 604800) + 'w ago';
        if (diffSec < 31536000) return Math.floor(diffSec / 2592000) + 'mo ago';
        return Math.floor(diffSec / 31536000) + 'y ago';
    }

    // ──── Email viewer ────
    @track showEmailViewer = false;
    @track emailViewer = null;
    @track emailLoading = false;
    get hasEmailViewer() { return !!this.emailViewer; }
    get emailHasOpp() { return !!(this.emailViewer && this.emailViewer.opportunityId); }
    get emailHasAttachments() { return !!(this.emailViewer && this.emailViewer.attachments && this.emailViewer.attachments.length); }
    get emailAttachmentCount() { return this.emailViewer && this.emailViewer.attachments ? this.emailViewer.attachments.length : 0; }

    async handleCommsRowClick(event) {
        const emailId = event.currentTarget.dataset.id;
        if (!emailId) return;
        this.showEmailViewer = true;
        this.emailLoading = true;
        this.emailViewer = null;
        try {
            const res = await getEmailMessage({ emailMessageId: emailId });
            if (res.status === 'success') {
                this.emailViewer = {
                    ...res,
                    dateFormatted: this._fmtDateTime(res.date),
                    relativeTime: this._relativeTime(res.date),
                    dirPill: 'hbd-comms-dir ' + (res.direction === 'Inbound' ? 'hbd-comms-dir-in' : 'hbd-comms-dir-out'),
                    attachments: (res.attachments || []).map(a => ({
                        ...a,
                        sizeLabel: this._fmtBytes(a.size)
                    }))
                };
            } else {
                this._toast('Failed', res.message || 'Email not found', 'error');
                this.showEmailViewer = false;
            }
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed to load email', 'error');
            this.showEmailViewer = false;
        } finally {
            this.emailLoading = false;
        }
    }

    handleCloseEmailViewer() {
        this.showEmailViewer = false;
        this.emailViewer = null;
    }

    handleOpenApplicationFromEmail() {
        const oppId = this.emailViewer?.opportunityId;
        if (!oppId) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: oppId, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }

    renderedCallback() {
        if (this.emailViewer && this.showEmailViewer) {
            const body = this.template.querySelector('.hbd-email-body-rendered');
            if (body && !body.dataset.rendered) {
                body.innerHTML = this.emailViewer.htmlBody || this._escapeHtml(this.emailViewer.textBody || '');
                body.dataset.rendered = '1';
            }
        }
    }

    _escapeHtml(s) {
        if (!s) return '';
        return '<pre style="white-space:pre-wrap;margin:0;font-family:inherit;">' + s.replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c])) + '</pre>';
    }

    _fmtBytes(b) {
        if (!b) return '';
        if (b < 1024) return b + ' B';
        if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
        return (b/1024/1024).toFixed(1) + ' MB';
    }

    get prefAgentsDisplay() {
        return (this.data?.preferredAgents || []).map(p => ({
            ...p,
            priorityDisplay: p.priority ? '#' + Math.trunc(p.priority) : '—',
            statusClass: 'hbd-pa-status hbd-pa-status-' + (p.status || 'active').toLowerCase(),
            addedDateFormatted: p.addedDate ? this._fmtDate(p.addedDate) : '',
            agentUrl: '/' + p.agentId,
            emailHref: p.agentEmail ? 'mailto:' + p.agentEmail : '',
            phoneHref: p.agentPhone ? 'tel:' + p.agentPhone : ''
        }));
    }

    _initials(first, last) {
        const f = (first || '').charAt(0);
        const l = (last || '').charAt(0);
        return (f + l).toUpperCase() || '?';
    }

    _fmtDate(d) {
        if (!d) return '';
        const dt = new Date(d);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
    }

    _fmtDateTime(d) {
        if (!d) return '';
        const dt = new Date(d);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear() + ', ' + hh + ':' + mm;
    }

    handleTabClick(event) { this.activeTab = event.currentTarget.dataset.tab; }

    stopProp(event) { event.stopPropagation(); }

    // Contact navigation
    handleContactClick(event) {
        const id = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Contact', actionName: 'view' }
        });
    }

    handleAppClick(event) {
        const id = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }

    // Edit Housebuilder
    handleShowEditHb() {
        this.editHb = {
            name: this.data?.name || '',
            phone: this.data?.phone || '',
            email: this.data?.email || '',
            website: this.data?.website || '',
            street: this.data?.street || '',
            city: this.data?.city || '',
            postcode: this.data?.postcode || '',
            country: this.data?.country || ''
        };
        this.showEditHb = true;
    }
    handleCloseEditHb() { this.showEditHb = false; }
    handleEditHbFieldChange(event) {
        const field = event.target.dataset.field;
        let value = event.target.value;
        if (field === 'phone') {
            value = value.replace(/[^0-9+()\-\s]/g, '');
            if (value !== event.target.value) event.target.value = value;
        }
        this.editHb = { ...this.editHb, [field]: value };
    }
    handlePhoneKeyPress(event) {
        if (!/[0-9+()\-\s]/.test(event.key)) {
            event.preventDefault();
        }
    }
    async handleSaveEditHb() {
        if (!this.editHb.name) {
            this._toast('Missing Name', 'Company name is required.', 'warning');
            return;
        }
        if (this.editHb.phone && !/^[0-9+()\-\s]+$/.test(this.editHb.phone)) {
            this._toast('Invalid Phone', 'Phone can only contain digits, +, -, (, ), and spaces.', 'warning');
            return;
        }
        if (this.editHb.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editHb.email)) {
            this._toast('Invalid Email', 'Please enter a valid email address.', 'warning');
            return;
        }
        try {
            await updateHousebuilder({
                accountId: this.recordId,
                accountDataJson: JSON.stringify(this.editHb)
            });
            this._toast('Saved', 'Housebuilder details updated.', 'success');
            this.showEditHb = false;
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed', 'error');
        }
    }

    // Add contact
    handleShowAddContact() {
        this.newContact = this._blankContact();
        this.showAddContact = true;
    }
    handleCloseAddContact() { this.showAddContact = false; }
    handleContactFieldChange(event) {
        const field = event.target.dataset.field;
        this.newContact = { ...this.newContact, [field]: event.target.value };
    }
    async handleSaveContact() {
        if (!this.newContact.firstName && !this.newContact.lastName) {
            this._toast('Missing Name', 'Please enter at least a last name.', 'warning');
            return;
        }
        try {
            await addContactToHousebuilder({
                accountId: this.recordId,
                firstName: this.newContact.firstName,
                lastName: this.newContact.lastName || 'Contact',
                email: this.newContact.email,
                mobile: this.newContact.mobile,
                jobTitle: this.newContact.jobTitle
            });
            this._toast('Added', 'Contact added.', 'success');
            this.showAddContact = false;
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed', 'error');
        }
    }

    // ──── Preferred Agents ────
    @track showAddPrefAgent = false;
    @track prefSearchTerm = '';
    @track prefAgentResults = [];
    @track prefSelectedAgent = null;
    @track prefPriority = '';
    @track prefNotes = '';
    @track prefIsSearching = false;
    @track prefIsSaving = false;
    _prefDebounce;

    handleShowAddPrefAgent() {
        this.showAddPrefAgent = true;
        this.prefSearchTerm = '';
        this.prefAgentResults = [];
        this.prefSelectedAgent = null;
        this.prefPriority = '';
        this.prefNotes = '';
        this._runPrefSearch();
    }
    handleClosePrefAgent() { this.showAddPrefAgent = false; }

    handlePrefSearchChange(event) {
        this.prefSearchTerm = event.target.value;
        clearTimeout(this._prefDebounce);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._prefDebounce = setTimeout(() => this._runPrefSearch(), 300);
    }

    async _runPrefSearch() {
        this.prefIsSearching = true;
        try {
            const rows = await searchEstateAgents({
                housebuilderId: this.recordId,
                searchTerm: this.prefSearchTerm
            });
            this.prefAgentResults = (rows || []).map(r => ({
                ...r,
                selectedClass: this.prefSelectedAgent && this.prefSelectedAgent.id === r.id
                    ? 'hbd-pa-result selected' : 'hbd-pa-result'
            }));
        } catch (e) {
            this._toast('Error', e.body?.message || 'Search failed', 'error');
        } finally {
            this.prefIsSearching = false;
        }
    }

    handlePrefPickAgent(event) {
        const id = event.currentTarget.dataset.id;
        const a = this.prefAgentResults.find(r => r.id === id);
        if (!a) return;
        this.prefSelectedAgent = a;
        this.prefAgentResults = this.prefAgentResults.map(r => ({
            ...r,
            selectedClass: r.id === id ? 'hbd-pa-result selected' : 'hbd-pa-result'
        }));
    }

    handlePrefPriorityChange(event) { this.prefPriority = event.target.value; }
    handlePrefNotesChange(event)    { this.prefNotes = event.target.value; }

    async handleSavePrefAgent() {
        if (!this.prefSelectedAgent) {
            this._toast('No Agent', 'Pick an estate agent from the list first.', 'warning');
            return;
        }
        this.prefIsSaving = true;
        try {
            await addPreferredAgent({
                housebuilderId: this.recordId,
                agentId:        this.prefSelectedAgent.id,
                priority:       this.prefPriority ? Number(this.prefPriority) : null,
                notes:          this.prefNotes || null
            });
            this._toast('Added', this.prefSelectedAgent.name + ' added as preferred.', 'success');
            this.showAddPrefAgent = false;
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Save failed', 'error');
        } finally {
            this.prefIsSaving = false;
        }
    }

    async handleDeletePrefAgent(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        if (!confirm('Remove this agent from the preferred list?')) return;
        try {
            await deletePreferredAgent({ preferredId: id });
            this._toast('Removed', 'Preferred agent removed.', 'success');
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Delete failed', 'error');
        }
    }

    // Edit Preferred Agent
    @track showEditPrefAgent = false;
    @track editPrefAgent = { id: null, agentName: '', priority: '', status: 'Active', notes: '' };
    @track isEditPrefSaving = false;
    get editPrefStatusOptions() {
        const statuses = ['Active', 'Paused', 'Removed'];
        return statuses.map(s => ({ label: s, value: s, selected: s === this.editPrefAgent.status }));
    }
    handleEditPrefAgent(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const row = (this.data?.preferredAgents || []).find(p => p.id === id);
        if (!row) return;
        this.editPrefAgent = {
            id: row.id,
            agentName: row.agentName,
            priority: row.priority != null ? String(Math.trunc(row.priority)) : '',
            status: row.status || 'Active',
            notes: row.notes || ''
        };
        this.showEditPrefAgent = true;
    }
    handleCloseEditPrefAgent() { this.showEditPrefAgent = false; }
    handleEditPrefPriorityChange(event) { this.editPrefAgent = { ...this.editPrefAgent, priority: event.target.value }; }
    handleEditPrefStatusChange(event)   { this.editPrefAgent = { ...this.editPrefAgent, status: event.target.value }; }
    handleEditPrefNotesChange(event)    { this.editPrefAgent = { ...this.editPrefAgent, notes: event.target.value }; }
    async handleSaveEditPrefAgent() {
        this.isEditPrefSaving = true;
        try {
            await updatePreferredAgent({
                preferredId: this.editPrefAgent.id,
                priority:    this.editPrefAgent.priority ? Number(this.editPrefAgent.priority) : null,
                status:      this.editPrefAgent.status || 'Active',
                notes:       this.editPrefAgent.notes || null
            });
            this._toast('Saved', 'Preferred agent updated.', 'success');
            this.showEditPrefAgent = false;
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Save failed', 'error');
        } finally {
            this.isEditPrefSaving = false;
        }
    }

    handlePrefAgentClick(event) {
        const id = event.currentTarget.dataset.agentid;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Account', actionName: 'view' }
        });
    }

    async handleDeleteContact(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        if (!confirm('Delete this contact?')) return;
        try {
            await deleteContact({ contactId: id });
            this._toast('Deleted', 'Contact removed.', 'success');
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed', 'error');
        }
    }

    // ──── Edit contact ────
    @track showEditContact = false;
    @track editContact = { id: null, firstName: '', lastName: '', email: '', mobile: '', phone: '', jobTitle: '' };
    @track isEditContactSaving = false;

    handleEditContact(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const c = (this.data?.contacts || []).find(x => x.id === id);
        if (!c) return;
        this.editContact = {
            id: c.id,
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            email: c.email || '',
            mobile: c.mobile || '',
            phone: c.phone || '',
            jobTitle: c.jobTitle || ''
        };
        this.showEditContact = true;
    }
    handleCloseEditContact() { this.showEditContact = false; }
    handleEditContactFieldChange(event) {
        const field = event.target.dataset.field;
        let value = event.target.value;
        if (field === 'mobile' || field === 'phone') {
            value = value.replace(/[^0-9+()\-\s]/g, '');
            if (value !== event.target.value) event.target.value = value;
        }
        this.editContact = { ...this.editContact, [field]: value };
    }
    handleEditContactKeyPress(event) {
        if (!/[0-9+()\-\s]/.test(event.key)) event.preventDefault();
    }
    async handleSaveEditContact() {
        if (!this.editContact.firstName && !this.editContact.lastName) {
            this._toast('Missing Name', 'Please enter at least a last name.', 'warning');
            return;
        }
        if (this.editContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editContact.email)) {
            this._toast('Invalid Email', 'Please enter a valid email address.', 'warning');
            return;
        }
        this.isEditContactSaving = true;
        try {
            await updateContact({
                contactId: this.editContact.id,
                firstName: this.editContact.firstName,
                lastName:  this.editContact.lastName || 'Contact',
                email:     this.editContact.email,
                mobile:    this.editContact.mobile,
                phone:     this.editContact.phone,
                jobTitle:  this.editContact.jobTitle
            });
            this._toast('Saved', 'Contact updated.', 'success');
            this.showEditContact = false;
            await refreshApex(this._wired);
        } catch (e) {
            this._toast('Error', e.body?.message || 'Save failed', 'error');
        } finally {
            this.isEditContactSaving = false;
        }
    }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
