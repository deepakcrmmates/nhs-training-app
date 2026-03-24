import { LightningElement, api, track, wire } from 'lwc';
export default class Filter extends LightningElement {
@track value = 'booked'; // Default value
    @api options = []; // Options for the combobox

    handleChange(event) {
        this.value = event.detail.value;
        const selectedEvent = new CustomEvent('filterchange', {
            detail: { value: this.value }
        });
        this.dispatchEvent(selectedEvent);
    }
}