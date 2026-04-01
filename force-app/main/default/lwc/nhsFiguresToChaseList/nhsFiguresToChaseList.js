import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFiguresToChaseApplications from '@salesforce/apex/FiguresToChaseController.getFiguresToChaseApplications';

function fmtDt(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
           d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtMoney(v) {
    if (v == null) return '—';
    return Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function isPassed(dt) {
    if (!dt) return false;
    return new Date(dt) < new Date();
}

function isDueIn48h(dt) {
    if (!dt) return false;
    const d = new Date(dt);
    const now = new Date();
    if (d <= now) return false; // already passed
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return d <= deadline;
}

export default class NhsFiguresToChaseList extends NavigationMixin(LightningElement) {
    @track allApps = [];
    @track searchTerm = '';
    @track activeFilter = 'all';
    @track pageSize = 10;
    @track currentPage = 1;
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getFiguresToChaseApplications({ searchTerm: this.searchTerm })
            .then(result => {
                this.allApps = (result || []).map(app => ({
                    ...app,
                    agent1DateFmt: app.agent1Desktop ? 'Desktop Valuation' : fmtDt(app.agent1Date),
                    agent2DateFmt: app.agent2Desktop ? 'Desktop Valuation' : fmtDt(app.agent2Date),
                    agent3DateFmt: app.agent3Desktop ? 'Desktop Valuation' : fmtDt(app.agent3Date),
                    agent1IsDesktop: app.agent1Desktop || false,
                    agent2IsDesktop: app.agent2Desktop || false,
                    agent3IsDesktop: app.agent3Desktop || false,
                    agent1MissingClass: app.agent1Desktop ? 'fig-desktop' : (isPassed(app.agent1Date) ? 'fig-urgent' : (isDueIn48h(app.agent1Date) ? 'fig-due-soon' : 'fig-missing')),
                    agent2MissingClass: app.agent2Desktop ? 'fig-desktop' : (isPassed(app.agent2Date) ? 'fig-urgent' : (isDueIn48h(app.agent2Date) ? 'fig-due-soon' : 'fig-missing')),
                    agent3MissingClass: app.agent3Desktop ? 'fig-desktop' : (isPassed(app.agent3Date) ? 'fig-urgent' : (isDueIn48h(app.agent3Date) ? 'fig-due-soon' : 'fig-missing')),
                    agent1PendingClass: app.agent1Desktop ? 'fig-desktop-pending' : (isDueIn48h(app.agent1Date) ? 'fig-due-soon-pending' : 'fig-pending'),
                    agent2PendingClass: app.agent2Desktop ? 'fig-desktop-pending' : (isDueIn48h(app.agent2Date) ? 'fig-due-soon-pending' : 'fig-pending'),
                    agent3PendingClass: app.agent3Desktop ? 'fig-desktop-pending' : (isDueIn48h(app.agent3Date) ? 'fig-due-soon-pending' : 'fig-pending'),
                    agent1HasFigure: app.agent1Figure != null,
                    agent2HasFigure: app.agent2Figure != null,
                    agent3HasFigure: app.agent3Figure != null,
                    agent1FigureFmt: fmtMoney(app.agent1Figure),
                    agent2FigureFmt: fmtMoney(app.agent2Figure),
                    agent3FigureFmt: fmtMoney(app.agent3Figure),
                    pendingLabel: app.pendingCount + ' figure' + (app.pendingCount !== 1 ? 's' : '') + ' pending',
                    pendingClass: app.pendingCount === 3 ? 'pending-badge high' :
                                  app.pendingCount === 2 ? 'pending-badge mid' : 'pending-badge low',
                    // Filter flags
                    hasUrgent: (!app.agent1Desktop && isPassed(app.agent1Date) && !app.agent1Figure) ||
                               (!app.agent2Desktop && isPassed(app.agent2Date) && !app.agent2Figure) ||
                               (!app.agent3Desktop && isPassed(app.agent3Date) && !app.agent3Figure),
                    hasDueSoon: (!app.agent1Desktop && isDueIn48h(app.agent1Date) && !app.agent1Figure) ||
                                (!app.agent2Desktop && isDueIn48h(app.agent2Date) && !app.agent2Figure) ||
                                (!app.agent3Desktop && isDueIn48h(app.agent3Date) && !app.agent3Figure),
                    hasDesktop: (app.agent1Desktop && !app.agent1Figure) ||
                                (app.agent2Desktop && !app.agent2Figure) ||
                                (app.agent3Desktop && !app.agent3Figure),
                    hasReceived: app.agent1Figure != null || app.agent2Figure != null || app.agent3Figure != null
                }));
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                this.isLoading = false;
            });
    }

    get filteredApps() {
        let apps = this.allApps;
        if (this.activeFilter === 'urgent') apps = apps.filter(a => a.hasUrgent);
        else if (this.activeFilter === 'duesoon') apps = apps.filter(a => a.hasDueSoon);
        else if (this.activeFilter === 'desktop') apps = apps.filter(a => a.hasDesktop);
        else if (this.activeFilter === 'received') apps = apps.filter(a => a.hasReceived);
        return apps;
    }

    get displayedApps() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredApps.slice(start, start + this.pageSize);
    }

    get hasApps() { return this.displayedApps.length > 0; }
    get totalCount() { return this.allApps.length; }
    get urgentCount() { return this.allApps.filter(a => a.hasUrgent).length; }
    get dueSoonCount() { return this.allApps.filter(a => a.hasDueSoon).length; }
    get desktopCount() { return this.allApps.filter(a => a.hasDesktop).length; }
    get receivedCount() { return this.allApps.filter(a => a.hasReceived).length; }
    get filteredCount() { return this.filteredApps.length; }

    get filterAllClass() { return 'ftag' + (this.activeFilter === 'all' ? ' active' : ''); }
    get filterUrgentClass() { return 'ftag ftag-red' + (this.activeFilter === 'urgent' ? ' active' : ''); }
    get filterDueSoonClass() { return 'ftag ftag-yellow' + (this.activeFilter === 'duesoon' ? ' active' : ''); }
    get filterDesktopClass() { return 'ftag ftag-purple' + (this.activeFilter === 'desktop' ? ' active' : ''); }
    get filterReceivedClass() { return 'ftag ftag-green' + (this.activeFilter === 'received' ? ' active' : ''); }

    get totalPages() { return Math.ceil(this.filteredCount / this.pageSize) || 1; }
    get showPaging() { return this.filteredCount > this.pageSize; }
    get pageStart() { return ((this.currentPage - 1) * this.pageSize) + 1; }
    get pageEnd() { return Math.min(this.currentPage * this.pageSize, this.filteredCount); }
    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }
    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
    handlePageSize(event) { this.pageSize = parseInt(event.target.value, 10); this.currentPage = 1; }

    handleRefresh() { this.loadData(); }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
        clearTimeout(this._t);
        this._t = setTimeout(() => this.loadData(), 400);
    }

    handleFilter(event) {
        this.activeFilter = event.currentTarget.dataset.filter;
        this.currentPage = 1;
    }

    handleRowClick(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.currentTarget.dataset.id, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }
}
