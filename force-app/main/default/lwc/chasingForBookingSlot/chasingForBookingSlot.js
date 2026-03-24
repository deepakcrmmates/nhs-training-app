import { LightningElement, api, wire, track } from 'lwc';
import getEvents from '@salesforce/apex/EventController.getEvents';
import { getRecord } from 'lightning/uiRecordApi';

// Import Opportunity fields
import AGENT_1 from '@salesforce/schema/Opportunity.Agent_1__c';
import AGENT_2 from '@salesforce/schema/Opportunity.Agent_2__c';
import AGENT_3 from '@salesforce/schema/Opportunity.Agent_3__c';
import AGENT_1_VALUATION from '@salesforce/schema/Opportunity.Agent_1_Valuation_Recieved__c';
import AGENT_2_VALUATION from '@salesforce/schema/Opportunity.Agent_2_Valuation_Recieved__c';
import AGENT_3_VALUATION from '@salesforce/schema/Opportunity.Agent_3_Valuation_Recieved__c';
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
export default class ChasingForBookingSlot extends LightningElement {
    _startDate; // Internal private variable for start date
    @track days = []; // Holds the days of the current week
    @track weekRange = ''; // Holds the week range (e.g., Mon, 02 Dec 2024 - Sun, 08 Dec 2024)
    @api applicationId;
    @track events = []; // Holds processed events
    @track flag = true;
    listFlag = false;
    kanBanFlag = true;
    @track formattedEvents = [];

    @api
    set startDate(value) {
        console.log('Setting startDate:', value);
        if (value) {
            this._startDate = new Date(value);
            this.updateWeek();
        }
    }

    get startDate() {
        return this._startDate;
    }


    connectedCallback() {
        this.applicationId = '';

        getEvents({ appId: this.applicationId, stage: 'Chasing' })
            .then(data => {
                this.processEvents(data);
            })
            .catch(error => {
                console.error('Error fetching events:', error);
            });

    }

    handleKanbanClick() {
        this.kanBanFlag = true;
        this.listFlag = false;
    }

    handleListClick() {
        this.listFlag = true;
        this.kanBanFlag = false;
    }

    @wire(getEvents, { appId: '$applicationId', stage: 'Chasing' })
    wiredEvents({ error, data }) {
        if (data) {
            console.log('Fetched events from server:', JSON.stringify(data));
            this.processEvents(data);
        } else if (error) {
            console.error('Error fetching events:', error);
        }


        if (data) {
            this.flag = false;
            // console.log('Fetched events from server:', JSON.stringify(data));

            const grouped = {};

            data.forEach(event => {
                const dateObj = new Date(event.StartDateTime);

              const datePart = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});


                // Get time in hh:mm AM/PM format (e.g. "06:30 PM")
                const timePart = dateObj.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                });

                // Combine into "27/12/2024, 06:30 PM"
                const ukDateTime = `${datePart}, ${timePart}`;

                if (!grouped[ukDateTime]) {
                    grouped[ukDateTime] = [];
                }

                grouped[ukDateTime].push({
                    Id: event.Id,
                    applicationName: event?.Application__r?.Name || event?.What?.Name || '—',
                    housebuilderName: event?.Application__r?.House_Builder__r?.Name || '—',
                    agentName: event?.Agent__r?.Name || '—',
                    vendorName: event?.Application__r?.Applicant__r?.Name || event?.Who?.Name || '—'
                });
            });


            this.formattedEvents = Object.keys(grouped).map(dateKey => ({
                dateTime: dateKey,
                records: grouped[dateKey]
            }));
        } else if (error) {
            console.error('Error fetching events:', error);
        }
    }


    processEvents(events) {
        console.log('Raw events received for processing:', events);

        const today = new Date();

        if (!events || events.length === 0) {
            console.warn('No events to process.');
            this.events = [];
            return;
        }

        this.events = events.map(event => {
            console.log('Processing event:', event);

            // Validate the StartDateTime field
            const eventDate = new Date(event.StartDateTime);
            if (isNaN(eventDate.getTime())) {
                console.error('Invalid event date for event:', event);
                return null;
            }

            // Extract and validate appointment fields dynamically
            const appointments = [
                event[AGENT_1_APPOINTMENT],
                event[AGENT_2_APPOINTMENT],
                event[AGENT_3_APPOINTMENT]
            ]
                .map(appt => (appt ? new Date(appt) : null)) // Convert to valid Date objects
                .filter(apptDate => apptDate && !isNaN(apptDate.getTime())); // Filter out invalid dates

            console.log('Valid appointments for event:', appointments);

            // Find the closest future appointment
            const futureAppointments = appointments.filter(apptDate => apptDate > today);
            console.log('OUTPUT : futureAppointments', JSON.stringify(appointments));
            const closestAppointment = eventDate.length > 0
                ? futureAppointments.sort((a, b) => a - b)[0] // Get the earliest future appointment
                : null; // No future appointments

            console.log('Closest appointment date for event:', closestAppointment || 'No future appointment');

            // Assign a color class based on the closest appointment
            const colorClass = eventDate
                ? this.getColorClass(eventDate, today)
                : 'default-class';

            console.log('Assigned color class for event:', colorClass);

            // Combine the base class and color class
            const fullClass = colorClass;

            // Extract details for Agent, Vendor, and Application
            const agentName = event.Agent__r ? this.shortenName(event.Agent__r.Name) : '';
            const agentFullName = event.Agent__r ? event.Agent__r.Name : '';
            const agentId = event.Agent__c;

            const vendorName = event.Who ? this.shortenName(event.Who.Name) : '';
            const vendorFullName = event.Who ? event.Who.Name : '';
            const vendorId = event.WhoId;

            const applicationName = event.What ? this.shortenName(event.What.Name) : '';
            const applicationFullName = event.What ? event.What.Name : '';
            const applicationId = event.WhatId;

            console.log('Agent, Vendor, Application details:', {
                agentName, agentFullName, agentId,
                vendorName, vendorFullName, vendorId,
                applicationName, applicationFullName, applicationId
            });

            // Return the updated event object with additional properties
            return {
                ...event,
                dateKey: this.formatDateOnly(eventDate),
                formattedStartDateTime: this.formatDateTime(event.StartDateTime),
                closestAppointment: closestAppointment ? this.formatDateOnly(closestAppointment) : null,
                colorClass,
                fullClass, // Add the combined class for rendering
                agentName,
                agentFullName,
                agentId,
                vendorName,
                vendorFullName,
                vendorId,
                HousebuilderId: event.Application__r.House_Builder__c ? event.Application__r.House_Builder__c : '',
                Housebuilder: event.Application__r.House_Builder__c ? event.Application__r.House_Builder__r.Name : '',
                opportunityName: applicationName,
                oppFullName: applicationFullName,
                opportunityId: applicationId
            };
        }).filter(event => event !== null); // Remove null results caused by invalid events

        console.log('Processed events with fullClass:', this.events);

        // Integrate processed events with days
        this.integrateEventsWithDays();
    }




    getColorClass(appointmentDate, today) {
        const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedAppointmentDate = normalizeDate(appointmentDate);
        const normalizedToday = normalizeDate(today);

        const diffDays = Math.floor((normalizedToday - normalizedAppointmentDate) / (1000 * 60 * 60 * 24));

        console.log(`Normalized Appointment Date: ${normalizedAppointmentDate}, Normalized Today: ${normalizedToday}, Diff Days: ${diffDays}`);

        if (diffDays >= 0 && diffDays <= 2) return 'light-green-card'; // Very close or today
        if (diffDays >= 3 && diffDays <= 5) return 'light-yellow-card'; // Near future
        if (diffDays > 5) return 'light-red-card'; // Far future
        return 'default-class'; // Past appointments
    }




    updateWeek() {
        console.log('Updating week based on startDate:', this._startDate);
        if (!this._startDate) return;

        const startOfWeek = this.getStartOfWeek(this._startDate);
        this.days = this.getWeekDays(startOfWeek);

        this.weekRange = `${this.formatDate(startOfWeek)} - ${this.formatDate(
            this.addDays(startOfWeek, 6)
        )}`;

        console.log('Updated week range:', this.weekRange);
        console.log('Days in the updated week:', this.days);
        this.integrateEventsWithDays();
    }

    getStartOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));
        console.log('Calculated start of the week:', startOfWeek);
        return startOfWeek;
    }

    getWeekDays(startDate) {
        console.log('Generating week days from startDate:', startDate);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = this.addDays(startDate, i);
            days.push({
                label: this.formatDate(day),
                dateKey: this.formatDateOnly(day),
                events: []
            });
        }
        console.log('Generated week days:', days);
        return days;
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    integrateEventsWithDays() {
        console.log('Integrating events with days...');
        if (!this.days || !this.events) {
            console.warn('No days or events available to integrate.');
            return;
        }

        this.days = this.days.map(day => {
            const eventsForDay = this.events.filter(
                event => event.dateKey === day.dateKey
            );
            console.log(`Events for day ${day.label}:`, eventsForDay);
            return {
                ...day,
                events: eventsForDay
            };
        });

        console.log('Integrated days with events:', this.days);
    }

    handleNavigation(event) {
        const recordId = event.target.dataset.id;
        if (recordId) {
            const recordUrl = `/lightning/r/${recordId}/view`;
            console.log('Navigating to record URL:', recordUrl);
            window.open(recordUrl, '_blank');
        } else {
            console.error('Record ID is undefined.');
        }
    }

    shortenName(name, maxLength = 10) {
        console.log('Shortening name:', name);
        if (name.length > maxLength) {
            return name.substring(0, maxLength) + '...';
        }
        return name;
    }

    formatDateTime(dateString) {
        console.log('Formatting date-time:', dateString);
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
        console.log('Formatting date only:', date);
        return date.toISOString().split('T')[0];
    }

    formatDate(date) {
        console.log('Formatting full date:', date);
        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    handleBook(event) {
        const availabilityId = event.target.closest('.kanban-card').key;
        console.log('Book button clicked for availability ID:', availabilityId);
        // Perform booking logic here
    }
}