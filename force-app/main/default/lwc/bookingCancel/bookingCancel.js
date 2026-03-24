import { LightningElement, wire, track, api } from 'lwc';
import getEvents from '@salesforce/apex/VendorAvailabilityService.getEvents';
import updateEvents from '@salesforce/apex/VendorAvailabilityService.updateEvents';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { refreshApex } from '@salesforce/apex';

export default class BookingCancel extends LightningElement {
    @api recordId;
    @api componentname;
    @api buttonlabel ='Update Slots'
    @track events = [];
    modifiedEvents = [];
    @track wiredEventsResult; 

    @wire(getEvents, { currentId: '$recordId' })
    wiredEvents({ data, error }) {
         this.wiredEventsResult = data; 
        if (data) {
            this.events = data.map(event => ({
                ...event,
                formattedStartDate: this.formatDate(event.StartDateTime),
                formattedEndDate: this.formatDate(event.EndDateTime),
                day:this.getDayOfWeek(this.formatDate(event.EndDateTime)),
                agentName: event.Agent__r ? event.Agent__r.Name : 'No Agent',
                buttonLabel: event.IsBooked__c ? 'Booked' : 'Canceled',
                buttonClass: event.IsBooked__c ? 'success' : 'destructive',
                isDescriptionRequired: !event.IsBooked__c
            }));
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

   getDayOfWeek(dateTimeString) {
        if (!dateTimeString) return ''; // Return empty if no input is provided
        const [date, time] = dateTimeString.split(', ');
        if (!date || !time) return ''; // Validate the input format
        const [day, month, year] = date.split('/').map(Number); // Extract day, month, year
        let [hours, minutes] = time.split(':');
        minutes = parseInt(minutes.split(' ')[0], 10); // Extract minutes
        const period = time.split(' ')[1]; // AM/PM
        if (period === 'PM' && parseInt(hours) !== 12) {
            hours = parseInt(hours, 10) + 12;
        } else if (period === 'AM' && parseInt(hours) === 12) {
            hours = 0;
        }
        const dateObject = new Date(year, month - 1, day, hours, minutes);
        if (isNaN(dateObject.getTime())) return '';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dateObject.getDay()];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
             timeZone: 'UTC'
        };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    handleInputChange(event) {
        const { id } = event.target.dataset;
        const value = event.target.value;

        this.updateEvent(id, 'Description', value);
    }

    handleCheckboxChange(event) {
        const { id } = event.target.dataset;
        const value = event.target.checked;

        this.updateEvent(id, 'IsBooked__c', value);
    }

    updateEvent(id, field, value) {
        this.events = this.events.map(event => {
            if (event.Id === id) {
                event[field] = value;
                this.addToModifiedEvents(event);
                
                // Validation for empty Description if booking is canceled
                if (field === 'IsBooked__c') {
                    if (!event.IsBooked__c && (!event.Description || event.Description.trim() === '')) {
                        this.showToast('Error', 'Notes cannot be blank if the booking is canceled', 'error');
                    }
                }
            }
            return event;
        });
    }

    addToModifiedEvents(event) {
        const existingEvent = this.modifiedEvents.find(e => e.Id === event.Id);
        if (existingEvent) {
            Object.assign(existingEvent, event);
        } else {
            this.modifiedEvents.push(event);
        }
    }

    handleButtonClick(event) {
        const { id } = event.target.dataset;

        this.events = this.events.map(event => {
            if (event.Id === id) {
                const isCurrentlyBooked = event.IsBooked__c;
                
                // Toggle booking status
                event.IsBooked__c = !isCurrentlyBooked;
                
                // Update the button label and class
                event.buttonLabel = event.IsBooked__c ? 'Booked' : 'Canceled';
                event.buttonClass = event.IsBooked__c ? 'success' : 'destructive';
                
                // Add event to modifiedEvents for future updates
                this.addToModifiedEvents(event);

                // Validation for empty Description if booking is canceled
                if (!event.IsBooked__c && (!event.Description || event.Description.trim() === '')) {
                    this.showToast('Error', 'Notes cannot be blank if the booking is canceled', 'error');
                }
            }
            return event;
        });
    }

    handleUpdateSlots() {
        // Validate all modified events
        const isValid = this.modifiedEvents.every(event => {
            if (!event.IsBooked__c && (!event.Description || event.Description.trim() === '')) {
                this.showToast('Error', 'Notes cannot be blank if the booking is canceled', 'error');
                return false;
            }
            return true;
        });

        // If validation fails, stop the update
        if (!isValid) {
            return;
        }

        // Proceed with the update if validation passes
        updateEvents({ events: this.modifiedEvents })
            .then(() => {
                 if(this.componentname != 'Calender Booking System'){
                     this. reloadPageAfterDelay();
               this.dispatchEvent(new CloseActionScreenEvent());
                }
                console.log('call from parents: ',this.componentname);
                this.showToast('Success', 'Events updated successfully', 'success');
                this.modifiedEvents = [];
               
                 return refreshApex(this.wiredEventsResult);
               
             
            })
            .then(() => {
                
              
            // Dispatch custom event if needed
            const nextEvent = new CustomEvent('next', {
                detail: { recordId: this.recordId, status: 'BookingCancelled' }
            });
            this.dispatchEvent(nextEvent);
        })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }
     reloadPageAfterDelay() {
        setTimeout(() => {
            window.location.reload(); // Reload the page after a delay
        }, 1600); // Delay time in milliseconds (e.g., 1000 ms = 1 second)
    }
    

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(evt);
    }
}