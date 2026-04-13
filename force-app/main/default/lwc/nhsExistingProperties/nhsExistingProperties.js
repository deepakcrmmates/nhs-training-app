import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProperties from '@salesforce/apex/AccountListController.getProperties';

const EPC_COLORS = {
    'A': 'epc-a', 'B': 'epc-b', 'C': 'epc-c',
    'D': 'epc-d', 'E': 'epc-e', 'F': 'epc-f', 'G': 'epc-g'
};

export default class NhsExistingProperties extends NavigationMixin(LightningElement) {
    @track records = [];
    @track isLoading = false;
    @track errorMessage = '';
    @track searchTerm = '';
    @track sortField = 'CreatedDate';
    @track sortDirection = 'desc';
    @track pageNumber = 1;
    @track totalCount = 0;
    @track totalPages = 1;
    @track pageSize = 25;

    _searchTimeout;

    get hasRecords() { return this.records.length > 0; }
    get isPrevDisabled() { return this.pageNumber <= 1; }
    get isNextDisabled() { return this.pageNumber >= this.totalPages; }

    get nameSortIcon() { return this.sortField === 'Name' ? (this.sortDirection === 'asc' ? '\u25B2' : '\u25BC') : ''; }
    get citySortIcon() { return this.sortField === 'Address__City__s' ? (this.sortDirection === 'asc' ? '\u25B2' : '\u25BC') : ''; }
    get bedsSortIcon() { return this.sortField === 'Number_Of_Bedrooms__c' ? (this.sortDirection === 'asc' ? '\u25B2' : '\u25BC') : ''; }

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const result = await getProperties({
                searchTerm: this.searchTerm,
                sortField: this.sortField,
                sortDirection: this.sortDirection,
                pageSize: this.pageSize,
                pageNumber: this.pageNumber
            });

            if (result.status === 'success') {
                this.records = result.records.map(p => ({
                    ...p,
                    url: '/' + p.id,
                    epcClass: 'al-epc ' + (EPC_COLORS[p.epcRating] || ''),
                    floorAreaDisplay: p.floorArea ? p.floorArea + ' m\u00B2' : '--',
                    bedroomsDisplay: p.bedrooms ? p.bedrooms + ' bed' : '--',
                    councilTaxDisplay: p.councilTax ? 'Band ' + p.councilTax : '--'
                }));
                this.totalCount = result.totalCount;
                this.totalPages = result.totalPages;
                this.pageNumber = result.pageNumber;
            } else {
                this.errorMessage = result.message;
            }
        } catch (e) {
            this.errorMessage = e.body?.message || 'Failed to load properties.';
        }

        this.isLoading = false;
    }

    handleSearchChange(event) {
        const val = event.target.value;
        clearTimeout(this._searchTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._searchTimeout = setTimeout(() => {
            this.searchTerm = val;
            this.pageNumber = 1;
            this.loadData();
        }, 400);
    }

    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.pageNumber = 1;
        this.loadData();
    }

    handlePrevPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadData();
        }
    }

    handleNextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadData();
        }
    }

    handleRowClick(event) {
        const recId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: recId, objectApiName: 'NHS_Property__c', actionName: 'view' }
        });
    }

    handleLinkClick(event) {
        event.stopPropagation();
    }
}
