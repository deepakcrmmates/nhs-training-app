import { LightningElement, api, track } from 'lwc';
import { transformAndFilterData, groupByStage } from 'c/kanbanDataAdapter';
import { showToast } from 'c/toastService';
import { KanbanDataAdapter } from 'c/kanbanDataAdapter';
import { ConfigService } from 'c/configService';

// WHY: Root container = orchestration + state management

export default class KanbanBoard extends LightningElement {

    // 🔥 External input
    _records = [];
    @api
    set records(value) {
        this._records = Array.isArray(value) ? value : [];
        this.processData();
    }
    get records() {
        return this._records;
    }

    @api config;

    // 🔥 UI state
    @track columns = [];
    @track viewType = 'KANBAN';

    // 🔥 Flat data cache (for table view)
    processedData = [];

    connectedCallback() {
        // 🔥 Normalize config once
        this.config = ConfigService.mergeConfig(this.config);
        this.processData();
    }

    // 🔥 SINGLE SOURCE OF TRUTH PIPELINE
    processData() {
    if (!this.records?.length) {
        this.columns = [];
        this.processedData = [];
        return;
    }

    const transformed = KanbanDataAdapter.transformAndFilter(
        this.records,
        this.config,
        this.mapping
    );

    this.processedData = transformed;
    this.columns = KanbanDataAdapter.groupByStage(transformed);
}

    // 🔄 View Switch
    handleViewChange(event) {
        this.viewType = event.detail;
    }

    // 📅 Date Filter
    handleDateFilter(event) {
        this.config = {
            ...this.config,
            dateFilter: event.detail
        };

        this.processData();
    }

    // 🔍 Search (board-level fallback)
    handleSearch(event) {
        if (!ConfigService.isEnabled(this.config, 'enableSearch')) return;

        const keyword = event.detail?.toLowerCase();

        if (!keyword) {
            this.processData(); // reset via pipeline
            return;
        }

        const filtered = this.processedData.filter(rec =>
            rec.title?.toLowerCase().includes(keyword)
        );

        this.columns = groupByStage(filtered);
    }

    // 🔥 Drag & Drop (Optimistic UI)
    handleCardDrop(event) {
        if (!ConfigService.isEnabled(this.config, 'enableDragDrop')) return;

        const { recordId, sourceStage, targetStage } = event.detail;

        let movedRecord;

        const updatedColumns = this.columns.map(col => {

            // Remove from source
            if (col.stage === sourceStage) {
                const remaining = col.records.filter(rec => {
                    if (rec.id === recordId) {
                        movedRecord = rec;
                        return false;
                    }
                    return true;
                });

                return { ...col, records: remaining };
            }

            // Add to target
            if (col.stage === targetStage && movedRecord) {
                const updatedRecord = {
                    ...movedRecord,
                    stage: targetStage
                };

                return {
                    ...col,
                    records: [updatedRecord, ...col.records]
                };
            }

            return col;
        });

        this.columns = updatedColumns;

        // 🔥 Also update flat data (table consistency)
        this.processedData = this.processedData.map(rec =>
            rec.id === recordId
                ? { ...rec, stage: targetStage }
                : rec
        );

        // 🔥 Toast
        showToast(this, 'Success', 'Stage Updated');

        // 🔥 Backend hook
        this.dispatchEvent(new CustomEvent('update', {
            detail: { recordId, targetStage }
        }));
    }

    // 🔥 View Getters
    get isKanban() {
        return this.viewType === 'KANBAN';
    }

    get isTable() {
        return this.viewType === 'TABLE';
    }

    get flatData() {
        return this.processedData;
    }
}