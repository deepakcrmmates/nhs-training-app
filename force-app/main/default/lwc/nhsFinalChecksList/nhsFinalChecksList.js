import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import NHS_PROCESS_FIELD from '@salesforce/schema/Opportunity.NHS_Process__c';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import getFinalChecksApplications from '@salesforce/apex/FinalChecksController.getFinalChecksApplications';
import saveFinalChecks from '@salesforce/apex/FinalChecksController.saveFinalChecks';

const CHECK_FIELDS = [
    { key: 'agent1Report',     label: 'Agent 1 Report',      group: 'Agent Reports' },
    { key: 'agent2Report',     label: 'Agent 2 Report',      group: 'Agent Reports' },
    { key: 'agent3Report',     label: 'Agent 3 Report',      group: 'Agent Reports' },
    { key: 'nhsPreWillReport', label: 'NHS Pre-Will Report',  group: 'Will Reports' },
    { key: 'willReport',       label: 'Will Report',          group: 'Will Reports' },
    { key: 'photosValidated',  label: 'Photos Validated',     group: 'Validation' },
    { key: 'addressValidated', label: 'Address Validated',    group: 'Validation' },
];

const TOTAL_CHECKS = CHECK_FIELDS.length;

export default class NhsFinalChecksList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track expandedId = null;
    @track editState = {};
    @track savingId = null;
    @track toastMsg = '';
    @track toastType = '';
    @track toastVisible = false;
    @track movingId = null;
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getFinalChecksApplications({ searchTerm: this.searchTerm })
            .then(result => {
                this.allApps = (result || []).map(app => ({
                    ...app,
                    progressPercent: Math.round((app.checkedCount / TOTAL_CHECKS) * 100),
                    progressLabel: `${app.checkedCount}/${TOTAL_CHECKS}`,
                    allChecked: app.checkedCount === TOTAL_CHECKS,
                    progressStyle: `width:${Math.round((app.checkedCount / TOTAL_CHECKS) * 100)}%`,
                    progressClass: app.checkedCount === TOTAL_CHECKS ? 'progress-bar complete' : 'progress-bar',
                    statusLabel: app.checkedCount === TOTAL_CHECKS ? 'Complete' : 'In Progress',
                    statusClass: app.checkedCount === TOTAL_CHECKS ? 'status-badge complete' : 'status-badge pending',
                    canMoveNext: app.checkedCount === TOTAL_CHECKS && app.builderApproved === true
                }));
                this.isLoading = false;
            })
            .catch(err => { console.error(err); this.isLoading = false; });
    }

    get hasApps() { return this.allApps.length > 0; }
    get totalCount() { return this.allApps.length; }

    handleSearch(e) {
        this.searchTerm = e.target.value;
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this.loadData(), 300);
    }

    handleRefresh() { this.expandedId = null; this.loadData(); }

    handleRowClick(e) {
        const id = e.currentTarget.dataset.id;
        if (this.expandedId === id) {
            this.expandedId = null;
        } else {
            this.expandedId = id;
            const app = this.allApps.find(a => a.id === id);
            if (app) {
                this.editState = {};
                CHECK_FIELDS.forEach(f => { this.editState[f.key] = app[f.key]; });
            }
        }
    }

    handleNavigate(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: id, actionName: 'view' } });
    }

    get expandedApp() {
        if (!this.expandedId) return null;
        return this.allApps.find(a => a.id === this.expandedId) || null;
    }

    get checkItems() {
        return CHECK_FIELDS.map(f => ({
            key: f.key,
            label: f.label,
            group: f.group,
            checked: this.editState[f.key] || false,
            iconClass: (this.editState[f.key]) ? 'check-icon checked' : 'check-icon'
        }));
    }

    get agentReports() { return this.checkItems.filter(c => c.group === 'Agent Reports'); }
    get willReports()  { return this.checkItems.filter(c => c.group === 'Will Reports'); }
    get validations()  { return this.checkItems.filter(c => c.group === 'Validation'); }

    get editCheckedCount() {
        return Object.values(this.editState).filter(v => v === true).length;
    }
    get editProgressPercent() { return Math.round((this.editCheckedCount / TOTAL_CHECKS) * 100); }
    get editProgressLabel() { return `${this.editCheckedCount}/${TOTAL_CHECKS} checked`; }
    get editAllChecked() { return this.editCheckedCount === TOTAL_CHECKS; }
    get editProgressClass() { return this.editAllChecked ? 'progress-bar complete' : 'progress-bar'; }
    get editProgressBarStyle() { return `width:${this.editProgressPercent}%`; }

    get isSaving() { return this.savingId !== null; }

    handleCheck(e) {
        const key = e.currentTarget.dataset.key;
        this.editState = { ...this.editState, [key]: !this.editState[key] };
    }

    handleSave() {
        if (!this.expandedId) return;
        this.savingId = this.expandedId;
        saveFinalChecks({ opportunityId: this.expandedId, checks: this.editState })
            .then(() => {
                this.showToast('Final checks saved successfully', 'success');
                this.expandedId = null;
                this.savingId = null;
                this.loadData();
            })
            .catch(err => {
                this.showToast(err.body?.message || 'Failed to save', 'error');
                this.savingId = null;
            });
    }

    handleCancel() {
        this.expandedId = null;
    }

    async handleMoveNext(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this.movingId = id;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = id;
        fields[NHS_PROCESS_FIELD.fieldApiName] = 'Vendor Discussions';
        try {
            await updateRecord({ fields });
            this.showToast('Moved to Vendor Discussions', 'success');
            this.loadData();
        } catch (err) {
            let msg = 'Failed to move.';
            if (err.body?.output?.errors?.length) {
                msg = err.body.output.errors.map(e => e.message).join('; ');
            } else if (err.body?.message) {
                msg = err.body.message;
            }
            this.showToast(msg, 'error');
        } finally { this.movingId = null; }
    }

    showToast(msg, type) {
        this.toastMsg = msg;
        this.toastType = type;
        this.toastVisible = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.toastVisible = false; }, 3000);
    }

    get toastClass() {
        return `fc-toast ${this.toastType}${this.toastVisible ? ' show' : ''}`;
    }
}
