import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getOfferKanbanData from '@salesforce/apex/OfferKanbanController.getOfferKanbanData';
import updateOfferStage from '@salesforce/apex/OfferKanbanController.updateOfferStage';

export default class OfferKanbanView extends NavigationMixin(LightningElement) {
    @api applicationId = '006KG000002EZX7YAO'; // Set this dynamically if needed
    @track days = [];
    isError = false;
    @track originalDays = [];
    selectedCard = null;
    draggedCard = null;
    Allow = false;
    disAllow = false;
    @track isOpen = false;
    @track notes = '';

    // Wire data from Apex method
    @wire(getOfferKanbanData)
    wiredKanbanData({ error, data }) {
        if (data) {
            console.log('Kanban Data:', data);
            // Add uniqueKey to each event before setting it to the days
            this.days = this.addUniqueKeysToData(data);
            console.log('OUTPUT :this.days ', JSON.stringify(this.days));
            this.originalDays = JSON.parse(JSON.stringify(this.days));
        } else if (error) {
            console.error('Error fetching data:', error);
            this.days = [];
        }
    }

    // Method to add unique keys to events
    addUniqueKeysToData(data) {
        return data.map(day => {
            // Create a new object for each day, ensuring the reactivity
            return {
                ...day,
                events: day.events.map((event, index) => {
                    // Add unique integer key to each event using spread operator
                    return {
                        ...event,
                        uniqueKey: index + 1 // Use index + 1 or any other method to create unique keys
                    };
                })
            };
        });
    }

    // Drag Start handler
    handleDragStart(event) {
        console.log('OUTPUT : drag start');

        // Store the dragged card's unique integer key and current stage
        this.draggedCard = {
            uniqueKey: parseInt(event.target.dataset.uniqueKey),  // Use the unique key directly
            currentStage: event.target.dataset.stage
        };

        console.log('Dragged Card:', this.draggedCard);  // Debugging the dragged card
    }

    // Drag Over handler
    handleDragOver(event) {
        console.log('Drag over');
        event.preventDefault(); // Allow dropping
    }

    // Drop handler
    handleDrop(event) {
        console.log('OUTPUT : drag drop');
        event.preventDefault();

        // Get the new stage from the drop target column
        const newStage = event.target.closest('.kanban-column')?.dataset.stage;

        // Ensure draggedCard is set and a valid newStage exists
        if (this.draggedCard && newStage) {
            const { currentStage } = this.draggedCard;

            console.log('Dragged Card:', this.draggedCard);
            console.log('New Stage:', newStage);  // Debugging the new stage

            // Find the source and target columns
            const sourceColumn = this.days.find(day => day.label === currentStage);
            const targetColumn = this.days.find(day => day.label === newStage);

            if (sourceColumn && targetColumn) {
                // Find the card in the source column using the unique integer key
                const movedCard = sourceColumn.events.find(event => event.uniqueKey === this.draggedCard.uniqueKey);

                if (movedCard) {
                    // Remove the card from the source column
                    sourceColumn.events = sourceColumn.events.filter(event => event.uniqueKey !== this.draggedCard.uniqueKey);
                    console.log('Card removed from Source Column:', movedCard);

                    // Update the card's stage and other properties
                    movedCard.stage = newStage;

                    // Update UI behavior based on the new stage
                    if (newStage === 'New Offers') {
                        movedCard.showAcceptButton = true;
                        movedCard.isDraggable = false;
                        movedCard.buttonText = 'Accept Offer';
                        movedCard.buttonClass = 'accept-offer-button';
                    } else {
                        movedCard.isDraggable = true;
                        movedCard.showAcceptButton = false;
                    }

                    // Add the card to the target column
                    targetColumn.events.push(movedCard);
                    console.log('Card added to Target Column:', movedCard);

                    // Trigger reactivity in the frontend by updating the entire days array
                    this.days = [...this.days];  // Ensure this updates the UI

                    // Update originalDays to reflect the changes
                    // Find the updated source and target columns in originalDays and modify them
                    const originalSourceColumn = this.originalDays.find(day => day.label === currentStage);
                    const originalTargetColumn = this.originalDays.find(day => day.label === newStage);

                    if (originalSourceColumn && originalTargetColumn) {
                        // Remove the card from the source column in originalDays
                        originalSourceColumn.events = originalSourceColumn.events.filter(event => event.uniqueKey !== this.draggedCard.uniqueKey);

                        // Add the moved card to the target column in originalDays
                        originalTargetColumn.events.push(movedCard);

                        // Update the originalDays to reflect the move
                        this.originalDays = [...this.originalDays]; // Ensure originalDays is updated
                    }

                    // Update the backend after updating the frontend
                    this.updateOfferStageInBackend(movedCard.Id, newStage, 'None', '');
                } else {
                    console.log('Error: Card not found in source column');
                }
            } else {
                console.log('Error: Source or Target column not found');
            }
        } else {
            console.log('Error: Dragged Card or New Stage not found');
        }

        // Reset the dragged card after processing the drop
        this.draggedCard = null;
    }


    // Function to update the Offer status in Salesforce (Backend)
    updateOfferStageInBackend(uniqueKey, newStage, status, notes) {
        console.log('OUTPUT : updateOfferStageInBackend');

        updateOfferStage({ offerId: uniqueKey, newStage: newStage, staus: status, notes: notes })
            .then(() => {
                console.log('✅ Offer status updated successfully in backend');

                // 🎉 Show Success Toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: `Offer status updated to "${newStage}" successfully!`,
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.error('❌ Error updating Offer status in backend:', error);

                // ⚠️ Show Error Toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to update Offer status. Please try again.',
                        variant: 'error'
                    })
                );
            });
    }

    // Navigation handler
    handleNavigation(event) {
        event.preventDefault(); // Prevent default anchor behavior
        const recordId = event.target.dataset.id;

        if (recordId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recordId,
                    actionName: 'view'
                }
            });
        }
    }

 
    handleAllowCheckbox(event) {
        const uniqueKey = parseInt(event.target.dataset.uniqueKey);  // Ensure it's a number
        console.log('✅ Allow clicked for card with uniqueKey:', uniqueKey);

        let card = null;
        let sourceColumn = null;
        this.isOpen = true;  // Open the modal for comment input
        this.Allow = true;

        // 🔍 Search for the card in all columns
        for (let day of this.days) {
            const foundIndex = day.events.findIndex(event => event.uniqueKey === uniqueKey);

            if (foundIndex !== -1) {
                card = day.events[foundIndex];  // Found the card
                sourceColumn = day;  // Found the source column
                console.log(`🔍 Found card in column: ${sourceColumn.label}`);
                day.events.splice(foundIndex, 1);  // Remove the card from source column
                break;
            }
        }

        if (!card) {
            console.error(`❌ Card with uniqueKey ${uniqueKey} not found!`);
            console.log('🔍 Current days data:', JSON.stringify(this.days, null, 2)); // Debugging full data
            return;
        }

        this.selectedCard = card;  // Store the selected card for future use
        console.log('OUTPUT : Selected Card', JSON.stringify(this.selectedCard));
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('Search Term:', searchTerm); // Debugging

        if (!this.originalDays || !Array.isArray(this.originalDays)) {
            console.log('No original data found');
            return;
        }

        if (searchTerm) {
            const filteredDays = this.originalDays.map(day => {
                const filteredEvents = day.events.filter(event => {
                    console.log('Checking event:', event.opportunityName); // Debugging

                    return event.opportunityName && event.opportunityName.toLowerCase().includes(searchTerm);
                });

                return { ...day, events: filteredEvents };
            });

            // Even days with no events should still appear with an empty events array
            this.days = filteredDays;
        } else {
            this.days = JSON.parse(JSON.stringify(this.originalDays)); // Reset to original data if search is cleared
        }

        console.log('Filtered Days:', JSON.stringify(this.days)); // Debugging
    }


    handleDisallowCheckbox(event) {
        const uniqueKey = parseInt(event.target.dataset.uniqueKey);
        console.log('❌ Disallow clicked for card with uniqueKey:', uniqueKey);
        this.disAllow = true;
        this.isOpen = true;
        let card = null;
        let sourceColumn = null;

        // 🔍 Search for the card in all columns
        for (let day of this.days) {
            const foundIndex = day.events.findIndex(event => event.uniqueKey === uniqueKey);

            if (foundIndex !== -1) {
                card = day.events[foundIndex];  // ✅ Found the card
                sourceColumn = day;  // ✅ Found the source column
                console.log(`🔍 Found card in column: ${sourceColumn.label}`);

                // 🛠️ Remove the card from the source column
                console.log("Before removal:", JSON.stringify(sourceColumn.events, null, 2));
                day.events.splice(foundIndex, 1);
                console.log("After removal:", JSON.stringify(sourceColumn.events, null, 2));

                break;
            }
        }

        if (!card) {
            console.error(`❌ Card with uniqueKey ${uniqueKey} not found!`);
            console.log('🔍 Current days data:', JSON.stringify(this.days, null, 2)); // Debugging full data
            return;
        }
        this.selectedCard = card;
        console.log(`🔄 Moving card to Disallowed stage`);

        console.log(`🔄 Ready to Disallow card with uniqueKey: ${uniqueKey}`);
    }

    handleDisallowAction() {
        const card = this.selectedCard;
        console.log(`🔄 Moving card to Disallowed stage`);

        // 🎨 Update card properties for Disallowed stage
        card.stage = 'Disallowed';
        card.isDraggable = false;  // ❌ No dragging in Disallowed
        card.showAcceptButton = false;
        card.buttonText = '';
        card.buttonClass = '';

        // ✅ Trigger UI update
        this.days = [...this.days];
        console.log(`✅ Card successfully moved to Disallowed`);

        // 🔄 Update backend with the new stage and the internal comment
        this.updateOfferStageInBackend(card.Id, '', 'Disallow', this.notes);

        // Close the modal after submission
        this.closeModal();
    }

    moveCard() {
        const card = this.selectedCard;
        const nextStage = this.getNextStage(card.stage);
        if (!nextStage) {
            console.warn(`⚠️ No next stage available for: ${card.stage}`);
            return;
        }

        console.log(`🔄 Moving card to next stage: ${nextStage}`);

        // 🏷️ Find the target column
        const targetColumn = this.days.find(day => day.label === nextStage);
        if (!targetColumn) {
            console.error(`❌ Target column ${nextStage} not found!`);
            return;
        }

        // 🎨 Update card properties
        card.stage = nextStage;
        card.isDraggable = nextStage !== 'New Offers';
        card.showAcceptButton = nextStage === 'New Offers';
        card.buttonText = nextStage === 'New Offers' ? 'Accept Offer' : '';
        card.buttonClass = nextStage === 'New Offers' ? 'accept-offer-button' : '';

        // ➕ Move card to the new column
        targetColumn.events.push(card);

        // ✅ Trigger UI update
        this.days = [...this.days];
        console.log(`✅ Card successfully moved to ${nextStage}`);

        // 🔄 Update backend with the internal notes and the new stage
        this.updateOfferStageInBackend(card.Id, nextStage, 'Allow', this.notes);

        // Close the modal after submission
        this.closeModal();
    }

    // Utility function to find the card by unique key
    findCardByUniqueKey(uniqueKey) {
        console.log('Finding card by uniqueKey:', uniqueKey);

        // Flatten all events across all days into a single array
        const allEvents = this.days.flatMap(day => day.events);

        // Find the card with the matching uniqueKey
        const foundCard = allEvents.find(event => event.uniqueKey === uniqueKey);

        if (foundCard) {
            // If found, log the card
            console.log('Card found:', foundCard.Subject);
        } else {
            // If not found, log the message
            console.log('Card not found for uniqueKey:', uniqueKey);
        }

        return foundCard || null; // Return the card or null if not found
    }


    // Utility function to get the next stage based on the current stage
    getNextStage(currentStage) {
        const stageOrder = ['New Offers', 'Pending Offers', 'Best and Final Offers'];
        const currentIndex = stageOrder.indexOf(currentStage);
        if (currentIndex !== -1 && currentIndex < stageOrder.length - 1) {
            console.log(`Next stage found: ${stageOrder[currentIndex + 1]}`);
            return stageOrder[currentIndex + 1];
        }
        console.log('No next stage available for:', currentStage);
        return null;  // No next stage available
    }

    // Update the Offer status in Salesforce (Backend)

    // Close modal
    closeModal() {
        this.isOpen = false;
    }

    // Handle textarea input
    handleInput(event) {
        this.notes = event.target.value;
        this.isError = false;
    }

    // Submit action
    handleSubmit() {
        console.log('Submitted Notes:', this.notes);
        if (!this.notes.trim()) {
            this.isError = true; // Show error if the textarea is empty
            return; // Prevent submission
        }

        if (this.Allow == true) {
            this.moveCard();
        }
        if (this.disAllow == true) {
            this.handleDisallowAction();
        }

        //  this.dispatchEvent(new CustomEvent('submitnotes', { detail: this.notes }));
        this.closeModal();
    }
}