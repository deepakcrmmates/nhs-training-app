import { LightningElement, track } from 'lwc';

export default class NhsHousebuildersList extends LightningElement {
    @track showNew = false;

    handleShowNew() { this.showNew = true; }
    handleBackToList() { this.showNew = false; }
    handleCreated() { this.showNew = false; }
}
