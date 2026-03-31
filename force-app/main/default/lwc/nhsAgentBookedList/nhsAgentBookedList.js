import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAgentBookedApplications from '@salesforce/apex/AgentBookedListController.getAgentBookedApplications';

const PAGE_SIZE = 15;

function ini(name) {
    if (!name) return '??';
    const p = name.trim().split(' ');
    return (p[0][0] + (p.length > 1 ? p[p.length-1][0] : '')).toUpperCase();
}

function fmtDt(dt) {
    if (!dt) return 'No appt set';
    const d = new Date(dt);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
}

function fmtDate(d) {
    if (!d) return 'TBC';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function todayStr() {
    const d = new Date(); d.setHours(0,0,0,0);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addWorkingDays(startDate, hours) {
    const d = new Date(startDate);
    let remaining = hours;
    while (remaining > 0) {
        d.setHours(d.getHours() + 1);
        const dow = d.getDay();
        if (dow === 0) { d.setDate(d.getDate() + 1); d.setHours(9,0,0,0); continue; }
        if (dow === 6) { d.setDate(d.getDate() + 2); d.setHours(9,0,0,0); continue; }
        remaining--;
    }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default class NhsAgentBookedList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track activeFilter = 'all';
    @track timeFilter = '';
    @track currentPage = 1;
    isLoading = true;

    _deadline24h;
    _deadline48h;
    _today;
    _tomorrow;

    connectedCallback() {
        const now = new Date();
        this._today = todayStr();
        const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
        this._tomorrow = `${tmr.getFullYear()}-${String(tmr.getMonth()+1).padStart(2,'0')}-${String(tmr.getDate()).padStart(2,'0')}`;
        this._deadline24h = addWorkingDays(now, 24);
        this._deadline48h = addWorkingDays(now, 48);
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        getAgentBookedApplications({ searchTerm: this.searchTerm, filterStatus: this.activeFilter })
            .then(result => {
                this.allApps = (result || []).map(app => {
                    const na = app.nextAvailDate || null;
                    let availBadgeClass = 'avail-badge avail-tbc';
                    let urgency = '';
                    if (na) {
                        if (na === this._today) { availBadgeClass = 'avail-badge avail-urgent'; urgency = 'Today'; }
                        else if (na === this._tomorrow) { availBadgeClass = 'avail-badge avail-gold'; urgency = 'Tomorrow'; }
                        else if (na <= this._deadline24h) { availBadgeClass = 'avail-badge avail-gold'; urgency = 'Within 24h'; }
                        else if (na <= this._deadline48h) { availBadgeClass = 'avail-badge avail-gold'; urgency = 'Within 48h'; }
                        else { availBadgeClass = 'avail-badge avail-normal'; urgency = ''; }
                    }
                    return {
                        ...app,
                        agent1Booked: !!app.agent1Id && !!app.agent1Date,
                        agent2Booked: !!app.agent2Id && !!app.agent2Date,
                        agent3Booked: !!app.agent3Id && !!app.agent3Date,
                        agent1Init: ini(app.agent1Name),
                        agent2Init: ini(app.agent2Name),
                        agent3Init: ini(app.agent3Name),
                        agent1DateFmt: fmtDt(app.agent1Date),
                        agent2DateFmt: fmtDt(app.agent2Date),
                        agent3DateFmt: fmtDt(app.agent3Date),
                        statusClass: app.bookedCount === 3 ? 'status-badge all-booked' : 'status-badge pending',
                        nextAvailStr: na,
                        nextAvailDisplay: na ? fmtDate(na) : 'Not set',
                        availBadgeClass,
                        availUrgency: urgency
                    };
                });
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                this.isLoading = false;
            });
    }

    get count24h() { return this.allApps.filter(a => a.nextAvailStr && a.nextAvailStr <= this._deadline24h).length; }
    get count48h() { return this.allApps.filter(a => a.nextAvailStr && a.nextAvailStr <= this._deadline48h).length; }

    get filteredApps() {
        let apps = this.allApps;
        if (this.activeFilter === 'booked') apps = apps.filter(a => a.bookedCount === 3);
        else if (this.activeFilter === 'pending') apps = apps.filter(a => a.bookedCount < 3);

        if (this.timeFilter === '24h') apps = apps.filter(a => a.nextAvailStr && a.nextAvailStr <= this._deadline24h);
        else if (this.timeFilter === '48h') apps = apps.filter(a => a.nextAvailStr && a.nextAvailStr <= this._deadline48h);

        return apps;
    }

    get displayedApps() {
        const start = (this.currentPage - 1) * PAGE_SIZE;
        return this.filteredApps.slice(start, start + PAGE_SIZE);
    }

    get hasApps() { return this.displayedApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get allBookedCount() { return this.allApps.filter(a => a.bookedCount === 3).length; }
    get pendingCount() { return this.allApps.filter(a => a.bookedCount < 3).length; }
    get filteredCount() { return this.filteredApps.length; }

    get filterAllClass() { return 'ftag' + (this.activeFilter === 'all' && !this.timeFilter ? ' active' : ''); }
    get filterBookedClass() { return 'ftag' + (this.activeFilter === 'booked' ? ' active' : ''); }
    get filterPendingClass() { return 'ftag' + (this.activeFilter === 'pending' ? ' active' : ''); }
    get filter24hClass() { return 'ftag ftag-time' + (this.timeFilter === '24h' ? ' active' : ''); }
    get filter48hClass() { return 'ftag ftag-time' + (this.timeFilter === '48h' ? ' active' : ''); }

    get totalPages() { return Math.ceil(this.filteredCount / PAGE_SIZE) || 1; }
    get showPaging() { return this.filteredCount > PAGE_SIZE; }
    get pageStart() { return ((this.currentPage - 1) * PAGE_SIZE) + 1; }
    get pageEnd() { return Math.min(this.currentPage * PAGE_SIZE, this.filteredCount); }
    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }
    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

    handleRefresh() { this.loadData(); }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => { this.loadData(); }, 400);
    }

    handleFilter(event) {
        this.activeFilter = event.currentTarget.dataset.filter;
        this.timeFilter = '';
        this.currentPage = 1;
    }

    handleTimeFilter(event) {
        const f = event.currentTarget.dataset.filter;
        this.timeFilter = this.timeFilter === f ? '' : f;
        this.currentPage = 1;
    }

    handleRowClick(event) {
        const appId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: appId, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }
}
