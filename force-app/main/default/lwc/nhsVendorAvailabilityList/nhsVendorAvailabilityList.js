import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import getVendorAvailabilityApplications from '@salesforce/apex/VendorAvailabilityListController.getVendorAvailabilityApplications';

const PAGE_SIZE = 15;

function fmtDate(d) {
    if (!d) return 'Not set';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function todayStr() {
    const d = new Date(); d.setHours(0,0,0,0);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function tomorrowStr() {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default class NhsVendorAvailabilityList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track activeFilter = 'all';
    @track currentPage = 1;
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getVendorAvailabilityApplications({ searchTerm: this.searchTerm })
            .then(result => {
                const today = todayStr();
                const tmr = tomorrowStr();
                this.allApps = (result || []).map(app => {
                    const na = app.nextAvailDate || null;
                    let availBadgeClass = 'avail-badge avail-tbc';
                    let urgency = '';
                    if (na) {
                        if (na === today) { availBadgeClass = 'avail-badge avail-urgent'; urgency = 'Today'; }
                        else if (na === tmr) { availBadgeClass = 'avail-badge avail-gold'; urgency = 'Tomorrow'; }
                        else { availBadgeClass = 'avail-badge avail-normal'; }
                    }
                    return {
                        ...app,
                        nextAvailDisplay: na ? fmtDate(na) : 'Not set',
                        availBadgeClass,
                        availUrgency: urgency,
                        slotLabel: app.slotsCount > 0 ? app.slotsCount + ' slot' + (app.slotsCount !== 1 ? 's' : '') : 'None',
                        slotBadgeClass: app.slotsCount > 0 ? 'slot-badge has-slots' : 'slot-badge no-slots'
                    };
                });
                this.isLoading = false;
            })
            .catch(error => { console.error('Error:', error); this.isLoading = false; });
    }

    get filteredApps() {
        let apps = this.allApps;
        if (this.activeFilter === 'has') apps = apps.filter(a => a.slotsCount > 0);
        else if (this.activeFilter === 'none') apps = apps.filter(a => a.slotsCount === 0);
        return apps;
    }

    get displayedApps() {
        const start = (this.currentPage - 1) * PAGE_SIZE;
        return this.filteredApps.slice(start, start + PAGE_SIZE);
    }

    get hasApps() { return this.displayedApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get hasAvailCount() { return this.allApps.filter(a => a.slotsCount > 0).length; }
    get noAvailCount() { return this.allApps.filter(a => a.slotsCount === 0).length; }
    get filteredCount() { return this.filteredApps.length; }

    get filterAllClass() { return 'ftag' + (this.activeFilter === 'all' ? ' active' : ''); }
    get filterHasClass() { return 'ftag' + (this.activeFilter === 'has' ? ' active' : ''); }
    get filterNoneClass() { return 'ftag' + (this.activeFilter === 'none' ? ' active' : ''); }

    get totalPages() { return Math.ceil(this.filteredCount / PAGE_SIZE) || 1; }
    get showPaging() { return this.filteredCount > PAGE_SIZE; }
    get pageStart() { return ((this.currentPage - 1) * PAGE_SIZE) + 1; }
    get pageEnd() { return Math.min(this.currentPage * PAGE_SIZE, this.filteredCount); }
    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }
    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

    handleRefresh() { this.loadData(); }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
        clearTimeout(this._t);
        this._t = setTimeout(() => this.loadData(), 400);
    }

    handleFilter(event) {
        this.activeFilter = event.currentTarget.dataset.filter;
        this.currentPage = 1;
    }

    handleRowClick(event) {
        const id = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }

    async handleMoveNext(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const app = this.allApps.find(a => a.id === id);
        if (!app || app.slotsCount === 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Cannot Move',
                message: 'At least 1 vendor availability slot is required before moving to Book Agents.',
                variant: 'error'
            }));
            return;
        }
        try {
            await updateRecord({ fields: { Id: id, NHS_Process__c: 'Agents Booked' } });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Stage Updated',
                message: 'Application moved to Book Agents.',
                variant: 'success'
            }));
            this.loadData();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to update stage.',
                variant: 'error'
            }));
        }
    }
}
