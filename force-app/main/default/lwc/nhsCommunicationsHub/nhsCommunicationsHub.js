import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getCommunications from '@salesforce/apex/NHSCommunicationsController.getCommunications';
import getOpportunityContext from '@salesforce/apex/NHSCommunicationsController.getOpportunityContext';
import sendEmailComplete from '@salesforce/apex/NHSCommunicationsController.sendEmailComplete';
import logCall from '@salesforce/apex/NHSCommunicationsController.logCall';
import sendSms from '@salesforce/apex/NHSCommunicationsController.sendSms';
import sendWhatsApp from '@salesforce/apex/NHSCommunicationsController.sendWhatsApp';
import getEmailTemplates from '@salesforce/apex/NHSCommunicationsController.getEmailTemplates';
import getRenderedTemplate from '@salesforce/apex/NHSCommunicationsController.getRenderedTemplate';
import getAddressBook from '@salesforce/apex/NHSCommunicationsController.getAddressBook';
import getBoxFilesForOpportunity from '@salesforce/apex/NHSCommunicationsController.getBoxFilesForOpportunity';
import sendEmailWithBoxAttachments from '@salesforce/apex/NHSCommunicationsController.sendEmailWithBoxAttachments';

export default class NhsCommunicationsHub extends LightningElement {
    @api recordId;
    @api propertyAddress = '';
    @api vendorName = '';
    @api vendorEmail = '';
    @api vendorMobile = '';
    @api houseBuilderName = '';
    @api autoCompose = false;

    // ── Loading ──
    @track isLoading = true;
    @track communications = [];

    // ── Tab state ──
    @track activeTab = 'email';

    // ── Email state ──
    @track emailFilter = 'sent'; // inbox | sent
    @track selectedEmailId = null;
    @track showComposeEmail = false;

    // ── Calls state ──
    @track callFilter = 'all';
    @track showLogCall = false;

    // ── SMS state ──
    @track smsBody = '';
    @track smsTo = '';
    @track showNewSms = false;

    // ── WhatsApp state ──
    @track waBody = '';

    // ── Compose email ──
    @track composeTo = '';
    @track composeCc = '';
    @track composeBcc = '';
    @track composeSubject = '';
    @track composeBody = '';
    @track selectedTemplateId = '';
    @track selectedTemplateName = '';
    @track isLoadingTemplate = false;
    @track emailTemplates = [];
    @track showTemplateLibrary = false;
    @track templateSearchQuery = '';
    @track attachmentFiles = [];
    @track isSending = false;

    // ── Box file picker ──
    @track showBoxPicker = false;
    @track boxFiles = [];
    @track boxSubfolders = [];
    @track boxFolderExists = false;
    @track boxLoadError = '';
    @track boxIsLoading = false;
    @track selectedBoxFileIds = [];
    @track boxSelectedFiles = []; // { id, name, size, subfolder }
    @track boxViewFolder = null;  // null = tree view, folder name = file list view
    @track boxRootName = '';

    // ── Address book ──
    @track showAddressBook = false;
    @track addressBookContacts = [];
    @track addressBookSearch = '';
    _addressBookLoaded = false;

    // ── Log call ──
    @track callSubject = '';
    @track callNotes = '';
    @track composeCallType = 'Outbound';
    @track composeCallStatus = 'Completed';

    // ── Context (loaded from Apex, falls back to @api props) ──
    opportunityName = '';
    _propertyAddress = '';
    vendor1Id = '';
    vendor1Name = '';
    vendor1Email = '';
    vendor1Mobile = '';
    vendor1Phone = '';
    vendor2Name = '';
    _houseBuilderName = '';

    _wiredCommsResult;
    _wiredCtxResult;
    _templatesLoaded = false;
    _shouldScrollSms = false;
    _shouldScrollWa = false;

    get acceptedFormats() {
        return ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
    }

    // ══════════════════════════════════════════════════════════════════
    // WIRE
    // ══════════════════════════════════════════════════════════════════

    @wire(getOpportunityContext, { opportunityId: '$recordId' })
    wiredCtx(result) {
        this._wiredCtxResult = result;
        if (result.data) {
            this.opportunityName = result.data.oppName || '';
            this._propertyAddress = result.data.propertyAddress || '';
            this.vendor1Id = result.data.vendor1Id || '';
            this.vendor1Name = result.data.vendor1Name || '';
            this.vendor1Email = result.data.vendor1Email || '';
            this.vendor1Mobile = result.data.vendor1Mobile || '';
            this.vendor1Phone = result.data.vendor1Phone || '';
            this.vendor2Name = result.data.vendor2Name || '';
            this._houseBuilderName = result.data.houseBuilderName || '';
        }
    }

    // Resolved context — prefer Apex data, fall back to @api props from parent
    get ctxPropertyAddress() { return this._propertyAddress || this.propertyAddress || ''; }
    get ctxVendorName() { return this.vendor1Name || this.vendorName || ''; }
    get ctxVendorEmail() { return this.vendor1Email || this.vendorEmail || ''; }
    get ctxVendorMobile() { return this.vendor1Mobile || this.vendorMobile || ''; }
    get ctxHouseBuilderName() { return this._houseBuilderName || this.houseBuilderName || ''; }

    @wire(getCommunications, { opportunityId: '$recordId' })
    wiredComms(result) {
        this._wiredCommsResult = result;
        if (result.data) {
            this.communications = result.data.map((item, idx) => ({
                id: item.Id || `comm-${idx}`,
                channel: this._mapChannel(item.Channel__c),
                direction: item.Direction__c || 'Outbound',
                contactName: item.Contact_Name__c || 'Unknown',
                subject: item.Subject__c || '',
                preview: item.Preview__c || '',
                body: item.Body__c || '',
                dateTime: item.DateTime__c ? new Date(item.DateTime__c) : new Date(),
                status: item.Status__c || 'Sent',
                isUnread: item.Is_Unread__c || false,
                duration: item.Duration__c || null,
                hasAttachment: item.HasAttachment || false,
                attachments: (item.Attachments || []).map(a => ({
                    id: a.id,
                    documentId: a.documentId,
                    name: a.name,
                    size: a.size,
                    sizeLabel: this._formatFileSize(a.size),
                    downloadUrl: a.documentId
                        ? '/sfc/servlet.shepherd/document/download/' + a.documentId
                        : '/servlet/servlet.FileDownload?file=' + a.id
                })),
                toAddress: item.ToAddress || '',
                fromAddress: item.FromAddress || '',
                fromName: item.FromName || '',
                ccAddress: item.CcAddress || ''
            }));

            // Auto-select first email in current filter
            if (!this.selectedEmailId) {
                const filtered = this._getEmailsByFilter();
                if (filtered.length > 0) this.selectedEmailId = filtered[0].id;
            }

            this.isLoading = false;

            // Auto-open compose if triggered from Email button on Property Details
            if (this.autoCompose && !this._autoComposeTriggered) {
                this._autoComposeTriggered = true;
                this.activeTab = 'email';
                this.handleComposeEmail();
            }
        } else if (result.error) {
            this.communications = [];
            this.isLoading = false;
        }
    }

    _mapChannel(ch) {
        const map = { 'Email': 'email', 'SMS': 'sms', 'WhatsApp': 'whatsapp', 'Call': 'call', 'Missed Call': 'missed' };
        return map[ch] || 'email';
    }

    renderedCallback() {
        if (this._shouldScrollSms) {
            this._scrollChat('.sms-chat-messages');
            this._shouldScrollSms = false;
        }
        if (this._shouldScrollWa) {
            this._scrollChat('.wa-chat-messages');
            this._shouldScrollWa = false;
        }
    }

    _scrollChat(selector) {
        const el = this.template.querySelector(selector);
        if (el) el.scrollTop = el.scrollHeight;
    }

    // ══════════════════════════════════════════════════════════════════
    // TAB NAVIGATION
    // ══════════════════════════════════════════════════════════════════

    get isEmailTab() { return this.activeTab === 'email'; }
    get isCallsTab() { return this.activeTab === 'calls'; }
    get isSmsTab() { return this.activeTab === 'sms'; }
    get isWhatsappTab() { return this.activeTab === 'whatsapp'; }

    get emailTabClass() { return 'ch-tab' + (this.activeTab === 'email' ? ' ch-tab-active' : ''); }
    get callsTabClass() { return 'ch-tab' + (this.activeTab === 'calls' ? ' ch-tab-active' : ''); }
    get smsTabClass() { return 'ch-tab' + (this.activeTab === 'sms' ? ' ch-tab-active' : ''); }
    get whatsappTabClass() { return 'ch-tab' + (this.activeTab === 'whatsapp' ? ' ch-tab-active' : ''); }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
        this.showComposeEmail = false;
        this.showLogCall = false;
        if (this.activeTab === 'sms') this._shouldScrollSms = true;
        if (this.activeTab === 'whatsapp') this._shouldScrollWa = true;
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    // ══════════════════════════════════════════════════════════════════
    // EMAIL TAB
    // ══════════════════════════════════════════════════════════════════

    get inboxBtnClass() { return 'em-filter-btn' + (this.emailFilter === 'inbox' ? ' em-filter-active' : ''); }
    get sentBtnClass() { return 'em-filter-btn' + (this.emailFilter === 'sent' ? ' em-filter-active' : ''); }

    _getEmailsByFilter() {
        const emails = this.communications.filter(c => c.channel === 'email');
        return this.emailFilter === 'inbox'
            ? emails.filter(e => e.direction === 'Inbound')
            : emails.filter(e => e.direction === 'Outbound');
    }

    get emailList() {
        return this._getEmailsByFilter().map(e => ({
            ...e,
            dateFormatted: this._fmtShortDate(e.dateTime),
            rowClass: 'em-row' + (e.id === this.selectedEmailId ? ' em-row-selected' : ''),
            dirLabel: e.direction === 'Outbound' ? 'To:' : 'From:',
            address: e.direction === 'Outbound' ? e.toAddress : e.fromAddress
        }));
    }

    get hasEmails() { return this.emailList.length > 0; }

    get selectedEmail() {
        if (!this.selectedEmailId) return null;
        const email = this.communications.find(c => c.id === this.selectedEmailId);
        if (!email) return null;
        const attachments = email.attachments || [];
        return {
            ...email,
            dateFormatted: this._fmtFullDateTime(email.dateTime),
            initials: this._initials(email.direction === 'Inbound' ? email.contactName : 'You'),
            senderName: email.direction === 'Inbound' ? (email.fromName || email.contactName) : 'You',
            senderEmail: email.direction === 'Inbound' ? email.fromAddress : email.toAddress,
            statusClass: 'em-status-badge em-status-' + email.status.toLowerCase(),
            isReceived: email.direction === 'Inbound',
            attachments,
            hasAttachmentsList: attachments.length > 0,
            attachmentCount: attachments.length,
            attachmentCountLabel: attachments.length === 1 ? '1 attachment' : attachments.length + ' attachments'
        };
    }

    get hasSelectedEmail() { return !!this.selectedEmail; }

    handleEmailFilterClick(event) {
        this.emailFilter = event.currentTarget.dataset.filter;
        this.selectedEmailId = null;
        // Auto-select first email in new filter
        const filtered = this._getEmailsByFilter();
        if (filtered.length > 0) this.selectedEmailId = filtered[0].id;
    }

    handleEmailSelect(event) {
        this.selectedEmailId = event.currentTarget.dataset.id;
    }

    handleReply() {
        const email = this.selectedEmail;
        if (!email) return;
        this.composeTo = email.fromAddress || email.toAddress;
        this.composeCc = '';
        this.composeBcc = '';
        this.composeSubject = email.subject.startsWith('Re:') ? email.subject : 'Re: ' + email.subject;
        this.composeBody = this._buildReplyBody(email);
        this.selectedTemplateId = '';
        this.selectedTemplateName = '';
        this.attachmentFiles = [];
        this.boxSelectedFiles = [];
        this.selectedBoxFileIds = [];
        this.showComposeEmail = true;
    }

    handleForward() {
        const email = this.selectedEmail;
        if (!email) return;
        this.composeTo = '';
        this.composeCc = '';
        this.composeBcc = '';
        this.composeSubject = email.subject.startsWith('Fwd:') ? email.subject : 'Fwd: ' + email.subject;
        this.composeBody = this._buildForwardBody(email);
        this.selectedTemplateId = '';
        this.selectedTemplateName = '';
        this.attachmentFiles = [];
        this.boxSelectedFiles = [];
        this.selectedBoxFileIds = [];
        this.showComposeEmail = true;
    }

    _buildReplyBody(email) {
        const senderName = email.senderName || email.contactName || email.fromAddress || '';
        const senderEmail = email.fromAddress || email.toAddress || '';
        const dateStr = this._fmtFullDateTime(email.dateTime);
        const originalBody = email.body || '';
        const senderDisplay = senderEmail ? `${senderName} &lt;${senderEmail}&gt;` : senderName;

        return `<p><br></p><p><br></p>`
            + `<hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;">`
            + `<p style="color: #666; font-size: 13px;">On ${dateStr}, <strong>${senderDisplay}</strong> wrote:</p>`
            + `<blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin-left: 0; color: #555;">`
            + originalBody
            + `</blockquote>`;
    }

    _buildForwardBody(email) {
        const senderName = email.senderName || email.contactName || email.fromAddress || '';
        const senderEmail = email.fromAddress || '';
        const toAddress = email.toAddress || '';
        const dateStr = this._fmtFullDateTime(email.dateTime);
        const subject = email.subject || '';
        const originalBody = email.body || '';

        return `<p><br></p><p><br></p>`
            + `<hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;">`
            + `<p style="color: #666; font-size: 13px;"><strong>---------- Forwarded message ----------</strong><br>`
            + `<strong>From:</strong> ${senderName} &lt;${senderEmail}&gt;<br>`
            + `<strong>Date:</strong> ${dateStr}<br>`
            + `<strong>Subject:</strong> ${subject}<br>`
            + `<strong>To:</strong> ${toAddress}</p>`
            + `<div>` + originalBody + `</div>`;
    }

    // ── Compose Email ──
    async handleComposeEmail() {
        this.composeType = 'email';
        this.composeTo = this.ctxVendorEmail || '';
        this.composeCc = '';
        this.composeBcc = '';
        this.composeSubject = '';
        this.composeBody = '';
        this.selectedTemplateId = '';
        this.selectedTemplateName = '';
        this.attachmentFiles = [];
        this.boxSelectedFiles = [];
        this.selectedBoxFileIds = [];
        this.showComposeEmail = true;

        if (!this._templatesLoaded) {
            try {
                this.emailTemplates = await getEmailTemplates();
                this._templatesLoaded = true;
            } catch (e) {
                console.error('Error loading templates:', e);
            }
        }
    }

    handleCloseCompose() { this.showComposeEmail = false; }

    handleComposeToChange(event) { this.composeTo = event.target.value; }
    handleComposeCcChange(event) { this.composeCc = event.target.value; }
    handleComposeBccChange(event) { this.composeBcc = event.target.value; }
    handleComposeSubjectChange(event) { this.composeSubject = event.target.value; }
    handleComposeBodyChange(event) { this.composeBody = event.target.value; }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const newFiles = uploadedFiles.map(f => ({ documentId: f.documentId, name: f.name }));
        this.attachmentFiles = [...this.attachmentFiles, ...newFiles];
    }

    handleRemoveAttachment(event) {
        const removeId = event.currentTarget.dataset.id;
        this.attachmentFiles = this.attachmentFiles.filter(f => f.documentId !== removeId);
    }

    // ── Box File Picker ──
    async handleOpenBoxPicker() {
        this.showBoxPicker = true;
        this.boxViewFolder = null;
        this.boxIsLoading = true;
        this.boxLoadError = '';
        try {
            const result = await getBoxFilesForOpportunity({ opportunityId: this.recordId });
            if (result.error) {
                this.boxLoadError = result.error;
                this.boxFiles = [];
                this.boxFolderExists = false;
            } else {
                this.boxFolderExists = result.folderExists;
                this.boxFiles = result.files || [];
                this.boxSubfolders = result.subfolders || [];
                this.boxRootName = result.folderName || this.ctxPropertyAddress || 'Application Folder';
            }
        } catch (e) {
            this.boxLoadError = e.body?.message || 'Failed to load Box files';
        } finally {
            this.boxIsLoading = false;
        }
    }

    handleOpenBoxSubfolder(event) {
        this.boxViewFolder = event.currentTarget.dataset.folder;
    }

    handleBoxBack() {
        this.boxViewFolder = null;
    }

    handleCloseBoxPicker() { this.showBoxPicker = false; }

    handleToggleBoxFile(event) {
        const fileId = event.currentTarget.dataset.id;
        if (this.selectedBoxFileIds.includes(fileId)) {
            this.selectedBoxFileIds = this.selectedBoxFileIds.filter(id => id !== fileId);
        } else {
            this.selectedBoxFileIds = [...this.selectedBoxFileIds, fileId];
        }
    }

    handleAddBoxFiles() {
        const selected = this.boxFiles.filter(f => this.selectedBoxFileIds.includes(f.id));
        this.boxSelectedFiles = selected.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            subfolder: f.subfolder || 'Root',
            sizeLabel: this._formatFileSize(f.size)
        }));
        this.showBoxPicker = false;
    }

    handleRemoveBoxFile(event) {
        const removeId = event.currentTarget.dataset.id;
        this.boxSelectedFiles = this.boxSelectedFiles.filter(f => f.id !== removeId);
        this.selectedBoxFileIds = this.selectedBoxFileIds.filter(id => id !== removeId);
    }

    _formatFileSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    get boxTree() {
        // Tree: list of subfolders with file counts
        const groups = {};
        (this.boxSubfolders || []).forEach(sf => { groups[sf] = 0; });
        this.boxFiles.forEach(f => {
            const key = f.subfolder || 'Root';
            if (key === 'Root') return;
            groups[key] = (groups[key] || 0) + 1;
        });

        const preferredOrder = ['Application', 'Valuations', 'Photos', 'Will Report'];
        const allNames = Object.keys(groups);
        const ordered = [
            ...preferredOrder.filter(n => allNames.includes(n)),
            ...allNames.filter(n => !preferredOrder.includes(n)).sort()
        ];

        return ordered.map(name => ({
            name,
            key: 'bt-' + name,
            fileCount: groups[name],
            countLabel: groups[name] === 1 ? '1 file' : groups[name] + ' files'
        }));
    }

    get boxRootFiles() {
        return this.boxFiles
            .filter(f => !f.subfolder || f.subfolder === 'Root')
            .map(f => ({
                ...f,
                sizeLabel: this._formatFileSize(f.size),
                isSelected: this.selectedBoxFileIds.includes(f.id),
                rowClass: 'box-file-row' + (this.selectedBoxFileIds.includes(f.id) ? ' box-file-row-selected' : '')
            }));
    }

    get boxCurrentFolderFiles() {
        if (!this.boxViewFolder) return [];
        return this.boxFiles
            .filter(f => f.subfolder === this.boxViewFolder)
            .map(f => ({
                ...f,
                sizeLabel: this._formatFileSize(f.size),
                isSelected: this.selectedBoxFileIds.includes(f.id),
                rowClass: 'box-file-row' + (this.selectedBoxFileIds.includes(f.id) ? ' box-file-row-selected' : '')
            }));
    }

    get isBoxTreeView() { return this.boxViewFolder === null; }
    get isBoxFolderView() { return this.boxViewFolder !== null; }
    get boxCurrentFolderName() { return this.boxViewFolder || ''; }
    get boxCurrentFolderEmpty() { return this.boxCurrentFolderFiles.length === 0; }
    get hasBoxRootFiles() { return this.boxRootFiles.length > 0; }
    get hasBoxTree() { return this.boxTree.length > 0 || this.boxRootFiles.length > 0; }
    get hasSelectedBoxFiles() { return this.selectedBoxFileIds.length > 0; }
    get boxSelectedCount() { return this.selectedBoxFileIds.length; }
    get hasBoxAttachments() { return this.boxSelectedFiles.length > 0; }

    // Template library
    handleOpenTemplateLibrary() { this.showTemplateLibrary = true; this.templateSearchQuery = ''; }
    handleCloseTemplateLibrary() { this.showTemplateLibrary = false; }
    handleTemplateSearchInput(event) { this.templateSearchQuery = event.target.value; }

    handleClearTemplate() {
        this.selectedTemplateId = '';
        this.selectedTemplateName = '';
        this.composeSubject = '';
        this.composeBody = '';
    }

    get filteredTemplates() {
        const q = this.templateSearchQuery.toLowerCase();
        if (!q) return this.emailTemplates;
        return this.emailTemplates.filter(t =>
            (t.name || '').toLowerCase().includes(q) ||
            (t.subject || '').toLowerCase().includes(q)
        );
    }

    get hasTemplateSelected() { return !!this.selectedTemplateId; }
    get templateLibraryCount() { return this.emailTemplates.length; }

    // ── Address Book ──
    async handleOpenAddressBook() {
        this.showAddressBook = true;
        this.addressBookSearch = '';
        if (!this._addressBookLoaded) {
            try {
                const results = await getAddressBook({ opportunityId: this.recordId });
                this.addressBookContacts = results.map((c, i) => ({
                    key: 'ab-' + i,
                    role: c.role,
                    name: c.name,
                    email: c.email,
                    category: c.category,
                    initials: this._initials(c.name || c.role),
                    avatarClass: 'ab-avatar ab-avatar-' + c.category
                }));
                this._addressBookLoaded = true;
            } catch (e) {
                this._toast('Error', e.body?.message || 'Failed to load address book', 'error');
            }
        }
    }

    handleCloseAddressBook() { this.showAddressBook = false; }

    handleAddressBookSearch(event) { this.addressBookSearch = event.target.value; }

    get filteredAddressBook() {
        const q = this.addressBookSearch.toLowerCase();
        if (!q) return this.addressBookContacts;
        return this.addressBookContacts.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.role || '').toLowerCase().includes(q)
        );
    }

    get hasAddressBookContacts() { return this.filteredAddressBook.length > 0; }

    handleSelectContact(event) {
        const email = event.currentTarget.dataset.email;
        // Append to To field (comma-separated if already has value)
        if (this.composeTo) {
            const existing = this.composeTo.split(',').map(e => e.trim().toLowerCase());
            if (!existing.includes(email.toLowerCase())) {
                this.composeTo = this.composeTo + ', ' + email;
            }
        } else {
            this.composeTo = email;
        }
        this.showAddressBook = false;
    }

    handleSelectContactCc(event) {
        const email = event.currentTarget.dataset.email;
        if (this.composeCc) {
            const existing = this.composeCc.split(',').map(e => e.trim().toLowerCase());
            if (!existing.includes(email.toLowerCase())) {
                this.composeCc = this.composeCc + ', ' + email;
            }
        } else {
            this.composeCc = email;
        }
        this.showAddressBook = false;
    }

    async handleSelectTemplate(event) {
        const templateId = event.currentTarget.dataset.id;
        const templateName = event.currentTarget.dataset.name;
        this.selectedTemplateId = templateId;
        this.selectedTemplateName = templateName;
        this.showTemplateLibrary = false;
        this.isLoadingTemplate = true;

        try {
            const result = await getRenderedTemplate({ templateId, opportunityId: this.recordId });
            if (result.status === 'success') {
                this.composeSubject = result.subject || '';
                this.composeBody = result.body || '';
            } else {
                this._toast('Template Error', result.message, 'error');
            }
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed to load template', 'error');
        } finally {
            this.isLoadingTemplate = false;
        }
    }

    async handleSendEmail() {
        if (!this.composeTo || !this.composeSubject) {
            this._toast('Missing Fields', 'Please enter a recipient and subject.', 'warning');
            return;
        }

        this.isSending = true;
        try {
            const attachmentIds = this.attachmentFiles.map(f => f.documentId);
            const boxIds = this.boxSelectedFiles.map(f => f.id);
            const result = await sendEmailWithBoxAttachments({
                opportunityId: this.recordId,
                toAddress: this.composeTo,
                subject: this.composeSubject,
                body: this.composeBody,
                ccAddress: this.composeCc,
                bccAddress: this.composeBcc,
                templateId: this.selectedTemplateId || null,
                contentDocumentIds: attachmentIds,
                boxFileIds: boxIds
            });

            if (result.status === 'success') {
                this._toast('Email Sent', `Email sent to ${this.composeTo}`, 'success');
                this.showComposeEmail = false;
                await refreshApex(this._wiredCommsResult);
            } else {
                this._toast('Error', result.message, 'error');
            }
        } catch (error) {
            this._toast('Error', error.body?.message || 'Failed to send email', 'error');
        } finally {
            this.isSending = false;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // CALLS TAB
    // ══════════════════════════════════════════════════════════════════

    get callFilterAllClass() { return 'cl-filter-btn' + (this.callFilter === 'all' ? ' cl-filter-active' : ''); }
    get callFilterInClass() { return 'cl-filter-btn cl-filter-in' + (this.callFilter === 'incoming' ? ' cl-filter-active' : ''); }
    get callFilterOutClass() { return 'cl-filter-btn cl-filter-out' + (this.callFilter === 'outgoing' ? ' cl-filter-active' : ''); }
    get callFilterMissedClass() { return 'cl-filter-btn cl-filter-missed' + (this.callFilter === 'missed' ? ' cl-filter-active' : ''); }

    get callList() {
        const calls = this.communications.filter(c => c.channel === 'call' || c.channel === 'missed');
        let filtered;
        switch (this.callFilter) {
            case 'incoming': filtered = calls.filter(c => c.direction === 'Inbound' && c.channel !== 'missed'); break;
            case 'outgoing': filtered = calls.filter(c => c.direction === 'Outbound'); break;
            case 'missed': filtered = calls.filter(c => c.channel === 'missed'); break;
            default: filtered = calls;
        }
        return filtered.map(c => ({
            ...c,
            dateFormatted: this._fmtFullDateTime(c.dateTime),
            dirLabel: c.channel === 'missed' ? 'Missed' : c.direction,
            dirClass: 'cl-dir cl-dir-' + (c.channel === 'missed' ? 'missed' : c.direction.toLowerCase()),
            avatarClass: 'cl-avatar cl-avatar-' + (c.channel === 'missed' ? 'missed' : c.direction.toLowerCase()),
            isMissed: c.channel === 'missed',
            isIncoming: c.direction === 'Inbound' && c.channel !== 'missed',
            isOutgoing: c.direction === 'Outbound',
            phone: this.ctxVendorMobile || '',
            hasDuration: !!c.duration,
            hasNotes: !!c.preview
        }));
    }

    get hasCalls() { return this.callList.length > 0; }

    handleCallFilterClick(event) {
        this.callFilter = event.currentTarget.dataset.filter;
    }

    get callNowHref() {
        return this.ctxVendorMobile ? 'tel:' + this.ctxVendorMobile : '#';
    }

    // Log call
    handleOpenLogCall() {
        this.callSubject = '';
        this.callNotes = '';
        this.composeCallType = 'Outbound';
        this.composeCallStatus = 'Completed';
        this.showLogCall = true;
    }

    handleCloseLogCall() { this.showLogCall = false; }
    handleCallSubjectChange(event) { this.callSubject = event.target.value; }
    handleCallNotesChange(event) { this.callNotes = event.target.value; }
    handleCallTypeChange(event) { this.composeCallType = event.detail.value; }
    handleCallStatusChange(event) { this.composeCallStatus = event.detail.value; }

    get callTypeOptions() {
        return [
            { label: 'Outbound', value: 'Outbound' },
            { label: 'Inbound', value: 'Inbound' }
        ];
    }

    get callStatusOptions() {
        return [
            { label: 'Completed', value: 'Completed' },
            { label: 'Not Reached', value: 'Not Reached' }
        ];
    }

    async handleSaveCall() {
        if (!this.callSubject) {
            this._toast('Missing Fields', 'Please enter a subject.', 'warning');
            return;
        }

        this.isSending = true;
        try {
            const result = await logCall({
                opportunityId: this.recordId,
                vendorContactId: this.vendor1Id,
                subject: this.callSubject,
                description: this.callNotes,
                callType: this.composeCallType,
                status: this.composeCallStatus
            });

            if (result.status === 'success') {
                this._toast('Call Logged', 'Call has been logged successfully.', 'success');
                this.showLogCall = false;
                await refreshApex(this._wiredCommsResult);
            } else {
                this._toast('Error', result.message, 'error');
            }
        } catch (error) {
            this._toast('Error', error.body?.message || 'Failed to log call', 'error');
        } finally {
            this.isSending = false;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // SMS TAB
    // ══════════════════════════════════════════════════════════════════

    get smsMessages() {
        return this.communications
            .filter(c => c.channel === 'sms')
            .sort((a, b) => a.dateTime - b.dateTime);
    }

    get smsConversation() {
        return this._groupChatMessages(this.smsMessages);
    }

    get hasSmsMessages() { return this.smsMessages.length > 0; }

    get smsContactPhone() { return this.ctxVendorMobile || ''; }

    get smsLastPreview() {
        const msgs = this.smsMessages;
        if (msgs.length === 0) return '';
        const last = msgs[msgs.length - 1];
        return last.preview || last.body || '';
    }

    get smsLastDate() {
        const msgs = this.smsMessages;
        if (msgs.length === 0) return '';
        return this._fmtShortDate(msgs[msgs.length - 1].dateTime);
    }

    handleSmsBodyChange(event) { this.smsBody = event.target.value; }

    async handleSendSms() {
        const body = this.smsBody.trim();
        if (!body) return;

        const toNumber = this.ctxVendorMobile;
        if (!toNumber) {
            this._toast('No Mobile', 'Vendor mobile number not available.', 'warning');
            return;
        }

        this.isSending = true;
        try {
            const result = await sendSms({
                opportunityId: this.recordId,
                toNumber: toNumber,
                body: body
            });

            if (result.status === 'success') {
                this.smsBody = '';
                this._shouldScrollSms = true;
                await refreshApex(this._wiredCommsResult);
            } else {
                this._toast('Error', result.message, 'error');
            }
        } catch (error) {
            this._toast('Error', error.body?.message || 'Failed to send SMS', 'error');
        } finally {
            this.isSending = false;
        }
    }

    handleNewSms() {
        this.showNewSms = true;
        this.smsTo = '';
        this.smsBody = '';
    }

    handleNewSmsToChange(event) { this.smsTo = event.target.value; }

    // ══════════════════════════════════════════════════════════════════
    // WHATSAPP TAB
    // ══════════════════════════════════════════════════════════════════

    get waMessages() {
        return this.communications
            .filter(c => c.channel === 'whatsapp')
            .sort((a, b) => a.dateTime - b.dateTime);
    }

    get waConversation() {
        return this._groupChatMessages(this.waMessages);
    }

    get hasWaMessages() { return this.waMessages.length > 0; }

    handleWaBodyChange(event) { this.waBody = event.target.value; }

    async handleSendWhatsApp() {
        const body = this.waBody.trim();
        if (!body) return;

        const toNumber = this.ctxVendorMobile;
        if (!toNumber) {
            this._toast('No Mobile', 'Vendor mobile number not available.', 'warning');
            return;
        }

        this.isSending = true;
        try {
            const result = await sendWhatsApp({
                opportunityId: this.recordId,
                toNumber: toNumber,
                body: body
            });

            if (result.status === 'success') {
                this.waBody = '';
                this._shouldScrollWa = true;
                await refreshApex(this._wiredCommsResult);
            } else {
                this._toast('Error', result.message, 'error');
            }
        } catch (error) {
            this._toast('Error', error.body?.message || 'Failed to send WhatsApp', 'error');
        } finally {
            this.isSending = false;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════

    _groupChatMessages(messages) {
        const groups = [];
        let currentDateKey = '';

        messages.forEach(m => {
            const dateStr = this._fmtChatDate(m.dateTime);
            if (dateStr !== currentDateKey) {
                currentDateKey = dateStr;
                groups.push({ isDate: true, isMessage: false, key: 'date-' + m.id, label: dateStr });
            }
            groups.push({
                isDate: false,
                isMessage: true,
                key: m.id,
                id: m.id,
                body: m.body || m.preview || '',
                isOutbound: m.direction === 'Outbound',
                isInbound: m.direction !== 'Outbound',
                timeFormatted: this._fmtTime(m.dateTime),
                fullDateTime: this._fmtFullDateTime(m.dateTime),
                bubbleClass: 'chat-bubble' + (m.direction === 'Outbound' ? ' chat-bubble-out' : ' chat-bubble-in'),
                status: m.status
            });
        });

        return groups;
    }

    _fmtShortDate(d) {
        const day = d.getDate();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins}`;
    }

    _fmtFullDateTime(d) {
        const day = d.getDate();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins}`;
    }

    _fmtChatDate(d) {
        const day = d.getDate();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    _fmtTime(d) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${mins}`;
    }

    _initials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    get vendorInitials() { return this._initials(this.ctxVendorName); }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    handleRefreshComms() {
        this.isLoading = true;
        refreshApex(this._wiredCommsResult).finally(() => { this.isLoading = false; });
    }
}
