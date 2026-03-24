import { LightningElement, wire, track, api } from 'lwc';
import getOpportunities from '@salesforce/apex/EventController.getOpportunities';

export default class OpportunityList extends LightningElement {
    @track opportunities = [];
    @track displayedOpportunities = []; // Opportunities for the current scroll batch
    @track totalCount = 0; // Track the total count of opportunities
    @track isLoading = false; // Spinner control
    @api nhsProcess;
    @api tab;
    @track isTab = false;
    @track sortField = 'Name'; // Default sort field
    @track sortDirection = 'asc'; // Default sort direction (asc or desc)
    @track showInput = false;

    batchSize = 15; // Number of opportunities per batch
    currentBatch = 0; // Track the current batch

    connectedCallback() {
        this.loadInitialBatch();
        console.log('OUTPUT :tab ', this.tab);
        this.isTab = this.tab == 'Offer' ? true : false;
        console.log('OUTPUT : Opp NHS Process ', this.nhsProcess);

    }


    get sortArrow() {
        return this.sortDirection === 'asc' ? '↑' : '↓';
    }

    // Icons for sort direction
    get sortIcon() {
        return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
    }

    // Fetch opportunities and related counts from Apex
    @wire(getOpportunities, { nhsProcess: '$nhsProcess' })
    wiredOpportunities({ data, error }) {
        console.log('OUTPUT : Opp NHS Process ', this.nhsProcess);
        this.isTab = this.tab == 'Offer' ? true : false;
        console.log('OUTPUT : Opp NHS Process  data', data);
        console.log('OUTPUT :tab ', this.tab);
        if (data) {
            if (!Array.isArray(data) || data.length === 0) {
                console.log('Data is not a valid array or is empty.');
                return;
            }

            // Check if the last record contains the total count
            const lastRecord = data[data.length - 1];
            if (lastRecord.TotalCount !== undefined) {
                this.totalCount = lastRecord.TotalCount;

                // Clear opportunities if totalCount is 0
                if (this.totalCount === 0) {
                    console.log('TotalCount is 0. Clearing opportunities.');
                    this.opportunities = [];
                    this.displayedOpportunities = [];
                    return;
                }

                // Extract the opportunities (excluding the last record)
                this.opportunities = data.slice(0, -1).map(opp => ({
                    ...opp,
                    TotalEvents: opp.TotalEvents || 0, // Initialize count for events
                    TotalVendorAvailability: opp.TotalVendorAvailability || 0, // Initialize count for vendor availability
                    ChasingCount: opp.TotalChasing || 0, // Add conflict count
                    TotalReturnCount: opp.TotalReturnCount || 0,
                    CreatedDate: new Date(opp.CreatedDate) // Parse CreatedDate
                }));

                // Load the initial batch
                this.loadInitialBatch();

            }
        } else if (error) {
            console.error('Error retrieving opportunities', error);
        }
    }

    // Load the initial batch of opportunities
    loadInitialBatch() {
        if (this.opportunities.length > 0) {
            this.displayedOpportunities = this.opportunities.slice(0, this.batchSize);
            this.currentBatch = 1;
        }
    }

    // Load the next batch of opportunities
    loadNextBatch() {
        if (this.currentBatch * this.batchSize >= this.opportunities.length) {
            return; // No more data to load
        }

        this.isLoading = true;
        setTimeout(() => {
            const startIndex = this.currentBatch * this.batchSize;
            const endIndex = startIndex + this.batchSize;
            this.displayedOpportunities = [
                ...this.displayedOpportunities,
                ...this.opportunities.slice(startIndex, endIndex)
            ];
            this.currentBatch++;
            this.isLoading = false;
        }, 1000); // Simulate loading delay
    }

    // Handle scroll event
    handleScroll(event) {
        const container = event.target;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight && !this.isLoading) {
            this.loadNextBatch();
        }
    }

    // Handle click on an opportunity row
    handleOpportunityClick(event) {
        const selectedOpportunityId = event.currentTarget.dataset.id;
        this.selectedOpportunityId = selectedOpportunityId;

        // Update the selected class dynamically
        this.template.querySelectorAll('.application-card').forEach(card => {
            if (card.dataset.id === selectedOpportunityId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Dispatch a custom event
        const opportunitySelectEvent = new CustomEvent('opportunityselect', {
            detail: { opportunityId: selectedOpportunityId },
        });
        this.dispatchEvent(opportunitySelectEvent);
    }

    handleSort(event) {
        const field = event.target.dataset.field;

        // Toggle direction if the same field is clicked
        this.sortDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortField = field;

        this.sortData(this.sortField, this.sortDirection);
    }


    // Apex call to fetch opportunities (filtered)
    fetchFilteredOpportunities(searchTerm) {
    this.isLoading = true;

    getOpportunities({ nhsProcess: this.nhsProcess, searchTerm: searchTerm })
        .then((data) => {
            console.log('OUTPUT on search: ',JSON.stringify(data));
            if (Array.isArray(data) && data.length > 0) {
                this.opportunities = data
                    .filter((opp) => !("TotalCount" in opp && Object.keys(opp).length === 1)) // Exclude { "TotalCount": 2 }
                    .map((opp) => ({
                        ...opp,
                        TotalEvents: opp.TotalEvents || 0,
                        TotalVendorAvailability: opp.TotalVendorAvailability || 0,
                        ChasingCount: opp.TotalChasing || 0,
                        TotalReturnCount: opp.TotalReturnCount || 0,
                        CreatedDate: opp.CreatedDate ? new Date(opp.CreatedDate) : null, // Safe Date Conversion
                    }));

                // Reset pagination & load initial batch
                this.displayedOpportunities = this.opportunities.slice(0, 15);
                this.totalCount = this.opportunities.length;
            } else {
                this.opportunities = [];
                this.displayedOpportunities = [];
                this.totalCount = 0;
            }
        })
        .catch((error) => {
            console.error("Error fetching opportunities:", error);
            this.opportunities = [];
            this.displayedOpportunities = [];
            this.totalCount = 0;
        })
        .finally(() => {
            this.isLoading = false;
        });
}



    // Handle input change
    handleSearchInput(event) {
        const searchTerm = event.target.value;
        this.searchTerm = searchTerm;

        // Call Apex to fetch filtered data
        this.fetchFilteredOpportunities(searchTerm);
    }


    sortData(field, direction) {
        const isAscending = direction === 'asc';
        this.displayedOpportunities = [...this.displayedOpportunities].sort((a, b) => {
            if (a[field] === null || a[field] === undefined) return 1;
            if (b[field] === null || b[field] === undefined) return -1;
            if (typeof a[field] === 'string') {
                return isAscending
                    ? a[field].localeCompare(b[field])
                    : b[field].localeCompare(a[field]);
            }
            console.log('OUTPUT :this.displayedOpportunities ', this.displayedOpportunities);
            return isAscending ? a[field] - b[field] : b[field] - a[field];
        });
    }
    get searchInputClass() {
        return `search-input ${this.showInput ? 'visible' : ''}`;
    }

    toggleSearch() {
        this.showInput = true;
    }

    hideSearch(event) {
        if (!event.target.value) {
            this.showInput = false;
        }
    }
}