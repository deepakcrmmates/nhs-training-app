import { LightningElement, wire, track } from 'lwc';
import getOpportunities from '@salesforce/apex/ArchivedApplicationKanbanController.getOpportunities';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';

const PAGE_SIZE = 50;

export default class ArchivedApplicationKanban extends NavigationMixin(LightningElement) {
    @track opportunities = [];
    @track filteredOpportunities = [];
    @track error;
    @track isLoading = false;
    @track totalRecords = 0; // Total count of records
    offset = 0; // Offset for pagination
    previousScrollTop = 0; // Store last scroll position
    sortBy = 'Name';
    searchKey = '';
    label = 'Unarchived';
    disable = false;

    sortOptions = [
        { label: 'Opportunity Name', value: 'Name' },
        { label: 'Sales Advisor', value: 'Sales_Advisor__c' },
        { label: 'Stage', value: 'StageName' }
    ];

    wiredOpportunitiesResult; // Stores wired response for refreshApex

    @wire(getOpportunities, { limitSize: PAGE_SIZE, offsetValue: '$offset' })
    wiredOpportunities(result) {
        this.isLoading = false;
        this.wiredOpportunitiesResult = result; // Store result for refreshApex

        if (result.data) {
            let records = result.data.opportunities;
            this.totalRecords = result.data.totalCount; // Total records count

            let formattedRecords = records.map(opp => ({
                ...opp,
                label: opp.Archived_Approval_Status__c === 'Pending' ? 'Pending' : 'Unarchived',
                disable: opp.Archived_Approval_Status__c === 'Pending',
                // Safe checks for null or undefined fields
                vendorName: opp.Applicant__r?.Name || 'No Vendor Name', // Safe check
                houseBuilder: opp.House_Builder__r?.Name || 'No House Builder', // Safe check
                applicationName: opp.Name || 'No Application Name' // Safe check
            }));

            this.opportunities = [...this.opportunities, ...formattedRecords];
            this.filteredOpportunities = [...this.opportunities]; // Ensure fresh copy
        } else {
            this.opportunities = [];
            this.filteredOpportunities = [];
        }
    }

    connectedCallback() {
        // Attach scroll event listener
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    disconnectedCallback() {
        // Remove event listener to avoid memory leaks
        window.removeEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll(event) {
        let target = event.target;
        let currentScrollTop = target.scrollTop;

        // Only call Apex if scrolling downward
        if (currentScrollTop > this.previousScrollTop) {
            let isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;

            if (isNearBottom && !this.isLoading && this.opportunities.length < this.totalRecords) {
                this.loadMoreRecords();
            }
        }

        // Update previous scroll position
        this.previousScrollTop = currentScrollTop;
    }

    loadMoreRecords() {
        this.isLoading = true;
        this.offset += PAGE_SIZE;

        getOpportunities({ limitSize: PAGE_SIZE, offsetValue: this.offset })
            .then(result => {
                console.log('Fetched records count:', result.opportunities?.length);
                console.log('Total records in database:', result.totalCount);

                if (result && result.opportunities && result.opportunities.length > 0) {
                    let records = result.opportunities;
                    this.totalRecords = result.totalCount;

                    let formattedRecords = records.map(opp => ({
                        ...opp,
                        label: opp.Archived_Approval_Status__c === 'Pending' ? 'Pending' : 'Unarchived',
                        disable: opp.Archived_Approval_Status__c === 'Pending',
                        vendorName: opp.Applicant__r?.Name || 'No Vendor Name', // 🛡️ safe check
                        houseBuilder: opp.House_Builder__r?.Name || 'No House Builder', // 🛡️ safe check
                        applicationName: opp.Name || 'No Application Name' // 🛡️ safe check
                    }));

                    this.opportunities = [...this.opportunities, ...formattedRecords];
                    this.filteredOpportunities = [...this.opportunities];

                    if (this.opportunities.length >= this.totalRecords) {
                        this.hasMoreData = false;
                    } else {
                        this.offset += PAGE_SIZE;
                    }
                } else {
                    console.log('No more records found or opportunities is undefined.');
                }
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading more records:', error);
                this.isLoading = false;
            });
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.filteredOpportunities = this.opportunities.filter(opp => {
            const oppName = opp?.Name || '';
            const advisor = opp?.Sales_Advisor__c || '';
            const builderName = opp?.House_Builder__r?.Name || '';

            return (
                oppName.toLowerCase().includes(this.searchKey) ||
                advisor.toLowerCase().includes(this.searchKey) ||
                builderName.toLowerCase().includes(this.searchKey)
            );
        });
    }

    handleSort(event) {
        this.sortBy = event.detail.value;
        this.sortData();
    }

    sortData() {
        this.filteredOpportunities = [...this.filteredOpportunities].sort((a, b) => {
            let fieldA = a[this.sortBy] ? a[this.sortBy].toLowerCase() : '';
            let fieldB = b[this.sortBy] ? b[this.sortBy].toLowerCase() : '';
            return fieldA > fieldB ? 1 : fieldA < fieldB ? -1 : 0;
        });
    }

    get noRecords() {
        return this.filteredOpportunities.length === 0;
    }

    handleUnarchivedClick(event) {
        const recordId = event.target.dataset.id;

        // Find the index of the opportunity in filteredOpportunities
        const opportunityIndex = this.filteredOpportunities.findIndex(opp => opp.Id === recordId);

        if (opportunityIndex === -1) {
            this.showToast('Error', 'Opportunity not found', 'error');
            return;
        }

        // Update only the selected opportunity
        this.filteredOpportunities = this.filteredOpportunities.map((opp, index) => {
            if (index === opportunityIndex) {
                return {
                    ...opp,
                    Archived_Approval_Status__c: 'Pending',
                    StageName: 'To be contacted',
                    label: 'Pending', // Update label for this row
                    disable: true // Disable the button for this row
                };
            }
            return opp;
        });

        // Prepare data for update
        const fields = {
            Id: recordId,
            Archived_Approval_Status__c: 'Pending',
            StageName: 'To be contacted',
        };

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Application successfully unarchived!', 'success');

                // Refresh the list to get updated data from the server
                return refreshApex(this.wiredOpportunitiesResult);
            })
            .catch(error => {
                console.error('Error updating record:', error);
                this.showToast('Error', 'Failed to update opportunity', 'error');
            });
    }

    navigateOppHandler(event) {
        event.preventDefault();
        console.log('Navigating to Opportunity ID:', event.currentTarget.dataset.Id);
        const oppId = event.currentTarget.dataset.id;
        console.log('Navigating to Opportunity ID:', oppId);

        // Navigate to the Opportunity record page
        this[NavigationMixin.Navigate]( {
            type: 'standard__recordPage',
            attributes: {
                recordId: oppId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}