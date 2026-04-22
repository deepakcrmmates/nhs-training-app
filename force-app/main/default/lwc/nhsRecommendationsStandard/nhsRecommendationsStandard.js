import { LightningElement, api } from 'lwc';

export default class NhsRecommendationsStandard extends LightningElement {
    @api market;
    @api target;
    @api forced;

    handleChange(event) {
        const field = event.target.dataset.role;
        const value = event.target.value;
        this.dispatchEvent(new CustomEvent('recchange', { detail: { field, value } }));
    }
}
