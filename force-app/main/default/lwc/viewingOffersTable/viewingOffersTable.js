import { LightningElement,api, track, wire } from 'lwc';
import saveRecords from '@salesforce/apex/ViewingsOffersController.saveRecords';
import getInitialData from '@salesforce/apex/ViewingsOffersController.getInitialData';

export default class ViewingsOffersTable extends LightningElement {
    @track viewingsOffersData = [{ key: 0 }];
    @track recordsToSave;
   @api recordId;
    buyingPositionOptions = [
        { label: 'FTB', value: 'FTB' }, 
        { label: 'INV', value: 'INV' },
        { label: 'SSTC', value: 'SSTC' },
        { label: 'HTS – OM', value: 'HTS – OM' },
        { label: 'HTS – NOM', value: 'HTS – NOM' },
        { label: 'Cash – NTS', value: 'Cash – NTS' },
        { label: 'Rented', value: 'Rented'}
        
    ];

    @wire(getInitialData, { availabiltyId: 'a0U7Z00000Ao7JUUAZ' })
    wiredData({ error, data }) {
      if (data) {
        console.log('Data get data', data);
        this.viewingsOffersData = data;
      } else if (error) {
         console.error('Error:', error);
      }
    }
    addRow() {
        console.log('OUTPUT : ',this.recordId);
        const newRowKey = this.viewingsOffersData.length;
        this.viewingsOffersData = [...this.viewingsOffersData, { key: newRowKey }];
    }

    handleInputChange(event) {
        const { key, field } = event.target.dataset;
        const value = event.target.value;
        const index = this.viewingsOffersData.findIndex(item => item.key == key);
        if (index !== -1) {
            this.viewingsOffersData[index][field] = value;
            this.viewingsOffersData = [...this.viewingsOffersData];
        }

        //start working here from tommorow.
    }
    handleValueSelectedOnVendor1(event){
        this.recordsToSave = this.viewingsOffersData.map(item => ({
            Vendor_Name__c:event.detail.id
        }));
        console.log('OUTPUT : handleValueSelectedOnVendor1',event.detail.id);
    }
    handleValueSelectedOnAgent(event){
        this.recordsToSave = this.viewingsOffersData.map(item => ({
            Agent__c:event.detail.id
        }));
        console.log('OUTPUT : handleValueSelectedOnAgent',event.detail.id);
    }
    saveNewRecords(event) {
        console.log('OUTPUT :saveNewRecords ');
        this.recordsToSave = this.viewingsOffersData.map(item => ({
            Id : item.Id,
            Agent__c: item.Agent__c,
            Date_of_Viewing__c: item.Date_of_Viewing__c,
            Vendor_Name__c: item.Vendor_Name__c,
            Buying_Position__c: item.Buying_Position__c,
            Feedback_Chased__c: item.Feedback_Chased__c,
            Feedback__c: item.Feedback__c,
            Offer__c: item.Offer__c,
            New_Offer__c: item.New_Offer__c,
            Notes_Updates__c: item.Notes_Updates__c,
            Availability_Report__c: 'a0U7Z00000Ao7JUUAZ'
        }));
        console.log('OUTPUT : rts', JSON.stringify(this.recordsToSave));

        saveRecords({ records: this.recordsToSave })
            .then(result => {
                console.log('Records saved successfully:', result);
                // Reset viewingsOffersData or perform any necessary actions after saving
            })
            .catch(error => {
                console.error('Error saving records:', error);
                // Handle error
            });
    }
}