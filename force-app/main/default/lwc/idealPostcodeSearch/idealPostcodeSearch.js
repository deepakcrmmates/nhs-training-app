import { LightningElement, track } from 'lwc';
import getAddress from '@salesforce/apex/IdealPostcodesHandler.getAddress';

export default class IdealPostcodeSearch extends LightningElement {
    @track postcode = '';
    @track addresses = [];

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
    }

    searchAddresses() {
        getAddress({ postcode: this.postcode })
            .then(result => {
                this.addresses = JSON.parse(result);
            })
            .catch(error => {
                console.error('Error fetching addresses', error);
            });
    }
}