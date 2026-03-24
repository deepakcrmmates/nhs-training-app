import { LightningElement, track } from 'lwc';
import getProperties from '@salesforce/apex/PropertySearchAPIController.getProperties';

export default class PropertySearchAPI extends LightningElement {
    @track postcode = '';
    @track propertyData;

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
    }

    fetchPropertyData() {
        getProperties({ postcode: this.postcode })
            .then(data => {
                this.propertyData = data;
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    get formattedData() {
        return JSON.stringify(this.propertyData, null, 2);
    }
}