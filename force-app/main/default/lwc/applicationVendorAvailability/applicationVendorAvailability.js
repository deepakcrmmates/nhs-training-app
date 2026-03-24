import { LightningElement, api, wire } from 'lwc';
import getAvailabilityDataForOpportunity from '@salesforce/apex/VendorAvailabilityService.getAvailabilityDataForOpportunity';

export default class ApplicationVendorAvailability extends LightningElement {
    @api recordId; // Opportunity ID
    mydata =[];
    weekData = []; // Current week's data
    availabilityData = {}; // Fetched availability data from Salesforce
    startOfWeek; // Date object for the start of the week
    hasData = false; // Flag for data availability
    isModalOpen = false;

    connectedCallback() {
        this.initializeWeek(); // Initialize to the current week
    }

    // Fetch vendor availability data for the current opportunity
    @wire(getAvailabilityDataForOpportunity, { opportunityId: '$recordId' })
    wiredData({ error, data }) {
        if (data) {
            console.log('Fetched Data:', JSON.stringify(data)); // Log the fetched data
            this.mydata = data;
            this.hasData = data.length > 0;
            this.processAvailabilityData(data);
            this.updateWeekData(); // Update the week data based on fetched availability
        } else if (error) {
            console.error('Error fetching vendor availability:', error);
        }
    }

    initializeWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to start from Monday
        this.startOfWeek = new Date(today);
        this.startOfWeek.setDate(today.getDate() + diffToMonday); // Set to Monday
        this.startOfWeek.setHours(0, 0, 0, 0); // Normalize to midnight

        console.log('Start of Week (Monday):', this.startOfWeek);

        this.updateWeekData(); // Update the data for the week
    }

    processAvailabilityData(data) {
        this.availabilityData = {};
        if (!data || data.length === 0) {
            console.log('No data to process in processAvailabilityData.');
            return;
        }

        data.forEach((item) => {
            const normalizedDate = new Date(item.Date__c).toISOString().split('T')[0]; // Normalize date
            this.availabilityData[normalizedDate] = {
                AM: Boolean(item.AM__c), // Ensure AM__c is boolean
                PM: Boolean(item.PM__c), // Ensure PM__c is boolean
                date: normalizedDate, // Add normalized date for further processing
            };
            console.log(`Processed Date: ${normalizedDate}, AM: ${item.AM__c}, PM: ${item.PM__c}`);
        });

        console.log('Final Availability Data:', this.availabilityData); // Check final structure
    }

  updateWeekData() {
    const weekData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight

    // Ensure startOfWeek is initialized correctly
    if (!this.startOfWeek) {
        console.error('Error: startOfWeek is undefined');
        return;
    }

    for (let i = 0; i < 7; i++) {
        // Create a fresh Date object for each day based on startOfWeek
        const currentDate = new Date(this.startOfWeek.getTime());
        currentDate.setDate(this.startOfWeek.getDate() + i); // Increment the date
        currentDate.setHours(0, 0, 0, 0); // Normalize to midnight

        // Format current date in DD/MM/YYYY
        const formattedDate = currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        // Use formattedDate as the key to lookup or initialize availability
        let availability = this.availabilityData[formattedDate] || {
            AM: false,
            PM: false,
            date: formattedDate,
        };

        // Iterate through this.mydata to process availability data
        this.mydata.forEach((item) => {
            const normalizedDate = new Date(item.Date__c).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }); // Normalize to DD/MM/YYYY

            if (normalizedDate === formattedDate) {
                // If the date matches, update availability
                availability = {
                    AM: Boolean(item.AM__c), // Ensure AM__c is boolean
                    PM: Boolean(item.PM__c), // Ensure PM__c is boolean
                    date: normalizedDate,    // Keep the normalized date
                };

                console.log(`Processed Date: ${normalizedDate}, AM: ${item.AM__c}, PM: ${item.PM__c}`);
            }
        });

        // Use the processed availability
        console.log(`Final Availability for ${formattedDate}:`, availability);

        // Revised isDisabled logic
        const isDisabled =
            currentDate < today || // Disable for past dates
            (!availability.AM && !availability.PM); // Disable if no availability for today or future dates

        const amClass = availability.AM ? 'available' : 'unavailable';
        const pmClass = availability.PM ? 'available' : 'unavailable';

        weekData.push({
            ...availability,
            amAvailable: availability.AM, // Include explicit amAvailable
            pmAvailable: availability.PM, // Include explicit pmAvailable
            label: formattedDate, // Use DD/MM/YYYY format for the label
            isDisabled,
            slotKeyAM: `${formattedDate}_AM`, // Use the same format for slot keys
            slotKeyPM: `${formattedDate}_PM`,
            amClass,
            pmClass,
        });

        // Debugging: Log alignment for each day
        console.log(`Date: ${availability.date}, isDisabled: ${isDisabled}, Label: ${formattedDate}, SlotKeyAM: ${formattedDate}_AM`);
    }

    console.log('Aligned Week Data:', JSON.stringify(weekData)); // Debugging output
    this.weekData = weekData;
}




    handlePreviousWeek() {
        this.startOfWeek.setDate(this.startOfWeek.getDate() - 7);
        console.log('Updated Start of Week (Previous):', this.startOfWeek);
        this.updateWeekData();
    }

    handleNextWeek() {
        this.startOfWeek.setDate(this.startOfWeek.getDate() + 7);
        console.log('Updated Start of Week (Next):', this.startOfWeek);
        this.updateWeekData();
    }

    get weekRange() {
        if (this.weekData.length === 0) {
            return '';
        }
        const startLabel = this.weekData[0].label;
        const endLabel = this.weekData[this.weekData.length - 1].label;
        return `${startLabel} - ${endLabel}`;
    }

    handleBookClick(event) {
        const date = event.target.closest('td').getAttribute('data-date');
        console.log('Booking for date:', date);
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleSave() {
        console.log('Save clicked');
        this.isModalOpen = false;
    }
}