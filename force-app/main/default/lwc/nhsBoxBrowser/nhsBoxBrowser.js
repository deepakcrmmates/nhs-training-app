import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import browseFolderById from '@salesforce/apex/BoxOAuthController.browseFolderById';
import createFolder from '@salesforce/apex/BoxOAuthController.createFolder';
import uploadFile from '@salesforce/apex/BoxOAuthController.uploadFile';
import getDownloadUrl from '@salesforce/apex/BoxOAuthController.getDownloadUrl';
import getConnectionStatus from '@salesforce/apex/BoxOAuthController.getConnectionStatus';
import ensureAccessToken from '@salesforce/apex/BoxOAuthController.ensureAccessToken';
import getBoxFolderForOpportunity from '@salesforce/apex/BoxOAuthController.getBoxFolderForOpportunity';
import saveBoxFolderId from '@salesforce/apex/BoxOAuthController.saveBoxFolderId';

export default class NhsBoxBrowser extends LightningElement {
    _propertyAddress = '';
    @api
    get propertyAddress() { return this._propertyAddress; }
    set propertyAddress(value) {
        const prev = this._propertyAddress;
        this._propertyAddress = value;
        // Reload when propertyAddress is set for the first time (wire data arrived)
        if (value && !prev && this._connected) {
            this.loadFolder();
        }
    }
    @api recordId;
    _connected = false;
    @track isLoading = true;
    @track folderExists = false;
    @track rootFolderId = '';
    @track files = [];
    @track subfolders = [];
    @track activeTab = 'all';
    @track isCreating = false;
    @track subfolderDetails = []; // {id, name, fileCount}
    @track showNewFolder = false;
    @track newFolderName = '';
    @track isCreatingCustomFolder = false;
    @track nhsFolderStatus = [];
    @track showNhsProgress = false;

    // Upload
    @track isUploading = false;
    @track uploadProgress = [];
    @track showUploadProgress = false;

    // Folder navigation
    @track browseMode = false;
    @track browseFolderItems = [];
    @track breadcrumbs = [];
    @track isBrowsing = false;

    connectedCallback() {
        this._connected = true;
        this.loadFolder();
    }

    async loadFolder() {
        if (!this.propertyAddress) {
            this.isLoading = false;
            return;
        }
        this.isLoading = true;
        this.browseMode = false;
        this.files = [];
        this.subfolders = [];
        this.subfolderDetails = [];

        try {
            // Check if Box is configured
            const status = await getConnectionStatus();
            if (status.status !== 'connected') {
                this.isLoading = false;
                return;
            }

            // Ensure access token is fresh (callout + DML in its own transaction)
            const tokenResult = await ensureAccessToken();
            if (tokenResult.status !== 'success') {
                this.isLoading = false;
                return;
            }

            // Check if Opportunity has a stored Box Folder ID
            let propertyFolderId = null;
            if (this.recordId) {
                const oppData = await getBoxFolderForOpportunity({ opportunityId: this.recordId });
                if (oppData.boxFolderId) {
                    propertyFolderId = oppData.boxFolderId;
                }
            }

            // If no stored folder ID, search by name
            if (!propertyFolderId) {
                const rootResult = await browseFolderById({ folderId: status.rootFolderId || '0' });
                if (rootResult.status !== 'success') {
                    this.isLoading = false;
                    return;
                }

                const entries = rootResult.entries || [];
                const propertyFolder = entries.find(e => e.type === 'folder' && e.name === this.propertyAddress);

                if (!propertyFolder) {
                    this.folderExists = false;
                    this.isLoading = false;
                    return;
                }

                propertyFolderId = propertyFolder.id;

                // Save the folder ID to the Opportunity for future lookups
                if (this.recordId) {
                    try { await saveBoxFolderId({ opportunityId: this.recordId, folderId: propertyFolderId }); } catch(e) { /* ignore */ }
                }
            }

            this.folderExists = true;
            this.rootFolderId = propertyFolderId;

            // Browse inside the property folder
            const propResult = await browseFolderById({ folderId: propertyFolderId });
            if (propResult.status === 'success') {
                const propEntries = propResult.entries || [];
                const folders = propEntries.filter(e => e.type === 'folder');
                this.subfolders = folders.map(e => e.name);

                // Build subfolder details with file counts
                for (const folder of folders) {
                    const subResult = await browseFolderById({ folderId: folder.id });
                    const fileCount = subResult.status === 'success'
                        ? (subResult.entries || []).filter(e => e.type === 'file').length
                        : 0;
                    this.subfolderDetails.push({ id: folder.id, name: folder.name, fileCount });
                }
            }
        } catch (error) {
            // Silently handle - Box may not be configured
        }
        this.isLoading = false;
    }

    handleRefresh() {
        if (this.browseMode && this.breadcrumbs.length > 0) {
            const current = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.navigateToFolder(current.id, current.name, true);
        } else {
            this.loadFolder();
        }
    }

    // ── NHS Folder Structure ──
    async handleCreateFolder() {
        if (!this.propertyAddress) return;
        this.isCreating = true;
        this.showNhsProgress = true;
        const subs = ['Application', 'Valuations', 'Photos', 'Will Report'];

        this.nhsFolderStatus = [
            { id: 'main', name: this.propertyAddress, status: 'creating', statusLabel: 'Creating...', statusClass: 'nhs-status status-uploading', isChild: false, rowClass: 'tree-row tree-parent', nameClass: 'tree-name tree-name-parent', iconColor: '#4A6B5E' },
            ...subs.map(s => ({ id: s, name: s, status: 'pending', statusLabel: 'Waiting...', statusClass: 'nhs-status status-pending', isChild: true, rowClass: 'tree-row tree-child', nameClass: 'tree-name', iconColor: '#0061D5' }))
        ];

        try {
            // Ensure access token in separate transaction (callout + DML)
            await ensureAccessToken();

            // Get root folder ID (no callout — just reads config)
            const status = await getConnectionStatus();
            const rootId = status.rootFolderId || '0';

            // Create main folder (separate transaction)
            const mainResult = await createFolder({ parentFolderId: rootId, folderName: this.propertyAddress });
            if (mainResult.status !== 'success') {
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === 'main'
                    ? { ...s, status: 'error', statusLabel: 'Failed: ' + (mainResult.message || ''), statusClass: 'nhs-status status-error' }
                    : s
                );
                this.isCreating = false;
                return;
            }

            const mainFolderId = mainResult.folderId;

            // Save folder ID to Opportunity permanently
            if (this.recordId) {
                try { await saveBoxFolderId({ opportunityId: this.recordId, folderId: mainFolderId }); } catch(e) { /* ignore */ }
            }

            this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === 'main'
                ? { ...s, status: 'success', statusLabel: 'Created', statusClass: 'nhs-status status-success' }
                : s
            );

            // Create each subfolder (each = separate transaction)
            for (const sub of subs) {
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === sub
                    ? { ...s, status: 'creating', statusLabel: 'Creating...', statusClass: 'nhs-status status-uploading' }
                    : s
                );
                const subResult = await createFolder({ parentFolderId: mainFolderId, folderName: sub });
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === sub
                    ? {
                        ...s,
                        status: subResult.status === 'success' ? 'success' : 'error',
                        statusLabel: subResult.status === 'success' ? 'Created' : 'Failed',
                        statusClass: subResult.status === 'success' ? 'nhs-status status-success' : 'nhs-status status-error'
                    }
                    : s
                );
            }

            this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: 'NHS folder structure created', variant: 'success' }));

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                this.showNhsProgress = false;
                this.nhsFolderStatus = [];
                this.loadFolder();
            }, 2000);
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to create folders', variant: 'error' }));
        }
        this.isCreating = false;
    }

    // ── Tab Navigation ──
    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
        this.browseMode = false;
    }

    // ── Folder Navigation ──
    handleFolderClick(event) {
        const folderId = event.currentTarget.dataset.id;
        const folderName = event.currentTarget.dataset.name;
        this.browseMode = true;
        this.breadcrumbs = [{ id: this.rootFolderId, name: this.propertyAddress }, { id: folderId, name: folderName }];
        this.navigateToFolder(folderId, folderName, true);
    }

    handleSubfolderClick(event) {
        const folderId = event.currentTarget.dataset.id;
        const folderName = event.currentTarget.dataset.name;
        this.breadcrumbs = [...this.breadcrumbs, { id: folderId, name: folderName }];
        this.navigateToFolder(folderId, folderName, true);
    }

    handleBreadcrumbClick(event) {
        const folderId = event.currentTarget.dataset.id;
        const folderName = event.currentTarget.dataset.name;
        if (folderId === this.rootFolderId) {
            this.browseMode = false;
            this.breadcrumbs = [];
            return;
        }
        const idx = this.breadcrumbs.findIndex(b => b.id === folderId);
        if (idx >= 0) {
            this.breadcrumbs = this.breadcrumbs.slice(0, idx + 1);
        }
        this.navigateToFolder(folderId, folderName, true);
    }

    async navigateToFolder(folderId, folderName, skipBreadcrumb) {
        this.isBrowsing = true;
        this.browseFolderItems = [];
        try {
            const result = await browseFolderById({ folderId });
            if (result.status === 'success') {
                this.browseFolderItems = (result.entries || []).map(e => ({
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    isFolder: e.type === 'folder',
                    isFile: e.type === 'file',
                    size: this.formatSize(e.size),
                    modified: this.formatDate(e.modified_at)
                }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to browse', variant: 'error' }));
        }
        this.isBrowsing = false;
    }

    // ── Upload ──
    handleUploadClick() {
        this.template.querySelector('.file-upload-input').click();
    }

    async handleFileSelected(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const targetFolderId = this.browseMode && this.breadcrumbs.length > 0
            ? this.breadcrumbs[this.breadcrumbs.length - 1].id
            : this.rootFolderId;

        this.isUploading = true;
        this.showUploadProgress = true;
        this.uploadProgress = Array.from(files).map((f, i) => ({
            id: 'file-' + i, name: f.name, size: this.formatSize(f.size),
            status: 'pending', statusLabel: 'Waiting...', statusClass: 'nhs-status status-pending'
        }));

        for (let i = 0; i < files.length; i++) {
            this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                ? { ...p, status: 'uploading', statusLabel: 'Uploading...', statusClass: 'nhs-status status-uploading' }
                : p
            );
            try {
                const base64 = await this.readFileAsBase64(files[i]);
                const result = await uploadFile({ folderId: targetFolderId, fileName: files[i].name, base64Content: base64 });
                this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                    ? {
                        ...p,
                        status: result.status === 'success' ? 'success' : 'error',
                        statusLabel: result.status === 'success' ? 'Uploaded' : 'Failed',
                        statusClass: result.status === 'success' ? 'nhs-status status-success' : 'nhs-status status-error'
                    }
                    : p
                );
            } catch (error) {
                this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                    ? { ...p, status: 'error', statusLabel: 'Error', statusClass: 'nhs-status status-error' }
                    : p
                );
            }
        }

        this.isUploading = false;
        try { event.target.value = ''; } catch(e) { /* ignore */ }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.showUploadProgress = false;
            this.uploadProgress = [];
            this.handleRefresh();
        }, 3000);
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ── Download ──
    async handleDownload(event) {
        const fileId = event.currentTarget.dataset.id;
        const fileName = event.currentTarget.dataset.name;
        try {
            const url = await getDownloadUrl({ fileId });
            if (url) {
                window.open(url, '_blank');
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Could not get download link for ' + fileName, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Download failed', variant: 'error' }));
        }
    }

    // ── Getters ──
    handleShowNewFolder() {
        this.showNewFolder = true;
        this.newFolderName = '';
    }

    handleCancelNewFolder() {
        this.showNewFolder = false;
        this.newFolderName = '';
    }

    handleNewFolderNameChange(event) {
        this.newFolderName = event.target.value;
    }

    async handleCreateCustomFolder() {
        if (!this.newFolderName.trim()) return;
        this.isCreatingCustomFolder = true;
        try {
            // Determine parent: if browsing inside a subfolder, create there; otherwise in root property folder
            const parentId = this.browseMode && this.breadcrumbs.length > 0
                ? this.breadcrumbs[this.breadcrumbs.length - 1].id
                : this.rootFolderId;

            const result = await createFolder({ parentFolderId: parentId, folderName: this.newFolderName.trim() });
            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: 'Folder "' + this.newFolderName.trim() + '" created', variant: 'success' }));
                this.showNewFolder = false;
                this.newFolderName = '';
                // Refresh
                if (this.browseMode) {
                    const current = this.breadcrumbs[this.breadcrumbs.length - 1];
                    await this.navigateToFolder(current.id, current.name, true);
                } else {
                    await this.loadFolder();
                }
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to create folder', variant: 'error' }));
        }
        this.isCreatingCustomFolder = false;
    }

    get folderPath() { return this.propertyAddress || ''; }
    get subfolderList() { return this.subfolderDetails; }
    get hasSubfolders() { return this.subfolderDetails.length > 0; }
    get filteredFiles() {
        if (this.activeTab === 'all') return this.files;
        return this.files.filter(f => f.subfolder === this.activeTab);
    }
    get hasFilteredFiles() { return this.filteredFiles.length > 0; }
    get hasBrowseItems() { return this.browseFolderItems.length > 0; }
    get hasNhsProgress() { return this.nhsFolderStatus.length > 0; }
    get hasBreadcrumbs() { return this.breadcrumbs.length > 0; }
    get showToolbar() { return this.folderExists && !this.isLoading; }
    get browseFolders() { return this.browseFolderItems.filter(i => i.isFolder); }
    get browseFiles() { return this.browseFolderItems.filter(i => i.isFile); }

    get tabAllClass() { return 'db-tab' + (this.activeTab === 'all' && !this.browseMode ? ' active' : ''); }
    get tabAppClass() { return 'db-tab' + (this.activeTab === 'Application' && !this.browseMode ? ' active' : ''); }
    get tabValClass() { return 'db-tab' + (this.activeTab === 'Valuations' && !this.browseMode ? ' active' : ''); }
    get tabPhotosClass() { return 'db-tab' + (this.activeTab === 'Photos' && !this.browseMode ? ' active' : ''); }
    get tabWillClass() { return 'db-tab' + (this.activeTab === 'Will Report' && !this.browseMode ? ' active' : ''); }

    // ── Helpers ──
    formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return d.getDate().toString().padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    }
}
