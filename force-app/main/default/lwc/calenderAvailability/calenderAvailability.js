import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { CloseActionScreenEvent } from 'lightning/actions';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import Last_NAME_FIELD from '@salesforce/schema/Opportunity.Applicant__r.LastName';
import First_NAME_FIELD from '@salesforce/schema/Opportunity.Applicant__r.FirstName';
import Property_NAME_FIELD from '@salesforce/schema/Opportunity.Property__r.Name';
import saveRecords from '@salesforce/apex/VendorAvailabilityService.processVendorAvailability';
import getExistingVendorAvailability from '@salesforce/apex/VendorAvailabilityService.getVendorAvailability';
import getOrganizationTimeZone  from '@salesforce/apex/VendorAvailabilityService.getOrganizationTimezone';

const FIELDS = [Last_NAME_FIELD, First_NAME_FIELD, Property_NAME_FIELD];

export default class CalenderAvailability extends LightningElement {
@track weekData = [];
    @track existingAvailability = [];
    @track  organizationTimezone;
    maxWeeks = 12;
    initialWeeks = 3;
    @api currentId = '';

    connectedCallback() {
        this.initializeWeeks();
        this.updateTodaySchedulingState();
        this.disablePastDays();
        this.fetchOrganizationTimeZone(); 

        if (this.existingAvailability.length) {
            this.mergeExistingAvailability();
        }
    }

    @wire(getExistingVendorAvailability, { currentId: '$currentId' })
    wiredAvailability({ error, data }) {
        if (data) {
            this.existingAvailability = data.availabilityRecords;
            this.mergeExistingAvailability();
        } else if (error) {
            console.error('Error retrieving existing availability:', error);
        }
    }

    @wire(getRecord, { recordId: '$currentId', fields: FIELDS })
    account;

    get firstname() {
        return getFieldValue(this.account.data, First_NAME_FIELD);
    }

    get lastname() {
        return getFieldValue(this.account.data, Last_NAME_FIELD);
    }

    get property() {
        return getFieldValue(this.account.data, Property_NAME_FIELD);
    }

   fetchOrganizationTimeZone() {
        getOrganizationTimeZone()
            .then(timezone => {
                this.organizationTimezone = timezone;
                console.log('Organization Timezone:', this.organizationTimezone);
                this.updateTodaySchedulingState(); // Call only after timezone is loaded
            })
            .catch(error => {
                console.error('Error fetching organization timezone:', error);
            });
    }
     // Method to convert a Date object to the organization's timezone
    convertToOrgTimezone(date) {
        const options = {
            timeZone: this.organizationTimezone,  // Use the organization timezone
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        // Convert date to organization timezone using Intl.DateTimeFormat
        const dateString = new Intl.DateTimeFormat('en-US', options).format(date);

        // Parse the formatted date and create a new Date object
        const [month, day, year, hour, minute, second] = dateString.match(/\d+/g);
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }

    initializeWeeks() {
    const currentWeekNumber = 1;
    for (let week = 0; week < this.initialWeeks; week++) {
        this.addWeek(currentWeekNumber + week);
    }
}

    addWeek(weekNumber) {
    const startDate1 = this.getMondayOfWeek(weekNumber); 
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const formattedDate1 = new Intl.DateTimeFormat('en-GB', options).format(startDate1);
    const startDate = this.getMondayOfWeek(weekNumber);
    const weekDates = this.generateWeekDates(startDate);

    const weekInfo = {
        weekNumber: `Week ${weekNumber} - ${formattedDate1}`,
        weekDates: weekDates,
        availabilityList: weekDates.map(date => ({
            date: date,
            formattedDate: this.formatDateForDisplay(date),
            availability: 'Unavailable', // Default to 'Unavailable'
            amChecked: false,
            pmChecked: false,
            dateBoxClass: 'date-box no-color',
            buttonClass: 'availability-button button-unavailable' // Set default button class
        }))
    };

    this.weekData = [...this.weekData, weekInfo];
}


    getMondayOfWeek(weekNumber) {
        const currentMonday = this.getMondayOfCurrentWeek();
        const daysOffset = (weekNumber - 1) * 7;
        const weekStartDate = new Date(currentMonday);
        weekStartDate.setDate(currentMonday.getDate() + daysOffset);
        return weekStartDate;
    }

    getMondayOfCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        return monday;
    }

    generateWeekDates(startDate) {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date.toISOString().split('T')[0];
        });
    }

    formatDateForDisplay(dateString) {
        return new Date(dateString).getDate();
    }

mergeExistingAvailability() {
    if (!this.existingAvailability.length) return;

    // Get today's date at midnight for comparison (past or future check)
    const today = new Date().setHours(0, 0, 0, 0);

    this.weekData.forEach(week => {
        week.availabilityList.forEach(item => {
            const itemDate = new Date(item.date).setHours(0, 0, 0, 0); // Item date at midnight

            // Find the matched record in existingAvailability
            const matchedRecord = this.existingAvailability.find(record => record.Date__c === item.date);

            // Check if the item date is in the past
            const isPastDate = itemDate < today;

            if (matchedRecord) {
                // Assign the ID of the matched record for updates
                item.id = matchedRecord.Id; 

                if (matchedRecord.Availability__c === 'Available') {
                    item.availability = 'Available';
                    item.amChecked = matchedRecord.AM__c;
                    item.pmChecked = matchedRecord.PM__c;
                    item.notes = matchedRecord.Notes__c || '';

                    // Enable or disable based on whether it's a past date
                    if (isPastDate) {
                        item.disabled = true;
                        item.amDisabled = true;
                        item.pmDisabled = true;
                        item.buttonClass = 'availability-button button-available button-gray'; // Disabled button style for past dates
                    } else {
                        item.disabled = false;
                        item.amDisabled =false;
                        item.pmDisabled = false;
                        item.buttonClass = 'availability-button button-available'; // Available button style for future dates
                    }
                } else {
                    // Set to unavailable and gray out the button
                    item.availability = 'Unavailable';
                    item.disabled = true;
                    item.amDisabled = true;
                    item.pmDisabled = true;
                    item.buttonClass = 'availability-button button-gray button-unavailable'; // Unavailable button style
                }
            } else {
                // No matched record found
                if (isPastDate) {
                    item.disabled = true;
                    item.amDisabled = true;
                    item.pmDisabled = true;
                    item.buttonClass = 'availability-button button-gray'; // Disabled button style for past dates
                } else {
                    item.disabled = false;
                    item.amDisabled = false;
                    item.pmDisabled = false;
                    item.buttonClass = 'availability-button button-unavailable'; // Default unavailable style for future dates
                }
            }
        });
    });

    // Trigger re-render
    this.weekData = [...this.weekData];
}





    updateClasses() {
        this.template.querySelectorAll('.availability-button').forEach(button => {
            const availability = button.dataset.availability;
            button.classList.toggle('button-available', availability === 'Available');
            button.classList.toggle('button-unavailable', availability !== 'Available');
        });

        this.template.querySelectorAll('.availability-checkbox').forEach(checkbox => {
            checkbox.classList.toggle('checkbox-checked', checkbox.checked);
            checkbox.classList.toggle('checkbox-unchecked', !checkbox.checked);
        });
    }

 updateTodaySchedulingState() { 
    if (!this.organizationTimezone) {
        console.error('Organization timezone not loaded.');
        return;
    }

    // Get the current time and date in the organization's timezone
    const now = new Date();  // Current date in browser timezone
    const orgTime = this.convertToOrgTimezone(now);  // Convert to organization timezone

    // Create a formatter for the time based on the organization's timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: this.organizationTimezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });

    // Create a formatter for the date based on the organization's timezone
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: this.organizationTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // Extract the formatted time (in hours and minutes)
    const timeParts = timeFormatter.formatToParts(now);
    const currentHour = parseInt(timeParts.find(part => part.type === 'hour').value, 10);

    // Format the date to match 'YYYY-MM-DD' in the organization's timezone
    const formattedDateParts = dateFormatter.format(now).split('/');
    const currentDate = `${formattedDateParts[2]}-${formattedDateParts[1]}-${formattedDateParts[0]}`; // Convert DD/MM/YYYY to YYYY-MM-DD

    console.log(`Current time in org timezone: ${currentHour}`);
    console.log(`Current date in org timezone: ${currentDate}`);

    // Loop through weekData and update states based on org timezone time and date
    this.weekData.forEach(week => {
        week.availabilityList.forEach(item => {
            const itemDate = new Date(item.date);
            const itemCurrentDate = itemDate.toISOString().split('T')[0];

            // Reset default state
            item.amDisabled = false;
            item.pmDisabled = false;
            item.disabled = false;
            item.dateBoxClass = 'date-box';

            if (itemDate < new Date(now.setHours(0, 0, 0, 0))) {
                // Disable past days
                item.disabled = true;
                item.amDisabled = true;
                item.pmDisabled = true;
                item.dateBoxClass = 'date-box past';
            } else if (itemCurrentDate === currentDate) {
                // Handle today's date in the org timezone
                if (currentHour >= 17) {
                    item.disabled = true;
                    item.amDisabled = true;
                    item.pmDisabled = true;
                    item.buttonClass = 'button-gray';
                    item.dateBoxClass = 'date-box disabled';
                } else if (currentHour >= 10) {
                    item.amDisabled = true;
                    item.pmDisabled = false;
                } else {
                    item.amDisabled = false;
                    item.pmDisabled = false;
                }
            } else {
                // Future dates
                item.amDisabled = false;
                item.pmDisabled = false;
            }
        });
    });

    this.weekData = [...this.weekData]; // Trigger re-render
}

handleCheckboxChange(event) {
    const { week: weekIndex, index: dateIndex, field } = event.target.dataset;
    const week = this.weekData[weekIndex];
    const item = week.availabilityList[dateIndex];

    // Define time limits
    const AM_TIME_LIMIT_END = 10;  // 10:00
    const PM_TIME_LIMIT_START = 17; // 17:00

    // Get current time in the organization's timezone
    const now = new Date();
    const orgTime = this.convertToOrgTimezone(now);  // Convert to organization timezone
    const currentDate = orgTime.toISOString().split('T')[0];  // Current date in YYYY-MM-DD format
    const currentHour = orgTime.getHours();  // Current hour in organization timezone

    console.log('Current Time (Org Timezone):', orgTime);
    console.log('Current Date (YYYY-MM-DD):', currentDate);
    console.log('Current Hour:', currentHour);

    // Convert item date to the organization's timezone
    const itemDate = new Date(item.date);
    const itemOrgTime = this.convertToOrgTimezone(itemDate);
    const itemCurrentDate = itemDate.toISOString().split('T')[0];  // Item date in YYYY-MM-DD format

    console.log('Item Date (Org Timezone):', itemOrgTime);
    console.log('Item Date (YYYY-MM-DD):', itemCurrentDate);

    // Check if item date is in the past
    const isPastDate = itemOrgTime < new Date(orgTime.setHours(0, 0, 0, 0));  // Check if item date is past

    console.log('Is Past Date:', isPastDate);

    if (item.disabled || item.availability === 'Unavailable') {
        event.target.checked = false;
        this.showToastMessage('Error', 'Scheduling is disabled or unavailable.', 'error');
        return;
    }

    if (isPastDate) {
        this.showToastMessage('Error', 'Scheduling is disabled for past dates.', 'error');
        if (!event.target.checked) {
            event.target.checked = true;
            item[field] = event.target.checked;
        }
        return;
    }

    // Disable AM/PM checkboxes if outside the time limits for today
    if (itemCurrentDate === currentDate) {
        if (field === 'amChecked' && currentHour >= 10) {
            console.log('AM Checkbox Disabled');
            // Ensure checkbox is unchecked
            item.amDisabled = true;
            this.showToastMessage('Error', 'AM time slot is not available at this hour.', 'error');
            return;
        } else if (field === 'pmChecked' && currentHour >= 17) {
            console.log('PM Checkbox Disabled');
            // Ensure checkbox is unchecked
            item.pmDisabled = true;
            item.disabled = true;
            this.showToastMessage('Error', 'PM time slot is not available yet.', 'error');
            return;
        }
    }

    // Update the item and UI
    item[field] = event.target.checked;
    this.weekData = [...this.weekData]; // Trigger reactivity
    this.updateClasses();
}

    handleNotesChange(event) {
    const weekIndex = event.target.dataset.week;
    const dateIndex = event.target.dataset.index;
    const newNotes = event.target.value;

    // Update the notes value in the data model
    const week = this.weekData[weekIndex];
    const item = week.availabilityList[dateIndex];
    item.notes = newNotes;

    // Trigger re-render
    this.weekData = [...this.weekData];
}

toggleAvailability(event) {
    const { week: weekIndex, index: dateIndex } = event.target.dataset;
    const week = this.weekData[weekIndex];
    const item = week.availabilityList[dateIndex];

    // Create current time and date in the organization's timezone
    const now = new Date();
    const orgTime = this.convertToOrgTimezone(now);  // Convert to organization timezone
    const currentDate = orgTime.toISOString().split('T')[0];  // Current date in YYYY-MM-DD format
    const currentHour = orgTime.getHours();  // Current hour in organization timezone

    const itemDate = new Date(item.date);
    const itemOrgTime = this.convertToOrgTimezone(itemDate);
    const isPastDate = itemOrgTime < new Date(orgTime.setHours(0, 0, 0, 0));  // Check if item date is past

    // If the date is in the past, prevent scheduling and show an error
    if (isPastDate) {
        this.showToastMessage('Error', `Cannot set past date (${item.date}) scheduling.`, 'error');
        return;
    }

    // Check for current date and time constraints
    if (item.date === currentDate) {
        if (currentHour >= 17 ) {
            console.log('OUTPUT :currentHour ', currentHour);
            this.showToastMessage('Error', 'Cannot schedule for the current time.', 'error');
            return;
        }
    }
   

    // Toggle the availability status
    item.availability = item.availability === 'Unavailable' ? 'Available' : 'Unavailable';

    // Update the button class based on the new availability state
    if (item.availability == 'Unavailable') {
        item.amChecked = false;
        item.pmChecked = false;
        item.disabled = true;
        item.buttonClass = 'availability-button button-unavailable'; // Update to unavailable class
    } else {
        item.disabled = false;
        item.buttonClass = 'availability-button button-available'; // Update to available class
    }

    // Trigger re-render to apply the new classes
    this.weekData = [...this.weekData];
}


    showToastMessage(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

  handleSave() {
    let hasError = false;
    const vendorAvailability = [];

    this.weekData.forEach(week => {
        week.availabilityList.forEach(item => {
            if (item.availability === 'Available' && !item.amChecked && !item.pmChecked) {
                hasError = true;
                this.showToastMessage('Error', `Please select AM or PM for date ${item.date}.`, 'error');
            }
        if (item.availability === 'Available'){
            vendorAvailability.push({
                'Id':item.id,
                'Date__c': item.date,
                'Availability__c': item.availability,
                'AM__c': item.amChecked,
                'PM__c': item.pmChecked,
                'Notes__c': item.notes || ''

            });
        }
        });
    });

    if (hasError) return;
    console.log('OUTPUT : ', vendorAvailability.length == 0);
    if(vendorAvailability.length == 0){
        this.showToastMessage('Warning', 'No Availability Selected', 'warning');
        return;
    }
console.log('OUTPUT : ', JSON.stringify(vendorAvailability));
     saveRecords({ dataList: JSON.stringify(vendorAvailability), currentId: this.currentId })
        .then(result => {
            if (result === 'Success') {
                this.showToastMessage('Success', 'Your slots are updated successfully.', 'success');
                this.dispatchEvent(new CloseActionScreenEvent());
            } else {
                this.showToastMessage('Error', result, 'error');
            }
            this.reloadPageAfterDelay(); // Call method to reload page with a delay
        })
        .catch(() => {
            this.showToastMessage('Error', 'Something went wrong.', 'error');
            this.dispatchEvent(new CloseActionScreenEvent()); // Attempting close on error
        });
}


    disablePastDays() {
    // Get current time in the organization's timezone
    const now = new Date();
    const orgTimeNow = this.convertToOrgTimezone(now); // Convert to organization's timezone
    const today = new Date(orgTimeNow.setHours(0, 0, 0, 0)); // Start of today in org timezone
    const currentDate = orgTimeNow.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    const currentHour = orgTimeNow.getHours();

    console.log('Current Time (Org Timezone):', orgTimeNow);
    console.log('Current Date (YYYY-MM-DD):', currentDate);
    console.log('Current Hour:', currentHour);

    this.weekData.forEach(week => {
        week.availabilityList.forEach(item => {
            // Convert item date to the organization's timezone
            console.log('OUTPUT : item---', JSON.stringify(item));
            const itemDate = new Date(item.date);
            const orgItemDate = this.convertToOrgTimezone(itemDate);
            const itemCurrentDate = orgItemDate.toISOString().split('T')[0]; // Item date in YYYY-MM-DD format

            console.log('Item Date (Org Timezone):', orgItemDate);
            console.log('Item Date (YYYY-MM-DD):', itemCurrentDate);

            // Check if item date is in the past
            if (orgItemDate < today) {
                item.disabled = true;
                item.amDisabled = true;
                item.pmDisabled = true;
                item.dateBoxClass = 'date-box past';
                item.buttonClass = 'availability-button button-gray';
            } else {
                // Check if the item date is today and disable AM/PM checkboxes based on current time
                if (itemCurrentDate === currentDate) {
                    // Disable AM checkbox if current hour >= 10
                    if (currentHour >= 10) {
                        item.amDisabled = true;
                        item.dateBoxClass = 'date-box today';
                    } else {
                        item.amDisabled = false;
                    }

                    // Disable PM checkbox if current hour >= 17
                    if (currentHour >= 17) {
                        item.pmDisabled = true;
                        item.disabled = true;
                        item.dateBoxClass = 'date-box today';
                    } else {
                        item.pmDisabled = false;
                    }
                }

                // Reset button class for other dates
                item.buttonClass = 'availability-button';
            }
        });
    });

    this.weekData = [...this.weekData];
}

          // Method to reload the page after a delay
    reloadPageAfterDelay() {
        this.dispatchEvent(new CloseActionScreenEvent()); // Dispatch close action event
        setTimeout(() => {
           window.location.reload(); // Reload the page after a delay

        }, 1600); // Delay time in milliseconds (e.g., 1000 ms = 1 second)
    }
          handleAddNewWeek() {
        if (this.weekData.length < this.maxWeeks) {
            this.addWeek(this.weekData.length + 1);
            this.mergeExistingAvailability();
            this.updateClasses();
        }
    }

}