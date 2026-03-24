import { LightningElement } from 'lwc';

export default class CalendarParentKanbanComponent extends LightningElement {
    showOpportunityList = true;
    selectedOpportunityId;

    // Dynamically update the class based on sidebar visibility
    get opportunityListClass() {
        return this.showOpportunityList ? 'opportunity-list visible' : 'opportunity-list hidden';
    }

    // Dynamically update the icon name based on sidebar visibility
    get toggleIconName() {
        return this.showOpportunityList ? 'utility:chevronleft' : 'utility:chevronright';
    }

    // Add icon rotation when toggling the sidebar
    toggleOpportunityList() {
        this.showOpportunityList = !this.showOpportunityList;

        // Adjust flex classes for kanban view to expand fully when sidebar is hidden
        const sidebar = this.template.querySelector('.sidebar');
        const kanbanContainer = this.template.querySelector('.kanban-view-container');
        const iconElement = this.template.querySelector('.custom-icon'); // Get the icon element
        
        if (this.showOpportunityList) {
            sidebar.style.width = '20%';
            kanbanContainer.classList.remove('full-width');
            kanbanContainer.classList.add('normal-width');
            iconElement.classList.remove('icon-rotate'); // Reset rotation
        } else {
            sidebar.style.width = '0';
            kanbanContainer.classList.remove('normal-width');
            kanbanContainer.classList.add('full-width');
            iconElement.classList.add('icon-rotate'); // Apply rotation
        }
    }

    handleOpportunitySelect(event) {
        this.selectedOpportunityId = event.detail.opportunityId;
    }
}