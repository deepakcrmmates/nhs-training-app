import { LightningElement, api } from 'lwc';

export default class NhsAgentValuationTimeline extends LightningElement {
    @api agentNum;      // '1' | '2' | '3'
    @api openMarket;    // display-formatted
    @api week68;
    @api week46;
    @api week24;

    handleChange(event) {
        const field = event.target.dataset.role;
        const value = event.target.value;
        this.dispatchEvent(new CustomEvent('valchange', {
            detail: { agentNum: this.agentNum, field, value }
        }));
    }
}
