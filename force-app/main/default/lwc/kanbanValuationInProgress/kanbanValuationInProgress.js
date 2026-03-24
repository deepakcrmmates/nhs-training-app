import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOpportunityStages from '@salesforce/apex/OpportunityController.getOpportunityStages';
import OWNER_BASED_INITIAL from '@salesforce/label/c.Owner_Based_Initial';
import getRecordTypes from '@salesforce/apex/OpportunityController.getRecordTypes';
import { updateRecord } from 'lightning/uiRecordApi';
import updateOpportunityStage from '@salesforce/apex/OpportunityController.updateOpportunityStage'; // Import the method
 export default class KanbanValuationInProgress extends NavigationMixin(LightningElement) {

 @track columns;
  @track recordTypes;
  @api selectedRecordTypeId = 'Part_Exchange_Valuations_In_Process';
   @track circleClass;
   @track showFullName = false;
   ownerBasedInitial = OWNER_BASED_INITIAL === 'true'; // Convert to Boolean

 connectedCallback() {
        this.circleClass = `circle ${this.getRandomColorClass()}`;
    }

  @wire(getRecordTypes)
  wiredRecordTypes({ error, data }) {
    if (data) {
      console.log('Record Types:', data);
      this.recordTypes = data.map(recordType => {
        return { label: recordType.Name, value: recordType.Id };
      });
    } else if (error) {
      console.error('Error fetching record types:', error);
    }
  }

  @wire(getOpportunityStages, { recordTypeId: '$selectedRecordTypeId' })
wiredOpportunityStages({ error, data }) {
    if (data) {
        this.circleClass = `circle ${this.getRandomColorClass()}`;
        console.log('Opportunity Stages:', data);

        // Define static stages
        const staticStages = [
          { stage: 'Vendor Availability', opportunities: [] },
            { stage: 'Agents Booked', opportunities: [] },
            { stage: 'Figures to chase', opportunities: [] },
            { stage: 'Valuations Returned', opportunities: [] }
           
        ];

        // Create a map for fetched stages for easy lookup
        const stageMap = new Map(data.map(stage => [stage.stage, stage]));

        // Combine static stages with fetched data
        this.columns = staticStages.map(staticStage => {
            // Retrieve the fetched stage or initialize a new one with no opportunities
            const fetchedStage = stageMap.get(staticStage.stage) || { opportunities: [] };
            return {
                stage: staticStage.stage,
                opportunities: fetchedStage.opportunities.map(opportunity => {
                    return {
                        Id: opportunity.id,
                        Name: this.getShortenedName(opportunity.name),
                        Housebuilder: opportunity.Housebuilder ? opportunity.Housebuilder : 'N/A',
                        City: opportunity.City ? opportunity.City : 'N/A',
                        Plot: opportunity.Plot ? opportunity.Plot : 'N/A',
                        Aprn: opportunity.Aprn ? opportunity.Aprn : 'N/A',
                        Owner: this.ownerBasedInitial ? opportunity.ownerName : (opportunity.salesAdvisorName || 'Not A'), 
                        Initials: this.getInitials(opportunity.ownerName)
                    };
                })
            };
        });

        console.log('Columns:', this.columns);
    } else if (error) {
        console.error('Error fetching opportunity stages:', error);
    }
}

   // Show popup on hover
    showPopup() {
        this.showFullName = true;
    }

    // Hide popup when not hovering
    hidePopup() {
        this.showFullName = false;
    }
  
    // Function to get a random color class
    getRandomColorClass() {
        const colors = [
            'circle-red', 'circle-green', 'circle-blue', 'circle-yellow',
            'circle-orange', 'circle-purple', 'circle-pink', 'circle-brown',
            'circle-grey', 'circle-black', 'circle-rose'
        ];
        const randomIndex = Math.floor(Math.random() * colors.length);
        return colors[randomIndex];
    }

 getInitials(name) {
        if (!name) {
            return '';
        }
        const nameArray = name.trim().split(' ');
        const initials = nameArray.map(word => word.charAt(0).toUpperCase()).join('');
        return initials;
    }
  getShortenedName(name) {
    const maxLength = 20; // Set your desired max length
    return name && name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  }

  // handleRecordTypeChange(event) {
  //   this.selectedRecordTypeId = event.detail.value;
  //   console.log('Selected Record Type ID:', this.selectedRecordTypeId);
  // }

  draggedItem = null;

  handleDragStart(event) {
    this.draggedItem = event.currentTarget;
    this.draggedFromColumn = event.currentTarget.closest('.kanban-column');
    event.currentTarget.classList.add('dragging');
    console.log('Drag Start:', this.draggedItem);
  }

  handleDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    console.log('Drag End:', this.draggedItem);
    this.draggedItem = null;
    this.draggedFromColumn = null;
    this.clearPlaceholders();
  }

  handleDragOver(event) {
    event.preventDefault();
    const column = event.currentTarget;
    console.log('Drag Over Column:', column.dataset.id);

    if (this.draggedFromColumn !== column) {
      this.clearPlaceholders(); // Clear placeholders from all columns

      column.classList.add('dragover');
      const placeholder = column.querySelector('.kanban-card-placeholder');
      const afterElement = this.getDragAfterElement(column, event.clientY);
      if (afterElement == null) {
        column.querySelector('.kanban-cards').appendChild(placeholder);
      } else {
        column.querySelector('.kanban-cards').insertBefore(placeholder, afterElement);
      }
      placeholder.style.display = 'block'; // Ensure the placeholder is visible
      console.log('Placeholder added to column:', column.dataset.id);
    }
  }

  handleDrop(event) {
    const column = event.currentTarget;
    column.classList.remove('dragover');
    const placeholder = column.querySelector('.kanban-card-placeholder');
    console.log('Drop Column:', column.dataset.id);
    if (this.draggedItem && placeholder) {
      column.querySelector('.kanban-cards').insertBefore(this.draggedItem, placeholder);
      console.log('Item dropped:', this.draggedItem.dataset.id);
      this.updateOpportunityStage(this.draggedItem.dataset.id, column.dataset.id);
    }
    this.clearPlaceholders();
  }

  getDragAfterElement(column, y) {
    const draggableElements = [...column.querySelectorAll('.kanban-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  clearPlaceholders() {
    this.template.querySelectorAll('.kanban-card-placeholder').forEach(placeholder => {
      placeholder.style.display = 'none';
      console.log('Placeholder cleared');
    });
  }

  navigateOppHandler(event) {
    event.preventDefault();
    console.log('Navigating to Opportunity ID:', event.currentTarget.dataset.Id);
    const oppId = event.currentTarget.dataset.id;
    console.log('Navigating to Opportunity ID:', oppId);

    // Navigate to the Opportunity record page
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: oppId,
        objectApiName: 'Opportunity',
        actionName: 'view'
      }
    });
  }

  updateOpportunityStage(draggedItemId, newStage) {
    let draggedOpportunity;

 const fields = {};
        fields['Id'] = draggedItemId;
        fields['StageName'] = newStage;

        const recordInput = { fields };

    updateRecord(recordInput)
      .then((res) => {
           this.showToast('Success', 'Stage Update Successfully.', 'success', 'dismissable');
          console.log('OUTPUT : stage updated', res);
        // Update the UI to reflect the changes
      })
      .catch(error => {
        console.error('Error updating opportunity stage:', error);
      });
    // Find and remove the dragged opportunity from its current stage
    this.columns = this.columns.map(column => {
      const opportunityIndex = column.opportunities.findIndex(opportunity => opportunity.Id === draggedItemId);
      if (opportunityIndex > -1) {
        draggedOpportunity = column.opportunities.splice(opportunityIndex, 1)[0];
        column.count--; // Decrease the count in the old stage
        console.log('Removed opportunity from stage:', column.stage);
      }
      return column;
    });

    // Add the dragged opportunity to the new stage
    this.columns = this.columns.map(column => {
      if (column.stage === newStage && draggedOpportunity) {
        column.opportunities.push(draggedOpportunity);
        column.count++; // Increase the count in the new stage
        console.log('Added opportunity to stage:', column.stage);
      }
      return column;
    });
  }
  showToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant, // 'info', 'success', 'warning', 'error'
            mode: mode // 'dismissable', 'pester', 'sticky'
        });
        this.dispatchEvent(event);
    }
}