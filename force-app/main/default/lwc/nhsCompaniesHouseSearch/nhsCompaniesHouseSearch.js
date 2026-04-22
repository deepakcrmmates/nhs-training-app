import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchCompanies from '@salesforce/apex/NhsCompaniesHouseController.searchCompanies';
import getCompany from '@salesforce/apex/NhsCompaniesHouseController.getCompany';

const SIC_GROUPS = [
    { label: 'Any category',     value: '' },
    { label: 'Housebuilder',     value: 'Housebuilder' },
    { label: 'Estate Agents',    value: 'Estate Agents' },
    { label: 'Solicitors',       value: 'Solicitors' },
    { label: 'Accountants',      value: 'Accountants' },
    { label: 'Mortgage Advisor', value: 'Mortgage Advisor' }
];

export default class NhsCompaniesHouseSearch extends LightningElement {
    @api defaultGroup = '';
    @api buttonLabel = 'Find on Companies House';

    @track showModal = false;
    @track query = '';
    @track sicGroup = '';
    @track isSearching = false;
    @track isFetching = false;
    @track items = [];
    @track errorMessage = '';
    @track hasSearched = false;

    _debounce;

    get sicOptions() {
        return SIC_GROUPS.map(o => ({ ...o, selected: o.value === this.sicGroup }));
    }
    get hasResults() { return this.items.length > 0; }
    get showEmpty() { return this.hasSearched && !this.items.length && !this.isSearching && !this.errorMessage; }
    get searchBtnLabel() { return this.isSearching ? 'Searching…' : 'Search'; }

    connectedCallback() {
        if (this.defaultGroup) this.sicGroup = this.defaultGroup;
    }

    handleOpen() {
        this.showModal = true;
        this.query = '';
        this.items = [];
        this.errorMessage = '';
        this.hasSearched = false;
    }

    handleClose() { this.showModal = false; }
    handleStopProp(e) { e.stopPropagation(); }

    handleQueryChange(e) {
        this.query = e.target.value;
        clearTimeout(this._debounce);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._debounce = setTimeout(() => this.runSearch(), 400);
    }

    handleSicChange(e) {
        this.sicGroup = e.target.value;
        if (this.query && this.query.length >= 2) this.runSearch();
    }

    handleSearchClick() { this.runSearch(); }

    async runSearch() {
        if (!this.query || this.query.length < 2) return;
        this.isSearching = true;
        this.errorMessage = '';
        this.hasSearched = true;
        try {
            const res = await searchCompanies({ query: this.query, sicGroup: this.sicGroup });
            if (res.status === 'success') {
                this.items = (res.items || []).map(c => ({
                    ...c,
                    statusBadge: c.status || '',
                    statusClass: 'ch-status ch-status-' + (c.status || '').replace(/\s+/g, '-').toLowerCase()
                }));
            } else {
                this.errorMessage = res.message || 'Search failed';
                this.items = [];
            }
        } catch (e) {
            this.errorMessage = e.body?.message || e.message || 'Search failed';
        } finally {
            this.isSearching = false;
        }
    }

    async handlePick(e) {
        const number = e.currentTarget.dataset.number;
        this.isFetching = true;
        try {
            const res = await getCompany({ companyNumber: number });
            if (res.status === 'success') {
                this.dispatchEvent(new CustomEvent('companyselected', { detail: res.data }));
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Company loaded',
                    message: res.data.name + ' (' + res.data.number + ')',
                    variant: 'success'
                }));
                this.showModal = false;
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Failed',
                    message: res.message || 'Could not fetch company details',
                    variant: 'error'
                }));
            }
        } catch (err) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: err.body?.message || err.message || 'Fetch failed',
                variant: 'error'
            }));
        } finally {
            this.isFetching = false;
        }
    }
}
