import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getDashboardData from '@salesforce/apex/HomeDashboardController.getDashboardData';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default class NhsHomeDashboard extends NavigationMixin(LightningElement) {
    @track firstName = '';
    @track activeApplications = 0;
    @track newThisMonth = 0;
    @track newThisWeek = 0;
    @track upcomingAppointments = 0;
    @track totalProperties = 0;
    @track totalAgents = 0;
    @track pipelineData = [];
    @track recentApps = [];
    @track events = [];

    get greeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    get todayFormatted() {
        const d = new Date();
        return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }

    get hasPipeline() { return this.pipelineData.length > 0; }
    get hasRecent() { return this.recentApps.length > 0; }
    get hasEvents() { return this.events.length > 0; }

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        try {
            const data = await getDashboardData();
            if (data.status !== 'success') return;

            this.firstName = data.firstName || 'there';
            this.activeApplications = data.activeApplications || 0;
            this.newThisMonth = data.newThisMonth || 0;
            this.newThisWeek = data.newThisWeek || 0;
            this.upcomingAppointments = data.upcomingAppointments || 0;
            this.totalProperties = data.totalProperties || 0;
            this.totalAgents = data.totalAgents || 0;

            // Pipeline
            const pipeline = data.pipeline || [];
            const maxCount = pipeline.length > 0 ? Math.max(...pipeline.map(p => p.count)) : 1;
            this.pipelineData = pipeline.map(p => ({
                ...p,
                barStyle: 'width: ' + Math.max((p.count / maxCount) * 100, 4) + '%'
            }));

            // Recent applications
            this.recentApps = (data.recentApplications || []).map(app => {
                const d = new Date(app.createdDate);
                return {
                    ...app,
                    dateDisplay: d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(),
                    stageClass: 'stage-badge stage-' + this.getStageColor(app.stage)
                };
            });

            // Events
            this.events = (data.upcomingEvents || []).map(evt => {
                const d = new Date(evt.startTime);
                const end = new Date(evt.endTime);
                return {
                    ...evt,
                    dayNum: d.getDate(),
                    monthShort: MONTHS[d.getMonth()],
                    timeDisplay: this.formatTime(d) + ' - ' + this.formatTime(end)
                };
            });
        } catch (e) {
            // silent
        }
    }

    getStageColor(stage) {
        if (!stage) return 'grey';
        const s = stage.toLowerCase();
        if (s.includes('archive') || s.includes('cancel')) return 'red';
        if (s.includes('1st') || s.includes('to be')) return 'blue';
        if (s.includes('2nd') || s.includes('3rd')) return 'amber';
        return 'green';
    }

    formatTime(d) {
        const h = d.getHours();
        const m = d.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return hour + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }

    handleCreateApp() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: { apiName: 'Create_Application' }
        });
    }

    handleSearchProperty() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: { apiName: 'Property_Search' }
        });
    }

    handleViewAll() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: { apiName: 'New_Applications' }
        });
    }

    handleAppClick(event) {
        const appId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: appId, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }
}
