import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getVendorAvailability from '@salesforce/apex/VendorAvailabilityService.getVendorAvailability';
import createEvents from '@salesforce/apex/VendorAvailabilityService.createEvents';
import cancelAgentBooking from '@salesforce/apex/VendorAvailabilityService.cancelAgentBooking';
import saveNote from '@salesforce/apex/VendorNoteController.saveNote';

const HOUR_LABELS = {
    '09': '9 – 10 am', '10': '10 – 11 am', '11': '11 am – 12 pm',
    '12': '12 – 1 pm', '13': '1 – 2 pm', '14': '2 – 3 pm',
    '15': '3 – 4 pm', '16': '4 – 5 pm'
};
const DISPLAY_HOURS = ['09','10','11','12','13','14','15','16'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default class NhsAgentBooking extends LightningElement {
    @api recordId;
    @api agent1Name = '';
    @api agent1Id = '';
    @api agent2Name = '';
    @api agent2Id = '';
    @api agent3Name = '';
    @api agent3Id = '';
    @api vendorId = '';

    @track existingEvents = [];
    @track availabilityRecords = [];
    @track weekOffsets = { '1': 0, '2': 0, '3': 0 };
    @track amendingAgents = {};
    @track confirmingCancel = {};
    @track expandedSlot = ''; // 'slotKey_agentNum' when a slot is expanded for sub-time selection
    cancelNotes = {};
    isLoading = true;

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getVendorAvailability({ currentId: this.recordId })
            .then(result => {
                this.availabilityRecords = result.availabilityRecords || [];
                this.existingEvents = result.existingEvents || [];
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading booking data:', error);
                this.isLoading = false;
            });
    }

    getAgentEvent(agentId) {
        if (!agentId) return null;
        return this.existingEvents.find(e => e.Agent__c === agentId && e.IsBooked__c);
    }

    get bookedCount() {
        let c = 0;
        if (this.getAgentEvent(this.agent1Id)) c++;
        if (this.getAgentEvent(this.agent2Id)) c++;
        if (this.getAgentEvent(this.agent3Id)) c++;
        return c;
    }

    get hasBookings() { return this.bookedCount > 0; }

    // Build all slots from availability records
    get tomorrowStr() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tmr = new Date(today);
        tmr.setDate(tmr.getDate() + 1);
        return `${tmr.getFullYear()}-${String(tmr.getMonth()+1).padStart(2,'0')}-${String(tmr.getDate()).padStart(2,'0')}`;
    }

    get allSlots() {
        const minDate = this.tomorrowStr;
        const slots = [];
        this.availabilityRecords.forEach(rec => {
            if (!rec.Date__c) return;
            const dateStr = rec.Date__c;
            if (dateStr < minDate) return; // Skip today and past
            const d = new Date(dateStr + 'T00:00:00');
            const dayName = DAY_SHORT[d.getDay()];
            const shortDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            DISPLAY_HOURS.forEach(hr => {
                const field = `Hour_${hr}__c`;
                if (!rec[field]) return;

                slots.push({
                    key: `${dateStr}_${hr}`,
                    dateStr,
                    dayName,
                    shortDate,
                    hour: hr,
                    startHour: parseInt(hr, 10),
                    timeLabel: HOUR_LABELS[hr],
                    weekSunday: this.getWeekSunday(d)
                });
            });
        });
        return slots.sort((a, b) => a.key.localeCompare(b.key));
    }

    getWeekSunday(d) {
        const dt = new Date(d);
        dt.setDate(dt.getDate() - dt.getDay());
        dt.setHours(0, 0, 0, 0);
        return dt.toISOString().split('T')[0];
    }

    get uniqueWeeks() {
        const weeks = new Set();
        this.allSlots.forEach(s => weeks.add(s.weekSunday));
        return [...weeks].sort();
    }

    get agentColumns() {
        const configs = [
            { id: this.agent1Id, name: this.agent1Name || 'Not Assigned', label: 'Agent 1 (NHS)', num: '1', color: 'a1' },
            { id: this.agent2Id, name: this.agent2Name || 'Not Assigned', label: 'Agent 2', num: '2', color: 'a2' },
            { id: this.agent3Id, name: this.agent3Name || 'Not Assigned', label: 'Agent 3', num: '3', color: 'a3' }
        ];

        return configs.map(ac => {
            const evt = this.getAgentEvent(ac.id);
            const isBooked = !!evt;
            const isAmending = !!this.amendingAgents[ac.num];
            const isConfirmingCancel = !!this.confirmingCancel[ac.num];
            const hasAgent = !!ac.id;
            const weeks = this.uniqueWeeks;
            const offset = this.weekOffsets[ac.num] || 0;
            const currentWeekIdx = Math.min(Math.max(0, offset), weeks.length - 1);
            const currentWeek = weeks[currentWeekIdx];

            let weekLabel = 'No slots';
            let pagedSlots = [];
            if (currentWeek) {
                const sun = new Date(currentWeek + 'T00:00:00');
                const sat = new Date(sun);
                sat.setDate(sat.getDate() + 6);
                weekLabel = `${sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sat.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
                pagedSlots = this.allSlots.filter(s => s.weekSunday === currentWeek).map(s => {
                    const expandKey = `${s.key}_${ac.num}`;
                    const isExpanded = this.expandedSlot === expandKey;
                    const h = parseInt(s.hour, 10);
                    const subSlots = ['00', '15', '30', '45'].map(m => ({
                        subKey: `${s.key}_${m}`,
                        label: `${h}:${m}`,
                        mins: m
                    }));
                    return { ...s, isExpanded, subSlots };
                });
            }

            let bookedDate = '', bookedTime = '';
            if (evt) {
                const start = new Date(evt.StartDateTime);
                const end = new Date(evt.EndDateTime);
                bookedDate = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                bookedTime = `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
            }

            return {
                key: `col-${ac.num}`,
                num: ac.num,
                label: ac.label,
                name: hasAgent ? ac.name : 'Not Assigned',
                hasAgent,
                isBooked,
                isAmending,
                isConfirmingCancel,
                bookedDate,
                bookedTime,
                hasSlots: this.allSlots.length > 0 && hasAgent,
                hasPagedSlots: pagedSlots.length > 0,
                pagedSlots,
                weekLabel,
                headerClass: `ac-header ${ac.color}`
            };
        });
    }

    handleWeekNav(event) {
        const agent = event.target.dataset.agent;
        const dir = parseInt(event.target.dataset.dir, 10);
        const weeks = this.uniqueWeeks;
        const current = this.weekOffsets[agent] || 0;
        const next = current + dir;
        if (next >= 0 && next < weeks.length) {
            this.weekOffsets = { ...this.weekOffsets, [agent]: next };
        }
    }

    handleAmend(event) {
        const num = event.target.dataset.agent;
        this.amendingAgents = { ...this.amendingAgents, [num]: true };
    }

    handleCancelAmend(event) {
        const num = event.target.dataset.agent;
        this.amendingAgents = { ...this.amendingAgents, [num]: false };
        this.confirmingCancel = { ...this.confirmingCancel, [num]: false };
    }

    handleConfirmCancel(event) {
        const num = event.target.dataset.agent;
        this.confirmingCancel = { ...this.confirmingCancel, [num]: true };
    }

    handleDenyCancel(event) {
        const num = event.target.dataset.agent;
        this.confirmingCancel = { ...this.confirmingCancel, [num]: false };
    }

    handleCancelNoteInput(event) {
        const num = event.target.dataset.agent;
        this.cancelNotes[num] = event.target.value;
    }

    async handleCancelBooking(event) {
        const agentNum = event.target.dataset.agent;
        let agentId, agentName;
        if (agentNum === '1') { agentId = this.agent1Id; agentName = this.agent1Name; }
        else if (agentNum === '2') { agentId = this.agent2Id; agentName = this.agent2Name; }
        else { agentId = this.agent3Id; agentName = this.agent3Name; }

        const noteText = (this.cancelNotes[agentNum] || '').trim();
        if (!noteText) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Note Required',
                message: 'Please enter a reason for cancelling this booking.',
                variant: 'warning'
            }));
            return;
        }

        const evt = this.getAgentEvent(agentId);
        if (!evt) return;

        this.isLoading = true;
        try {
            // Save cancellation note
            const evtStart = new Date(evt.StartDateTime);
            const fullNote = `BOOKING CANCELLED — ${agentName}\nSlot: ${evtStart.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} ${evtStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\nReason: ${noteText}`;
            await saveNote({ noteText: fullNote, opportunityId: this.recordId });

            // Cancel the event
            await cancelAgentBooking({ eventId: evt.Id });

            this.amendingAgents = { '1': false, '2': false, '3': false };
            this.confirmingCancel = { '1': false, '2': false, '3': false };
            this.cancelNotes = {};
            this.dispatchEvent(new ShowToastEvent({
                title: 'Booking Cancelled',
                message: `${agentName} booking cancelled. Note saved.`,
                variant: 'success'
            }));
            this.loadData();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to cancel booking.',
                variant: 'error'
            }));
            this.isLoading = false;
        }
    }

    handleBookSlot(event) {
        const slotKey = event.currentTarget.dataset.slotKey;
        const agentNum = event.currentTarget.dataset.agent;
        const expandKey = `${slotKey}_${agentNum}`;

        // Toggle expand — show sub-time options
        this.expandedSlot = this.expandedSlot === expandKey ? '' : expandKey;
    }

    async handleSubSlotBook(event) {
        const slotKey = event.currentTarget.dataset.slotKey;
        const agentNum = event.currentTarget.dataset.agent;
        const mins = event.currentTarget.dataset.mins;
        const [dateStr, hr] = slotKey.split('_');

        let agentId, agentName;
        if (agentNum === '1') { agentId = this.agent1Id; agentName = this.agent1Name; }
        else if (agentNum === '2') { agentId = this.agent2Id; agentName = this.agent2Name; }
        else { agentId = this.agent3Id; agentName = this.agent3Name; }

        if (!agentId) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'No Agent', message: `Agent ${agentNum} has not been assigned.`, variant: 'warning'
            }));
            return;
        }
        if (this.getAgentEvent(agentId) && !this.amendingAgents[agentNum]) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Already Booked', message: `${agentName} already has a booking. Click Amend to change.`, variant: 'warning'
            }));
            return;
        }

        this.isLoading = true;
        this.expandedSlot = '';
        const startHour = parseInt(hr, 10);
        const startDT = new Date(`${dateStr}T${String(startHour).padStart(2, '0')}:${mins}:00`);
        const endDT = new Date(startDT.getTime() + 60 * 60000);

        try {
            await createEvents({
                eventData: [{
                    agentId,
                    currentId: this.recordId,
                    vendorId: this.vendorId,
                    startDateTime: startDT.toISOString(),
                    endDateTime: endDT.toISOString(),
                    subject: `Valuation appointment with ${agentName}`
                }]
            });
            this.amendingAgents = { '1': false, '2': false, '3': false };
            this.dispatchEvent(new ShowToastEvent({
                title: 'Agent Booked',
                message: `${agentName} booked for ${HOUR_LABELS[hr]} on ${dateStr}`,
                variant: 'success'
            }));
            this.loadData();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Booking Error',
                message: error.body?.message || error.message || 'Failed to book agent.',
                variant: 'error'
            }));
            this.isLoading = false;
        }
    }
}
