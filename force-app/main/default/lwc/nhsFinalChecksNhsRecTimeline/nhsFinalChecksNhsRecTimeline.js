import { LightningElement, api } from 'lwc';

const fmt = v => v != null ? '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0 }) : '—';

export default class NhsFinalChecksNhsRecTimeline extends LightningElement {
    @api data = {};

    get recOpen() { return fmt(this.data.nhsRecOpenMarket); }
    get rec_68() { return fmt(this.data.nhsRec_6_8_Week); }
    get rec_46() { return fmt(this.data.nhsRec_4_6_Week); }
    get rec_24() { return fmt(this.data.nhsRec_2_4_Week); }
}
