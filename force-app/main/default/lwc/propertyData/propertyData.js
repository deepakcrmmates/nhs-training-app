import { LightningElement, track, wire } from 'lwc';
import getPropertyData from '@salesforce/apex/PropertyDataService.getPropertyData';

export default class PropertyData extends LightningElement {
    @track postcode = '';
    @track propertyData;
    @track error;

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
    }

    fetchData() {
        getPropertyData({ postcode: this.postcode })
            .then(result => {
                this.propertyData = result;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.propertyData = undefined;
            });
    }
}