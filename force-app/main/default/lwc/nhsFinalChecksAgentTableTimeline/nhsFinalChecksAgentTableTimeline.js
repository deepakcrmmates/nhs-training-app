import { LightningElement, api } from 'lwc';

const fmt = v => v != null ? '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0 }) : '—';

export default class NhsFinalChecksAgentTableTimeline extends LightningElement {
    @api data = {};

    get agent1Name() { return this.data.agent1Name || 'Agent 1'; }
    get agent2Name() { return this.data.agent2Name || 'Agent 2'; }
    get agent3Name() { return this.data.agent3Name || 'Agent 3'; }

    get a1Open() { return fmt(this.data.a1OpenMarket); }
    get a1_68() { return fmt(this.data.a1_6_8_Week); }
    get a1_46() { return fmt(this.data.a1_4_6_Week); }
    get a1_24() { return fmt(this.data.a1_2_4_Week); }
    get a2Open() { return fmt(this.data.a2OpenMarket); }
    get a2_68() { return fmt(this.data.a2_6_8_Week); }
    get a2_46() { return fmt(this.data.a2_4_6_Week); }
    get a2_24() { return fmt(this.data.a2_2_4_Week); }
    get a3Open() { return fmt(this.data.a3OpenMarket); }
    get a3_68() { return fmt(this.data.a3_6_8_Week); }
    get a3_46() { return fmt(this.data.a3_4_6_Week); }
    get a3_24() { return fmt(this.data.a3_2_4_Week); }

    get avgOpen() { return this._avg(['a1OpenMarket', 'a2OpenMarket', 'a3OpenMarket']); }
    get avg_68() { return this._avg(['a1_6_8_Week', 'a2_6_8_Week', 'a3_6_8_Week']); }
    get avg_46() { return this._avg(['a1_4_6_Week', 'a2_4_6_Week', 'a3_4_6_Week']); }
    get avg_24() { return this._avg(['a1_2_4_Week', 'a2_2_4_Week', 'a3_2_4_Week']); }

    _avg(keys) {
        const vals = keys
            .map(k => this.data[k])
            .filter(v => v != null && v > 0);
        if (vals.length === 0) return '—';
        return fmt(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
}
