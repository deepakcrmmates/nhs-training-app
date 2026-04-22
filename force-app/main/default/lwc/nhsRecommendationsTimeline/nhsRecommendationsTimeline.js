import { LightningElement, api } from 'lwc';

export default class NhsRecommendationsTimeline extends LightningElement {
    @api openMarket;
    @api week68;
    @api week46;
    @api week24;
    @api disabled = false;

    handleChange(event) {
        const field = event.target.dataset.role;
        const value = event.target.value;
        this.dispatchEvent(new CustomEvent('recchange', { detail: { field, value } }));
    }
}
