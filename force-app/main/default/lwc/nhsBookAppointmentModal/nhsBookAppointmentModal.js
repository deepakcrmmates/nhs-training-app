import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAvailableSlots from '@salesforce/apex/AgentFinderController.getAvailableSlots';
import bookAppointment from '@salesforce/apex/AgentFinderController.bookAppointment';
import getRenderedTemplate from '@salesforce/apex/NHSCommunicationsController.getRenderedTemplate';
import sendEmailComplete from '@salesforce/apex/NHSCommunicationsController.sendEmailComplete';
import getAddressBook from '@salesforce/apex/NHSCommunicationsController.getAddressBook';
import saveNote from '@salesforce/apex/VendorNoteController.saveNote';

const AGENT_TEMPLATE_IDS = {
    1: '00XKG00000121b42AA',
    2: '00XKG00000121bI2AQ',
    3: '00XKG00000121bJ2AQ'
};

const AM_HOURS = [9, 10, 11];
const PM_HOURS = [13, 14, 15, 16];
// 15-minute granularity to match the rest of the app (inline calendar picker etc.)
const QUARTER_MINUTES = [0, 15, 30, 45];

export default class NhsBookAppointmentModal extends LightningElement {
    @api recordId;
    @api agentSlot;        // 'agent1' | 'agent2' | 'agent3'
    @api agentNum;         // 1 | 2 | 3
    @api agentName;
    @api agentEmail;
    @api propertyAddress;
    @api isAmend = false;      // true when launched from Amend Booking
    @api previousAppt = null;  // ISO string of the old Agent_N_Appointment__c

    @track step = 1;
    @track slots = [];
    @track loadingSlots = true;
    @track selectedSlotId = null;
    @track selectedTime = null;   // "HH:MM"
    @track amendReason = '';      // only used when isAmend

    // Mini calendar filter
    @track calendarOpen = false;
    @track filterDate = null;     // "YYYY-MM-DD"
    @track calMonth = new Date().getMonth();
    @track calYear = new Date().getFullYear();

    @track loadingEmail = false;
    @track emailTo = '';
    @track emailCc = '';
    @track emailBcc = '';
    @track emailSubject = '';
    @track emailBody = '';
    @track sending = false;
    @track isEditingBody = false;

    // Phonebook (address book) — contacts from this Opportunity
    @track showAddressBook = false;
    @track addressBookContacts = [];
    @track addressBookSearch = '';
    _addressBookLoaded = false;

    connectedCallback() {
        this.emailTo = this.agentEmail || '';
        this.fetchSlots();
    }

    async fetchSlots() {
        this.loadingSlots = true;
        try {
            const raw = await getAvailableSlots({ opportunityId: this.recordId });
            this.slots = (raw || []).map(s => this.decorateSlot(s));
            // Jump the calendar to the first available month
            if (this.slots.length) {
                const first = this.slots[0].iso;
                if (first) {
                    const [y, m] = first.split('-').map(Number);
                    this.calYear = y;
                    this.calMonth = m - 1;
                }
            }
        } catch (e) {
            this.toast('Error', 'Could not load vendor availability: ' + this.msg(e), 'error');
            this.slots = [];
        }
        this.loadingSlots = false;
    }

    decorateSlot(s) {
        const buildTimes = (hours) => hours.flatMap(h =>
            QUARTER_MINUTES.map(m => ({
                key: `${s.id}-${h}-${this.pad(m)}`,
                slotId: s.id,
                time: this.pad(h) + ':' + this.pad(m),
                label: this.fmtTime(h, m)
            }))
        );
        const amTimes = s.am ? buildTimes(AM_HOURS) : [];
        const pmTimes = s.pm ? buildTimes(PM_HOURS) : [];
        // s.date arrives as "YYYY-MM-DD" (Apex Date → LWC ISO string)
        const iso = typeof s.date === 'string' ? s.date.slice(0, 10)
                    : (s.date ? new Date(s.date).toISOString().slice(0, 10) : '');
        return {
            id: s.id,
            iso,
            dayName: s.dayName,
            dateFormatted: s.dateFormatted,
            am: !!s.am,
            pm: !!s.pm,
            hasAny: !!s.am || !!s.pm,
            amTimes,
            pmTimes
        };
    }

    pad(n) { return n < 10 ? '0' + n : '' + n; }

    fmtTime(h, m) {
        const suffix = h >= 12 ? 'pm' : 'am';
        const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return display + ':' + this.pad(m) + ' ' + suffix;
    }

    get modalTitle() {
        const prefix = this.isAmend ? 'Amend Appointment' : 'Book Appointment';
        return prefix + ' — Agent ' + (this.agentNum || '');
    }

    get amendReasonMissing() {
        return this.isAmend && !(this.amendReason && this.amendReason.trim());
    }

    // Display helper shown above the Reason banner on Amend:
    // "Previous Appointment: DD/MM/YYYY - HH:MM AM/PM"
    get previousApptDisplay() {
        if (!this.previousAppt) return '';
        try {
            const d = new Date(this.previousAppt);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            let hour = d.getHours();
            const min = String(d.getMinutes()).padStart(2, '0');
            const suffix = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            if (hour === 0) hour = 12;
            const hh = String(hour).padStart(2, '0');
            return `${dd}/${mm}/${yyyy} - ${hh}:${min} ${suffix}`;
        } catch (e) {
            return String(this.previousAppt);
        }
    }

    get hasPreviousAppt() { return this.isAmend && !!this.previousAppt; }

    handleAmendReasonChange(event) {
        this.amendReason = event.target.value;
    }

    get subtitle() {
        return this.agentName ? this.agentName : '';
    }

    get step1Active() { return this.step === 1; }
    get step2Active() { return this.step === 2; }

    get stepIndicator() { return `Step ${this.step} of 2`; }

    get nextDisabled() {
        return !this.selectedSlotId || !this.selectedTime || this.amendReasonMissing;
    }

    get sendDisabled() { return this.sending || !this.emailBody; }

    get hasSlots() { return !this.loadingSlots && this.slots && this.slots.length > 0; }
    get noSlots() { return !this.loadingSlots && (!this.slots || this.slots.length === 0); }

    // Decorate each slot with selected-state for template rendering; apply
    // date filter if the user picked a day from the mini calendar.
    get slotsForRender() {
        const sel = this.selectedSlotId;
        const selTime = this.selectedTime;
        const base = this.filterDate
            ? this.slots.filter(s => s.iso === this.filterDate)
            : this.slots;
        return base.map(slot => ({
            ...slot,
            amTimes: slot.amTimes.map(t => ({
                ...t,
                cls: 'bam-time' + (slot.id === sel && t.time === selTime ? ' bam-time-selected' : '')
            })),
            pmTimes: slot.pmTimes.map(t => ({
                ...t,
                cls: 'bam-time' + (slot.id === sel && t.time === selTime ? ' bam-time-selected' : '')
            })),
            cardCls: 'bam-day-card' + (slot.id === sel ? ' bam-day-card-selected' : '')
        }));
    }

    // Empty-state (after applying the filter)
    get filterActive() { return !!this.filterDate; }
    get filterLabel() {
        if (!this.filterDate) return '';
        const s = this.slots.find(x => x.iso === this.filterDate);
        return s ? `${s.dayName} ${s.dateFormatted}` : this.filterDate;
    }
    get noFilteredSlots() {
        return this.filterActive && this.slotsForRender.length === 0;
    }

    // ── Mini calendar ───────────────────────────────────────────────────
    get calendarIconCls() {
        return 'bam-cal-toggle' + (this.calendarOpen ? ' bam-cal-toggle-open' : '');
    }

    get calMonthLabel() {
        const names = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
        return names[this.calMonth] + ' ' + this.calYear;
    }

    get calDays() {
        const daysWith = new Set(this.slots.map(s => s.iso));
        const firstOfMonth = new Date(this.calYear, this.calMonth, 1);
        const jsDow = firstOfMonth.getDay();          // 0=Sun..6=Sat
        const mondayOffset = (jsDow + 6) % 7;          // days to subtract to land on Monday
        const gridStart = new Date(this.calYear, this.calMonth, 1 - mondayOffset);
        const cells = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            const iso = d.getFullYear() + '-'
                      + String(d.getMonth() + 1).padStart(2, '0') + '-'
                      + String(d.getDate()).padStart(2, '0');
            const isOtherMonth = d.getMonth() !== this.calMonth;
            const hasSlots = daysWith.has(iso);
            const isSelected = this.filterDate === iso;
            const classes = ['bam-cal-day'];
            if (isOtherMonth) classes.push('bam-cal-day-other');
            if (hasSlots)     classes.push('bam-cal-day-has');
            if (isSelected)   classes.push('bam-cal-day-selected');
            cells.push({
                key: iso,
                iso,
                day: d.getDate(),
                hasSlots,
                isSelected,
                disabled: !hasSlots,
                cls: classes.join(' ')
            });
        }
        return cells;
    }

    handleToggleCalendar() {
        this.calendarOpen = !this.calendarOpen;
    }

    handleCalPrev() {
        if (this.calMonth === 0) { this.calMonth = 11; this.calYear -= 1; }
        else this.calMonth -= 1;
    }

    handleCalNext() {
        if (this.calMonth === 11) { this.calMonth = 0; this.calYear += 1; }
        else this.calMonth += 1;
    }

    handleCalDayClick(event) {
        const iso = event.currentTarget.dataset.iso;
        if (!iso) return;
        // Toggle off if clicking the already-selected date
        this.filterDate = (this.filterDate === iso) ? null : iso;
        // Clear any in-progress time/slot selection so the user picks fresh
        this.selectedSlotId = null;
        this.selectedTime = null;
    }

    handleClearFilter() {
        this.filterDate = null;
    }

    handleTimeClick(event) {
        const slotId = event.currentTarget.dataset.slot;
        const time = event.currentTarget.dataset.time;
        this.selectedSlotId = slotId;
        this.selectedTime = time;
    }

    handleOverlayClick(event) {
        // Close only if user clicks directly on the overlay
        if (event.target.classList.contains('bam-overlay')) {
            this.close();
        }
    }

    handleModalClick(event) { event.stopPropagation(); }

    handleClose() { this.close(); }

    close() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    async handleNext() {
        if (this.nextDisabled) return;
        this.sending = true; // reuse sending flag as "advancing" spinner
        try {
            // Persist booking first so the email template can render with the new Appointment
            const result = await bookAppointment({
                opportunityId: this.recordId,
                agentSlot: this.agentSlot,
                availabilityId: this.selectedSlotId,
                selectedTime: this.selectedTime
            });
            if (result && result.status === 'error') {
                throw new Error(result.message || 'Failed to save booking');
            }
            // If this is an amend, log a Vendor Note capturing the before/after
            // times and reason. Saved at this transition so the audit trail is
            // persisted even if the user later discards the email step.
            if (this.isAmend) {
                try { await this._saveAmendNote(); } catch (e) { /* silent */ }
            }
            // Render the per-agent booking confirmation template
            this.loadingEmail = true;
            const templateId = AGENT_TEMPLATE_IDS[this.agentNum] || null;
            if (templateId) {
                try {
                    const rendered = await getRenderedTemplate({
                        templateId,
                        opportunityId: this.recordId
                    });
                    this.emailSubject = rendered?.subject || 'Valuation Booking Confirmation';
                    this.emailBody = rendered?.body || '';
                } catch (e) {
                    this.emailSubject = 'Valuation Booking Confirmation';
                    this.emailBody = '<p>Unable to load the email template automatically. Please compose the message.</p>';
                }
            } else {
                this.emailSubject = 'Valuation Booking Confirmation';
                this.emailBody = '';
            }
            this.loadingEmail = false;
            this.step = 2;
        } catch (e) {
            this.toast('Booking failed', this.msg(e), 'error');
        }
        this.sending = false;
    }

    handleBack() {
        // Go back to step 1 (booking already persisted but user can re-pick a slot)
        this.step = 1;
    }

    handleSubjectChange(event) { this.emailSubject = event.target.value; }
    handleToChange(event)      { this.emailTo = event.target.value; }
    handleCcChange(event)      { this.emailCc = event.target.value; }
    handleBccChange(event)     { this.emailBcc = event.target.value; }
    handleBodyChange(event)    { this.emailBody = event.target.value; }
    handleToggleEditBody()     { this.isEditingBody = !this.isEditingBody; }

    get editBodyToggleLabel() {
        return this.isEditingBody ? '✓ Done Editing' : '✎ Edit';
    }

    // ── Phonebook / Address Book ───────────────────────────────────────
    async handleOpenAddressBook() {
        this.showAddressBook = true;
        this.addressBookSearch = '';
        if (!this._addressBookLoaded) {
            try {
                const results = await getAddressBook({ opportunityId: this.recordId });
                this.addressBookContacts = (results || []).map((c, i) => ({
                    key: 'bamab-' + i, role: c.role, name: c.name, email: c.email, category: c.category
                }));
                this._addressBookLoaded = true;
            } catch (e) {
                this.addressBookContacts = [];
                this._addressBookLoaded = true;
            }
        }
    }

    handleCloseAddressBook() { this.showAddressBook = false; }
    handleAddressBookSearch(event) { this.addressBookSearch = event.target.value; }

    get filteredAddressBook() {
        const q = (this.addressBookSearch || '').toLowerCase();
        const all = this.addressBookContacts || [];
        if (!q) return all;
        return all.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.role || '').toLowerCase().includes(q)
        );
    }
    get hasAddressBookContacts() { return this.filteredAddressBook.length > 0; }

    _addEmailToField(fieldKey, email) {
        if (!email) return;
        const current = this[fieldKey] || '';
        if (current) {
            const existing = current.split(',').map(e => e.trim().toLowerCase());
            if (!existing.includes(email.toLowerCase())) this[fieldKey] = current + ', ' + email;
        } else {
            this[fieldKey] = email;
        }
    }
    handleSelectContactTo(event)  { this._addEmailToField('emailTo',  event.currentTarget.dataset.email); this.showAddressBook = false; }
    handleSelectContactCc(event)  { this._addEmailToField('emailCc',  event.currentTarget.dataset.email); this.showAddressBook = false; }
    handleSelectContactBcc(event) { this._addEmailToField('emailBcc', event.currentTarget.dataset.email); this.showAddressBook = false; }

    async handleSend() {
        if (this.sendDisabled) return;
        this.sending = true;
        try {
            await sendEmailComplete({
                opportunityId: this.recordId,
                toAddress: this.emailTo,
                subject: this.emailSubject,
                body: this.emailBody,
                ccAddress: this.emailCc || '',
                bccAddress: this.emailBcc || '',
                templateId: AGENT_TEMPLATE_IDS[this.agentNum] || null,
                contentDocumentIds: []
            });
            this.toast('Sent', 'Booking confirmation emailed to ' + this.agentName, 'success');
            this.dispatchEvent(new CustomEvent('bookingcomplete', {
                detail: { agentSlot: this.agentSlot, agentNum: this.agentNum, emailSent: true }
            }));
            this.close();
        } catch (e) {
            this.toast('Send failed', this.msg(e), 'error');
        }
        this.sending = false;
    }

    toast(title, message, variant = 'info') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    msg(e) {
        return e?.body?.message || e?.message || 'Unknown error';
    }

    // Format an ISO or Date as "dd MMM yyyy, HH:MM" (en-GB)
    _fmtDt(iso) {
        if (!iso) return 'none';
        try {
            return new Date(iso).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return String(iso); }
    }

    // Persist a Vendor Note capturing the amendment (previous/new/reason)
    async _saveAmendNote() {
        // Build the new DateTime from the picked slot + time
        const slot = this.slots.find(s => s.id === this.selectedSlotId);
        const newIso = slot && slot.iso ? slot.iso + 'T' + this.selectedTime + ':00' : null;
        const reason = (this.amendReason || '').trim() || '(not provided)';
        const noteText =
            `Appointment for Agent ${this.agentNum} amended.\n` +
            `• Previous: ${this._fmtDt(this.previousAppt)}\n` +
            `• New: ${this._fmtDt(newIso)}\n` +
            `• Reason: ${reason}`;
        await saveNote({ noteText, opportunityId: this.recordId });
    }
}
