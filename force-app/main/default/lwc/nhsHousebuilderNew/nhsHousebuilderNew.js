import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import createHousebuilder from '@salesforce/apex/NhsHousebuilderController.createHousebuilder';

export default class NhsHousebuilderNew extends NavigationMixin(LightningElement) {
    @track account = {
        name: '',
        email: '',
        phone: '',
        website: '',
        street: '',
        city: '',
        postcode: '',
        country: 'United Kingdom'
    };

    @track contacts = [this._blankContact(0)];
    @track logoFile = null;        // { name, base64, previewUrl }
    @track isSaving = false;

    _blankContact(idx) {
        return {
            key: 'c-' + idx + '-' + Date.now(),
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            jobTitle: ''
        };
    }

    handleAccountChange(event) {
        const field = event.target.dataset.field;
        this.account = { ...this.account, [field]: event.target.value };
    }

    handleContactChange(event) {
        const key = event.target.dataset.key;
        const field = event.target.dataset.field;
        this.contacts = this.contacts.map(c => c.key === key ? { ...c, [field]: event.target.value } : c);
    }

    handleAddContact() {
        this.contacts = [...this.contacts, this._blankContact(this.contacts.length)];
    }

    handleRemoveContact(event) {
        const key = event.currentTarget.dataset.key;
        this.contacts = this.contacts.filter(c => c.key !== key);
        if (this.contacts.length === 0) this.contacts = [this._blankContact(0)];
    }

    async handleLogoChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            this._toast('File too large', 'Logo must be under 4MB.', 'warning');
            return;
        }
        try {
            const base64 = await this._fileToBase64(file);
            this.logoFile = {
                name: file.name,
                base64,
                previewUrl: URL.createObjectURL(file),
                sizeLabel: this._formatSize(file.size)
            };
        } catch (e) {
            this._toast('Error', 'Failed to read file', 'error');
        }
    }

    handleRemoveLogo() {
        if (this.logoFile?.previewUrl) URL.revokeObjectURL(this.logoFile.previewUrl);
        this.logoFile = null;
        const input = this.template.querySelector('input[type="file"]');
        if (input) input.value = '';
    }

    get hasLogo() { return !!this.logoFile; }

    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const r = reader.result;
                resolve(r.substring(r.indexOf(',') + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    async handleSave() {
        if (!this.account.name) {
            this._toast('Missing Name', 'Please enter a company name.', 'warning');
            return;
        }
        this.isSaving = true;
        try {
            const validContacts = this.contacts.filter(c => c.firstName || c.lastName).map(c => ({
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                mobile: c.mobile,
                jobTitle: c.jobTitle
            }));
            const newId = await createHousebuilder({
                accountDataJson: JSON.stringify(this.account),
                contactsJson: JSON.stringify(validContacts),
                logoBase64: this.logoFile?.base64 || null,
                logoFileName: this.logoFile?.name || null
            });
            this._toast('Created', 'Housebuilder saved successfully.', 'success');
            this.dispatchEvent(new CustomEvent('created', { detail: { recordId: newId } }));
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: { recordId: newId, objectApiName: 'Account', actionName: 'view' }
            });
        } catch (e) {
            this._toast('Error', e.body?.message || e.message || 'Save failed', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancelled'));
    }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
