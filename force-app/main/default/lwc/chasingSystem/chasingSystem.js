import { LightningElement, track } from 'lwc';
export default class ChasingSystem extends LightningElement {

   @track activeTabValue = '1'; // Default active tab is Calendar
    @track selectedTabHeader = 'Calendar'; // Default header for Calendar tab
    @track highlightBarStyle = 'width: 100px; left: 0px;'; // Default position for the highlight bar

    handleTabChange(event) {
        console.log('OUTPUT : ', event.target.value);
        const tabValue = event.target.value;

        // Update the selected tab header dynamically
        if (tabValue === '1') {
            this.selectedTabHeader = 'Calendar';
            this.highlightBarStyle = 'width: 100px; left: 0px;'; // Adjust bar position for Tab 1
        } else if (tabValue === '2') {
            this.selectedTabHeader = 'Chasing';
            this.highlightBarStyle = 'width: 100px; left: 100px;'; // Adjust bar position for Tab 2
        }

        // Update the active tab value
        this.activeTabValue = tabValue;
    }
}