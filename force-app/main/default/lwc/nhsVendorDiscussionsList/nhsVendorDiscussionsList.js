import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getVendorDiscussionsApplications from '@salesforce/apex/FinalChecksController.getVendorDiscussionsApplications';
import updateVDPriority from '@salesforce/apex/FinalChecksController.updateVDPriority';
import saveNote from '@salesforce/apex/VendorNoteController.saveNote';

const PRIORITY_OPTIONS = [
    { label: 'New', value: 'New' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
];

const PRIORITY_DOT = {
    'New':    'priority-dot new',
    'High':   'priority-dot high',
    'Medium': 'priority-dot medium',
    'Low':    'priority-dot low',
    '':       'priority-dot new'
};

const PRIORITY_ROW = {
    'New':    'vd-row priority-row-new',
    'High':   'vd-row priority-row-high',
    'Medium': 'vd-row priority-row-medium',
    'Low':    'vd-row priority-row-low',
    '':       'vd-row priority-row-new'
};

const KANBAN_COLS = [
    { key: 'New',    label: 'New',    color: '#10b981', bg: '#f0fdf4', border: '#10b981' },
    { key: 'High',   label: 'High',   color: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
    { key: 'Medium', label: 'Medium', color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b' },
    { key: 'Low',    label: 'Low',    color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' },
];

export default class NhsVendorDiscussionsList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track viewMode = 'list'; // 'list' or 'kanban'
    @track toastMsg = '';
    @track toastType = '';
    @track toastVisible = false;
    @track draggedId = null;
    @track showNoteModal = false;
    @track noteAppId = '';
    @track noteAppName = '';
    @track noteText = '';
    @track noteSaving = false;
    isLoading = true;
    priorityOptions = PRIORITY_OPTIONS;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getVendorDiscussionsApplications({ searchTerm: this.searchTerm })
            .then(result => {
                this.allApps = (result || []).map(app => {
                    const p = app.priority || 'New';
                    return {
                        ...app,
                        priority: p,
                        priorityDotClass: PRIORITY_DOT[p] || PRIORITY_DOT[''],
                        rowClass: PRIORITY_ROW[p] || PRIORITY_ROW['']
                    };
                });
                this.isLoading = false;
            })
            .catch(err => { console.error(err); this.isLoading = false; });
    }

    get hasApps() { return this.allApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get isList() { return this.viewMode === 'list'; }
    get isKanban() { return this.viewMode === 'kanban'; }
    get listBtnClass() { return this.isList ? 'view-toggle active' : 'view-toggle'; }
    get kanbanBtnClass() { return this.isKanban ? 'view-toggle active' : 'view-toggle'; }

    handleListView() { this.viewMode = 'list'; }
    handleKanbanView() { this.viewMode = 'kanban'; }

    handleSearch(e) {
        this.searchTerm = e.target.value;
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this.loadData(), 300);
    }

    handleRefresh() { this.loadData(); }

    handleRowClick(e) {
        const id = e.currentTarget.dataset.id;
        if (id) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: { recordId: id, actionName: 'view' }
            });
        }
    }

    handlePriorityClick(e) { e.stopPropagation(); }

    handlePriorityChange(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const value = e.detail.value;
        updateVDPriority({ opportunityId: id, priority: value })
            .then(() => {
                this.allApps = this.allApps.map(app => {
                    if (app.id === id) {
                        return {
                            ...app,
                            priority: value,
                            priorityDotClass: PRIORITY_DOT[value] || PRIORITY_DOT[''],
                            rowClass: PRIORITY_ROW[value] || PRIORITY_ROW['']
                        };
                    }
                    return app;
                });
                this.showToast('Priority updated', 'success');
            })
            .catch(err => {
                this.showToast(err.body?.message || 'Failed to update', 'error');
            });
    }

    // ── Kanban ──
    get kanbanColumns() {
        return KANBAN_COLS.map(col => {
            const cards = this.allApps.filter(a => a.priority === col.key);
            return {
                ...col,
                cards,
                count: cards.length,
                headerStyle: `border-top: 3px solid ${col.border}; background: ${col.bg};`,
                dotStyle: `background: ${col.color};`,
                isEmpty: cards.length === 0
            };
        });
    }

    handleCardClick(e) {
        const id = e.currentTarget.dataset.id;
        if (id) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: { recordId: id, actionName: 'view' }
            });
        }
    }

    // Drag & Drop
    handleDragStart(e) {
        this.draggedId = e.currentTarget.dataset.id;
        e.dataTransfer.setData('text/plain', this.draggedId);
        e.dataTransfer.effectAllowed = 'move';
    }
    handleDragEnd() { this.draggedId = null; }
    handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    handleDragEnter(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
    handleDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const priority = e.currentTarget.dataset.priority;
        const droppedId = this.draggedId;
        if (!droppedId || !priority) return;
        const app = this.allApps.find(a => a.id === droppedId);
        if (app && app.priority !== priority) {
            // Update locally first for instant feedback
            this.allApps = this.allApps.map(a => {
                if (a.id === droppedId) {
                    return {
                        ...a,
                        priority,
                        priorityDotClass: PRIORITY_DOT[priority] || PRIORITY_DOT[''],
                        rowClass: PRIORITY_ROW[priority] || PRIORITY_ROW['']
                    };
                }
                return a;
            });
            updateVDPriority({ opportunityId: droppedId, priority })
                .then(() => {
                    this.showToast(`Moved to ${priority}`, 'success');
                })
                .catch(err => {
                    this.showToast(err.body?.message || 'Failed', 'error');
                    this.loadData(); // Revert on failure
                });
        }
        this.draggedId = null;
    }

    // ── Quick Notes ──
    handleNoteClick(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        this.noteAppId = id;
        this.noteAppName = name || '';
        this.noteText = '';
        this.showNoteModal = true;
    }

    handleNoteInput(e) { this.noteText = e.detail.value; }

    handleNoteClose() {
        this.showNoteModal = false;
        this.noteAppId = '';
        this.noteAppName = '';
        this.noteText = '';
    }

    handleNoteOverlayClick() { this.handleNoteClose(); }
    handleNoteModalClick(e) { e.stopPropagation(); }

    async handleNoteSave() {
        const text = (this.noteText || '').trim();
        if (!text) {
            this.showToast('Please enter a note', 'error');
            return;
        }
        this.noteSaving = true;
        try {
            await saveNote({ noteText: text, opportunityId: this.noteAppId });
            this.showToast('Note saved', 'success');
            this.handleNoteClose();
        } catch (err) {
            this.showToast(err.body?.message || 'Failed to save note', 'error');
        }
        this.noteSaving = false;
    }

    showToast(msg, type) {
        this.toastMsg = msg;
        this.toastType = type;
        this.toastVisible = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.toastVisible = false; }, 2500);
    }

    get toastClass() {
        return `vd-toast ${this.toastType}${this.toastVisible ? ' show' : ''}`;
    }
}
