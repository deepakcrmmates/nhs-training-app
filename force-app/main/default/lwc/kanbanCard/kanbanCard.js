import { LightningElement, api } from 'lwc';

export default class KanbanCard extends LightningElement {

    @api opportunity;
    @api stage;

    // ---------------------------
    // 🔹 COMPUTED UI
    // ---------------------------
    get circleClass() {
        return `circle ${this.getColorClass(this.opportunity?.Initials)}`;
    }

    // ---------------------------
    // 🔹 EVENTS
    // ---------------------------

    handleDragStart(event) {
        event.dataTransfer.setData('text/plain', JSON.stringify({
            id: this.opportunity.Id,
            stage: this.stage
        }));

        this.dispatchEvent(new CustomEvent('dragstart', {
            detail: {
                id: this.opportunity.Id,
                stage: this.stage
            },
            bubbles: true,
            composed: true
        }));
    }

    handleDragEnd() {
        this.dispatchEvent(new CustomEvent('dragend', {
            bubbles: true,
            composed: true
        }));
    }

    handleNavigate(event) {
        event.preventDefault();

        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                recordId: this.opportunity.Id
            },
            bubbles: true,
            composed: true
        }));
    }

    // ---------------------------
    // 🔹 UTILS
    // ---------------------------

    getColorClass(seed) {
        const colors = [
            'circle-red',
            'circle-green',
            'circle-blue',
            'circle-yellow',
            'circle-purple'
        ];

        if (!seed) return 'circle-grey';

        const index = seed.charCodeAt(0) % colors.length;
        return colors[index];
    }
}