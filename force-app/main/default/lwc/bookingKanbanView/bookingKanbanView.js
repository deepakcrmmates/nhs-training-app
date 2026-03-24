import { LightningElement, api, wire, track } from 'lwc';
import getEvents from '@salesforce/apex/EventController.getEvents';

// Import Opportunity fields
import AGENT_1 from '@salesforce/schema/Opportunity.Agent_1__c';
import AGENT_2 from '@salesforce/schema/Opportunity.Agent_2__c';
import AGENT_3 from '@salesforce/schema/Opportunity.Agent_3__c';
import AGENT_1_APPOINTMENT from '@salesforce/schema/Opportunity.Agent_1_Appointment__c';
import AGENT_2_APPOINTMENT from '@salesforce/schema/Opportunity.Agent_2_Appointment__c';
import AGENT_3_APPOINTMENT from '@salesforce/schema/Opportunity.Agent_3_Appointment__c';

const FIELDS = [
    AGENT_1,
    AGENT_2,
    AGENT_3,
    AGENT_1_APPOINTMENT,
    AGENT_2_APPOINTMENT,
    AGENT_3_APPOINTMENT
];
export default class BookingKanbanView extends LightningElement {
    _startDate; // Internal private variable for start date
    @track days = []; // Holds the days of the current week
    @track weekRange = ''; // Holds the week range (e.g., Mon, 02 Dec 2024 - Sun, 08 Dec 2024)
    @api applicationId;
    @api stage = 'Figure Return';
    @track events = []; // Holds processed events
    @track flag = true;
    listFlag = false;
    kanBanFlag = true;
     @track groupedEvents = [];

    @api
    set startDate(value) {
        console.log('Child Received Start Date:', value);
        if (value) {
            this._startDate = new Date(value);
            this.updateWeek();

            console.log('OUTPUT :Stage ', this.stage);
        }
    }

    get startDate() {
        return this._startDate;
    }

    connectedCallback() {
        this.applicationId = '';
        console.log('Connected Callback Running');
        if (this.applicationId) {
           
            console.log('OUTPUT : FLAG',this.flag);
            getEvents({ appId: this.applicationId, stage: this.stage })
                .then(result => {
                    console.log('Imperatively Fetched Events:', result);
                    this.processEvents(result);
                })
                .catch(error => {
                    console.error('Error fetching events imperatively:', error);
                });
        }
    }

    handleKanbanClick(){
        this.kanBanFlag = true;
         this.listFlag = false;
    }

    handleListClick(){
        this.listFlag = true;
        this.kanBanFlag  = false;
    }

   @track groupedEvents = [];

@wire(getEvents, { appId: '$applicationId', stage: '$stage' })
wiredEvents({ error, data }) {
    console.log('OUTPUT :Stage ', this.stage);
    if (data) {
        this.flag = false;
        const groupedMap = new Map();
        console.log('Fetched Events:', JSON.stringify(data));

        data.forEach(event => {
            const dateKey = new Date(event.StartDateTime).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});


            if (!groupedMap.has(dateKey)) {
                groupedMap.set(dateKey, []);
            }

            groupedMap.get(dateKey).push({
                Id: event.Id,
                application: event.Application__r?.Name,
                housebuilder: event.Application__r?.House_Builder__r?.Name,
                agentName: event.Agent__r?.Name,
                applicant: event.Application__r?.Applicant__r?.Name,
                dateTime: new Date(event.StartDateTime).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                applicationId: event.Application__c,
                housebuilderId: event.Application__r?.House_Builder__r?.Id,
                agentId: event.Agent__c,
                applicantId: event.Application__r?.Applicant__r?.Id
            });
        });

        // Convert map to array
        this.groupedEvents = [...groupedMap.entries()].map(([label, events]) => ({
            label,
            events
        }));

        // For kanban or another view
        this.processEvents(data);
    } else if (error) {
        console.error('Error fetching events:', error);
    }
}


    processEvents(events) {

        this.events = events.map(event => {
            const eventDate = new Date(event.StartDateTime);

            return {
                ...event,
                opportunityName: event.Application__r.Name ? event.Application__r.Name : '',
                applicationId: event.Application__c ? event.Application__c : '',
                agentId: event.Agent__c ? event.Agent__c : '',
                vendorId: event.Application__r.Applicant__c ? event.Application__r.Applicant__c : '',
                agentName: event.Agent__r ? event.Agent__r.Name : '',
                vendorName: event.Application__r.Applicant__c ? event.Application__r.Applicant__r.Name : '',
                housebuilderId: event.Application__r.House_Builder__c ? event.Application__r.House_Builder__c : '',
                housebuilder: event.Application__r.House_Builder__c ? event.Application__r.House_Builder__r.Name : '',
                dateKey: this.formatDateOnly(eventDate),
                formattedStartDateTime: this.formatDateTime(event.StartDateTime),

            };
        }).filter(event => event !== null);
    }

    updateWeek() {
        if (!this._startDate) return;

        const startOfWeek = this.getStartOfWeek(this._startDate);
        this.days = this.getWeekDays(startOfWeek);

        this.weekRange = `${this.formatDate(startOfWeek)} - ${this.formatDate(
            this.addDays(startOfWeek, 6)
        )}`;

        this.integrateEventsWithDays();
        console.log('Updated Week Range:', this.weekRange);
        console.log('Days with Events:', this.days);
    }

    getStartOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday as the first day
        return new Date(date.setDate(diff));
    }

    getWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = this.addDays(startDate, i);
            days.push({
                label: this.formatDate(day), // Human-readable label
                dateKey: this.formatDateOnly(day), // Key for matching events
                events: [] // Placeholder for events
            });
        }
        return days;
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    integrateEventsWithDays() {
        if (!this.days || !this.events) return;

        this.days = this.days.map(day => {
            const eventsForDay = this.events.filter(
                event => event.dateKey === day.dateKey
            );

            return {
                ...day,
                events: eventsForDay
            };
        });
    }

    handleNavigation(event) {
        const recordId = event.target.dataset.id;
        if (recordId) {
            const recordUrl = `/lightning/r/${recordId}/view`;
            window.open(recordUrl, '_blank');
        } else {
            console.error('Record ID is undefined');
        }
    }

    shortenName(name, maxLength = 10) {
        if (name.length > maxLength) {
            return name.substring(0, maxLength) + '...';
        }
        return name;
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
        };
        console.log('OUTPUT :INIT ', new Intl.DateTimeFormat('en-GB', options).format(date));
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    formatDateOnly(date) {
        return date.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
    }

    formatDate(date) {
        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    handleBook(event) {
        const availabilityId = event.target.closest('.kanban-card').key;
        console.log('Book button clicked for availability:', availabilityId);
        // Perform booking logic here
    }

}