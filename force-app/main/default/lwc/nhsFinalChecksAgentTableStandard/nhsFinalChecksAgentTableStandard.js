import { LightningElement, api } from 'lwc';

const fmt = v => v != null ? '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0 }) : '—';

export default class NhsFinalChecksAgentTableStandard extends LightningElement {
    @api data = {};

    get agent1Name() { return this.data.agent1Name || 'Agent 1'; }
    get agent2Name() { return this.data.agent2Name || 'Agent 2'; }
    get agent3Name() { return this.data.agent3Name || 'Agent 3'; }

    get a1Initial() { return fmt(this.data.agent1Initial); }
    get a1Target()  { return fmt(this.data.agent1Target); }
    get a1Bottom()  { return fmt(this.data.agent1Bottom); }
    get a2Initial() { return fmt(this.data.agent2Initial); }
    get a2Target()  { return fmt(this.data.agent2Target); }
    get a2Bottom()  { return fmt(this.data.agent2Bottom); }
    get a3Initial() { return fmt(this.data.agent3Initial); }
    get a3Target()  { return fmt(this.data.agent3Target); }
    get a3Bottom()  { return fmt(this.data.agent3Bottom); }

    get avgInitial() { return this._avg('Initial'); }
    get avgTarget()  { return this._avg('Target'); }
    get avgBottom()  { return this._avg('Bottom'); }

    _avg(key) {
        const vals = [1, 2, 3]
            .map(n => this.data[`agent${n}${key}`])
            .filter(v => v != null && v > 0);
        if (vals.length === 0) return '—';
        return fmt(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
}
