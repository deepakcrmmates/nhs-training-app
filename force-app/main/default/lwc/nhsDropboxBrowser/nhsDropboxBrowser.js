import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getDropboxFolder from '@salesforce/apex/DropboxBrowserController.getDropboxFolder';
import createPropertyFolder from '@salesforce/apex/DropboxBrowserController.createPropertyFolder';

function formatBytes(bytes) {
    if (!bytes || bytes === '0' || bytes === 'null') return '';
    const b = parseInt(bytes, 10);
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default class NhsDropboxBrowser extends LightningElement {
    @api propertyAddress = '';
    @track files = [];
    @track subfolders = [];
    @track folderExists = false;
    @track activeTab = 'all';
    isLoading = true;

    connectedCallback() { this.loadFolder(); }

    get folderPath() {
        return this.propertyAddress
            ? 'Accounts / ' + this.propertyAddress
            : 'No property address';
    }

    loadFolder() {
        if (!this.propertyAddress) { this.isLoading = false; return; }
        this.isLoading = true;
        getDropboxFolder({ propertyAddress: this.propertyAddress })
            .then(result => {
                this.folderExists = result.folderExists;
                this.subfolders = result.subfolders || [];
                this.files = (result.files || []).map(f => ({
                    ...f,
                    sizeDisplay: formatBytes(f.size),
                    modifiedDisplay: formatDate(f.modified)
                }));
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Dropbox error:', error);
                this.isLoading = false;
            });
    }

    get filteredFiles() {
        if (this.activeTab === 'all') return this.files;
        return this.files.filter(f => f.subfolder === this.activeTab);
    }

    get hasFilteredFiles() { return this.filteredFiles.length > 0; }

    get tabAllClass() { return 'db-tab' + (this.activeTab === 'all' ? ' active' : ''); }
    get tabAppClass() { return 'db-tab' + (this.activeTab === 'Application' ? ' active' : ''); }
    get tabValClass() { return 'db-tab' + (this.activeTab === 'Valuation' ? ' active' : ''); }

    handleTabClick(event) { this.activeTab = event.currentTarget.dataset.tab; }
    handleRefresh() { this.loadFolder(); }

    async handleCreateFolder() {
        this.isLoading = true;
        try {
            await createPropertyFolder({ propertyAddress: this.propertyAddress });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Folder Created',
                message: 'Dropbox folder with Application and Valuation subfolders created.',
                variant: 'success'
            }));
            this.loadFolder();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to create folder.',
                variant: 'error'
            }));
            this.isLoading = false;
        }
    }
}
