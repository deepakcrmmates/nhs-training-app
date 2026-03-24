import { LightningElement, api, track } from 'lwc';

export default class DateRangeSlider extends LightningElement {
    @track startDate;
    @track endDate;

    handleStartChange(event) {
        this.startDate = event.target.value;
        this.dispatchDateChangeEvent();
    }

    handleEndChange(event) {
        this.endDate = event.target.value;
        this.dispatchDateChangeEvent();
    }

    dispatchDateChangeEvent() {
        this.dispatchEvent(new CustomEvent('datechange', {
            detail: {
                startDate: this.startDate,
                endDate: this.endDate
            }
        }));
    }
}