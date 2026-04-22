import { LightningElement, api } from 'lwc';

const fmt = v => v != null ? '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0 }) : '—';

export default class NhsFinalChecksNhsRecStandard extends LightningElement {
    @api data = {};

    get nhsMarket() { return fmt(this.data.nhsMarket); }
    get nhsTarget() { return fmt(this.data.nhsTarget); }
    get nhsForced() { return fmt(this.data.nhsForced); }
}
