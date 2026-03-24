import { LightningElement, track } from 'lwc';

export default class NHSCalendarApplication extends LightningElement {
    @track isCalendarVisible = true;
    @track isChasingVisible = false;
    @track isOpportunityVisible = true;
    @track startDate = new Date(); // Start date for the calendar
    @track parentEndDate;
    @track label = 'Applications';
    @track selectedOpportunityId;

    @track nhsProcess = 'Application';
    @track tabName = '';
    isAvailable = false;
    isBooked = false;
    kanban = true;
    opportunity = true;
    figureToChase = false;
    offer = false;
   @track isArchived = false;


    connectedCallback() {
        this.setStartDateToCurrentWeek(); // Set the start date of the current week
        this.parentEndDate = this.getWeekEndDate(this.startDate).toISOString(); // Calculate the end date based on start date
        console.log('End Date of the Week:', this.parentEndDate); // Debugging log
        this. nhsProcess = 'Application';
        this.setDefaultSelectedTab();
    }

    setDefaultSelectedTab() {
        // Wait for the DOM to load
        requestAnimationFrame(() => {
            const buttons = this.template.querySelectorAll('.tab-button');
            buttons.forEach((button) => button.classList.remove('selected-tab'));

            // Find the default button (e.g., using a data attribute or class)
            const defaultButton = this.template.querySelector('.tab-button[data-tab="application"]');
            if (defaultButton) {
                defaultButton.classList.add('selected-tab');
            }
        });
    }

    // Method to calculate and set the start date of the current week
    setStartDateToCurrentWeek() {
        const now = new Date(); // Get the current date
        const dayOfWeek = now.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ...)
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday as the first day of the week
        this.startDate = new Date(now.setDate(diff)); // Set the start date to the calculated date
        console.log('Start Date of the Week:', this.startDate); // Debugging log
    }

    // Method to calculate the end date of the week based on the start date
    getWeekEndDate(date) {
        const endDate = new Date(date); // Clone the start date to avoid modifying the original
        endDate.setDate(endDate.getDate() + 6); // Add 6 days to get the end of the week
        return endDate;
    }

    handlePrevClick() {
        console.log('Previous button clicked');
        this.startDate = this.addDays(this.startDate, -7);
        console.log('OUTPUT : ', this.startDate);
    }

    handleNextClick() {
        console.log('Next button clicked');
        this.startDate = this.addDays(this.startDate, 7);
        console.log('OUTPUT : ', this.startDate);
    }

    addDays(date, days) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

     handleTabClick(event) {
        this.nhsProcess = 'Figures to Chased';
        this.isChasingVisible = true;
        this.isBooked = false;
        this.isAvailable = false;
        this.opportunity = false;
        this.figureToChase = false;
         this.kanban = false;
        this.offer = false;
        this.isArchived = false;
        this.label = 'Figures to Chase';
        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

    }

    handleAvailableClick() {
        console.log('Available button clicked');
        this.nhsProcess = 'Vendor Availability';
        this.opportunity = false;
        this.isChasingVisible = false;
        this.isBooked = false;
        this.isAvailable = true;
        this.figureToChase = false;
        this.offer = false;
        this.label = 'Vendor Availability';
        this.isArchived = false;
 this.kanban = false;
        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);
    }

    handleBookedClick() {
        console.log('Booked button clicked');
        this.nhsProcess = 'Agents Booked';
        this.isChasingVisible = false;
        this.isBooked = true;
        this.isAvailable = false;
        this.opportunity = false;
        this.offer = false;
        this.figureToChase = false;
        this.label = 'Agents Booked';
        this.isArchived = false;

 this.kanban = false;
        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);
    }

    handleApplicationKanban() {
        console.log('OUTPUT : kanban click', event.target);
        this.nhsProcess = 'Application';
        this.isChasingVisible = false;
        this.isBooked = false;
        this.isAvailable = false;
        this.kanban = true;
        this.offer = false;
        this.opportunity = true;
        this.figureToChase = false;
        this.label = 'Applications';
        this.isArchived = false;

        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);
    }

    handleFigClick() {
        this.nhsProcess = 'Figures Returned';
        this.isChasingVisible = false;
        this.isBooked = false;
        this.isAvailable = false;
        this.opportunity = false;
        this.offer = false;
        this.figureToChase = true;
        this.label = 'Figures Returned';
        this.isArchived = false;
 this.kanban = false;
        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);
    }
    handleOfferClick() {
        this.tabName ='Offer'
        this.nhsProcess = '';
        this.isChasingVisible = false;
        this.isBooked = false;
        this.isAvailable = false;
        this.opportunity = false;
        this.offer = true;
        this.figureToChase = false;
        this.label = 'Offer';
         this.isArchived = false;
 this.kanban = false;
        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);
    }

    handleArchivedClick(){
        this.tabName ='Archived'
        this.nhsProcess = '';
        this.isChasingVisible = false;
        this.isBooked = false;
        this.isAvailable = false;
       
        this.offer = false;
        this.figureToChase = false;
        this.label = 'Archived';
        this.isArchived = true;
         this.kanban = false;
         this.opportunity = true;

        const buttons = this.template.querySelectorAll('.tab-button');
        buttons.forEach((button) => button.classList.remove('selected-tab'));

        // Add 'selected-tab' class to the clicked button
        const clickedButton = event.target;
        clickedButton.classList.add('selected-tab');

        // Optional: You can also get the selected tab from the `data-tab` attribute
        const selectedTab = clickedButton.dataset.tab;
        console.log(`Selected tab: ${selectedTab}`);

        
         
    }

    toggleCollapsibleSection() {
        this.isOpportunityVisible = !this.isOpportunityVisible;
    }

    // Dynamically sets the styles for the opportunity container
    get opportunityContainerStyles() {
        return this.isOpportunityVisible
            ? 'width: 20%; display: block; transition: width 0.3s ease-in-out;'
            : 'width: 0; display: none; transition: width 0.3s ease-in-out;';
    }

    // Dynamically sets the styles for the tab content
    get tabContentStyles() {
        return this.isOpportunityVisible
            ? 'width: 80%; transition: width 0.3s ease-in-out;'
            : 'width: 1200%; transition: width 0.3s ease-in-out;';
    }
    handleOpportunitySelect(event) {
        this.selectedOpportunityId = event.detail.opportunityId;
        console.log('OUTPUT : parent', this.selectedOpportunityId);
    }


}