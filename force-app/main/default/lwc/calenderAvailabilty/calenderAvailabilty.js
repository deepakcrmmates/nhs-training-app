import { LightningElement, track } from 'lwc';

export default class AvailabilityTable extends LightningElement {
    @track tableData = [];

    connectedCallback() {
        this.loadTableData();
    }

    loadTableData() {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
        const currentHour = now.getHours();
        
        // Get the start (Monday) and end (Sunday) of the current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - now.getDay() + 7); // Sunday

        // Generate table data for the current week
        let weekData = [];
        for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            weekData.push({
                id: d.getTime(), // Unique ID based on the date
                date: dateStr, // Date in YYYY-MM-DD format
                availability: false, // Default value
                am: false, // Default value
                pm: false, // Default value
                amDisabled: false, // Default value
                pmDisabled: false, // Default value
                buttonLabel: 'Unavailable' // Default value
            });
        }

        this.tableData = weekData; // Set the generated week data
        this.updateTodaySchedulingState(); // Update the state based on the current date and time
    }

    updateTodaySchedulingState() {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
        const currentHour = now.getHours();

        this.tableData.forEach(item => {
            const itemDate = new Date(item.date);
            const itemCurrentDate = itemDate.toISOString().split('T')[0];

            // Default states
            item.amDisabled = false;
            item.pmDisabled = false;
            item.disabled = false;

            if (itemDate.getTime() < now.setHours(0, 0, 0, 0)) {
                // Past dates
                item.disabled = true;
                item.amDisabled = true;
                item.pmDisabled = true;
                item.availability = false;
                item.am = false;
                item.pm = false;
                item.buttonLabel = 'Unavailable';
            } else if (itemCurrentDate === currentDate) {
                // Today
                if (currentHour >= 17) {
                    // After 5 PM
                    item.disabled = true;
                    item.amDisabled = true;
                    item.pmDisabled = true;
                    item.availability = false;
                    item.am = false;
                    item.pm = false;
                    item.buttonLabel = 'Unavailable';
                } else if (currentHour >= 10) {
                    // Between 10 AM and 5 PM
                    item.amDisabled = true;
                    item.pmDisabled = false;
                    item.availability = true;
                    item.buttonLabel = 'Available';
                } else {
                    // Before 10 AM
                    item.amDisabled = false;
                    item.pmDisabled = false;
                    item.availability = true;
                    item.buttonLabel = 'Available';
                }
            } else {
                // Future dates
                item.availability = true;
                item.amDisabled = false;
                item.pmDisabled = false;
                item.buttonLabel = 'Available';
            }
        });

        this.tableData = [...this.tableData]; // Trigger re-render
    }

    handleCheckboxChange(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const field = event.target.dataset.field;
        const item = this.tableData.find(data => data.id === id);

        if (item) {
            item[field] = event.target.checked;
            this.tableData = [...this.tableData]; // Trigger re-render
        }
    }

    toggleAvailability(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const item = this.tableData.find(data => data.id === id);

        if (item) {
            item.availability = !item.availability;
            item.buttonLabel = item.availability ? 'Available' : 'Unavailable'; // Update button label
            this.tableData = [...this.tableData]; // Trigger re-render
        }
    }
}