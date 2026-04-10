import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getConnectionStatus from '@salesforce/apex/BoxOAuthController.getConnectionStatus';
import getAuthorizationUrl from '@salesforce/apex/BoxOAuthController.getAuthorizationUrl';
import exchangeCodeForToken from '@salesforce/apex/BoxOAuthController.exchangeCodeForToken';
import testConnection from '@salesforce/apex/BoxOAuthController.testConnection';
import browseFolderById from '@salesforce/apex/BoxOAuthController.browseFolderById';
import createFolder from '@salesforce/apex/BoxOAuthController.createFolder';
import uploadFile from '@salesforce/apex/BoxOAuthController.uploadFile';
import getDownloadUrl from '@salesforce/apex/BoxOAuthController.getDownloadUrl';

export default class NhsBoxSetup extends LightningElement {
    @track connectionStatus = {};
    @track isLoading = true;
    @track authCode = '';
    @track showCodeInput = false;
    @track exchangeMessage = '';
    @track exchangeStatus = '';
    @track isExchanging = false;
    @track isTesting = false;
    @track testResult = null;
    @track folderItems = [];
    @track isBrowsing = false;
    @track breadcrumbs = [];
    @track currentFolderName = '';
    @track showBrowser = false;
    @track showNewFolderInput = false;
    @track newFolderName = '';
    @track isCreatingFolder = false;
    @track showNhsFolderInput = false;
    @track nhsFolderName = '';
    @track isCreatingNhsFolder = false;
    @track nhsFolderStatus = [];
    @track isUploading = false;
    @track uploadProgress = [];
    @track showUploadProgress = false;

    connectedCallback() {
        this.checkStatus();
    }

    async checkStatus() {
        this.isLoading = true;
        try {
            this.connectionStatus = await getConnectionStatus();
        } catch (error) {
            this.connectionStatus = { status: 'error', message: error.body?.message || 'Failed to check status' };
        }
        this.isLoading = false;
    }

    get statusMessage() { return this.connectionStatus.message || ''; }
    get isConnected() { return this.connectionStatus.status === 'connected'; }
    get statusBadgeClass() {
        const s = this.connectionStatus.status;
        if (s === 'connected') return 'status-badge connected';
        if (s === 'error' || s === 'token_invalid') return 'status-badge error';
        return 'status-badge warning';
    }
    get checkClientId() { return this.connectionStatus.hasClientId ? '✓ Client ID' : '✗ Client ID'; }
    get checkClientSecret() { return this.connectionStatus.hasClientSecret ? '✓ Client Secret' : '✗ Client Secret'; }
    get checkRefreshToken() { return this.connectionStatus.hasRefreshToken ? '✓ Refresh Token' : '✗ Refresh Token'; }
    get clientIdClass() { return 'check-item ' + (this.connectionStatus.hasClientId ? 'ok' : 'missing'); }
    get clientSecretClass() { return 'check-item ' + (this.connectionStatus.hasClientSecret ? 'ok' : 'missing'); }
    get refreshTokenClass() { return 'check-item ' + (this.connectionStatus.hasRefreshToken ? 'ok' : 'missing'); }
    get hasFolderItems() { return this.folderItems.length > 0; }
    get showTestSection() { return this.isConnected; }
    get hasBreadcrumbs() { return this.breadcrumbs.length > 0; }
    get isEmpty() { return this.showBrowser && !this.isBrowsing && this.folderItems.length === 0; }

    async handleConnect() {
        try {
            const url = await getAuthorizationUrl();
            window.open(url, 'BoxAuth', 'width=600,height=700,scrollbars=yes');
            this.showCodeInput = true;
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to start auth', variant: 'error' }));
        }
    }

    handleCodeChange(event) {
        this.authCode = event.target.value;
    }

    async handleExchangeCode() {
        if (!this.authCode) return;
        this.isExchanging = true;
        this.exchangeMessage = '';
        try {
            const result = await exchangeCodeForToken({ authCode: this.authCode });
            if (result.status === 'success') {
                this.exchangeStatus = 'success';
                this.exchangeMessage = 'Connected to Box successfully. Refresh token has been saved automatically.';
                // eslint-disable-next-line @lwc/lwc/no-async-operation
                setTimeout(() => { this.checkStatus(); }, 1000);
            } else {
                this.exchangeStatus = 'error';
                this.exchangeMessage = result.message;
            }
        } catch (error) {
            this.exchangeStatus = 'error';
            this.exchangeMessage = error.body?.message || 'Exchange failed';
        }
        this.isExchanging = false;
    }

    async handleTestConnection() {
        this.isTesting = true;
        this.testResult = null;
        this.folderItems = [];
        this.showBrowser = false;
        try {
            const result = await testConnection();
            this.testResult = result;
            if (result.status === 'success') {
                this.showBrowser = true;
                this.currentFolderName = 'Root';
                this.breadcrumbs = [{ id: result.rootFolderId || '0', name: 'Root' }];
                this.folderItems = this.mapEntries(result.entries || []);
            }
        } catch (error) {
            this.testResult = { status: 'error', message: error.body?.message || 'Test failed' };
        }
        this.isTesting = false;
    }

    async handleFolderClick(event) {
        const folderId = event.currentTarget.dataset.id;
        const folderName = event.currentTarget.dataset.name;
        await this.navigateToFolder(folderId, folderName);
    }

    async handleBreadcrumbClick(event) {
        const folderId = event.currentTarget.dataset.id;
        const folderName = event.currentTarget.dataset.name;
        // Trim breadcrumbs to this level
        const idx = this.breadcrumbs.findIndex(b => b.id === folderId);
        if (idx >= 0) {
            this.breadcrumbs = this.breadcrumbs.slice(0, idx + 1);
        }
        await this.navigateToFolder(folderId, folderName, true);
    }

    async navigateToFolder(folderId, folderName, skipBreadcrumb) {
        this.isBrowsing = true;
        this.folderItems = [];
        try {
            const result = await browseFolderById({ folderId });
            if (result.status === 'success') {
                this.currentFolderName = folderName;
                if (!skipBreadcrumb) {
                    this.breadcrumbs = [...this.breadcrumbs, { id: folderId, name: folderName }];
                }
                this.folderItems = this.mapEntries(result.entries || []);
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to browse folder', variant: 'error' }));
        }
        this.isBrowsing = false;
    }

    mapEntries(entries) {
        return entries.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            isFolder: e.type === 'folder',
            isFile: e.type === 'file',
            size: this.formatSize(e.size),
            modified: this.formatDate(e.modified_at),
            typeLabel: e.type === 'folder' ? 'Folder' : 'File'
        }));
    }

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

    get currentFolderId() {
        return this.breadcrumbs.length > 0 ? this.breadcrumbs[this.breadcrumbs.length - 1].id : '0';
    }

    handleShowNewFolder() {
        this.showNewFolderInput = true;
        this.newFolderName = '';
    }

    handleCancelNewFolder() {
        this.showNewFolderInput = false;
        this.newFolderName = '';
    }

    handleNewFolderNameChange(event) {
        this.newFolderName = event.target.value;
    }

    async handleCreateFolder() {
        if (!this.newFolderName.trim()) return;
        this.isCreatingFolder = true;
        try {
            const result = await createFolder({ parentFolderId: this.currentFolderId, folderName: this.newFolderName.trim() });
            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: result.message, variant: 'success' }));
                this.showNewFolderInput = false;
                this.newFolderName = '';
                // Refresh current folder
                const currentCrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
                await this.navigateToFolder(currentCrumb.id, currentCrumb.name, true);
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to create folder', variant: 'error' }));
        }
        this.isCreatingFolder = false;
    }

    handleUploadClick() {
        this.template.querySelector('.file-upload-input').click();
    }

    async handleFileSelected(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        this.isUploading = true;
        this.showUploadProgress = true;
        this.uploadProgress = Array.from(files).map((f, i) => ({
            id: 'file-' + i,
            name: f.name,
            size: this.formatSize(f.size),
            status: 'pending',
            statusLabel: 'Waiting...',
            statusClass: 'upload-status status-pending'
        }));

        let uploaded = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Update status to uploading
            this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                ? { ...p, status: 'uploading', statusLabel: 'Uploading...', statusClass: 'upload-status status-uploading' }
                : p
            );

            try {
                const base64 = await this.readFileAsBase64(file);
                const result = await uploadFile({
                    folderId: this.currentFolderId,
                    fileName: file.name,
                    base64Content: base64
                });
                if (result.status === 'success') {
                    uploaded++;
                    this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                        ? { ...p, status: 'success', statusLabel: 'Uploaded', statusClass: 'upload-status status-success' }
                        : p
                    );
                } else {
                    this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                        ? { ...p, status: 'error', statusLabel: 'Failed', statusClass: 'upload-status status-error' }
                        : p
                    );
                }
            } catch (error) {
                this.uploadProgress = this.uploadProgress.map((p, idx) => idx === i
                    ? { ...p, status: 'error', statusLabel: 'Error', statusClass: 'upload-status status-error' }
                    : p
                );
            }
        }

        // Reset
        this.isUploading = false;
        try { event.target.value = ''; } catch(e) { /* ignore */ }

        // Refresh folder after 3 seconds, then hide progress
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(async () => {
            this.showUploadProgress = false;
            this.uploadProgress = [];
            const currentCrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
            await this.navigateToFolder(currentCrumb.id, currentCrumb.name, true);
        }, 3000);
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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

    // ── NHS Folder Structure ──
    handleShowNhsFolder() {
        this.showNhsFolderInput = true;
        this.nhsFolderName = '';
        this.nhsFolderStatus = [];
    }

    handleCancelNhsFolder() {
        this.showNhsFolderInput = false;
        this.nhsFolderName = '';
        this.nhsFolderStatus = [];
    }

    handleNhsFolderNameChange(event) {
        this.nhsFolderName = event.target.value;
    }

    get hasNhsFolderStatus() {
        return this.nhsFolderStatus.length > 0;
    }

    async handleCreateNhsFolder() {
        if (!this.nhsFolderName.trim()) return;
        this.isCreatingNhsFolder = true;
        const propertyName = this.nhsFolderName.trim();
        const subfolders = ['Application', 'Valuations', 'Photos', 'Will Report'];

        this.nhsFolderStatus = [
            { id: 'main', name: propertyName, status: 'creating', statusLabel: 'Creating...', statusClass: 'upload-status status-uploading' },
            ...subfolders.map(s => ({ id: s, name: s, status: 'pending', statusLabel: 'Waiting...', statusClass: 'upload-status status-pending' }))
        ];

        try {
            // Create main folder
            const mainResult = await createFolder({ parentFolderId: this.currentFolderId, folderName: propertyName });
            if (mainResult.status !== 'success') {
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === 'main'
                    ? { ...s, status: 'error', statusLabel: 'Failed', statusClass: 'upload-status status-error' }
                    : s
                );
                this.isCreatingNhsFolder = false;
                return;
            }

            const mainFolderId = mainResult.folderId;
            this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === 'main'
                ? { ...s, status: 'success', statusLabel: 'Created', statusClass: 'upload-status status-success' }
                : s
            );

            // Create subfolders
            for (const sub of subfolders) {
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === sub
                    ? { ...s, status: 'creating', statusLabel: 'Creating...', statusClass: 'upload-status status-uploading' }
                    : s
                );

                const subResult = await createFolder({ parentFolderId: mainFolderId, folderName: sub });
                this.nhsFolderStatus = this.nhsFolderStatus.map(s => s.id === sub
                    ? {
                        ...s,
                        status: subResult.status === 'success' ? 'success' : 'error',
                        statusLabel: subResult.status === 'success' ? 'Created' : 'Failed',
                        statusClass: subResult.status === 'success' ? 'upload-status status-success' : 'upload-status status-error'
                    }
                    : s
                );
            }

            this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: 'NHS folder structure created for ' + propertyName, variant: 'success' }));

            // Refresh after 2 seconds
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(async () => {
                this.showNhsFolderInput = false;
                this.nhsFolderStatus = [];
                const currentCrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
                await this.navigateToFolder(currentCrumb.id, currentCrumb.name, true);
            }, 2000);
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to create folder structure', variant: 'error' }));
        }
        this.isCreatingNhsFolder = false;
    }

    get exchangeMsgClass() {
        return 'exchange-msg ' + this.exchangeStatus;
    }
    get testResultClass() {
        if (!this.testResult) return '';
        return 'exchange-msg ' + this.testResult.status;
    }
    get testResultMessage() {
        if (!this.testResult) return '';
        if (this.testResult.status === 'success') {
            return 'Connection verified. Root Folder ID: ' + (this.testResult.rootFolderId || '0') + ' | Items: ' + (this.testResult.totalCount || 0);
        }
        return this.testResult.message;
    }
}
