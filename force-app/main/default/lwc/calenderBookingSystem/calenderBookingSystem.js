import { LightningElement, api, track } from 'lwc';
export default class CalenderBookingSystem extends LightningElement {

@api recordId;;
@track loader = false;
isModalOpen = true;
 @track showAgentBooking = false; // Default tab
    @track showBookingCancellation = true;

    // Classes for styling the active tab
    get agentTabClass() {
        return this.showAgentBooking ? 'tab active' : 'tab';
    }

    get bookingTabClass() {
        return this.showBookingCancellation ? 'tab active' : 'tab';
    }
     handleChildResponse(event) {
        // Access data from the child component
        const { recordId, status } = event.detail;

        // Process response
        console.log(`Record ID: ${recordId}, Status: ${status}`);
        // alert(status);

        // Example: Switch to Agent Re-Booking tab based on child response
        if (status === 'BookingCancelled') {
            this.loader = true;
            this.showBookingCancellation = false;
            this.showAgentBooking = true;
             setTimeout(() => {
            this.loader = false; // Reload the page after a delay
        }, 5000);
        }
    }

    handleModalClose() {
    this.isModalOpen = false; // Assuming you use `isModalOpen` to control the modal's visibility.
}

    // Tab click handlers
    handleAgentTabClick() {
        this.showAgentBooking = true;
        this.showBookingCancellation = false;
    }

    handleBookingTabClick() {
        this.showAgentBooking = false;
        this.showBookingCancellation = true;
    }
}