import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getHousebuilderDetail from '@salesforce/apex/NhsHousebuilderController.getHousebuilderDetail';
import addContactToHousebuilder from '@salesforce/apex/NhsHousebuilderController.addContactToHousebuilder';
import deleteContact from '@salesforce/apex/NhsHousebuilderController.deleteContact';

export default class NhsHousebuilderDetail extends NavigationMixin(LightningElement) {
    @api recordId;
    @track data = null;
    @track activeTab = 'contacts';
    @track showAddContact = false;
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
    get contactsTabClass() { return 'hbd-tab' + (this.activeTab === 'contacts' ? ' hbd-tab-active' : ''); }
    get appsTabClass() { return 'hbd-tab' + (this.activeTab === 'apps' ? ' hbd-tab-active' : ''); }
    get commsTabClass() { return 'hbd-tab' + (this.activeTab === 'comms' ? ' hbd-tab-active' : ''); }

    get contactCount() { return this.data?.contacts?.length || 0; }
    get appCount() { return this.data?.applications?.length || 0; }
    get commsCount() { return this.data?.commsHistory?.length || 0; }

    get hasContacts() { return this.contactCount > 0; }
    get hasApps() { return this.appCount > 0; }
    get hasComms() { return this.commsCount > 0; }

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
        return (this.data?.commsHistory || []).map(c => ({
            ...c,
            dateFormatted: this._fmtDateTime(c.date),
            dirClass: 'hbd-dir ' + (c.direction === 'Inbound' ? 'hbd-dir-in' : 'hbd-dir-out')
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

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
