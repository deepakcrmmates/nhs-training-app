import { LightningElement } from 'lwc';

export default class KanbanToolbar extends LightningElement {

    handleKanban() {
        this.dispatchEvent(new CustomEvent('viewchange', {
            detail: 'KANBAN'
        }));
    }

    handleTable() {
        this.dispatchEvent(new CustomEvent('viewchange', {
            detail: 'TABLE'
        }));
    }

    handleFilter(event) {
        this.dispatchEvent(new CustomEvent('datefilter', {
            detail: event.target.value
        }));
    }
}