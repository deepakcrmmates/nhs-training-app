// idealPostcodeAutocomplete.js
import { LightningElement, track } from 'lwc';
import searchAddresses from '@salesforce/apex/IdealPostcodeController.searchAddresses';

export default class IdealPostcodeAutocomplete extends LightningElement {
    @track addressSuggestions = [];
    @track showDropdown = false;

    handleSearch(event) {
        const searchTerm = event.target.value;
        if (searchTerm.length >= 3) {
            searchAddresses({ searchTerm })
                .then(result => {
                    this.addressSuggestions = result;
                    this.showDropdown = true;
                })
                .catch(error => {
                    // Handle error
                });
        } else {
            this.addressSuggestions = [];
            this.showDropdown = false;
        }
    }

    handleSelection(event) {
        const selectedAddress = event.target.dataset.address;
        // Update Contact/Account/Lead record with selectedAddress
    }
}