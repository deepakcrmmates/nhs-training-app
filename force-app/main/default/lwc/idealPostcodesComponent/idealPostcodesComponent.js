// idealPostcodesComponent.js
import { LightningElement, wire, track, api } from 'lwc';
import getAddress from '@salesforce/apex/IdealPostcodesHandler.getAddress';

export default class IdealPostcodesComponent extends LightningElement {
    @track postcode;
    @track address;

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
    }

    findAddress() {
        getAddress({postcode: this.postcode})
            .then(result => {
                this.address = result;
            })
            .catch(error => {
                this.address = 'Error retrieving address';
            });
    }
}