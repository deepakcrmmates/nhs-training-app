import { LightningElement } from 'lwc';

export default class KanbanFilters extends LightningElement {
    handleInput(event) {
        this.dispatchEvent(
            new CustomEvent('search', { detail: event.target.value })
        );
    }
}