import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getCommunications from '@salesforce/apex/NHSCommunicationsController.getCommunications';
import getOpportunityContext from '@salesforce/apex/NHSCommunicationsController.getOpportunityContext';
import sendEmailWithAttachments from '@salesforce/apex/NHSCommunicationsController.sendEmailWithAttachments';
import logCall from '@salesforce/apex/NHSCommunicationsController.logCall';
import sendSms from '@salesforce/apex/NHSCommunicationsController.sendSms';
import getEmailTemplates from '@salesforce/apex/NHSCommunicationsController.getEmailTemplates';
import getRenderedTemplate from '@salesforce/apex/NHSCommunicationsController.getRenderedTemplate';

const CHANNEL_MAP = {
    Email: 'email',
    SMS: 'sms',
    WhatsApp: 'whatsapp',
    Call: 'call',
    'Missed Call': 'missed'
};

export default class NhsCommunicationsHub extends NavigationMixin(LightningElement) {
    @api recordId;
    @track isLoading = true;
    @track communications = [];
    @track activeFilter = 'all';
    @track searchQuery = '';

    // Compose panel state (side panel, not modal)
    @track showComposePanel = false;
    @track composeType = 'email'; // email | call
    @track composeTo = '';
    @track composeCc = '';
    @track composeSubject = '';
    @track composeBody = '';
    @track composeCallType = 'Outbound';
    @track composeCallStatus = 'Completed';
    @track isSending = false;
    @track selectedTemplateId = '';
    @track attachmentFiles = [];
    @track smsTo = '';
    @track smsBody = '';

    get acceptedFormats() {
        return ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
    }
    @track selectedTemplateName = '';
    @track isLoadingTemplate = false;

    // Template library
    @track emailTemplates = [];
    @track showTemplateLibrary = false;
    @track templateSearchQuery = '';
    _templatesLoaded = false;

    // Opportunity context
    opportunityName = '';
    propertyAddress = '';
    vendor1Id = '';
    vendor1Name = '';
    vendor1Email = '';
    vendor1Mobile = '';

    _wiredCommsResult;
    _wiredCtxResult;

    @wire(getOpportunityContext, { opportunityId: '$recordId' })
    wiredCtx(result) {
        this._wiredCtxResult = result;
        if (result.data) {
            this.opportunityName = result.data.oppName || '';
            this.propertyAddress = result.data.propertyAddress || '';
            this.vendor1Id = result.data.vendor1Id || '';
            this.vendor1Name = result.data.vendor1Name || '';
            this.vendor1Email = result.data.vendor1Email || '';
            this.vendor1Mobile = result.data.vendor1Mobile || '';
        } else if (result.error) {
            console.error('Error loading opp context:', result.error);
        }
    }

    @wire(getCommunications, { opportunityId: '$recordId' })
    wiredComms(result) {
        this._wiredCommsResult = result;
        if (result.data) {
            this.communications = result.data.map((item, idx) => ({
                id: item.Id || `comm-${idx}`,
                channel: CHANNEL_MAP[item.Channel__c] || 'email',
                direction: item.Direction__c || 'Outbound',
                contactName: item.Contact_Name__c || 'Unknown',
                subject: item.Subject__c || '',
                preview: item.Preview__c || '',
                dateTime: item.DateTime__c ? new Date(item.DateTime__c) : new Date(),
                status: item.Status__c || 'Sent',
                isUnread: item.Is_Unread__c || false,
                duration: item.Duration__c || null
            }));
            this.isLoading = false;
        } else if (result.error) {
            console.error('Error loading communications:', result.error);
            this.communications = [];
            this.isLoading = false;
        }
    }

    // ── Computed: Counts ──
    get emailCount() {
        return this.communications.filter(c => c.channel === 'email').length;
    }
    get smsCount() {
        return this.communications.filter(c => c.channel === 'sms').length;
    }
    get whatsappCount() {
        return this.communications.filter(c => c.channel === 'whatsapp').length;
    }
    get callCount() {
        return this.communications.filter(c => c.channel === 'call' || c.channel === 'missed').length;
    }
    get missedCount() {
        return this.communications.filter(c => c.channel === 'missed').length;
    }
    get totalInteractions() {
        return this.communications.length;
    }

    // ── Computed: Filter Tabs ──
    get filterTabs() {
        const tabs = [
            { id: 'all', label: 'All', count: this.totalInteractions, showIcon: false },
            { id: 'email', label: 'Email', count: this.emailCount, showIcon: true, isEmail: true },
            { id: 'call', label: 'Calls', count: this.callCount, showIcon: true, isCall: true },
            { id: 'missed', label: 'Missed', count: this.missedCount, showIcon: true, isMissed: true }
        ];
        return tabs.map(t => ({
            ...t,
            cssClass: `tab${t.id === this.activeFilter ? ' active' : ''}`,
            badgeClass: `tab-badge${t.id === 'missed' ? ' badge-missed' : (t.id === this.activeFilter ? ' badge-active' : '')}`
        }));
    }

    // ── Computed: Grouped & Filtered Entries ──
    get filteredComms() {
        const query = this.searchQuery.toLowerCase();
        return this.communications.filter(c => {
            let channelMatch = true;
            if (this.activeFilter === 'missed') {
                channelMatch = c.channel === 'missed';
            } else if (this.activeFilter === 'call') {
                channelMatch = c.channel === 'call' || c.channel === 'missed';
            } else if (this.activeFilter !== 'all') {
                channelMatch = c.channel === this.activeFilter;
            }
            const searchMatch = !query ||
                (c.contactName + ' ' + c.subject + ' ' + c.preview + ' ' + c.channel).toLowerCase().includes(query);
            return channelMatch && searchMatch;
        });
    }

    get groupedEntries() {
        const filtered = this.filteredComms;
        const groups = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        filtered.forEach(c => {
            const d = c.dateTime;
            let dateKey, dateLabel;
            if (this.isSameDay(d, today)) {
                dateKey = 'today';
                dateLabel = 'Today \u2014 ' + this.formatFullDate(d);
            } else if (this.isSameDay(d, yesterday)) {
                dateKey = 'yesterday';
                dateLabel = 'Yesterday \u2014 ' + this.formatFullDate(d);
            } else {
                dateKey = this.formatDateKey(d);
                dateLabel = this.formatFullDate(d);
            }

            if (!groups[dateKey]) {
                groups[dateKey] = { dateKey, dateLabel, entries: [], sortDate: d, visible: true };
            }
            groups[dateKey].entries.push(this.buildEntryViewModel(c));
        });

        return Object.values(groups)
            .sort((a, b) => b.sortDate - a.sortDate)
            .map(g => ({
                ...g,
                entries: g.entries.sort((a, b) => b.sortDateTime - a.sortDateTime)
            }));
    }

    get showEmptyState() {
        return this.filteredComms.length === 0 && !this.isLoading;
    }

    get commsCardClass() {
        return `comms-card${this.showComposePanel ? ' comms-card-shrink' : ''}`;
    }

    // ── Compose Panel Getters ──
    get isComposeEmail() {
        return this.composeType === 'email';
    }
    get isComposeSms() {
        return this.composeType === 'sms';
    }
    get isComposeCall() {
        return this.composeType === 'call';
    }
    get composeTitle() {
        if (this.composeType === 'email') return 'Compose Email';
        if (this.composeType === 'sms') return 'Send SMS';
        return 'Log Call';
    }
    get smsCharCount() {
        return this.smsBody ? this.smsBody.length : 0;
    }
    get filteredTemplates() {
        const q = this.templateSearchQuery.toLowerCase();
        if (!q) return this.emailTemplates;
        return this.emailTemplates.filter(t =>
            (t.name || '').toLowerCase().includes(q) ||
            (t.subject || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }
    get hasTemplateSelected() {
        return !!this.selectedTemplateId;
    }
    get templateLibraryCount() {
        return this.emailTemplates.length;
    }
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

    // ── Build Entry View Model ──
    buildEntryViewModel(c) {
        const isOutbound = c.direction === 'Outbound';
        const ch = c.channel;
        return {
            id: c.id,
            visible: true,
            sortDateTime: c.dateTime.getTime(),
            isEmailChannel: ch === 'email',
            isSmsChannel: ch === 'sms',
            isWhatsappChannel: ch === 'whatsapp',
            isCallChannel: ch === 'call',
            isMissedChannel: ch === 'missed',
            channelIconClass: `ch-icon ch-${ch === 'missed' ? 'missed' : ch}-icon`,
            entryCssClass: `entry${c.isUnread ? ' unread' : ''}`,
            avatarClass: `avatar ${isOutbound ? 'avatar-outbound' : (ch === 'missed' ? 'avatar-missed' : 'avatar-inbound')}`,
            directionClass: `entry-direction ${isOutbound ? 'dir-out' : 'dir-in'}`,
            directionLabel: c.direction,
            statusPillClass: `status-pill pill-${c.status.toLowerCase().replace(' ', '-')}`,
            statusLabel: c.status,
            unreadDotClass: `unread-dot${ch === 'missed' ? ' unread-dot-missed' : ''}`,
            displayName: isOutbound ? `You \u2192 ${c.contactName}` : c.contactName,
            initials: this.getInitials(isOutbound ? 'You' : c.contactName, isOutbound),
            subject: c.subject,
            preview: c.preview,
            timeDisplay: this.formatTime(c.dateTime),
            isUnread: c.isUnread,
            hasDuration: !!c.duration,
            duration: c.duration
        };
    }

    // ── Helpers ──
    isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    formatFullDate(d) {
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    formatDateKey(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    formatTime(d) {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    getInitials(name, isOutbound) {
        if (isOutbound) return 'NH';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    // ── Event Handlers ──
    handleStatClick(event) {
        this.activeFilter = event.currentTarget.dataset.channel;
    }

    handleTabClick(event) {
        this.activeFilter = event.currentTarget.dataset.channel;
    }

    handleSearchInput(event) {
        this.searchQuery = event.target.value;
    }

    handleEntryClick(event) {
        const entryId = event.currentTarget.dataset.id;
        // Navigate to the EmailMessage or Task record
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: entryId,
                actionName: 'view'
            }
        });
    }

    // ── Compose Email ──
    async handleComposeEmail() {
        this.composeType = 'email';
        this.composeTo = this.vendor1Email || '';
        this.composeCc = '';
        this.composeSubject = '';
        this.composeBody = '';
        this.selectedTemplateId = '';
        this.attachmentFiles = [];
        this.showComposePanel = true;

        // Load templates once
        if (!this._templatesLoaded) {
            try {
                this.emailTemplates = await getEmailTemplates();
                this._templatesLoaded = true;
            } catch (e) {
                console.error('Error loading templates:', e);
            }
        }
    }

    handleCloseCompose() {
        this.showComposePanel = false;
    }

    handleOpenTemplateLibrary() {
        this.showTemplateLibrary = true;
        this.templateSearchQuery = '';
    }

    handleCloseTemplateLibrary() {
        this.showTemplateLibrary = false;
    }

    handleTemplateSearchInput(event) {
        this.templateSearchQuery = event.target.value;
    }

    handleClearTemplate() {
        this.selectedTemplateId = '';
        this.selectedTemplateName = '';
        this.composeSubject = '';
        this.composeBody = '';
    }

    async handleSelectTemplate(event) {
        const templateId = event.currentTarget.dataset.id;
        const templateName = event.currentTarget.dataset.name;
        this.selectedTemplateId = templateId;
        this.selectedTemplateName = templateName;
        this.showTemplateLibrary = false;
        this.isLoadingTemplate = true;

        try {
            const result = await getRenderedTemplate({
                templateId: templateId,
                opportunityId: this.recordId
            });
            if (result.status === 'success') {
                this.composeSubject = result.subject || '';
                this.composeBody = result.body || '';
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Template Error',
                    message: result.message,
                    variant: 'error'
                }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: e.body?.message || 'Failed to load template',
                variant: 'error'
            }));
        } finally {
            this.isLoadingTemplate = false;
        }
    }

    handleComposeToChange(event) {
        this.composeTo = event.target.value;
    }
    handleComposeCcChange(event) {
        this.composeCc = event.target.value;
    }
    handleComposeSubjectChange(event) {
        this.composeSubject = event.target.value;
    }
    handleComposeBodyChange(event) {
        this.composeBody = event.target.value;
    }
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const newFiles = uploadedFiles.map(f => ({ documentId: f.documentId, name: f.name }));
        this.attachmentFiles = [...this.attachmentFiles, ...newFiles];
    }
    handleRemoveAttachment(event) {
        const removeId = event.currentTarget.dataset.id;
        this.attachmentFiles = this.attachmentFiles.filter(f => f.documentId !== removeId);
    }
    handleCallTypeChange(event) {
        this.composeCallType = event.detail.value;
    }
    handleCallStatusChange(event) {
        this.composeCallStatus = event.detail.value;
    }

    async handleSendEmail() {
        if (!this.composeTo || !this.composeSubject) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Fields',
                message: 'Please enter a recipient and subject.',
                variant: 'warning'
            }));
            return;
        }

        this.isSending = true;
        try {
            const attachmentIds = this.attachmentFiles.map(f => f.documentId);
            const result = await sendEmailWithAttachments({
                opportunityId: this.recordId,
                toAddress: this.composeTo,
                subject: this.composeSubject,
                body: this.composeBody,
                ccAddress: this.composeCc,
                templateId: this.selectedTemplateId || null,
                contentDocumentIds: attachmentIds
            });

            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Email Sent',
                    message: `Email sent to ${this.composeTo}`,
                    variant: 'success'
                }));
                this.showComposePanel = false;
                await refreshApex(this._wiredCommsResult);
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: result.message,
                    variant: 'error'
                }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to send email',
                variant: 'error'
            }));
        } finally {
            this.isSending = false;
        }
    }

    // ── Compose SMS ──
    handleComposeSms() {
        this.composeType = 'sms';
        this.smsTo = this.vendor1Mobile || '';
        this.smsBody = '';
        this.showComposePanel = true;
    }

    handleSmsToChange(event) {
        this.smsTo = event.target.value;
    }
    handleSmsBodyChange(event) {
        this.smsBody = event.target.value;
    }

    async handleSendSms() {
        if (!this.smsTo || !this.smsBody) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Fields',
                message: 'Please enter a mobile number and message.',
                variant: 'warning'
            }));
            return;
        }

        this.isSending = true;
        try {
            const result = await sendSms({
                opportunityId: this.recordId,
                toNumber: this.smsTo,
                body: this.smsBody
            });

            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'SMS Sent',
                    message: `SMS sent to ${this.smsTo}`,
                    variant: 'success'
                }));
                this.showComposePanel = false;
                await refreshApex(this._wiredCommsResult);
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: result.message,
                    variant: 'error'
                }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to send SMS',
                variant: 'error'
            }));
        } finally {
            this.isSending = false;
        }
    }

    // ── Log Call ──
    handleLogCall() {
        this.composeType = 'call';
        this.composeSubject = '';
        this.composeBody = '';
        this.composeCallType = 'Outbound';
        this.composeCallStatus = 'Completed';
        this.showComposePanel = true;
    }

    async handleSaveCall() {
        if (!this.composeSubject) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Fields',
                message: 'Please enter a subject.',
                variant: 'warning'
            }));
            return;
        }

        this.isSending = true;
        try {
            const result = await logCall({
                opportunityId: this.recordId,
                vendorContactId: this.vendor1Id,
                subject: this.composeSubject,
                description: this.composeBody,
                callType: this.composeCallType,
                status: this.composeCallStatus
            });

            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Call Logged',
                    message: 'Call has been logged successfully.',
                    variant: 'success'
                }));
                this.showComposePanel = false;
                await refreshApex(this._wiredCommsResult);
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: result.message,
                    variant: 'error'
                }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to log call',
                variant: 'error'
            }));
        } finally {
            this.isSending = false;
        }
    }

    handleRefreshComms() {
        this.isLoading = true;
        refreshApex(this._wiredCommsResult).finally(() => {
            this.isLoading = false;
        });
    }

    handleViewAll() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Opportunity',
                relationshipApiName: 'Tasks',
                actionName: 'view'
            }
        });
    }
}
