import { LightningElement, api, track } from 'lwc';
import { ScrollService } from 'c/scrollService';
import { ConfigService } from 'c/configService';

export default class KanbanColumn extends LightningElement {

    @api stage;

    // 🔥 Reactive records
    _records = [];
    @api
    set records(value) {
        this._records = Array.isArray(value) ? value : [];
        this.initialize();
    }
    get records() {
        return this._records;
    }

    @api config;

    // 🔥 UI state
    @track visibleRecords = [];

    // 🔥 Internal state
    originalRecords = [];
    processedCache = [];
    searchKey = '';

    // 🔥 Virtual scroll config
    itemHeight = 80;       // approx card height
    containerHeight = 400; // must match CSS
    buffer = 5;

    startIndex = 0;
    endIndex = 20;

    debounceTimeout;

    connectedCallback() {
        this.initialize();
    }

    disconnectedCallback() {
        clearTimeout(this.debounceTimeout);
    }

    // 🔥 INIT
    initialize() {
        this.originalRecords = [...this.records];
        this.processedCache = this.processData(this.originalRecords);

        this.updateVisibleRecords();
    }

    // 🔥 PROCESS PIPELINE
    processData(data) {
        let result = [...data];

        result = ConfigService.filterData(
            result,
            this.searchKey,
            this.config
        );

        result = ConfigService.sortData(
            result,
            this.config
        );

        return result;
    }

    // 🔍 SEARCH
    handleSearch(event) {
        if (!ConfigService.isEnabled(this.config, 'enableSearch')) return;

        const value = event.target.value?.toLowerCase() || '';

        clearTimeout(this.debounceTimeout);

        this.debounceTimeout = setTimeout(() => {
            this.searchKey = value;
            this.recompute();
        }, 300);
    }

    // 🔃 SORT
    handleSort() {
        if (!ConfigService.isEnabled(this.config, 'enableSort')) return;

        const dir = this.config.sortConfig?.direction || 'asc';

        this.config = {
            ...this.config,
            sortConfig: {
                ...this.config.sortConfig,
                direction: dir === 'asc' ? 'desc' : 'asc'
            }
        };

        this.recompute();
    }

    // 🔄 RECOMPUTE
    recompute() {
        this.processedCache = this.processData(this.originalRecords);

        this.startIndex = 0;
        this.endIndex = 20;

        this.updateVisibleRecords();
    }

    // 🔥 CORE: Virtual Window Update
    updateVisibleRecords() {
        this.visibleRecords = this.processedCache.slice(
            this.startIndex,
            this.endIndex
        );
    }

    // 📜 SCROLL (THROTTLED + VIRTUAL)
    handleScroll(event) {
        if (!ConfigService.isEnabled(this.config, 'enableInfiniteScroll')) return;

        const container = event.target;

        ScrollService.throttle(() => {

            const { start, end } = ScrollService.getVisibleRange(
                container.scrollTop,
                this.itemHeight,
                this.containerHeight,
                this.buffer
            );

            this.startIndex = start;
            this.endIndex = end;

            this.updateVisibleRecords();

        }, 100);
    }
}