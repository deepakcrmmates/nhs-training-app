// addressAutocomplete.js
import { LightningElement } from 'lwc';
import searchAddresses from '@salesforce/apex/AddressController.searchAddresses';

export default class AddressAutocomplete extends LightningElement {
    address = '';
    showSuggestions = false;
    suggestions = [];

    handleInputChange(event) {
        this.address = event.target.value;
        if (this.address.length > 2) {
            this.getSuggestions();
        } else {
            this.showSuggestions = false;
        }
    }

    getSuggestions() {
        searchAddresses({ address: this.address })
            .then(result => {
                this.suggestions = result;
                this.showSuggestions = true;
            })
            .catch(error => {
                console.error('Error fetching suggestions', error);
            });
    }

    handleSuggestionClick(event) {
        this.address = event.target.innerText;
        this.showSuggestions = false;
    }
}