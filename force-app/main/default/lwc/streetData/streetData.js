import { LightningElement, track } from 'lwc';
import fetchStreetData from '@salesforce/apex/StreetDataController.fetchStreetData';

export default class StreetData extends LightningElement {
    @track address = '';
    @track postcode = '';
    @track data = null;
    @track error = null;

    handleAddressChange(event) {
        this.address = event.target.value;
    }

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
    }

    async fetchStreetData() {
        try {
            const response = await fetchStreetData({ address: this.address, postcode: this.postcode });
            this.data = response;
            this.error = null;
        } catch (error) {
            this.error = error.body ? error.body.message : error.message;
            this.data = null;
        }
    }
}