import { LightningElement, api, wire } from 'lwc';
import findRecords from '@salesforce/apex/LookupController.findRecords';

export default class CustomLookup extends LightningElement {
    @api label;
    @api objectApiName;
    searchKey = '';
    searchResults;

    handleKeyChange(event) {
        this.searchKey = event.target.value;
        this.searchRecords();
    }

    searchRecords() {
        findRecords({ searchKey: this.searchKey, objectName: this.objectApiName })
            .then(result => {
                this.searchResults = result;
            })
            .catch(error => {
                this.searchResults = undefined;
                console.error('Error:', error);
            });
    }

    handleSelect(event) {
        const selectedEvent = new CustomEvent('select', { detail: { selectedRecordId: event.currentTarget.dataset.id } });
        this.dispatchEvent(selectedEvent);
    }
}