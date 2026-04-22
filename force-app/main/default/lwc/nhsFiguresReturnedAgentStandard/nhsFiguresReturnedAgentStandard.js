import { LightningElement, api } from 'lwc';

const fmt = v => v == null ? '—' : '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default class NhsFiguresReturnedAgentStandard extends LightningElement {
    @api agentName = '';
    @api initial;
    @api target;
    @api bottom;

    get initFmt()   { return fmt(this.initial); }
    get targetFmt() { return fmt(this.target); }
    get bottomFmt() { return fmt(this.bottom); }
}
