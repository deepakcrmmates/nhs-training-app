import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFiguresReturnedApplications from '@salesforce/apex/FiguresReturnedController.getFiguresReturnedApplications';

function fmtMoney(v) {
    if (v == null) return '—';
    return '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default class NhsFiguresReturnedList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track pageSize = 10;
    @track currentPage = 1;
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getFiguresReturnedApplications({ searchTerm: this.searchTerm })
            .then(result => {
                this.allApps = (result || []).map(app => ({
                    ...app,
                    a1InitFmt: fmtMoney(app.agent1Initial),
                    a1TargetFmt: app.agent1Target != null ? fmtMoney(app.agent1Target) : '—',
                    a1BottomFmt: app.agent1Bottom != null ? fmtMoney(app.agent1Bottom) : '—',
                    a2InitFmt: fmtMoney(app.agent2Initial),
                    a2TargetFmt: app.agent2Target != null ? fmtMoney(app.agent2Target) : '—',
                    a2BottomFmt: app.agent2Bottom != null ? fmtMoney(app.agent2Bottom) : '—',
                    a3InitFmt: fmtMoney(app.agent3Initial),
                    a3TargetFmt: app.agent3Target != null ? fmtMoney(app.agent3Target) : '—',
                    a3BottomFmt: app.agent3Bottom != null ? fmtMoney(app.agent3Bottom) : '—',
                    nhsMarketFmt: fmtMoney(app.nhsMarket),
                    nhsTargetFmt: fmtMoney(app.nhsTarget),
                    nhsForcedFmt: fmtMoney(app.nhsForced)
                }));
                this.isLoading = false;
            })
            .catch(error => { console.error('Error:', error); this.isLoading = false; });
    }

    get displayedApps() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.allApps.slice(start, start + this.pageSize);
    }

    get hasApps() { return this.displayedApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get totalPages() { return Math.ceil(this.totalCount / this.pageSize) || 1; }
    get showPaging() { return this.totalCount > this.pageSize; }
    get pageStart() { return ((this.currentPage - 1) * this.pageSize) + 1; }
    get pageEnd() { return Math.min(this.currentPage * this.pageSize, this.totalCount); }
    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }
    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
    handlePageSize(event) { this.pageSize = parseInt(event.target.value, 10); this.currentPage = 1; }

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
