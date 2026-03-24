import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createOpportunityRecord from '@salesforce/apex/OpportunityController.createOpportunityRecord';

export default class OpportunityForm extends LightningElement {
    @track schemeValue;
    @track startDate;
    @track endDate;
    @track applicationDate;
    schemeOptions = [
        { label: 'New Home', value: 'New Home' },
        { label: 'Part Exchange', value: 'Part Exchange' },
        { label: 'Assisted Sale', value: 'Assisted Sale' },
    ];

    handleSchemeChange(event) {
        this.schemeValue = event.detail.value;
    }

    handleDateChange(event) {
        this.startDate = event.detail.startDate;
        this.endDate = event.detail.endDate;
    }

    handlePropertySelect(event) {
        this.propertyId = event.detail.selectedRecordId;
    }

    handleApplicationDateChange(event) {
        this.applicationDate = event.detail.value;
    }

    handleVendor1Select(event) {
        this.vendor1Id = event.detail.selectedRecordId;
    }

    handleVendor2Select(event) {
        this.vendor2Id = event.detail.selectedRecordId;
    }

    createOpportunity() {
        const fields = {
            Scheme__c: this.schemeValue,
            ETA_Comp_Date_Start_Range__c: this.startDate,
            ETA_Comp_Date_End_Range__c: this.endDate,
            Property__c: this.propertyId,
            Date_of_Application_Received__c: this.applicationDate,
            Vendor_1__c: this.vendor1Id,
            Vendor_2__c: this.vendor2Id
        };
        createOpportunityRecord({ oppFields: fields })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Opportunity created',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating opportunity',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}