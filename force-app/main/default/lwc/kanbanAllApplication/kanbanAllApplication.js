import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOpportunityStages from '@salesforce/apex/AllApplicationKanban.getOpportunityStages';
import fetchOpportunitiesByStage from '@salesforce/apex/AllApplicationKanban.fetchOpportunitiesByStage';

import getRecordTypes from '@salesforce/apex/OpportunityController.getRecordTypes';
import OWNER_BASED_INITIAL from '@salesforce/label/c.Owner_Based_Initial';
import { updateRecord } from 'lightning/uiRecordApi';
export default class KanbanAllApplication extends NavigationMixin(LightningElement) {
  @track columns;
  @track recordTypes;
  @track circleClass;
  @track searchTerm = '';
  @track selectedStage = '';
  @track showFullName = false;
  @api isArchived;
  ownerBasedInitial = OWNER_BASED_INITIAL === 'true'; // Convert to Boolean
  originalColumns; // Store original columns to reset search results

  connectedCallback() {
    this.circleClass = `circle ${this.getRandomColorClass()}`;
    console.log('OUTPUT Application : Opp NHS Process ', this.nhsProcess);
    // console.log('OUTPUT :AllApplicationKanban ', this.isArchived);
    if (this.isArchived == null || this.isArchived == undefined) {
      this.isArchived = false;
    }
    console.log('OUTPUT :AllApplicationKanban ', this.isArchived);
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

  @wire(getOpportunityStages, { opportunityName: '$searchTerm', stageName: '$selectedStage', isArchived: '$isArchived' })
  wiredOpportunityStages({ error, data }) {
    console.log('OUTPUT :AllApplicationKanban ', this.isArchived);

    if (data) {
      this.circleClass = `circle ${this.getRandomColorClass()}`;
      console.log('Opportunity Stages:', data);

      // Define static stages
      const staticStages = [
        { stage: 'To be contacted', opportunities: [] },
        { stage: '1st Contact', opportunities: [] },
        { stage: '2nd Contact', opportunities: [] },
        { stage: '3rd Contact', opportunities: [] },
        { stage: 'Sale Cancelled', opportunities: [] }

      ];

      // Create a map for fetched stages for easy lookup
      const stageMap = new Map(data.map(stage => [stage.stage, stage]));

      // Combine static stages with fetched data
      this.columns = staticStages.map(staticStage => {
        // Retrieve the fetched stage or initialize a new one with no opportunities
        const fetchedStage = stageMap.get(staticStage.stage) || { opportunities: [] };

        return {
          stage: staticStage.stage,
          opportunities: fetchedStage.opportunities
            .map(opportunity => ({
              Id: opportunity.id,
              Name: opportunity.name,
              Housebuilder: opportunity.Housebuilder ? opportunity.Housebuilder : 'N/A',
              City: opportunity.City ? opportunity.City : 'N/A',
              Plot: opportunity.Plot ? opportunity.Plot : 'N/A',
              Aprn: opportunity.Aprn ? opportunity.Aprn : 'N/A',
              CreatedDate: opportunity.CreatedDate, // Keep original for sorting
              FormattedCreatedDate: this.formatDate(opportunity.CreatedDate),
              Owner: this.ownerBasedInitial ? opportunity.ownerName : (opportunity.salesAdvisorName || 'Not A'),
              Initials: this.getInitials(opportunity.ownerName)
            }))
            // Sort opportunities based on CreatedDate in descending order (latest first)
            .sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)),

          // ✅ Move sorting icon and order tracking to the column level
          sortIcon: 'utility:arrowdown', // Default sorting icon
          isAscending: false, // Sorting order state
          isLoading: false,
          allLoaded: false,
          offset: 20,
          hasMore: true
        };
      });

      this.originalColumns = JSON.parse(JSON.stringify(this.columns)); // Clone original data
      this.updateFilteredOpportunities();
      console.log('Columns:', this.columns);
    } else if (error) {
      console.error('Error fetching opportunity stages:', error);
    }
  }



  formatDate(isoDate) {
    // Convert to a JavaScript Date object
    const dateObj = new Date(isoDate);

    // Format the date
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // 🔹 Fetch opportunities from Apex (called in handleSearch too)
  fetchOpportunities(searchText = '', stage = '') {
    getOpportunityStages({ opportunityName: searchText, stageName: stage, isArchived: this.isArchived })
      .then((data) => {
        console.log('Apex returned data:', data);
        const stageMap = new Map(data.map(stage => [stage.stage, stage]));

        // Preserve static stages and merge with fetched data
        this.columns = this.staticStages.map(staticStage => {
          const fetchedStage = stageMap.get(staticStage.stage) || { opportunities: [] };
          return {
            stage: staticStage.stage,
            opportunities: fetchedStage.opportunities.map(opportunity => ({
              Id: opportunity.id,
              Name: opportunity.name,
              Housebuilder: opportunity.Housebuilder || 'N/A',
              City: opportunity.City || 'N/A',
              Plot: opportunity.Plot || 'N/A',
              Aprn: opportunity.Aprn || 'N/A',
              CreatedDate: this.formatDate(opportunity.CreatedDate),
              Owner: this.ownerBasedInitial ? opportunity.ownerName : (opportunity.salesAdvisorName || 'Not Available'),
              Initials: this.getInitials(opportunity.ownerName)
            }))
          };
        });

        this.originalColumns = JSON.parse(JSON.stringify(this.columns)); // Clone for reference
        this.updateFilteredOpportunities();
      })
      .catch(error => {
        console.error('Error fetching opportunity stages:', error);
      });
  }

  handleSearch(event) {
    const searchText = event.target.value.toLowerCase();
    const stage = event.target.dataset.stage;

    // Call Apex to fetch updated data
    this.fetchOpportunities(searchText, stage);

    // Filter current opportunities list
    this.columns = this.columns.map(column => {
      if (column.stage === stage) {
        column.filteredOpportunities = column.opportunities.filter(opportunity =>
          opportunity.Name.toLowerCase().includes(searchText) ||
          (opportunity.Housebuilder && opportunity.Housebuilder.toLowerCase().includes(searchText)) ||
          (opportunity.City && opportunity.City.toLowerCase().includes(searchText)) ||
          (opportunity.Plot && opportunity.Plot.toString().toLowerCase().includes(searchText)) ||
          (opportunity.Aprn && opportunity.Aprn.toLowerCase().includes(searchText))
        );
      }
      return column;
    });
  }

  handleSort(event) {
    const stage = event.currentTarget.dataset.stage;
    const columnIndex = this.columns.findIndex(col => col.stage === stage);

    if (columnIndex !== -1) {
      const column = this.columns[columnIndex];

      // Toggle sort order
      column.isAscending = !column.isAscending;
      column.sortIcon = column.isAscending ? 'utility:arrowup' : 'utility:arrowdown';

      // Sort opportunities
      column.filteredOpportunities.sort((a, b) => {
        const dateA = new Date(a.CreatedDate);
        const dateB = new Date(b.CreatedDate);
        return column.isAscending ? dateA - dateB : dateB - dateA;
      });

      // Update UI
      this.columns = [...this.columns];
    }
  }

  handleScroll(event) {
    const container = event.target;
    const stageName = container.dataset.stage;

    // Find column by stage name
    const columnIndex = this.columns.findIndex(col => col.stage === stageName);
    if (columnIndex === -1) return;

    const column = this.columns[columnIndex];

    // Prevent multiple calls if already loading or everything loaded
    if (column.isLoading || column.allLoaded) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Check if scroll is near the bottom
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      column.isLoading = true;

      const offset = column.opportunities.length;

      fetchOpportunitiesByStage({
        stageName: stageName,
        offsetValue: offset
      }).then(newOpps => {
        console.log('OUTPUT : ', newOpps.length);
        if (newOpps.length === 0) {
          column.allLoaded = true;
        } else {
          const existingIds = new Set(column.opportunities.map(o => o.Id));

          const formatted = newOpps
            .filter(opportunity => !existingIds.has(opportunity.Id)) // prevent duplicates
            .map(opportunity => ({
              Id: opportunity.Id,
              Name: opportunity.Name,
              Housebuilder: opportunity.House_Builder__r?.Name || 'N/A',
              City: opportunity.House_Builder__r?.BillingCity || 'N/A',
              Plot: opportunity.Plot__c || 'N/A',
              Aprn: opportunity.Application_Reference_Number__c || 'N/A',
              CreatedDate: opportunity.CreatedDate,
              FormattedCreatedDate: this.formatDate(opportunity.CreatedDate),
              Owner: this.ownerBasedInitial
                ? opportunity.Owner?.Name || 'N/A'
                : (opportunity.Sales_Advisor__c || 'Not A'),
              Initials: this.getInitials(opportunity.Owner?.Name || 'N/A')
            }));

          column.opportunities = [...column.opportunities, ...formatted];
          column.filteredOpportunities = [...column.opportunities];
        }
      }).catch(error => {
        console.error('Error loading opportunities:', error);
      }).finally(() => {
        column.isLoading = false;
      });

    }
  }


  // handleSearch(event) {
  //   const searchText = event.target.value.toLowerCase();
  //   const stage = event.target.dataset.stage;

  //   this.columns = this.columns.map(column => {
  //     if (column.stage === stage) {
  //       column.filteredOpportunities = column.opportunities.filter(opportunity =>
  //         opportunity.Name.toLowerCase().includes(searchText) ||
  //         (opportunity.Housebuilder && opportunity.Housebuilder.toLowerCase().includes(searchText)) ||
  //         (opportunity.City && opportunity.City.toLowerCase().includes(searchText)) ||
  //         (opportunity.Plot && opportunity.Plot.toString().toLowerCase().includes(searchText)) ||
  //         (opportunity.Aprn && opportunity.Aprn.toLowerCase().includes(searchText))
  //       );
  //     }
  //     return column;
  //   });
  // }

  // Initialize filteredOpportunities with all opportunities
  updateFilteredOpportunities() {
    this.columns = this.columns.map(column => ({
      ...column,
      filteredOpportunities: [...column.opportunities] // Initially show all
    }));
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