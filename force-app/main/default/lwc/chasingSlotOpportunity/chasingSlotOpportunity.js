import { LightningElement, wire, track, api } from 'lwc';
import getOpportunities from '@salesforce/apex/EventController.getOpportunities1';

export default class ChasingSlotOpportunity extends LightningElement {


    @track opportunities = [];
    @track totalCount = 0; // Track the total count of opportunities
    allOpportunities = []; // Keep a copy of all opportunities for search functionality
    selectedOpportunityId;
    searchKey = '';

    // Fetch opportunities and related counts from Apex
    @wire(getOpportunities)
    wiredOpportunities({ data, error }) {
        if (data) {
            // Check if the last record contains the total count
            const lastRecord = data[data.length - 1];
            if (lastRecord.TotalCount !== undefined) {
                this.totalCount = lastRecord.TotalCount;

                // Extract the opportunities (excluding the last record)
                this.opportunities = data.slice(0, -1).map(opp => ({
                    ...opp,
                    rowClass: '', // Set default class for each row
                    TotalEvents: opp.TotalEventsWithAnyValuationTrue || 0, // Initialize count for events
                    TotalVendorAvailability: opp.TotalVendorAvailability || 0 // Initialize count for vendor availability
                }));
            }

            // Keep a copy of all opportunities for search functionality
            this.allOpportunities = [...this.opportunities];
        } else if (error) {
            console.error('Error retrieving opportunities', error);
        }
    }

    // Handle click on an opportunity row
    handleOpportunityClick(event) {
        const selectedOpportunityId = event.target.dataset.id;
        this.selectedOpportunityId = selectedOpportunityId;

        // Update the row class based on the selected opportunity
        this.opportunities = this.opportunities.map(opp => ({
            ...opp,
            rowClass: opp.Id === selectedOpportunityId ? 'highlight-row' : ''
        }));

        // Dispatch a custom event to notify the parent component
        const opportunitySelectEvent = new CustomEvent('opportunityselect', {
            detail: { opportunityId: selectedOpportunityId }
        });
        this.dispatchEvent(opportunitySelectEvent);
    }

    // Handle search input changes
    handleSearchKeyChange(event) {
        this.searchKey = event.target.value.toLowerCase();

        // Filter opportunities based on the search key (case-insensitive)
        this.opportunities = this.allOpportunities.filter(opp =>
            opp.Name.toLowerCase().includes(this.searchKey)
        );
    }

}