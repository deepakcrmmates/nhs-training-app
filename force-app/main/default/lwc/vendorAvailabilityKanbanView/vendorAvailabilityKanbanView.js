import { LightningElement, api, track, wire } from 'lwc';
import getVendorAvailabilities from '@salesforce/apex/EventController.getAvailabilities';

export default class VendorAvailabilityKanbanView extends LightningElement {
    _startDate; // Internal variable for startDate
    @track dates = [];
    @track currentWeekHeader = '';
    @api applicationId;
    @track availabilities = [];
    @track currentWeekStartDate;
    @track currentWeekEndDate;
    @track isPopupVisible = false;
    @track groupedAvailabilities = [];
    @track listFlag = false;
    @track kanBanFlag = true;
    @track flag = true;

    @api
    set startDate(value) {
        if (value) {
            this._startDate = new Date(value);
            this.updateWeek(this._startDate);
        }
    }

    get startDate() {
        return this._startDate;
    }

    connectedCallback() {
        if (!this._startDate) {
            this.updateWeek(new Date());
        }
    }

   /* @wire(getVendorAvailabilities, {
        startDate: '$currentWeekStartDate',
        endDate: '$currentWeekEndDate',
        appId: '$applicationId'
    }) */

      @wire(getVendorAvailabilities, {
        startDate: '$currentWeekStartDate',
        endDate: '$currentWeekEndDate',
        appId: '$applicationId'
    })
    wiredAvailabilities({ error, data }) {
        this.flag = false;

        if (data) {
            console.log('Fetched Vendor Availabilities:', data);

            // Clone and add computed name
            const clonedData = data.map(item => {
                const clone = { ...item };
                const firstName = item?.Vendor__r?.FirstName || '';
                const lastName = item?.Vendor__r?.LastName || '';
                clone.vendorFullName = `${firstName} ${lastName}`.trim();
                return clone;
            });

            const mapByDate = new Map();

            clonedData.forEach(item => {
                const date = item.Date__c;
                if (!mapByDate.has(date)) {
                    mapByDate.set(date, []);
                }
                mapByDate.get(date).push(item);
            });

            this.groupedAvailabilities = Array.from(mapByDate.entries()).map(([label, events]) => {
    const formattedLabel = new Date(label).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(',', '');

    return {
        label: `${formattedLabel.slice(0, 3)}, ${formattedLabel.slice(4)}`, // "Mon, 12 Feb 2025"
        events
    };
});


            this.listFlag = this.groupedAvailabilities.length > 0;
        } else if (error) {
            console.error('Error fetching availabilities:', error);
            this.groupedAvailabilities = [];
            this.listFlag = false;
        }
    }


    handleKanbanClick() {
        this.kanBanFlag = true;
        this.listFlag = false;
    }

    handleListClick() {
        this.listFlag = true;
        this.kanBanFlag = false;
    }

    updateWeek(startDate) {
        const startOfWeek = this.getStartOfWeek(startDate);
        const endOfWeek = this.addDays(startOfWeek, 6);

        this.currentWeekStartDate = startOfWeek.toISOString().split('T')[0];
        this.currentWeekEndDate = endOfWeek.toISOString().split('T')[0];

        this.dates = this.generateWeekDays(startOfWeek);
        console.log('Generated Dates:', JSON.stringify(this.dates));
        this.currentWeekHeader = `${this.formatDate(startOfWeek)} - ${this.formatDate(endOfWeek)}`;
    }

    getStartOfWeek(date) {
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = utcDate.getUTCDay(); // Use UTC day
        const diff = utcDate.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday as the start of the week
        return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), diff));
    }

    addDays(date, days) {
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        utcDate.setUTCDate(utcDate.getUTCDate() + days);
        return utcDate;
    }

    generateWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = this.addDays(startDate, i);
            days.push({
                label: this.formatDate(day),
                availabilities: []
            });
        }
        return days;
    }

    //    processAvailabilities(availabilities) {
    //     console.log('Raw Availabilities from Apex:', JSON.stringify(availabilities));

    //     // Normalize keys in the availability map
    //     const availabilityMap = availabilities.reduce((acc, item) => {
    //         const utcDate = new Date(item.Date__c); // Parse Date__c
    //         const dateKey = utcDate.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD

    //         if (!acc[dateKey]) {
    //             acc[dateKey] = [];
    //         }

    //         let availabilityLabel = '';
    //         if (item.AM__c) availabilityLabel += 'Morning ';
    //         if (item.PM__c) availabilityLabel += 'Evening';
    //         availabilityLabel = availabilityLabel.trim();

    //         acc[dateKey].push({
    //             ...item,
    //             availabilityLabel, // Custom label for UI
    //         });

    //         return acc;
    //     }, {});

    //     console.log('Availability Map Keys:', Object.keys(availabilityMap));

    //     // Map availabilities to respective days
    //     this.dates.forEach((day) => {
    //     const dayKey = this.formatDateOnly(day.label); // Convert label to YYYY-MM-DD
    //     console.log(`Day Label: ${day.label}, Day Key: ${dayKey}`);
    //     if (dayKey) {
    //         console.log(`Mapped Availabilities for Day Key (${dayKey}):`, availabilityMap[dayKey]);
    //     } else {
    //         console.error(`Failed to Map Availabilities for Day Label: ${day.label}`);
    //     }
    //     day.availabilities = availabilityMap[dayKey] || [];
    // });


    //     console.log('Processed Dates with Availabilities:', JSON.stringify(this.dates));
    // }

    processAvailabilities(availabilities) {
        console.log('Raw Availabilities from Apex:', JSON.stringify(availabilities));

        // Normalize keys in the availability map
        const availabilityMap = availabilities.reduce((acc, item) => {
            const utcDate = new Date(item.Date__c); // Parse Date__c
            const dateKey = utcDate.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }

            let availabilityLabel = '';
            if (item.AM__c) availabilityLabel += 'Morning ';
            if (item.PM__c) availabilityLabel += 'Evening';
            availabilityLabel = availabilityLabel.trim();

            // Push mapped fields into the accumulator
            acc[dateKey].push({
                Id: item.Id, // Unique availability ID
                Date__c: this.formatCustomDate(item.Date__c), // Date
                Vendor__c: item.Vendor__c, // Vendor ID
                vendorFullName: item.Vendor__r ? item.Vendor__r.FirstName + ' ' + item.Vendor__r.LastName : '', // Vendor Full Name
                vendorShortName: item.Vendor__r ? this.shortenName(item.Vendor__r.LastName) : '', // Vendor Short Name
                Application__c: item.Application__c, // Application ID
                applicationFullName: item.Application__r ? item.Application__r.Name : '', // Application Full Name
                applicationShortName: item.Application__r ? this.shortenName(item.Application__r.Name) : '', // Application Short Name
                AM__c: item.AM__c || false, // Morning availability
                PM__c: item.PM__c || false, // Evening availability
                availabilityLabel: availabilityLabel || 'None', // Availability label (e.g., "Morning Evening")
            });

            return acc;
        }, {});

        console.log('Availability Map Keys:', Object.keys(availabilityMap));

        // Map availabilities to respective days
        this.dates.forEach((day) => {
            const dayKey = this.formatDateOnly(day.label); // Convert label to YYYY-MM-DD
            console.log(`Mapping for Day Label: ${day.label} -> Day Key: ${dayKey}`);

            if (availabilityMap[dayKey]) {
                console.log(`Mapped Availabilities for Day Key (${dayKey}):`, availabilityMap[dayKey]);
            } else {
                console.log(`No Availabilities for Day Label: ${day.label}`);
            }

            day.availabilities = availabilityMap[dayKey] || [];
        });

        console.log('Processed Dates with Availabilities:', JSON.stringify(this.dates));
    }

    formatCustomDate(dateInput) {
        if (!dateInput) {
            return "Invalid Date";
        }
        const date = new Date(dateInput); // Convert to Date object
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    shortenName(name, maxLength = 15) {
        if (name.length > maxLength) {
            return `${name.substring(0, maxLength)}...`;
        }
        return name;
    }

    handleNavigation(event) {
        const recordId = event.target.dataset.id;
        if (recordId) {
            const url = `/lightning/r/${recordId}/view`;
            window.open(url, '_blank');
        }
    }

    formatDate(date) {
        const options = {
            timeZone: 'Europe/London', // Specify UK timezone
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    formatDateOnly(dateString) {
        try {
            // Expected input: "Mon, 16 Dec 2024"
            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            const parts = dateString.split(', '); // Split by ", "
            if (parts.length === 2) {
                const [dayName, datePart] = parts; // Extract weekday and date
                const [day, month, year] = datePart.split(' '); // Split into day, month, and year
                const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth(); // Parse month to get index (0-11)

                if (!isNaN(monthIndex)) {
                    const date = new Date(Date.UTC(year, monthIndex, day));
                    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                }
            }
            console.error('Invalid Date Label Format:', dateString);
            return null;
        } catch (error) {
            console.error('Error Parsing Date Label:', error, dateString);
            return null;
        }
    }


    // formatDateOnly(dateString) {
    //     const date = new Date(dateString);
    //     if (!isNaN(date)) {
    //         // Convert to UK timezone
    //         const ukDate = new Intl.DateTimeFormat('en-GB', {
    //             timeZone: 'Europe/London',
    //             year: 'numeric',
    //             month: '2-digit',
    //             day: '2-digit'
    //         }).format(date);
    //         return ukDate.split('/').reverse().join('-'); // Return YYYY-MM-DD
    //     }
    //     console.error('Invalid Date Label:', dateString);
    //     return null;
    // }

    handleBook() {
        console.log('Book button clicked');
        this.isPopupVisible = true;
    }

    closePopup() {
        this.isPopupVisible = false;
    }

    handleSave() {
        console.log('Save button clicked');
        this.closePopup();
    }
}