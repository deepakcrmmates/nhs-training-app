import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getExistingVendorAvailability from '@salesforce/apex/VendorAvailabilityService.getExistingVendorAvailability';
import processVendorAvailability from '@salesforce/apex/VendorAvailabilityService.processVendorAvailability';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_WEEKS = 12;
const INITIAL_WEEKS = 3;

export default class NhsVendorAvailability extends LightningElement {
    @api recordId;
    @track slots = {}; // keyed by date string: { am: bool, pm: bool, id: string }
    @track weekCount = INITIAL_WEEKS;
    isLoading = true;
    existingRecords = [];

    get canAddWeek() {
        return this.weekCount < MAX_WEEKS;
    }

    connectedCallback() {
        this.loadExistingAvailability();
    }

    loadExistingAvailability() {
        this.isLoading = true;
        getExistingVendorAvailability({ currentId: this.recordId })
            .then(result => {
                const records = result.availabilityRecords || [];
                this.existingRecords = records;
                const loadedSlots = {};
                records.forEach(rec => {
                    if (rec.Date__c) {
                        loadedSlots[rec.Date__c] = {
                            am: rec.AM__c || false,
                            pm: rec.PM__c || false,
                            id: rec.Id,
                            availability: rec.Availability__c
                        };
                    }
                });
                this.slots = loadedSlots;
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading availability:', error);
                this.isLoading = false;
            });
    }

    getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        date.setDate(date.getDate() + diff);
        return date;
    }

    getSunday(mondayDate) {
        const sun = new Date(mondayDate);
        sun.setDate(sun.getDate() - 1);
        return sun;
    }

    formatDate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }

    get weeks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.formatDate(today);
        const monday = this.getMonday(today);
        const result = [];

        for (let w = 0; w < this.weekCount; w++) {
            const weekStart = new Date(monday);
            weekStart.setDate(weekStart.getDate() + (w * 7));
            const sunday = this.getSunday(weekStart);
            const satDate = new Date(weekStart);
            satDate.setDate(satDate.getDate() + 5);

            const sunStr = sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const satStr = satDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            const days = [];
            for (let d = 0; d < 7; d++) {
                const dayDate = new Date(sunday);
                dayDate.setDate(dayDate.getDate() + d);
                const dateStr = this.formatDate(dayDate);
                const dayOfWeek = dayDate.getDay();
                const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                const isPast = dateStr < todayStr;
                const slot = this.slots[dateStr] || { am: false, pm: false };
                const hasAm = slot.am;
                const hasPm = slot.pm;
                const hasAll = hasAm && hasPm;
                const hasAvailability = hasAm || hasPm;

                let pastLabel = '';
                if (isPast && hasAvailability) {
                    if (hasAll) pastLabel = 'All Day';
                    else if (hasAm) pastLabel = 'AM';
                    else pastLabel = 'PM';
                }

                days.push({
                    dateStr,
                    dayName: DAY_NAMES[dayOfWeek],
                    dayNumber: dayDate.getDate(),
                    isWeekday,
                    isPast,
                    hasAvailability,
                    pastLabel,
                    colClass: `day-col ${isWeekday ? '' : 'weekend'} ${isPast && isWeekday ? 'past' : ''}`,
                    allClass: `slot-btn ${hasAll ? 'active' : ''}`,
                    amClass: `slot-btn slot-am ${hasAm && !hasAll ? 'active' : ''} ${hasAll ? 'active-via-all' : ''}`,
                    pmClass: `slot-btn slot-pm ${hasPm && !hasAll ? 'active' : ''} ${hasAll ? 'active-via-all' : ''}`
                });
            }

            result.push({
                key: `week-${w}`,
                label: `${sunStr} — ${satStr}`,
                days
            });
        }
        return result;
    }

    handleSlotToggle(event) {
        const dateStr = event.target.dataset.date;
        const slotType = event.target.dataset.slot;
        const current = this.slots[dateStr] || { am: false, pm: false };

        let newSlot;
        if (slotType === 'all') {
            const isAllActive = current.am && current.pm;
            newSlot = { ...current, am: !isAllActive, pm: !isAllActive };
        } else if (slotType === 'am') {
            newSlot = { ...current, am: !current.am };
        } else {
            newSlot = { ...current, pm: !current.pm };
        }

        this.slots = { ...this.slots, [dateStr]: newSlot };
    }

    handleAddWeek() {
        if (this.weekCount < MAX_WEEKS) {
            this.weekCount++;
        }
    }

    async handleSave() {
        this.isLoading = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.formatDate(today);

        const dataList = [];

        // Build data for all dates in the displayed weeks
        const monday = this.getMonday(today);
        for (let w = 0; w < this.weekCount; w++) {
            const weekStart = new Date(monday);
            weekStart.setDate(weekStart.getDate() + (w * 7));
            const sunday = this.getSunday(weekStart);

            for (let d = 0; d < 7; d++) {
                const dayDate = new Date(sunday);
                dayDate.setDate(dayDate.getDate() + d);
                const dateStr = this.formatDate(dayDate);
                const dayOfWeek = dayDate.getDay();

                if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
                if (dateStr < todayStr) continue; // Skip past dates

                const slot = this.slots[dateStr] || { am: false, pm: false };
                const isAvailable = slot.am || slot.pm;

                dataList.push({
                    'Date__c': dateStr,
                    'AM__c': slot.am || false,
                    'PM__c': slot.pm || false,
                    'Availability__c': isAvailable ? 'Available' : 'Unavailable',
                    'Notes__c': '',
                    'Id': slot.id || ''
                });
            }
        }

        try {
            await processVendorAvailability({
                dataList: dataList,
                currentId: this.recordId
            });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Vendor availability saved successfully.',
                variant: 'success'
            }));
            this.loadExistingAvailability();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to save availability.',
                variant: 'error'
            }));
            this.isLoading = false;
        }
    }
}
