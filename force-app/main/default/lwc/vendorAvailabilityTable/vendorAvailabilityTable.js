import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { CloseActionScreenEvent } from 'lightning/actions';
import getVendorAvailability from '@salesforce/apex/VendorAvailabilityService.getVendorAvailability';
import createEvents from '@salesforce/apex/VendorAvailabilityService.createEvents';
import checkEventExists from '@salesforce/apex/VendorAvailabilityService.isEventCreated';
import isSlotBooked from '@salesforce/apex/VendorAvailabilityService.isSlotBooked';
import getOrgTimezone from '@salesforce/apex/VendorAvailabilityService.getOrganizationTimezone';
import customModalStyles from '@salesforce/resourceUrl/modalcss';
export default class VendorAvailabilityTable extends LightningElement {
    @track vendorAvailability = [];
    @track orgTimezone;
    amSlotOptions = [];
    pmSlotOptions = [];
    agentOptions = [];
    selectedAgentIds = {}; // Using an object to store selected agents by recordId
    @api recordId;

    connectedCallback() {

        this.amSlotOptions = [{ label: 'None', value: '' }, ...this.generateTimeSlots('06:00', '11:45')];
        this.pmSlotOptions = [{ label: 'None', value: '' }, ...this.generateTimeSlots('12:00', '18:00')];
        this.loadOrgTimezone();
         this.loadCustomModalCSS();
    }

    loadCustomModalCSS() {
        // Create a <link> element to load the CSS from the static resource
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = customModalStyles;  // customModalStyles is the URL for the static resource
        document.head.appendChild(link); // Apply the custom styles by appending the <link> to the <head>
    }

    isPastDate(recordDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set today to midnight (00:00:00)

        const recordDateWithoutTime = new Date(recordDate);
        recordDateWithoutTime.setHours(0, 0, 0, 0); // Set record date to midnight

        return recordDateWithoutTime < today; // Check if the record date is before today
    }

    isTimeWindowExceeded(recordDate, amCheckboxChecked, pmCheckboxChecked) {
        // Get the current time in the org's timezone
        const currentOrgTime = new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));

        const currentHours = currentOrgTime.getHours();
        const today = new Date(currentOrgTime);
        today.setHours(0, 0, 0, 0); // Set to midnight of the current day
        console.log('currentOrgTime : ', currentOrgTime);
        // Convert recordDate to the org's timezone
        const recordDateLocal = new Date(recordDate.toLocaleString('en-GB', { timeZone: 'Europe/London' }));

        // Determine if recordDate is today or in the past
        const isToday = recordDateLocal.toDateString() === today.toDateString();
        const isPast = recordDateLocal < today;

        console.log('OUTPUT: isPast', isPast);
        console.log('OUTPUT: recordDate', recordDateLocal.toDateString());
        console.log('OUTPUT: today', today.toDateString());

        let isAMSlotDisabled = false;
        let isRowDisabled = false;

        if (isToday) {
            if (amCheckboxChecked && currentHours >= 10) {
                isAMSlotDisabled = true;
            }
            if (currentHours >= 17) {
                isRowDisabled = true;
            }
        }

        if (isPast) {
            isAMSlotDisabled = true;
            isRowDisabled = true;
        }

        return { isAMSlotDisabled, isRowDisabled };
    }



    @wire(getVendorAvailability, { currentId: '$recordId' })
    wiredVendorAvailability({ error, data }) {
        if (data) {
            // Process the vendor availability data
            this.vendorAvailability = data['availabilityRecords'].map(record => {
                const recordDate = new Date(record.Date__c);
                const isPastDate = this.isPastDate(recordDate);

                // Check if an event already exists for the current record
                const existingEvent = data['existingEvents'].find(event =>
                    event.Date__c === record.Date__c && event.Vendor__c === record.Vendor__c
                );

                const { isAMSlotDisabled, isRowDisabled } = this.isTimeWindowExceeded(recordDate, record.AM__c, record.PM__c);

                return {
                    ...record,
                    formattedDate: this.formatDate(record.Date__c),
                    day:this.getDayOfWeek(record.Date__c),
                    selectedAMSlot: existingEvent ? existingEvent.AM__c : null, // Prepopulate AM slot if event exists
                    selectedPMSlot: existingEvent ? existingEvent.PM__c : null, // Prepopulate PM slot if event exists
                    availabilityLabel: isPastDate ? 'Unavailable' : 'Available',
                    availabilityVariant: isPastDate ? 'destructive' : 'success',
                    isSlotDisabled: isPastDate || isRowDisabled,
                    isAMSlotDisabled: isPastDate || isAMSlotDisabled || !record.AM__c,
                    isPMSlotDisabled: isPastDate || isRowDisabled || !record.PM__c
                };
            });

            // Process the agent options
            this.agentOptions = [{ label: 'None', value: '' },
            ...data['agentOptions'].map(agent => ({
                label: agent.Name,
                value: agent.Id
            }))
            ];
        } else if (error) {
            console.error('Error retrieving vendor availability:', error);
        }
    }

    getDayOfWeek(dateString) {
        if (!dateString) return ''; 
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    loadOrgTimezone() {
        getOrgTimezone()
            .then(timezone => {
                this.orgTimezone = timezone;
                this.amSlotOptions = [{ label: 'None', value: '' }, ...this.generateTimeSlots('06:00', '12:00')];
                this.pmSlotOptions = [{ label: 'None', value: '' }, ...this.generateTimeSlots('12:00', '18:00')];
            })
            .catch(error => {
                console.error('Error fetching org timezone:', error);
            });
    }
    generateTimeSlots(startTime, endTime) {
        const timeSlots = [];
        let start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);

        while (start <= end) {
            const hours = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            timeSlots.push({ label: `${hours}:${minutes}`, value: `${hours}:${minutes}` });
            start.setMinutes(start.getMinutes() + 15);
        }
        return timeSlots;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
    }

    handleAgentChange(event) {
        const agentId = event.detail.value;
        const recordId = event.target.dataset.id;
        const vendorId = event.target.dataset.vendorId;
        const recordDate = this.vendorAvailability.find(record => record.Id === recordId).Date__c;

        // Check if the agent is already booked for another date
        for (const record of this.vendorAvailability) {
            const existingAgentId = this.selectedAgentIds[record.Id];
            if (existingAgentId === agentId && record.Date__c !== recordDate) {
                this.showNotification('Error', `Agent is already booked for another date (${record.Date__c}).`, 'error');
                return;
            }
        }

        checkEventExists({ agentId: agentId, currentId: this.recordId, vendorId: vendorId })
            .then((isEventExists) => {
                if (isEventExists) {
                    this.showNotification('Error', 'This agent is already booked.', 'error');
                } else {
                    // Update the selectedAgentIds object and reassign it to ensure reactivity
                    this.selectedAgentIds = { ...this.selectedAgentIds, [recordId]: agentId };
                }
            })
            .catch((error) => {
                console.error('Error checking event existence:', error);
                this.showNotification('Error', 'An unexpected error occurred while checking agent availability.', 'error');
            });
        console.log('Selected Agent IDs:', this.selectedAgentIds);
    }



    handleSlotBooking() {
        const eventsToCreateOrUpdate = [];
        const agentDateMap = {};

        for (const record of this.vendorAvailability) {
            const amSlot = record.selectedAMSlot;
            const pmSlot = record.selectedPMSlot;
            const date = record.Date__c;
            const agentId = this.selectedAgentIds[record.Id];

            if (!agentId) {
                console.warn(`No agent selected for record ${record.Id}`);
                continue;
            }

            if (agentDateMap[agentId] && agentDateMap[agentId] !== date) {
                this.showNotification('Error', `Agent is already booked for a different date: ${agentDateMap[agentId]}. Cannot book multiple dates.`, 'error');
                return;
            }

            agentDateMap[agentId] = date;

            const existingEvent = record.existingEventId; // Check if there's an existing event

            const createOrUpdateEvent = {
                agentId,
                currentId: this.recordId,
                vendorId: record.Vendor__c,
                startDateTime: new Date(`${date}T${amSlot || pmSlot}:00.000Z`).toISOString(),
                endDateTime: new Date(new Date(`${date}T${amSlot || pmSlot}:00.000Z`).getTime() + 60 * 60000).toISOString(),
                eventId: existingEvent ? existingEvent : null // If an event exists, provide its ID for updating
            };
            eventsToCreateOrUpdate.push(createOrUpdateEvent);
        }

        if (eventsToCreateOrUpdate.length === 0) {
            this.showNotification('Error', 'No events to create or update. Please select available slots and agents.', 'error');
            return;
        }

        console.log('OUTPUT : 56', JSON.stringify(eventsToCreateOrUpdate));
        createEvents({ eventData: JSON.stringify(eventsToCreateOrUpdate) })
            .then(result => {
                console.log('OUTPUT : ', result);
                // Dispatch event to close the modal
                setTimeout(() => {
                   this.dispatchEvent(new CloseActionScreenEvent());
                }, 1000);
                this.showNotification('Success', 'Events created or updated successfully.', 'success');

                setTimeout(() => {
                    this.dispatchEvent(new CustomEvent('closemodal'));
                     const recordId = this.recordId;
                    window.location = `/lightning/r/${recordId}/view`;
                }, 900);
            })
            .catch(error => {
                console.error('Error creating or updating events:', error);
                this.showNotification('Error', 'An unexpected error occurred while creating or updating events.', 'error');
                // this.dispatchEvent(new CloseActionScreenEvent());
            });

        // Delay of 2 seconds
    }

    handleSlotChange(event) {
        const { name, value, dataset } = event.target; // 'name' will be 'selectedAMSlot' or 'selectedPMSlot'
        const recordId = dataset.id;

        // Get the selected slot's time (in HH:mm format)
        const selectedSlotTime = value;

        // Find the record for the selected slot
        const selectedRecord = this.vendorAvailability.find(record => record.Id === recordId);

        // Check if the selected record or date is valid
        if (!selectedRecord || !selectedRecord.Date__c) {
            this.showNotification('Error', 'Invalid date or record selection.', 'error');
            return;
        }

        let selectedDate = selectedRecord.Date__c;

        // Format to remove the time component (keeping only YYYY-MM-DD)
        if (selectedDate) {
            selectedDate = new Date(selectedDate).toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'
        } else {
            console.error('Selected date is null or undefined');
            this.showNotification('Error', 'Invalid date format.', 'error');
            return;
        }

        if (!selectedSlotTime) {
            this.showNotification('Error', 'Slot time is missing or invalid.', 'error');
            return;
        }
        // Check if today’s date is selected and compare it with the org’s current time
        if (selectedDate === new Date().toISOString().split('T')[0]) {
            // Ensure orgTimezone is available
            if (!this.orgTimezone) {
                this.showNotification('Error', 'Unable to check slot due to missing timezone information.', 'error');
                return;
            }

            // Log orgTimezone for debugging
            console.log('Organization Timezone:', this.orgTimezone);

            try {
                const currentOrgTime = new Date(new Date().toLocaleString('en-US', { timeZone: this.orgTimezone }));
                // Log currentOrgTime for debugging
                console.log('Current Org Time:', currentOrgTime);

                if (isNaN(currentOrgTime.getTime())) {
                    throw new Error('Invalid Date format for orgTimezone.');
                }

                const selectedSlotDateTime = new Date(`${selectedDate}T${selectedSlotTime}:00`);
                // Log selectedSlotDateTime for debugging
                console.log('Selected Slot DateTime:', selectedSlotDateTime);

                if (selectedSlotDateTime <= currentOrgTime) {
                    this.showNotification('Error', 'You cannot select a past time slot for today.', 'error');
                    return;
                }
            } catch (error) {
                console.error('Error processing timezone:', error);
                this.showNotification('Error', 'Invalid timezone information.', 'error');
            }
        }



        // Format the DateTime into ISO format before sending it to Apex
        let formattedDateTime = new Date(`${selectedDate}T${selectedSlotTime}:00`).toISOString();

        // Check if the selected slot is already booked
        isSlotBooked({
            startDateTime: formattedDateTime,
            slot: selectedSlotTime,
            currentId: this.recordId
        })
            .then(isBooked => {
                if (isBooked) {
                    this.showNotification('Error', 'This slot is already booked for the selected date.', 'error');

                    // Reset the selected slot
                    this.vendorAvailability = this.vendorAvailability.map(record => {
                        if (record.Id === recordId) {
                            return {
                                ...record,
                                [name]: '' // Clear the slot selection
                            };
                        }
                        return record;
                    });
                    return;
                }

                // Continue with slot selection and update the vendorAvailability list
                this.vendorAvailability = this.vendorAvailability.map(record => {
                    if (record.Id === recordId) {
                        let selectedAMSlot = name === 'selectedAMSlot' ? value : record.selectedAMSlot;
                        let selectedPMSlot = name === 'selectedPMSlot' ? value : record.selectedPMSlot;

                        if (selectedAMSlot && selectedPMSlot) {
                            if (name === 'selectedAMSlot') {
                                selectedPMSlot = ''; // Reset PM slot if AM is selected
                            } else {
                                selectedAMSlot = ''; // Reset AM slot if PM is selected
                            }

                            this.showNotification('Warning', 'You can only select one slot (either AM or PM).', 'warning');
                        }

                        return { ...record, selectedAMSlot, selectedPMSlot };
                    }
                    return record;
                });
            })
            .catch(error => {
                console.error('Error checking slot availability:', error);
                this.showNotification('Error', 'Unable to check slot availability. Please try again later.', 'error');
            });

        console.log('Selected Date:', selectedDate);
        console.log('Selected Slot Time:', selectedSlotTime);
        console.log('Opportunity Id:', this.recordId);
    }







    // handleSlotBooking() {
    //     const eventsToCreate = [];
    //     const agentDateMap = {}; // Map to track the agent's booked dates

    //     // Iterate through the vendor availability records to check for conflicts
    //     for (const record of this.vendorAvailability) {
    //         console.log('OUTPUT : record', JSON.stringify(record));
    //         const amSlot = record.selectedAMSlot;
    //         const pmSlot = record.selectedPMSlot;
    //         const date = record.Date__c;
    //         const agentId = this.selectedAgentIds[record.Id]; // Get the selected agent ID for this record

    //         // Check if an agent is selected for the record
    //         if (!agentId) {
    //             console.warn(`No agent selected for record ${record.Id}`);
    //             continue; // Skip this record if no agent is selected
    //         }

    //         // Check if the agent is already booked for a different date
    //         if (agentDateMap[agentId] && agentDateMap[agentId] !== date) {
    //             this.showNotification('Error', `Agent is already booked for a different date: ${agentDateMap[agentId]}. Cannot book multiple dates.`, 'error');
    //             return; // Stop processing further, no event creation should happen
    //         }

    //         // Store the agent's booking date in the map
    //         agentDateMap[agentId] = date;

    //         // Process AM Slot
    //         if (amSlot) {
    //             const startDateTime = new Date(`${date}T${amSlot}:00`);
    //             const endDateTime = new Date(startDateTime.getTime() + 60 * 60000); // 1-hour slot

    //             eventsToCreate.push({
    //                 agentId,
    //                 currentId: this.recordId,
    //                 vendorId: record.Vendor__c,
    //                 startDateTime: startDateTime.toISOString(),
    //                 endDateTime: endDateTime.toISOString()
    //             });
    //         }

    //         // Process PM Slot
    //         if (pmSlot) {
    //             const startDateTime = new Date(`${date}T${pmSlot}:00`);
    //             const endDateTime = new Date(startDateTime.getTime() + 60 * 60000); // 1-hour slot

    //             eventsToCreate.push({
    //                 agentId,
    //                 currentId: this.recordId,
    //                 vendorId: record.Vendor__c,
    //                 startDateTime: startDateTime.toISOString(),
    //                 endDateTime: endDateTime.toISOString()
    //             });
    //         }
    //     }

    //     // If no events were created, show an error and stop further execution
    //     if (eventsToCreate.length === 0) {
    //         this.showNotification('Error', 'No events to create. Please select available slots and agents.', 'error');
    //         return;
    //     }

    //     // If we reach this point, there are valid events to create
    //     createEvents({ eventData: JSON.stringify(eventsToCreate) })
    //         .then(result => {
    //             if (result.startsWith('No data available to insert.')) {
    //                 console.error(result);
    //                 this.showNotification('Error', result, 'error');
    //             } else {
    //                 console.log(result);
    //                 this.showNotification('Success', result, 'success');
    //             }
    //             this.dispatchEvent(new CloseActionScreenEvent());
    //         })
    //         .catch(error => {
    //             console.error('Error creating events:', error);
    //             this.showNotification('Error', 'An unexpected error occurred while creating events.', 'error');
    //             this.dispatchEvent(new CloseActionScreenEvent());
    //         });
    // }


    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(evt);
        // location.reload();
    }
}