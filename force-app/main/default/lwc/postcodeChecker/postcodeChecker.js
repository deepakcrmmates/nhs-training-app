import { LightningElement, track, api } from 'lwc';
import getAddresses from '@salesforce/apex/AddressController.getAddresses'; // Apex method to call Google API

export default class PostcodeChecker extends LightningElement {
    @track postcode;
    @track addressList;
    @track selectedAddress;
    @track finalAddress;

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
        if (this.postcode.length >= 5) { // assuming postcode length validation
            getAddresses({ postcode: this.postcode })
                .then(result => {
                    this.addressList = result.map(addr => {
                        return { label: addr, value: addr };
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }

    handleAddressChange(event) {
        this.selectedAddress = event.detail.value;
        this.finalAddress = this.selectedAddress;
    }
}