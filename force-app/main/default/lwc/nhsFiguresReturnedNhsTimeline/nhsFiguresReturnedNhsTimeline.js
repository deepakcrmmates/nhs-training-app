import { LightningElement, api } from 'lwc';

const fmt = v => v == null ? '—' : '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default class NhsFiguresReturnedNhsTimeline extends LightningElement {
    @api openMarket;
    @api week68;
    @api week46;
    @api week24;

    get openFmt() { return fmt(this.openMarket); }
    get w68Fmt()  { return fmt(this.week68); }
    get w46Fmt()  { return fmt(this.week46); }
    get w24Fmt()  { return fmt(this.week24); }
}
