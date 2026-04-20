import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAccounts from '@salesforce/apex/AccountListController.getAccounts';
import getContacts from '@salesforce/apex/AccountListController.getContacts';

export default class NhsAccountList extends NavigationMixin(LightningElement) {
    @api recordTypeDeveloperName = '';
    @api title = '';
    @api subtitle = '';
    @api recordTypeLabel = '';
    @api objectType = 'Account'; // 'Account' or 'Contact'

    @track accounts = [];
    @track isLoading = false;
    @track errorMessage = '';
    @track searchTerm = '';
    @track sortField = 'Name';
    @track sortDirection = 'asc';
    @track pageNumber = 1;
    @track totalCount = 0;
    @track totalPages = 1;
    @track pageSize = 25;

    _searchTimeout;

    get hasAccounts() { return this.accounts.length > 0; }
    get isAgents() { return this.recordTypeDeveloperName === 'Estate_Agents'; }
    get isContact() { return this.objectType === 'Contact'; }
    get searchPlaceholder() { return 'Search ' + this.recordTypeLabel + 's by name, city or postcode...'; }
    get isPrevDisabled() { return this.pageNumber <= 1; }
    get isNextDisabled() { return this.pageNumber >= this.totalPages; }
    get nameSortIcon() { return this.sortField === 'Name' ? (this.sortDirection === 'asc' ? '\u25B2' : '\u25BC') : ''; }
    get citySortIcon() {
        const field = this.isContact ? 'MailingCity' : 'BillingCity';
        return this.sortField === field ? (this.sortDirection === 'asc' ? '\u25B2' : '\u25BC') : '';
    }
    get citySortField() { return this.isContact ? 'MailingCity' : 'BillingCity'; }

    connectedCallback() {
        this.loadAccounts();
    }

    async loadAccounts() {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const apexMethod = this.isContact ? getContacts : getAccounts;
            const result = await apexMethod({
                recordTypeDeveloperName: this.recordTypeDeveloperName,
                searchTerm: this.searchTerm,
                sortField: this.sortField,
                sortDirection: this.sortDirection,
                pageSize: this.pageSize,
                pageNumber: this.pageNumber
            });

            if (result.status === 'success') {
                this.accounts = result.accounts.map(a => ({
                    ...a,
                    url: '/' + a.id
                }));
                this.totalCount = result.totalCount;
                this.totalPages = result.totalPages;
                this.pageNumber = result.pageNumber;
            } else {
                this.errorMessage = result.message;
            }
        } catch (e) {
            this.errorMessage = e.body?.message || 'Failed to load records.';
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
            this.loadAccounts();
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
        this.loadAccounts();
    }

    handlePrevPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadAccounts();
        }
    }

    handleNextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadAccounts();
        }
    }

    handleRowClick(event) {
        const recId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: recId, objectApiName: this.objectType, actionName: 'view' }
        });
    }

    handleLinkClick(event) {
        event.stopPropagation();
    }

    handleNewAccount() {
        if (this.recordTypeDeveloperName === 'House_Builder') {
            this.dispatchEvent(new CustomEvent('newhousebuilder'));
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: this.objectType, actionName: 'new' },
            state: { defaultFieldValues: 'RecordTypeId=' + this.recordTypeDeveloperName }
        });
    }
}
