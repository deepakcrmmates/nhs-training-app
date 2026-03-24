import { LightningElement, track } from 'lwc';
import updateRecords from '@salesforce/apex/WeeklyUpdatesController.updateRecords';

export default class WeeklyUpdates extends LightningElement {
    @track data = [];  // This will hold your data
    @track draftValues = [];  // This holds any changes made in the UI

    columns = [
        { label: 'Weekly Updates Name', fieldName: 'name', type: 'text', editable: true },
        { label: 'Application', fieldName: 'Application__c', type: 'Lookup(Application)', editable: true },
        { label: 'Property', fieldName: 'Property__c', type: 'Lookup(Property)', editable: true },
        { label: 'Update Agent', fieldName: 'Update_Agent__c', type: 'Lookup(Account)', editable: true },
        { label: 'Update By', fieldName: 'Update_By__c', type: 'Text', editable: true },
        { label: 'Update Date', fieldName: 'Update_Date__c', type: 'Date', editable: true }
    ];

    connectedCallback() {
        // Fetch data from backend (Apex, APIs, etc.) and initialize `this.data`
        this.data = [{id: 'a', name: 'Task 1', Application: 'ABC Application', Property: '72 Doniford House'}];
    }

    handleSave(event) {
        const updatedFields = event.detail.draftValues;

        // Here you'd call an Apex method to update records on server side
        updateRecords({data: updatedFields})
            .then(result => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Records updated',
                        variant: 'success'
                    })
                );
                // Clear draft values
                this.draftValues = [];
                // Refresh data
                this.connectedCallback();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating records',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}