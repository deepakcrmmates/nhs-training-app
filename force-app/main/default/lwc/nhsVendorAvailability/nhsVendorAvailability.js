import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getHourlyAvailability from '@salesforce/apex/VendorAvailabilityService.getHourlyAvailability';
import saveHourlyAvailability from '@salesforce/apex/VendorAvailabilityService.saveHourlyAvailability';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DISPLAY_HOURS = [
    { fieldNum: '09', label: '9 am – 10 am' },
    { fieldNum: '10', label: '10 am – 11 am' },
    { fieldNum: '11', label: '11 am – 12 pm' },
    { fieldNum: '12', label: '12 pm – 1 pm' },
    { fieldNum: '13', label: '1 pm – 2 pm' },
    { fieldNum: '14', label: '2 pm – 3 pm' },
    { fieldNum: '15', label: '3 pm – 4 pm' },
    { fieldNum: '16', label: '4 pm – 5 pm' }
];

const AM_HOURS = ['09', '10', '11'];
const PM_HOURS = ['12', '13', '14', '15', '16'];
const ALL_HOURS = [...AM_HOURS, ...PM_HOURS];

export default class NhsVendorAvailability extends LightningElement {
    @api recordId;
    @api vendorName = '';
    @api vendorPhone = '';
    @api vendorEmail = '';
    @track slots = {};
    @track weekOffset = 0;
    @track satEnabled = false;
    @track sunEnabled = false;
    isLoading = true;

    connectedCallback() {
        this.loadAvailability();
    }

    loadAvailability() {
        this.isLoading = true;
        getHourlyAvailability({ opportunityId: this.recordId })
            .then(records => {
                const loaded = {};
                records.forEach(rec => {
                    if (!rec.Date__c) return;
                    for (let h = 0; h < 24; h++) {
                        const hh = String(h).padStart(2, '0');
                        if (rec[`Hour_${hh}__c`]) {
                            loaded[`${rec.Date__c}_${hh}`] = true;
                        }
                    }
                });
                this.slots = loaded;

                // Auto-enable weekend toggles if there's existing weekend data
                let hasSat = false, hasSun = false;
                records.forEach(rec => {
                    if (!rec.Date__c) return;
                    const d = new Date(rec.Date__c + 'T00:00:00');
                    if (d.getDay() === 6) hasSat = true;
                    if (d.getDay() === 0) hasSun = true;
                });
                if (hasSat) this.satEnabled = true;
                if (hasSun) this.sunEnabled = true;

                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading availability:', error);
                this.isLoading = false;
            });
    }

    fmtDate(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    getSunday(d) {
        const date = new Date(d);
        date.setDate(date.getDate() - date.getDay());
        return date;
    }

    getWeekSunday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sun = this.getSunday(today);
        sun.setDate(sun.getDate() + (this.weekOffset * 7));
        return sun;
    }

    get currentWeekLabel() {
        const sun = this.getWeekSunday();
        const sat = new Date(sun);
        sat.setDate(sat.getDate() + 6);
        const sunStr = sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const satStr = sat.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${sunStr} — ${satStr}`;
    }

    get currentWeek() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = this.fmtDate(tomorrow);
        const todayStr = this.fmtDate(today);
        const weekSun = this.getWeekSunday();

        const days = [];
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(weekSun);
            dayDate.setDate(dayDate.getDate() + d);
            const dateStr = this.fmtDate(dayDate);
            const dow = dayDate.getDay();
            const isSat = dow === 6;
            const isSun = dow === 0;
            const isWeekday = (dow >= 1 && dow <= 5) || (isSat && this.satEnabled) || (isSun && this.sunEnabled);
            const isWeekendDisabled = (isSat && !this.satEnabled) || (isSun && !this.sunEnabled);
            const isPast = dateStr < tomorrowStr;
            const isToday = dateStr === todayStr;

            const amOn = AM_HOURS.every(h => this.slots[`${dateStr}_${h}`]);
            const pmOn = PM_HOURS.every(h => this.slots[`${dateStr}_${h}`]);
            const allOn = amOn && pmOn;
            const amPartial = !amOn && AM_HOURS.some(h => this.slots[`${dateStr}_${h}`]);
            const pmPartial = !pmOn && PM_HOURS.some(h => this.slots[`${dateStr}_${h}`]);

            days.push({
                dateStr,
                dayName: DAY_NAMES[dow],
                dayNumber: dayDate.getDate(),
                isWeekday,
                isPast,
                isSat,
                isSun,
                isWeekendDisabled,
                showQuick: isWeekday && !isPast,
                headerClass: `cal-header${isWeekendDisabled ? ' weekend' : ''}${isToday ? ' today' : ''}`,
                quickCellClass: `cal-quick${isWeekendDisabled ? ' weekend' : ''}${isPast ? ' past' : ''}`,
                allBtnClass: `qbtn${allOn ? ' on' : ''}`,
                amBtnClass: `qbtn am${amOn ? ' on' : ''}${amPartial ? ' partial' : ''}`,
                pmBtnClass: `qbtn pm${pmOn ? ' on' : ''}${pmPartial ? ' partial' : ''}`
            });
        }

        const hourRows = DISPLAY_HOURS.map(hour => {
            const cells = days.map(day => {
                const isOn = !!this.slots[`${day.dateStr}_${hour.fieldNum}`];
                let cls = 'cal-slot';
                if (day.isWeekendDisabled) cls += ' weekend';
                else if (day.isPast) cls += ' past';
                else if (isOn) cls += ' on';
                return {
                    key: `${day.dateStr}-${hour.fieldNum}`,
                    dateStr: day.dateStr,
                    hour: hour.fieldNum,
                    isOn,
                    slotClass: cls,
                    tickClass: day.isPast ? 'slot-tick past-tick' : 'slot-tick'
                };
            });
            return { key: `row-${hour.fieldNum}`, label: hour.label, cells };
        });

        return { days, hourRows };
    }

    handleSlotClick(event) {
        const el = event.currentTarget;
        const dateStr = el.dataset.date;
        const hour = el.dataset.hour;
        if (!dateStr || !hour) return;
        if (el.classList.contains('past')) return;
        if (el.classList.contains('weekend')) return;
        const key = `${dateStr}_${hour}`;
        this.slots = { ...this.slots, [key]: !this.slots[key] };
    }

    handleQuickToggle(event) {
        const dateStr = event.target.dataset.date;
        const action = event.target.dataset.action;
        let hours;
        if (action === 'all') hours = ALL_HOURS;
        else if (action === 'am') hours = AM_HOURS;
        else hours = PM_HOURS;

        const allOn = hours.every(h => this.slots[`${dateStr}_${h}`]);
        const newSlots = { ...this.slots };
        hours.forEach(h => { newSlots[`${dateStr}_${h}`] = !allOn; });
        this.slots = newSlots;
    }

    handleWeekendToggle(event) {
        const day = event.target.dataset.day;
        if (day === 'sat') this.satEnabled = event.target.checked;
        else if (day === 'sun') this.sunEnabled = event.target.checked;
    }

    handlePrevWeek() { this.weekOffset--; }
    handleNextWeek() { this.weekOffset++; }
    handleGoToday() { this.weekOffset = 0; }

    async handleSave() {
        this.isLoading = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = this.fmtDate(tomorrow);
        const weekSun = this.getWeekSunday();
        const dataList = [];

        for (let d = 0; d <= 6; d++) {
            // Skip weekends unless enabled
            if (d === 0 && !this.sunEnabled) continue;
            if (d === 6 && !this.satEnabled) continue;
            const dayDate = new Date(weekSun);
            dayDate.setDate(dayDate.getDate() + d);
            const dateStr = this.fmtDate(dayDate);
            if (dateStr < tomorrowStr) continue;

            const entry = { 'Date__c': dateStr };
            for (let h = 0; h < 24; h++) {
                const hh = String(h).padStart(2, '0');
                entry[`Hour_${hh}__c`] = !!this.slots[`${dateStr}_${hh}`];
            }
            dataList.push(entry);
        }

        try {
            await saveHourlyAvailability({ dataList, opportunityId: this.recordId });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success', message: 'Vendor availability saved.', variant: 'success'
            }));
            this.loadAvailability();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to save.',
                variant: 'error'
            }));
            this.isLoading = false;
        }
    }
}
