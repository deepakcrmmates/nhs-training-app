import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFinalChecks from '@salesforce/apex/FinalChecksController.getFinalChecks';
import saveFinalChecks from '@salesforce/apex/FinalChecksController.saveFinalChecks';

const CHECK_ITEMS = [
    { key: 'agent1Report',     label: 'Agent 1 Report',       group: 'reports' },
    { key: 'agent2Report',     label: 'Agent 2 Report',       group: 'reports' },
    { key: 'agent3Report',     label: 'Agent 3 Report',       group: 'reports' },
    { key: 'nhsPreWillReport', label: 'NHS Pre-Will Report',   group: 'will' },
    { key: 'willReport',       label: 'Will Report',           group: 'will' },
    { key: 'photosValidated',  label: 'Photos Validated',      group: 'validation' },
    { key: 'addressValidated', label: 'Address Validated',     group: 'validation' },
];

const TOTAL = CHECK_ITEMS.length;

export default class NhsFinalChecksPanel extends LightningElement {
    @api recordId;
    @track checks = {};
    @track isLoaded = false;
    @track isSaving = false;
    @track isDirty = false;

    connectedCallback() { this.loadData(); }

    loadData() {
        getFinalChecks({ opportunityId: this.recordId })
            .then(result => {
                this.checks = { ...result };
                this.isLoaded = true;
                this.isDirty = false;
            })
            .catch(err => {
                console.error('Failed to load final checks:', err);
                this.isLoaded = true;
            });
    }

    get agentReports() { return this._buildGroup('reports'); }
    get willReports()  { return this._buildGroup('will'); }
    get validations()  { return this._buildGroup('validation'); }

    _buildGroup(group) {
        return CHECK_ITEMS
            .filter(i => i.group === group)
            .map(i => ({
                key: i.key,
                label: i.label,
                checked: this.checks[i.key] || false,
                boxClass: (this.checks[i.key]) ? 'fc-box checked' : 'fc-box',
                labelClass: (this.checks[i.key]) ? 'fc-label done' : 'fc-label'
            }));
    }

    get checkedCount() {
        return Object.values(this.checks).filter(v => v === true).length;
    }
    get progressPercent() { return Math.round((this.checkedCount / TOTAL) * 100); }
    get progressBarStyle() { return `width:${this.progressPercent}%`; }
    get progressText() { return `${this.checkedCount} of ${TOTAL} complete`; }
    get allComplete() { return this.checkedCount === TOTAL; }
    get barClass() { return this.allComplete ? 'bar fill complete' : 'bar fill'; }
    get summaryClass() { return this.allComplete ? 'fc-summary complete' : 'fc-summary'; }
    get summaryText() { return this.allComplete ? 'All checks passed' : `${TOTAL - this.checkedCount} remaining`; }

    handleToggle(e) {
        const key = e.currentTarget.dataset.key;
        this.checks = { ...this.checks, [key]: !this.checks[key] };
        this.isDirty = true;
    }

    async handleSave() {
        this.isSaving = true;
        try {
            await saveFinalChecks({ opportunityId: this.recordId, checks: this.checks });
            this.isDirty = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Saved',
                message: 'Final checks updated successfully.',
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to save.',
                variant: 'error'
            }));
        } finally {
            this.isSaving = false;
        }
    }
}
