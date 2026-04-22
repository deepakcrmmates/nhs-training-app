import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFiguresReturnedApplications from '@salesforce/apex/FiguresReturnedController.getFiguresReturnedApplications';

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
                this.allApps = result || [];
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
