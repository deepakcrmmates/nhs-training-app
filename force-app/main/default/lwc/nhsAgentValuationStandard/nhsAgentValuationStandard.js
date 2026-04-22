import { LightningElement, api } from 'lwc';

export default class NhsAgentValuationStandard extends LightningElement {
    @api agentNum;         // '1' | '2' | '3'
    @api initialPrice;     // display-formatted value
    @api targetSale;
    @api bottomLine;
    @api disabled = false;

    handleChange(event) {
        const field = event.target.dataset.role;
        const value = event.target.value;
        this.dispatchEvent(new CustomEvent('valchange', {
            detail: { agentNum: this.agentNum, field, value }
        }));
    }
}
