import { LightningElement, api } from 'lwc';

const fmt = v => v == null ? '—' : '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default class NhsFiguresReturnedNhsStandard extends LightningElement {
    @api market;
    @api target;
    @api forced;

    get marketFmt() { return fmt(this.market); }
    get targetFmt() { return fmt(this.target); }
    get forcedFmt() { return fmt(this.forced); }
}
