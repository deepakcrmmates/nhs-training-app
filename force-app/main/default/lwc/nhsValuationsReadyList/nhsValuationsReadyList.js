import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getValuationsReadyApplications from '@salesforce/apex/ValuationsReadyController.getValuationsReadyApplications';

const PAGE_SIZE = 15;

function fmtMoney(v) {
    if (v == null) return '—';
    return '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default class NhsValuationsReadyList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track currentPage = 1;
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getValuationsReadyApplications({ searchTerm: this.searchTerm })
            .then(result => {
                this.allApps = (result || []).map(app => ({
                    ...app,
                    a1InitFmt: fmtMoney(app.agent1Initial),
                    a2InitFmt: fmtMoney(app.agent2Initial),
                    a3InitFmt: fmtMoney(app.agent3Initial),
                    nhsMarketFmt: fmtMoney(app.nhsMarket),
                    nhsTargetFmt: fmtMoney(app.nhsTarget),
                    nhsForcedFmt: fmtMoney(app.nhsForced)
                }));
                this.isLoading = false;
            })
            .catch(error => { console.error('Error:', error); this.isLoading = false; });
    }

    get displayedApps() {
        const start = (this.currentPage - 1) * PAGE_SIZE;
        return this.allApps.slice(start, start + PAGE_SIZE);
    }

    get hasApps() { return this.displayedApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get totalPages() { return Math.ceil(this.totalCount / PAGE_SIZE) || 1; }
    get showPaging() { return this.totalCount > PAGE_SIZE; }
    get pageStart() { return ((this.currentPage - 1) * PAGE_SIZE) + 1; }
    get pageEnd() { return Math.min(this.currentPage * PAGE_SIZE, this.totalCount); }
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

    handleRowClick(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.currentTarget.dataset.id, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }
}
