import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getApplicationKanbanData from '@salesforce/apex/NhsApplicationKanbanController.getApplicationKanbanData';
import getAssigneeList          from '@salesforce/apex/NhsApplicationKanbanController.getAssigneeList';
import updateOpportunityStage   from '@salesforce/apex/NhsApplicationKanbanController.updateOpportunityStage';
import archiveOpportunity       from '@salesforce/apex/NhsApplicationKanbanController.archiveOpportunity';

const TOP_STAGES = [
    { key: 'application',         label: 'Application',         colour: '#93c5fd', num: '1' },
    { key: 'vendor_availability', label: 'Vendor Availability', colour: '#93c5fd', num: '2' },
    { key: 'agents_booked',       label: 'Agents Booked',       colour: '#93c5fd', num: '3' },
    { key: 'figures_to_chase',    label: 'Figures to Chase',    colour: '#93c5fd', num: '4' },
    { key: 'figures_returned',    label: 'Figures Returned',    colour: '#93c5fd', num: '5' },
    { key: 'archived',            label: 'Archived',            colour: '#93c5fd', num: '6' },
];

const PILL_STYLES = {
    'to be contacted': { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    '1st contact':     { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
    '2nd contact':     { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    '3rd contact':     { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'sales cancelled': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

const SUB_COLOURS = {
    'to be contacted': '#6366f1',
    '1st contact':     '#0ea5e9',
    '2nd contact':     '#f59e0b',
    '3rd contact':     '#f97316',
    'sales cancelled': '#ef4444',
};

const AV = [
    {bg:'#DCE8FF',t:'#1A4FCC'},{bg:'#E1F5EE',t:'#0F6E56'},
    {bg:'#FAEEDA',t:'#854F0B'},{bg:'#FAECE7',t:'#993C1D'},
    {bg:'#EEEDFE',t:'#3C3489'},{bg:'#E8F8FA',t:'#006978'},
];

const fmt  = n => !n ? null : n >= 1000000 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'k' : String(n);
const ini  = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
const avSt = n => {
    if (!n) return 'background:#f3f4f6;color:#374151;';
    const i = n.split('').reduce((s,c) => s + c.charCodeAt(0), 0) % AV.length;
    return `background:${AV[i].bg};color:${AV[i].t};`;
};
const fmtD = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : null;
const stageColour = n => n ? (SUB_COLOURS[n.toLowerCase()] || '#6b7280') : '#6b7280';

export default class NhsApplicationKanbanV5 extends NavigationMixin(LightningElement) {

    @track rawColumns     = [];
    @track assigneeList   = [];
    @track searchTerm     = '';
    @track assigneeFilter = '';
    @track showArchived   = false;
    @track isLoading      = true;
    @track hasError       = false;
    @track errorMessage   = '';
    @track draggedId      = null;
    @track dragOverStage  = null;
    @track activeNav      = 'application';
    @track toastVisible   = false;
    @track toastMessage   = '';
    @track toastType      = 'success';

    _wiredKanbanResult;
    toastTimer;

    @wire(getAssigneeList)
    wiredAssignees({ data }) { if (data) this.assigneeList = data; }

    @wire(getApplicationKanbanData, {
        searchTerm:     '$searchTerm',
        assigneeFilter: '$assigneeFilter',
        showArchived:   '$showArchived',
    })
    wiredKanbanData(result) {
        this._wiredKanbanResult = result;
        this.isLoading = false;
        const { data, error } = result;
        if (data)       { this.rawColumns = data; this.hasError = false; }
        else if (error) { this.hasError = true; this.errorMessage = error.body?.message || 'Failed to load.'; }
    }

    doRefresh() {
        this.isLoading = true;
        refreshApex(this._wiredKanbanResult)
            .then(()  => { this.isLoading = false; })
            .catch(() => { this.isLoading = false; });
    }

    get stageNav() {
        return TOP_STAGES.map(s => ({
            ...s,
            cls:      'sn-tab' + (s.key === this.activeNav ? ' sn-active' : ''),
            dotStyle: `background:${s.colour};`,
        }));
    }
    get activeStageLabel() { return TOP_STAGES.find(x => x.key === this.activeNav)?.label || ''; }
    handleNavClick(e) { this.activeNav = e.currentTarget.dataset.key; }

    get flowPills() {
        const stages = ['To be Contacted','1st Contact','2nd Contact','3rd Contact','Sales Cancelled'];
        const items = [];
        stages.forEach((label, i) => {
            const s = PILL_STYLES[label.toLowerCase()] || { bg:'#f1f5f9', text:'#475569', border:'#e2e8f0' };
            items.push({ key:'pill-'+i, label, isArrow:false, style:`background:${s.bg};color:${s.text};border-color:${s.border};` });
            if (i < stages.length - 1) items.push({ key:'arr-'+i, isArrow:true, label:'' });
        });
        return items;
    }

    get showBoard()      { return !this.isLoading && !this.hasError && this.activeNav === 'application'; }
    get showComingSoon() { return !this.isLoading && this.activeNav !== 'application'; }
    get totalCards()     { return this.rawColumns.reduce((s, c) => s + (c.cardCount || 0), 0); }
    get cancelledCards() { const c = this.rawColumns.find(x => x.stageName === 'Sales Cancelled'); return c ? c.cardCount : 0; }
    get activeCards()    { return this.totalCards - this.cancelledCards; }
    get contactedCards() {
        return this.rawColumns
            .filter(c => ['1st Contact','2nd Contact','3rd Contact'].includes(c.stageName))
            .reduce((s, c) => s + (c.cardCount || 0), 0);
    }

    get columns() {
        return this.rawColumns.map(col => {
            const colour = stageColour(col.stageName);
            const isOver = this.dragOverStage === col.stageName;
            const isCan  = col.stageName === 'Sales Cancelled';
            const cards  = (col.cards || []).map(c => ({
                ...c,
                appRefNumber:       c.appRefNumber || '—',
                closeDateFormatted: fmtD(c.closeDate),
                avInitials:         ini(c.ownerName),
                avStyle:            avSt(c.ownerName),
                arcIcon:  c.archived ? 'utility:undelete' : 'utility:archive',
                arcLabel: c.archived ? 'Unarchive' : 'Archive',
                cardClass: 'kcard' + (c.archived ? ' card-arc' : '') + (this.draggedId === c.id ? ' card-drag' : ''),
            }));
            return {
                stageName: col.stageName, cardCount: col.cardCount || 0,
                totalFormatted: fmt(col.totalAmount), showTotal: col.totalAmount > 0,
                isEmpty: (col.cards || []).length === 0, isDragOver: isOver,
                colClass:       'kcol' + (isCan ? ' col-can' : '') + (isOver ? ' col-ov' : ''),
                accentStyle:    `border-top:3px solid ${colour};`,
                accentBarStyle: `background:${colour};`,
                dotStyle:       `background:${colour};`,
                cards,
            };
        });
    }

    handleSearch(e)   { this.searchTerm     = e.target.value; }
    clearSearch()     { this.searchTerm     = ''; }
    handleAssignee(e) { this.assigneeFilter = e.target.value; }
    handleArchived(e) { this.showArchived   = e.target.checked; }
    handleRefresh()   { this.doRefresh(); }

    handleCardClick(e) {
        const id = e.currentTarget.dataset.id;
        if (id) this[NavigationMixin.Navigate]({ type:'standard__recordPage', attributes:{ recordId:id, actionName:'view' } });
    }

    handleArchiveClick(e) {
        e.stopPropagation();
        const id  = e.currentTarget.dataset.id;
        const arc = e.currentTarget.dataset.archived === 'true';
        archiveOpportunity({ opportunityId:id, archived:!arc })
            .then(() => { this.showToast(arc ? 'Unarchived' : 'Archived', 'success'); this.doRefresh(); })
            .catch(err => this.showToast(err.body?.message || 'Error', 'error'));
    }

    handleDragStart(e) { this.draggedId = e.currentTarget.dataset.id; e.dataTransfer.setData('text/plain', this.draggedId); }
    handleDragEnd()    { this.draggedId = null; this.dragOverStage = null; }
    handleDragEnter(e) { e.preventDefault(); this.dragOverStage = e.currentTarget.dataset.stage; }
    handleDragOver(e)  { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    handleDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) this.dragOverStage = null; }

    handleDrop(e) {
        e.preventDefault();
        const targetStage  = e.currentTarget.dataset.stage;
        const cardId       = e.dataTransfer.getData('text/plain') || this.draggedId;
        this.draggedId     = null;
        this.dragOverStage = null;
        if (!cardId || !targetStage) return;

        let sourceStage = null;
        let movedCard   = null;
        for (const col of this.rawColumns) {
            const found = (col.cards || []).find(c => c.id === cardId);
            if (found) { sourceStage = col.stageName; movedCard = found; break; }
        }
        if (!sourceStage || sourceStage === targetStage) return;

        this.rawColumns = this.rawColumns.map(col => {
            if (col.stageName === sourceStage) {
                const cards = (col.cards || []).filter(c => c.id !== cardId);
                return { ...col, cards, cardCount: cards.length };
            }
            if (col.stageName === targetStage) {
                const cards = [{ ...movedCard, stageName: targetStage }, ...(col.cards || [])];
                return { ...col, cards, cardCount: cards.length };
            }
            return col;
        });

        updateOpportunityStage({ opportunityId: cardId, newStageName: targetStage })
            .then(() => { this.showToast(`Moved to "${targetStage}"`, 'success'); this.doRefresh(); })
            .catch(err => { this.showToast(err.body?.message || 'Move failed', 'error'); this.doRefresh(); });
    }

    showToast(msg, type = 'success') {
        clearTimeout(this.toastTimer);
        this.toastMessage = msg; this.toastType = type; this.toastVisible = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3000);
    }
    get toastClass() { return 'toast toast-' + this.toastType; }
    get toastIcon()  { return this.toastType === 'success' ? 'utility:success' : 'utility:error'; }
}