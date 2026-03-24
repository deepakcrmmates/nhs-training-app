import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getApplicationKanbanData from '@salesforce/apex/NhsApplicationKanbanController.getApplicationKanbanData';
import getAssigneeList          from '@salesforce/apex/NhsApplicationKanbanController.getAssigneeList';
import updateOpportunityStage   from '@salesforce/apex/NhsApplicationKanbanController.updateOpportunityStage';
import archiveOpportunity       from '@salesforce/apex/NhsApplicationKanbanController.archiveOpportunity';

/* ── Top-level stage nav ─────────────────────────────────────────────── */
const TOP_STAGES = [
    { key: 'application',         label: 'Application',         colour: '#93c5fd', num: '1' },
    { key: 'vendor_availability', label: 'Vendor Availability', colour: '#93c5fd', num: '2' },
    { key: 'agents_booked',       label: 'Agents Booked',       colour: '#93c5fd', num: '3' },
    { key: 'figures_to_chase',    label: 'Figures to Chase',    colour: '#93c5fd', num: '4' },
    { key: 'valuations_ready',    label: 'Valuations Ready',    colour: '#93c5fd', num: '5' },
    { key: 'figures_returned',    label: 'Figures Returned',    colour: '#93c5fd', num: '6' },
    { key: 'archived',            label: 'Archived',            colour: '#93c5fd', num: '7' },
];

/* ── Kanban helpers ──────────────────────────────────────────────────── */
const PILL_STYLES = {
    'to be contacted': { bg:'#eef2ff', text:'#4338ca', border:'#c7d2fe' },
    '1st contact':     { bg:'#f0f9ff', text:'#0369a1', border:'#bae6fd' },
    '2nd contact':     { bg:'#fffbeb', text:'#b45309', border:'#fde68a' },
    '3rd contact':     { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
    'sale cancelled': { bg:'#fef2f2', text:'#b91c1c', border:'#fecaca' },
};
const SUB_COLOURS = {
    'to be contacted': '#6366f1', '1st contact': '#0ea5e9',
    '2nd contact': '#f59e0b', '3rd contact': '#f97316', 'sale cancelled': '#ef4444',
};
const AV_COLS = [
    {bg:'#DCE8FF',t:'#1A4FCC'},{bg:'#E1F5EE',t:'#0F6E56'},
    {bg:'#FAEEDA',t:'#854F0B'},{bg:'#FAECE7',t:'#993C1D'},
    {bg:'#EEEDFE',t:'#3C3489'},{bg:'#E8F8FA',t:'#006978'},
];
const fmt  = n => !n ? null : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'k' : String(n);
const ini  = n => n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
const avSt = n => { if(!n) return 'background:#f3f4f6;color:#374151;'; const i=n.split('').reduce((s,c)=>s+c.charCodeAt(0),0)%AV_COLS.length; return `background:${AV_COLS[i].bg};color:${AV_COLS[i].t};`; };
const fmtD = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : null;
const stageColour = n => n ? (SUB_COLOURS[n.toLowerCase()] || '#6b7280') : '#6b7280';

/* ── Vendor Availability data ────────────────────────────────────────── */
const VA_VENDORS = [
    { id:1, name:'Margaret Holloway', address:'14 Elm Grove, Leeds LS6',     status:'available',   phone:'07700 900211', email:'m.holloway@email.co.uk',  property:'4-bed detached',  price:'£485,000', calls:3, agent:'James T.' },
    { id:2, name:'Robert Ashworth',   address:'8 Park Lane, Harrogate',      status:'pending',     phone:'07700 900344', email:'r.ashworth@email.co.uk',   property:'3-bed semi',      price:'£320,000', calls:1, agent:'James T.' },
    { id:3, name:'Priya Sharma',      address:'22 Victoria Rd, Bradford',    status:'available',   phone:'07700 900182', email:'p.sharma@mail.co.uk',      property:'2-bed terrace',   price:'£175,000', calls:5, agent:'Sarah K.' },
    { id:4, name:'David Whitfield',   address:'3 Maple Close, Otley',        status:'unavailable', phone:'07700 900098', email:'d.whitfield@email.co.uk',  property:'5-bed detached',  price:'£695,000', calls:0, agent:'James T.' },
    { id:5, name:'Susan Bancroft',    address:'57 High Street, Skipton',     status:'available',   phone:'07700 900457', email:'s.bancroft@mail.co.uk',    property:'3-bed terrace',   price:'£215,000', calls:2, agent:'Nina P.' },
    { id:6, name:'James Patel',       address:'9 Beech Ave, Wakefield',      status:'pending',     phone:'07700 900321', email:'j.patel@email.co.uk',      property:'2-bed flat',      price:'£145,000', calls:4, agent:'Sarah K.' },
    { id:7, name:'Claire Donaldson',  address:'31 Oak Terrace, Wetherby',    status:'available',   phone:'07700 900756', email:'c.donaldson@mail.co.uk',   property:'4-bed detached',  price:'£520,000', calls:2, agent:'Nina P.' },
    { id:8, name:'Tom Greenwood',     address:'18 Rose Lane, Castleford',    status:'unavailable', phone:'07700 900543', email:'t.greenwood@mail.co.uk',   property:'3-bed semi',      price:'£235,000', calls:0, agent:'James T.' },
];
const VA_SLOTS = {
    1:[{d:3,s:'available',t:'10:00 AM'},{d:7,s:'available',t:'2:00 PM'},{d:10,s:'tentative',t:'11:00 AM'},{d:14,s:'booked',t:'3:30 PM'},{d:17,s:'available',t:'9:00 AM'},{d:22,s:'available',t:'1:00 PM'},{d:25,s:'tentative',t:'4:00 PM'}],
    2:[{d:1,s:'tentative',t:'10:30 AM'},{d:5,s:'booked',t:'2:00 PM'},{d:9,s:'available',t:'11:00 AM'},{d:15,s:'available',t:'3:00 PM'},{d:20,s:'booked',t:'9:30 AM'},{d:24,s:'tentative',t:'1:30 PM'}],
    3:[{d:2,s:'available',t:'9:00 AM'},{d:4,s:'available',t:'2:30 PM'},{d:8,s:'available',t:'11:00 AM'},{d:11,s:'booked',t:'3:00 PM'},{d:16,s:'tentative',t:'10:00 AM'},{d:19,s:'available',t:'4:00 PM'},{d:23,s:'available',t:'1:00 PM'},{d:28,s:'available',t:'9:30 AM'}],
    4:[{d:6,s:'booked',t:'10:00 AM'},{d:12,s:'booked',t:'2:00 PM'},{d:18,s:'booked',t:'3:30 PM'}],
    5:[{d:1,s:'available',t:'9:00 AM'},{d:3,s:'available',t:'11:30 AM'},{d:7,s:'tentative',t:'2:00 PM'},{d:13,s:'available',t:'10:00 AM'},{d:21,s:'available',t:'3:00 PM'},{d:26,s:'booked',t:'1:00 PM'}],
    6:[{d:2,s:'tentative',t:'9:30 AM'},{d:6,s:'available',t:'2:00 PM'},{d:10,s:'booked',t:'11:00 AM'},{d:14,s:'available',t:'3:30 PM'},{d:18,s:'tentative',t:'10:00 AM'},{d:22,s:'available',t:'1:00 PM'},{d:30,s:'available',t:'4:00 PM'}],
    7:[{d:3,s:'available',t:'9:00 AM'},{d:9,s:'available',t:'2:30 PM'},{d:15,s:'booked',t:'11:00 AM'},{d:20,s:'available',t:'3:00 PM'},{d:27,s:'tentative',t:'10:30 AM'}],
    8:[{d:4,s:'booked',t:'10:00 AM'},{d:11,s:'booked',t:'2:00 PM'},{d:17,s:'booked',t:'3:00 PM'},{d:24,s:'booked',t:'9:30 AM'}],
};
const VA_NEXT_CALLS = { 1:'Thu 27 Mar — 10:00 AM', 2:'Fri 28 Mar — 2:30 PM', 3:'Mon 31 Mar — 11:00 AM', 5:'Tue 1 Apr — 9:00 AM', 6:'Wed 2 Apr — 3:00 PM', 7:'Thu 3 Apr — 1:00 PM' };
const VA_AV_COLS = [
    ['#1565c0','#e3f2fd'],['#2e7d32','#e8f5e9'],['#6a1b9a','#f3e5f5'],
    ['#bf360c','#fbe9e7'],['#00695c','#e0f2f1'],['#4527a0','#ede7f6'],
    ['#0277bd','#e1f5fe'],['#558b2f','#f1f8e9'],
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function vaBadgeStyle(s) {
    if (s==='available')   return 'background:#d1fae5;color:#065f46;';
    if (s==='pending')     return 'background:#fef3c7;color:#92400e;';
    if (s==='unavailable') return 'background:#f1f5f9;color:#64748b;';
    return '';
}
function vaStatusLabel(s) { return s==='available'?'Available':s==='pending'?'Pending':'Unavailable'; }
function vaSlotBadge(s) {
    if (s==='available') return 'background:#d1fae5;color:#065f46;';
    if (s==='booked')    return 'background:#fce7f3;color:#9d174d;';
    return 'background:#fef3c7;color:#92400e;';
}
function vaSlotLabel(s) { return s==='available'?'Available':s==='booked'?'Booked':'Tentative'; }

export default class NhsApplicationKanbanV7 extends NavigationMixin(LightningElement) {

    /* ── Nav ── */
    @track activeNav = 'application';

    /* ── Kanban state ── */
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

    /* ── Vendor Availability state ── */
    @track vaSearch         = '';
    @track vaFilter         = 'all';
    @track activeVendorId   = null;
    @track selectedCalDay   = null;
    @track calYear          = new Date().getFullYear();
    @track calMonth         = new Date().getMonth();

    /* ── Toast ── */
    @track toastVisible = false;
    @track toastMessage = '';
    @track toastType    = 'success';

    _wiredKanbanResult;
    toastTimer;

    /* ══ Wires ══════════════════════════════════════════════════════════ */
    @wire(getAssigneeList) wiredAssignees({ data }) { if (data) this.assigneeList = data; }

    @wire(getApplicationKanbanData, { searchTerm:'$searchTerm', assigneeFilter:'$assigneeFilter', showArchived:'$showArchived' })
    wiredKanbanData(result) {
        this._wiredKanbanResult = result;
        this.isLoading = false;
        const { data, error } = result;
        if (data)       { this.rawColumns = data; this.hasError = false; }
        else if (error) { this.hasError = true; this.errorMessage = error.body?.message || 'Failed to load.'; }
    }

    doRefresh() { this.isLoading = true; refreshApex(this._wiredKanbanResult).then(()=>{this.isLoading=false;}).catch(()=>{this.isLoading=false;}); }

    /* ══ Nav getters ═════════════════════════════════════════════════════ */
    get stageNav() {
        return TOP_STAGES.map(s => ({ ...s, cls:'sn-tab'+(s.key===this.activeNav?' sn-active':''), dotStyle:`background:${s.colour};` }));
    }
    get isApplication()       { return this.activeNav === 'application'; }
    get isVendorAvailability() { return this.activeNav === 'vendor_availability'; }
    get showComingSoon()       { return !this.isApplication && !this.isVendorAvailability; }
    get activeStageLabel()     { return TOP_STAGES.find(x=>x.key===this.activeNav)?.label || ''; }
    handleNavClick(e)          { this.activeNav = e.currentTarget.dataset.key; }

    /* ══ Kanban getters ══════════════════════════════════════════════════ */
    get flowPills() {
        const stages = ['To be contacted','1st Contact','2nd Contact','3rd Contact','Sale Cancelled'];
        const items = [];
        stages.forEach((label,i) => {
            const s = PILL_STYLES[label.toLowerCase()] || { bg:'#f1f5f9',text:'#475569',border:'#e2e8f0' };
            items.push({ key:'pill-'+i, label, isArrow:false, style:`background:${s.bg};color:${s.text};border-color:${s.border};` });
            if (i < stages.length-1) items.push({ key:'arr-'+i, isArrow:true, label:'' });
        });
        return items;
    }
    get showBoard()      { return !this.isLoading && !this.hasError; }
    get totalCards()     { return this.rawColumns.reduce((s,c)=>s+(c.cardCount||0),0); }
    get cancelledCards() { const c=this.rawColumns.find(x=>x.stageName==='Sales Cancelled'); return c?c.cardCount:0; }
    get activeCards()    { return this.totalCards - this.cancelledCards; }
    get contactedCards() { return this.rawColumns.filter(c=>['1st Contact','2nd Contact','3rd Contact'].includes(c.stageName)).reduce((s,c)=>s+(c.cardCount||0),0); }
    get columns() {
        return this.rawColumns.map(col => {
            const colour = stageColour(col.stageName);
            const isOver = this.dragOverStage === col.stageName;
            const isCan  = col.stageName === 'Sales Cancelled';
            const cards  = (col.cards||[]).map(c => ({ ...c, appRefNumber:c.appRefNumber||'—', closeDateFormatted:fmtD(c.closeDate), avInitials:ini(c.ownerName), avStyle:avSt(c.ownerName), arcIcon:c.archived?'utility:undelete':'utility:archive', arcLabel:c.archived?'Unarchive':'Archive', cardClass:'kcard'+(c.archived?' card-arc':'')+(this.draggedId===c.id?' card-drag':'') }));
            return { stageName:col.stageName, cardCount:col.cardCount||0, totalFormatted:fmt(col.totalAmount), showTotal:col.totalAmount>0, isEmpty:(col.cards||[]).length===0, isDragOver:isOver, colClass:'kcol'+(isCan?' col-can':'')+(isOver?' col-ov':''), accentStyle:`border-top:3px solid ${colour};`, accentBarStyle:`background:${colour};`, dotStyle:`background:${colour};`, cards };
        });
    }

    handleSearch(e)   { this.searchTerm     = e.target.value; }
    clearSearch()     { this.searchTerm     = ''; }
    handleAssignee(e) { this.assigneeFilter = e.target.value; }
    handleArchived(e) { this.showArchived   = e.target.checked; }
    handleRefresh()   { this.doRefresh(); }
    handleCardClick(e) { const id=e.currentTarget.dataset.id; if(id) this[NavigationMixin.Navigate]({type:'standard__recordPage',attributes:{recordId:id,actionName:'view'}}); }
    handleArchiveClick(e) { e.stopPropagation(); const id=e.currentTarget.dataset.id; const arc=e.currentTarget.dataset.archived==='true'; archiveOpportunity({opportunityId:id,archived:!arc}).then(()=>{this.showToast(arc?'Unarchived':'Archived');this.doRefresh();}).catch(err=>this.showToast(err.body?.message||'Error','error')); }
    handleDragStart(e) { this.draggedId=e.currentTarget.dataset.id; e.dataTransfer.setData('text/plain',this.draggedId); }
    handleDragEnd()    { this.draggedId=null; this.dragOverStage=null; }
    handleDragEnter(e) { e.preventDefault(); this.dragOverStage=e.currentTarget.dataset.stage; }
    handleDragOver(e)  { e.preventDefault(); e.dataTransfer.dropEffect='move'; }
    handleDragLeave(e) { if(!e.currentTarget.contains(e.relatedTarget)) this.dragOverStage=null; }
    handleDrop(e) {
        e.preventDefault();
        const targetStage = e.currentTarget.dataset.stage;
        const cardId = e.dataTransfer.getData('text/plain')||this.draggedId;
        this.draggedId=null; this.dragOverStage=null;
        if(!cardId||!targetStage) return;
        let sourceStage=null,movedCard=null;
        for(const col of this.rawColumns){ const found=(col.cards||[]).find(c=>c.id===cardId); if(found){sourceStage=col.stageName;movedCard=found;break;} }
        if(!sourceStage||sourceStage===targetStage) return;
        this.rawColumns=this.rawColumns.map(col=>{ if(col.stageName===sourceStage){const cards=(col.cards||[]).filter(c=>c.id!==cardId);return{...col,cards,cardCount:cards.length};} if(col.stageName===targetStage){const cards=[{...movedCard,stageName:targetStage},...(col.cards||[])];return{...col,cards,cardCount:cards.length};} return col; });
        updateOpportunityStage({opportunityId:cardId,newStageName:targetStage}).then(()=>{this.showToast(`Moved to "${targetStage}"`);this.doRefresh();}).catch(err=>{this.showToast(err.body?.message||'Move failed','error');this.doRefresh();});
    }

    /* ══ Vendor Availability getters ═════════════════════════════════════ */
    get vaFilteredVendors() {
        const q = this.vaSearch.toLowerCase();
        return VA_VENDORS
            .filter(v => (this.vaFilter==='all'||v.status===this.vaFilter) && (!q||(v.name.toLowerCase().includes(q)||v.address.toLowerCase().includes(q))))
            .map(v => {
                const [fg,bg] = VA_AV_COLS[(v.id-1)%VA_AV_COLS.length];
                return { ...v, initials:ini(v.name), avStyle:`background:${bg};color:${fg};`, badgeStyle:vaBadgeStyle(v.status), statusLabel:vaStatusLabel(v.status), itemCls:'va-vendor-item'+(this.activeVendorId===v.id?' sel':'') };
            });
    }
    get vaFilteredCount() { return this.vaFilteredVendors.length; }
    get vaFilterAll()     { return 'va-filter-tab'+(this.vaFilter==='all'?' on':''); }
    get vaFilterAvail()   { return 'va-filter-tab'+(this.vaFilter==='available'?' on':''); }
    get vaFilterPend()    { return 'va-filter-tab'+(this.vaFilter==='pending'?' on':''); }
    get vaFilterUnavail() { return 'va-filter-tab'+(this.vaFilter==='unavailable'?' on':''); }

    get activeVendor() {
        if (!this.activeVendorId) return null;
        const v = VA_VENDORS.find(x=>x.id===this.activeVendorId);
        if (!v) return null;
        const [fg,bg] = VA_AV_COLS[(v.id-1)%VA_AV_COLS.length];
        const nc = VA_NEXT_CALLS[v.id];
        const parts = nc ? nc.split('—') : [];
        return { ...v, initials:ini(v.name), iconStyle:`background:${fg};`, badgeStyle:vaBadgeStyle(v.status), statusLabel:vaStatusLabel(v.status), nextCall:!!nc, nextCallDate:parts[0]?.trim()||'', nextCallTime:parts[1]?.trim()||'', hasCalls:v.calls>0 };
    }

    get activeVendorSlots() {
        if (!this.activeVendorId) return [];
        const slots = VA_SLOTS[this.activeVendorId] || [];
        return slots.map((s,i) => ({
            key:'slot-'+i, dateStr:`Apr ${String(s.d).padStart(2,'0')}, 2025`,
            time:s.t, label:vaSlotLabel(s.s), badgeStyle:vaSlotBadge(s.s)
        }));
    }
    get noSlots() { return this.activeVendorSlots.length === 0; }

    get calMonthLabel() { return `${MONTHS[this.calMonth]} ${this.calYear}`; }
    get calCells() {
        const slots = VA_SLOTS[this.activeVendorId] || [];
        const slotMap = {};
        slots.forEach(s => slotMap[s.d] = s.s);
        let startDow = new Date(this.calYear, this.calMonth, 1).getDay();
        startDow = startDow===0 ? 6 : startDow-1;
        const daysInMonth = new Date(this.calYear, this.calMonth+1, 0).getDate();
        const today = new Date();
        const cells = [];
        for (let e=0; e<startDow; e++) cells.push({ key:'e'+e, cls:'sf-day empty', label:'', day:null });
        for (let d=1; d<=daysInMonth; d++) {
            const s = slotMap[d];
            let cls = 'sf-day' + (s ? ' '+s : '');
            if (d===today.getDate() && this.calMonth===today.getMonth() && this.calYear===today.getFullYear()) cls += ' today';
            if (this.selectedCalDay===d) cls += ' sel';
            cells.push({ key:'d'+d, cls, label:String(d), day:d });
        }
        return cells;
    }

    handleVaSearch(e)  { this.vaSearch = e.target.value; }
    setVaFilter(e)     { this.vaFilter = e.currentTarget.dataset.filter; }
    selectVendor(e)    { this.activeVendorId = parseInt(e.currentTarget.dataset.id, 10); this.selectedCalDay = null; }
    calPrev()          { if(this.calMonth===0){this.calMonth=11;this.calYear--;}else{this.calMonth--;} }
    calNext()          { if(this.calMonth===11){this.calMonth=0;this.calYear++;}else{this.calMonth++;} }
    handleCalClick(e)  { const d=parseInt(e.currentTarget.dataset.day,10); if(d) this.selectedCalDay = (this.selectedCalDay===d?null:d); }
    handleVaSchedule() { this.showToast('Schedule Call opened'); }
    handleVaNew()      { this.showToast('Form opened'); }

    /* ══ Toast ═══════════════════════════════════════════════════════════ */
    showToast(msg, type='success') {
        clearTimeout(this.toastTimer);
        this.toastMessage=msg; this.toastType=type; this.toastVisible=true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.toastTimer=setTimeout(()=>{this.toastVisible=false;},3000);
    }
    get toastClass() { return 'toast toast-'+this.toastType; }
    get toastIcon()  { return this.toastType==='success'?'utility:success':'utility:error'; }
}