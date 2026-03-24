import { LightningElement, api } from 'lwc';
import getAddressFinderApiResponse from '@salesforce/apex/AddressFinderController.methodName';
const DELAY = 500;

export default class Idealaddresslookup extends LightningElement {
    @api helpText = "Custom Search Address";
    @api label = "Search UK Address";
    @api required;
    @api selectedIconName = "standard:account";
    @api objectLabel = "Account";
    recordsList = [];
    selectedRecordName;

    @api objectApiName = "Account";
    @api fieldApiName = "Name";
    @api otherFieldApiName = "Industry";
    @api searchString = "";
    @api selectedRecordId = "";
    @api parentRecordId;
    @api parentFieldApiName;

    preventClosingOfSerachPanel = false;

    get showRecentRecords() {
        if (!this.recordsList) {
            return false;
        }
        return this.recordsList.length > 0;
    }

    fetchSobjectRecords() {
        getAddressFinderApiResponse({ query: this.searchString })
            .then(result => {
                let rslt = JSON.parse(result);
                if (rslt && rslt.result && rslt.result.hits) {
                    let lookupResults = [];
                    this.recordsList = [];
                    rslt.result.hits.forEach((hit, index) => {
                        const key = `${hit.line_1},${hit.post_town},${hit.postcode}`;
                        lookupResults.push({ id: hit.id, label: key, country: hit.country, line_2: hit.line_2, dta: JSON.stringify(hit)});

                    });
                    this.recordsList = lookupResults;
                }
            })
            .catch(error => {
                // Handle error
                console.error('Error:', error);
            });
    }

    get isValueSelected() {
        return this.selectedRecordId;
    }

    handleChange(event) {
        this.searchString = encodeURIComponent(event.target.value);
        this.fetchSobjectRecords();
    }

    handleBlur() {
        this.recordsList = [];
        this.preventClosingOfSerachPanel = false;
    }

    handleDivClick() {
        this.preventClosingOfSerachPanel = true;
    }

    handleCommit() {
        this.selectedRecordId = "";
        this.selectedRecordName = "";
    }

    handleSelect(event) {
        let selectedRecord = {
            label: event.currentTarget.dataset.label,
            country: event.currentTarget.dataset.country,
            id: event.currentTarget.dataset.id,
            dta: event.currentTarget.dataset.dta
        };
        this.selectedRecordId = event.currentTarget.dataset.id;
        this.selectedRecordName = event.currentTarget.dataset.label;
        this.recordsList = [];
        const selectedEvent = new CustomEvent('valueselected', {
            detail: selectedRecord
        });
        this.dispatchEvent(selectedEvent);
    }
    
    handleInputBlur(event) {
        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {
            if (!this.preventClosingOfSerachPanel) {
                this.recordsList = [];
            }
            this.preventClosingOfSerachPanel = false;
        }, DELAY);
    }

}