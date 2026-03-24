import { LightningElement, track } from 'lwc';

// ── Colour map for assignee circles ────────────────────────────────
const ASSIGNEE_COLOURS = {
    'Akash G':    { bg: '#DCE8FF', text: '#1A4FCC' },
    'Deepak Rana':{ bg: '#E1F5EE', text: '#0F6E56' },
    'Gokul A':    { bg: '#FAEEDA', text: '#854F0B' },
    'Shalom I':   { bg: '#FAECE7', text: '#993C1D' },
    'default':    { bg: '#F3F4F6', text: '#374151' },
};

// ── Stage colour accents ────────────────────────────────────────────
const STAGE_COLOURS = {
    'New':               '#6B7280',
    'Valuation Booked':  '#1A4FCC',
    'Offer Made':        '#F59E0B',
    'Under Offer':       '#8B5CF6',
    'Exchanged':         '#00B8CC',
    'Completed':         '#059669',
};

const STAGES = ['New','Valuation Booked','Offer Made','Under Offer','Exchanged','Completed'];

// ── Seed data ──────────────────────────────────────────────────────
const SEED_CARDS = [
    { id:'c1',  title:'42 Birchwood Drive',       amount:285000, stage:'New',              assignee:'Akash G',     dueDateRaw:'2026-04-10', priority:'Low'    },
    { id:'c2',  title:'17 Oakfield Crescent',     amount:620000, stage:'New',              assignee:'Deepak Rana', dueDateRaw:'2026-03-28', priority:'High'   },
    { id:'c3',  title:'8 Primrose Lane',           amount:312500, stage:'New',              assignee:'Gokul A',     dueDateRaw:'2026-04-15', priority:'Medium' },
    { id:'c4',  title:'Rosewood Heights Plot 3',   amount:198000, stage:'New',              assignee:'Shalom I',    dueDateRaw:'2026-05-01', priority:'Low'    },
    { id:'c5',  title:'55 Maple Road',             amount:430000, stage:'Valuation Booked', assignee:'Akash G',     dueDateRaw:'2026-03-25', priority:'Medium' },
    { id:'c6',  title:'The Willows, Unit 7',       amount:267000, stage:'Valuation Booked', assignee:'Deepak Rana', dueDateRaw:'2026-04-02', priority:'Low'    },
    { id:'c7',  title:'Lakeside Manor',            amount:875000, stage:'Valuation Booked', assignee:'Akash G',     dueDateRaw:'2026-03-22', priority:'High'   },
    { id:'c8',  title:'2 Cedar Close',             amount:342000, stage:'Offer Made',       assignee:'Gokul A',     dueDateRaw:'2026-04-08', priority:'Medium' },
    { id:'c9',  title:'19 Highfield Avenue',       amount:495000, stage:'Offer Made',       assignee:'Akash G',     dueDateRaw:'2026-03-30', priority:'Medium' },
    { id:'c10', title:'Plot 12 Greenfield Park',   amount:221000, stage:'Offer Made',       assignee:'Shalom I',    dueDateRaw:'2026-04-20', priority:'Low'    },
    { id:'c11', title:'Thornbury Place',           amount:310000, stage:'Offer Made',       assignee:'Deepak Rana', dueDateRaw:'2026-04-12', priority:'Medium' },
    { id:'c12', title:'The Grange Estate',         amount:1200000,stage:'Offer Made',       assignee:'Akash G',     dueDateRaw:'2026-03-26', priority:'High'   },
    { id:'c13', title:'Sundown Cottage',           amount:390000, stage:'Under Offer',      assignee:'Gokul A',     dueDateRaw:'2026-04-05', priority:'Medium' },
    { id:'c14', title:'31 Beech Grove',            amount:512000, stage:'Under Offer',      assignee:'Akash G',     dueDateRaw:'2026-03-29', priority:'High'   },
    { id:'c15', title:'Heatherfield, Lot 2',       amount:288000, stage:'Under Offer',      assignee:'Shalom I',    dueDateRaw:'2026-04-18', priority:'Low'    },
    { id:'c16', title:'Kensington Heights, PH',    amount:2100000,stage:'Exchanged',        assignee:'Deepak Rana', dueDateRaw:'2026-03-31', priority:'High'   },
    { id:'c17', title:'7 Wentworth Close',         amount:365000, stage:'Exchanged',        assignee:'Akash G',     dueDateRaw:'2026-04-03', priority:'Medium' },
    { id:'c18', title:'3 Lavender Way',            amount:299000, stage:'Completed',        assignee:'Gokul A',     dueDateRaw:'2026-03-20', priority:'Low'    },
    { id:'c19', title:'9 Juniper Court',           amount:415000, stage:'Completed',        assignee:'Akash G',     dueDateRaw:'2026-03-18', priority:'Medium' },
];

// ── Helpers ────────────────────────────────────────────────────────
const fmt = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'k' : String(n);

const initials = name => name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';

const assigneeStyle = name => {
    const c = ASSIGNEE_COLOURS[name] || ASSIGNEE_COLOURS['default'];
    return `background:${c.bg};color:${c.text};`;
};

const isOverdue = raw => {
    if (!raw) return false;
    return new Date(raw) < new Date(new Date().toDateString());
};

const fmtDate = raw => {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
};

export default class NhsPipelineBoard extends LightningElement {

    @track currentView = 'kanban';
    @track searchTerm  = '';
    @track filterPriority = '';
    @track filterDateFrom = '';
    @track filterDateTo   = '';
    @track cards = JSON.parse(JSON.stringify(SEED_CARDS));
    @track draggedCardId = null;
    @track dragOverStage = null;
    @track showPanel = false;
    @track selectedCard = {};
    @track toastVisible = false;
    @track toastMessage = '';
    @track toastType = 'success';

    // ── View ──────────────────────────────────────────────────────
    get isKanbanView() { return this.currentView === 'kanban'; }
    get kanbanBtnClass() { return 'toggle-btn' + (this.currentView === 'kanban' ? ' active' : ''); }
    get tableBtnClass()  { return 'toggle-btn' + (this.currentView === 'table'  ? ' active' : ''); }

    handleKanbanView() { this.currentView = 'kanban'; }
    handleTableView()  { this.currentView = 'table';  }

    // ── Filters ───────────────────────────────────────────────────
    handleSearch(e)        { this.searchTerm      = e.target.value; }
    clearSearch()          { this.searchTerm      = ''; }
    handlePriorityFilter(e){ this.filterPriority  = e.target.value; }
    handleDateFrom(e)      { this.filterDateFrom  = e.target.value; }
    handleDateTo(e)        { this.filterDateTo    = e.target.value; }

    get filteredCards() {
        const q = this.searchTerm.toLowerCase();
        return this.cards.filter(c => {
            if (q && !c.title.toLowerCase().includes(q)) return false;
            if (this.filterPriority && c.priority !== this.filterPriority) return false;
            if (this.filterDateFrom && c.dueDateRaw < this.filterDateFrom) return false;
            if (this.filterDateTo   && c.dueDateRaw > this.filterDateTo)   return false;
            return true;
        });
    }

    // ── Decorate a raw card for the template ──────────────────────
    decorateCard(c, stage) {
        const overdue = isOverdue(c.dueDateRaw);
        const prio = c.priority;
        return {
            ...c,
            stage: stage || c.stage,
            amountFormatted: fmt(c.amount),
            assigneeInitials: initials(c.assignee),
            assigneeStyle: assigneeStyle(c.assignee),
            dueDate: fmtDate(c.dueDateRaw),
            dueDateClass: 'card-due' + (overdue ? ' overdue' : ''),
            priorityBarClass: 'priority-bar priority-' + prio.toLowerCase(),
            priorityBadgeClass: 'priority-badge badge-' + prio.toLowerCase(),
            cardClass: 'nhs-card' + (c.id === this.draggedCardId ? ' dragging' : ''),
            isHigh:   prio === 'High',
            isMedium: prio === 'Medium',
            isLow:    prio === 'Low',
        };
    }

    // ── Columns ───────────────────────────────────────────────────
    get columns() {
        const fc = this.filteredCards;
        return STAGES.map(stage => {
            const stageCards = fc.filter(c => c.stage === stage).map(c => this.decorateCard(c, stage));
            const total = stageCards.reduce((s, c) => s + c.amount, 0);
            const isDragOver = this.dragOverStage === stage;
            return {
                stage,
                cards: stageCards,
                cardCount: stageCards.length,
                totalFormatted: fmt(total),
                isEmpty: stageCards.length === 0,
                isDragOver,
                columnClass: 'nhs-column' + (isDragOver ? ' drag-over' : ''),
                headerStyle: `border-top: 3px solid ${STAGE_COLOURS[stage] || '#6B7280'};`,
            };
        });
    }

    // ── All cards for table view ──────────────────────────────────
    get allCards() {
        return this.filteredCards.map(c => this.decorateCard(c));
    }

    // ── Summary ───────────────────────────────────────────────────
    get totalCards() { return this.filteredCards.length; }
    get totalFormatted() { return fmt(this.filteredCards.reduce((s,c) => s + c.amount, 0)); }

    // ── Drag & drop ───────────────────────────────────────────────
    handleDragStart(e) {
        this.draggedCardId = e.currentTarget.dataset.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedCardId);
    }
    handleDragEnd() {
        this.draggedCardId = null;
        this.dragOverStage = null;
    }
    handleDragEnter(e) {
        e.preventDefault();
        this.dragOverStage = e.currentTarget.dataset.stage;
    }
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    handleDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            this.dragOverStage = null;
        }
    }
    handleDrop(e) {
        e.preventDefault();
        const targetStage = e.currentTarget.dataset.stage;
        const cardId = e.dataTransfer.getData('text/plain') || this.draggedCardId;
        if (cardId && targetStage) {
            const idx = this.cards.findIndex(c => c.id === cardId);
            if (idx > -1 && this.cards[idx].stage !== targetStage) {
                const prev = this.cards[idx].stage;
                this.cards = this.cards.map(c => c.id === cardId ? {...c, stage: targetStage} : c);
                this.showToast(`Moved to "${targetStage}"`, 'success');
            }
        }
        this.draggedCardId = null;
        this.dragOverStage = null;
    }

    // ── Quick-edit panel ──────────────────────────────────────────
    handleCardClick(e) {
        if (e.target.classList.contains('card-body') || e.target.closest('.card-body') ||
            e.target.classList.contains('nhs-card') || e.target.classList.contains('table-row') ||
            e.target.closest('.table-row')) {
            const cardId = e.currentTarget.dataset.id;
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                this.selectedCard = this.decorateCard(card);
                this.showPanel = true;
            }
        }
    }

    get stageOptions() {
        return STAGES.map(s => ({ value: s, label: s, isSelected: s === this.selectedCard.stage }));
    }

    handleFieldChange(e) {
        const field = e.target.dataset.field;
        const val   = field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value;
        this.selectedCard = { ...this.selectedCard, [field]: val };
        if (field === 'amount') this.selectedCard.amountFormatted = fmt(val);
    }

    handleStageChange(e) {
        this.selectedCard = { ...this.selectedCard, stage: e.target.value };
    }

    saveCard() {
        this.cards = this.cards.map(c => c.id === this.selectedCard.id ? {
            ...c,
            title:      this.selectedCard.title,
            amount:     this.selectedCard.amount,
            assignee:   this.selectedCard.assignee,
            dueDateRaw: this.selectedCard.dueDateRaw,
            priority:   this.selectedCard.priority,
            stage:      this.selectedCard.stage,
        } : c);
        this.showPanel = false;
        this.showToast('Changes saved', 'success');
    }

    closePanel() { this.showPanel = false; }

    // ── Toast ─────────────────────────────────────────────────────
    showToast(msg, type = 'success') {
        this.toastMessage = msg;
        this.toastType    = type;
        this.toastVisible = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.toastVisible = false; }, 2800);
    }
    get toastClass() { return 'nhs-toast toast-' + this.toastType; }
}