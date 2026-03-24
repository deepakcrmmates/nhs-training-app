import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { CloseActionScreenEvent } from 'lightning/actions';
import fetchStreetData from '@salesforce/apex/StreetDataController.fetchStreetData';
import fetchStreetDataFromUprn from '@salesforce/apex/StreetDataController.fetchStreetDataFromUprn';
import { getRecord } from 'lightning/uiRecordApi';

// Define the fields to be fetched by the wire service
const FIELDS = [ 
    'NHS_Property__c.Address__Street__s',
    'NHS_Property__c.Address__PostalCode__s',
    'NHS_Property__c.UPRN__c'
];

export default class CallStreetAPI extends LightningElement {
    @api recordId; // Ensure to pass the recordId from the parent component
    @track address = '';
    @track postCode = '';
    @track uprn = '';
    @track loader = false;

    // Use wire service to automatically fetch data and call fetchData when record data is available
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            // Populate fields with data from the record
            this.address = data.fields.Address__Street__s.value || '';
            this.postCode = data.fields.Address__PostalCode__s.value || '';
            this.uprn = data.fields.UPRN__c.value || '';
            this.loader = true;
            this.fetchData(); // Call fetchData once the record data is available
        } else if (error) {
            // Handle errors in retrieving the record data
            this.showErrorToast('Error loading record data');
            console.error('Error:', error);
        }
    }

    fetchData() {
        // Determine which Apex method to call based on the presence of UPRN
        if (!this.uprn) {
            // Call fetchStreetData if UPRN is not available
            fetchStreetData({ address: this.address, postcode: this.postCode, propId: this.recordId })
                .then((result) => {
                    this.loader = false;
                    if (result.hasOwnProperty('Y')) {
                        this.dispatchEvent(new CloseActionScreenEvent()); // Dispatch close action event
                        this.reloadPageAfterDelay(); // Call method to reload page with a delay
                    } else if (result.hasOwnProperty('N')) {
                        this.showErrorToast('Something went wrong INTERNAL SERVER ERROR');
                    }
                })
                .catch((err) => {
                    this.loader = false;
                    this.showErrorToast('Error fetching street data');
                    console.error('Error:', err);
                });
        } else {
            // Call fetchStreetDataFromUprn if UPRN is available
            fetchStreetDataFromUprn({ uprn: this.uprn, propId: this.recordId })
                .then((result) => {
                    if (result.hasOwnProperty('Y')) {
                        this.dispatchEvent(new CloseActionScreenEvent()); // Dispatch close action event
                        this.reloadPageAfterDelay(); // Call method to reload page with a delay
                    } else if (result.hasOwnProperty('N')) {
                        this.showErrorToast('Something went wrong');
                    }
                })
                .catch((err) => {
                    this.showErrorToast('Error fetching data from UPRN');
                    console.error('Error:', err);
                });
        }
    }

    // Method to reload the page after a delay
    reloadPageAfterDelay() {
        setTimeout(() => {
            window.location.reload(); // Reload the page after a delay
        }, 1600); // Delay time in milliseconds (e.g., 1000 ms = 1 second)
    }

    showErrorToast(message) {
        // Display a toast message for errors
        const evt = new ShowToastEvent({
            title: 'Error..!',
            message: message,
            variant: 'error',
            mode: 'pester'
        });
        this.dispatchEvent(evt);
    }
}