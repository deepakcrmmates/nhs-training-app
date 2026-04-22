import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getProjectPlans from '@salesforce/apex/NhsProjectPlanController.getProjectPlans';
import getTasks from '@salesforce/apex/NhsProjectPlanController.getTasks';
import saveTask from '@salesforce/apex/NhsProjectPlanController.saveTask';
import updateTaskPriority from '@salesforce/apex/NhsProjectPlanController.updateTaskPriority';
import updateTaskStatus from '@salesforce/apex/NhsProjectPlanController.updateTaskStatus';
import deleteTaskApex from '@salesforce/apex/NhsProjectPlanController.deleteTask';
import saveProjectPlan from '@salesforce/apex/NhsProjectPlanController.saveProjectPlan';

const PRIORITIES = [
    { key: 'Critical', label: 'Critical', headerClass: 'col-header col-critical' },
    { key: 'High',     label: 'High',     headerClass: 'col-header col-high' },
    { key: 'Medium',   label: 'Medium',   headerClass: 'col-header col-medium' },
    { key: 'Low',      label: 'Low',      headerClass: 'col-header col-low' }
];

export default class NhsProjectPlanKanban extends LightningElement {
    @track projectPlans = [];
    @track selectedPlanId = null;
    @track tasks = [];
    @track activeTab = 'active'; // 'active' | 'history'
    @track isLoading = false;
    @track showTaskModal = false;
    @track editingTask = null;
    @track showPlanModal = false;
    @track editingPlan = null;
    _wiredPlans;
    _dragTaskId = null;

    @wire(getProjectPlans)
    wiredPlans(result) {
        this._wiredPlans = result;
        if (result.data) {
            this.projectPlans = result.data;
            if (!this.selectedPlanId && result.data.length > 0) {
                this.selectedPlanId = result.data[0].Id;
                this.loadTasks();
            }
        }
    }

    get planOptions() {
        return this.projectPlans.map(p => ({ label: p.Title__c || p.Name, value: p.Id }));
    }

    get isActiveTab() { return this.activeTab === 'active'; }
    get isHistoryTab() { return this.activeTab === 'history'; }
    get activeTabClass() { return 'tab-btn' + (this.activeTab === 'active' ? ' tab-active' : ''); }
    get historyTabClass() { return 'tab-btn' + (this.activeTab === 'history' ? ' tab-active' : ''); }

    get hasPlans() { return this.projectPlans.length > 0; }
    get currentPlan() {
        return this.projectPlans.find(p => p.Id === this.selectedPlanId);
    }
    get currentPlanTitle() {
        return this.currentPlan ? (this.currentPlan.Title__c || this.currentPlan.Name) : '';
    }

    get priorityColumns() {
        return PRIORITIES.map(p => {
            const colTasks = this.tasks.filter(t => (t.Priority__c || 'Medium') === p.key);
            return {
                ...p,
                key: 'col-' + p.key,
                priority: p.key,
                count: colTasks.length,
                tasks: colTasks.map(t => this._buildTaskVm(t)),
                columnClass: 'kanban-col kanban-col-' + p.key.toLowerCase()
            };
        });
    }

    get historyTasks() {
        return this.tasks.map(t => this._buildTaskVm(t));
    }

    get hasHistory() { return this.tasks.length > 0; }

    _buildTaskVm(t) {
        const catKey = (t.Category__c || 'Feature').replace(/\s+/g, '-').toLowerCase();
        const statusClass = 'task-status task-status-' + (t.Status__c || 'ToDo').replace(/\s+/g, '-').toLowerCase();
        const categoryClass = 'task-category task-cat-' + catKey;
        const landed = this._justDroppedId === t.Id ? ' task-card-landed' : '';
        const cardClass = 'task-card task-card-' + catKey + landed;
        const completedLabel = t.Completed_Date__c ? this._fmtDate(t.Completed_Date__c) : '';
        const dueLabel = t.Due_Date__c ? this._fmtDate(t.Due_Date__c) : '';
        const isOverdue = t.Due_Date__c && new Date(t.Due_Date__c) < new Date() && t.Status__c !== 'Done' && t.Status__c !== 'Cancelled';
        return {
            ...t,
            cardClass,
            statusClass,
            categoryClass,
            completedLabel,
            dueLabel,
            isOverdue,
            overdueClass: isOverdue ? 'due-overdue' : '',
            hasAssignee: !!t.Assigned_To__c,
            hasDue: !!t.Due_Date__c,
            hasCategory: !!t.Category__c
        };
    }

    _fmtDate(dateStr) {
        const d = new Date(dateStr);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    async loadTasks() {
        if (!this.selectedPlanId) return;
        this.isLoading = true;
        try {
            const includeClosed = this.activeTab === 'history';
            this.tasks = await getTasks({ projectPlanId: this.selectedPlanId, includeClosed });
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed to load tasks', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handlePlanChange(event) {
        this.selectedPlanId = event.detail.value;
        this.loadTasks();
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
        this.loadTasks();
    }

    // Refresh
    @track isRefreshing = false;
    get refreshIconClass() { return this.isRefreshing ? 'ppk-refresh-spin' : ''; }

    async handleRefresh() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        try {
            await Promise.all([
                refreshApex(this._wiredPlans),
                this.loadTasks()
            ]);
            this._toast('Refreshed', 'Plans and tasks reloaded.', 'success');
        } catch (e) {
            this._toast('Refresh failed', e?.body?.message || e?.message || 'Something went wrong', 'error');
        } finally {
            this.isRefreshing = false;
        }
    }

    // Task CRUD
    handleNewTask() {
        this.editingTask = {
            Id: null,
            Title__c: '',
            Description__c: '',
            Priority__c: 'High',
            Status__c: 'To Do',
            Category__c: 'Feature',
            Assigned_To__c: null,
            Due_Date__c: null,
            Notes__c: ''
        };
        this.showTaskModal = true;
    }

    handleEditTask(event) {
        const taskId = event.currentTarget.dataset.id;
        const task = this.tasks.find(t => t.Id === taskId);
        if (task) {
            this.editingTask = { ...task };
            this.showTaskModal = true;
        }
    }

    handleCloseTaskModal() {
        this.showTaskModal = false;
        this.editingTask = null;
    }

    handleTaskFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.editingTask = { ...this.editingTask, [field]: value };
    }

    async handleSaveTask() {
        if (!this.editingTask.Title__c) {
            this._toast('Missing Title', 'Please enter a task title.', 'warning');
            return;
        }
        try {
            await saveTask({
                taskId: this.editingTask.Id,
                projectPlanId: this.selectedPlanId,
                title: this.editingTask.Title__c,
                description: this.editingTask.Description__c,
                priority: this.editingTask.Priority__c,
                status: this.editingTask.Status__c,
                category: this.editingTask.Category__c,
                assignedToId: this.editingTask.Assigned_To__c,
                dueDate: this.editingTask.Due_Date__c,
                notes: this.editingTask.Notes__c
            });
            this._toast('Saved', 'Task saved.', 'success');
            this.showTaskModal = false;
            this.editingTask = null;
            this.loadTasks();
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed to save task', 'error');
        }
    }

    async handleDeleteTask() {
        if (!this.editingTask.Id) return;
        if (!confirm('Delete this task?')) return;
        try {
            await deleteTaskApex({ taskId: this.editingTask.Id });
            this._toast('Deleted', 'Task deleted.', 'success');
            this.showTaskModal = false;
            this.editingTask = null;
            this.loadTasks();
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed to delete', 'error');
        }
    }

    async handleQuickStatus(event) {
        event.stopPropagation();
        const taskId = event.currentTarget.dataset.id;
        const newStatus = event.currentTarget.dataset.status;
        try {
            await updateTaskStatus({ taskId, newStatus });
            this.loadTasks();
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed', 'error');
        }
    }

    // Drag & drop
    @track _justDroppedId = null;

    handleDragStart(event) {
        this._dragTaskId = event.currentTarget.dataset.id;
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.classList.add('task-dragging');
    }

    handleDragEnd(event) {
        event.currentTarget.classList.remove('task-dragging');
        this.template.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drop-target-active'));
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drop-target-active');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drop-target-active');
    }

    async handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drop-target-active');
        const newPriority = event.currentTarget.dataset.priority;
        const taskId = this._dragTaskId;
        if (!taskId || !newPriority) return;
        this._dragTaskId = null;

        const task = this.tasks.find(t => t.Id === taskId);
        if (!task || task.Priority__c === newPriority) return;

        const oldPriority = task.Priority__c;
        this.tasks = this.tasks.map(t =>
            t.Id === taskId ? { ...t, Priority__c: newPriority } : t
        );
        this._justDroppedId = taskId;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this._justDroppedId = null; }, 500);

        try {
            await updateTaskPriority({ taskId, newPriority });
        } catch (e) {
            this.tasks = this.tasks.map(t =>
                t.Id === taskId ? { ...t, Priority__c: oldPriority } : t
            );
            this._toast('Error', e.body?.message || 'Failed to move task', 'error');
        }
    }

    // Plan CRUD
    handleNewPlan() {
        this.editingPlan = {
            Id: null,
            Title__c: '',
            Description__c: '',
            Status__c: 'Active',
            Start_Date__c: null,
            Target_End_Date__c: null
        };
        this.showPlanModal = true;
    }

    handleEditPlan() {
        if (!this.currentPlan) return;
        this.editingPlan = { ...this.currentPlan };
        this.showPlanModal = true;
    }

    handleClosePlanModal() {
        this.showPlanModal = false;
        this.editingPlan = null;
    }

    handlePlanFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;
        this.editingPlan = { ...this.editingPlan, [field]: value };
    }

    async handleSavePlan() {
        if (!this.editingPlan.Title__c) {
            this._toast('Missing Title', 'Please enter a plan title.', 'warning');
            return;
        }
        try {
            const planId = await saveProjectPlan({
                planId: this.editingPlan.Id,
                title: this.editingPlan.Title__c,
                description: this.editingPlan.Description__c,
                status: this.editingPlan.Status__c,
                startDate: this.editingPlan.Start_Date__c,
                targetEndDate: this.editingPlan.Target_End_Date__c
            });
            this._toast('Saved', 'Plan saved.', 'success');
            this.showPlanModal = false;
            this.editingPlan = null;
            await refreshApex(this._wiredPlans);
            this.selectedPlanId = planId;
            this.loadTasks();
        } catch (e) {
            this._toast('Error', e.body?.message || 'Failed', 'error');
        }
    }

    // Dropdown options
    get priorityOptions() {
        return [
            { label: 'Critical', value: 'Critical' },
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' }
        ];
    }
    get statusOptions() {
        return [
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Blocked', value: 'Blocked' },
            { label: 'Done', value: 'Done' },
            { label: 'Cancelled', value: 'Cancelled' }
        ];
    }
    get categoryOptions() {
        return [
            { label: 'Bug Fix', value: 'Bug Fix' },
            { label: 'Feature', value: 'Feature' },
            { label: 'Integration', value: 'Integration' },
            { label: 'UX Improvement', value: 'UX Improvement' },
            { label: 'Admin', value: 'Admin' },
            { label: 'Testing', value: 'Testing' }
        ];
    }
    get planStatusOptions() {
        return [
            { label: 'Active', value: 'Active' },
            { label: 'On Hold', value: 'On Hold' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Archived', value: 'Archived' }
        ];
    }

    get isEditingTask() { return !!(this.editingTask && this.editingTask.Id); }
    get isEditingPlan() { return !!(this.editingPlan && this.editingPlan.Id); }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
