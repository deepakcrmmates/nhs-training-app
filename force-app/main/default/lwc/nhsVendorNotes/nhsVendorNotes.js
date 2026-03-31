import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getNotes from '@salesforce/apex/VendorNoteController.getNotes';
import saveNote from '@salesforce/apex/VendorNoteController.saveNote';

const PAGE_SIZE = 5;

export default class NhsVendorNotes extends LightningElement {
    @api recordId;
    @track notes = [];
    @track currentPage = 1;
    newNoteText = '';

    connectedCallback() {
        this.loadNotes();
    }

    loadNotes() {
        getNotes({ opportunityId: this.recordId })
            .then(result => {
                this.notes = result.map(n => ({
                    ...n,
                    createdByName: n.CreatedBy?.Name || '',
                    formattedDate: n.CreatedDate ? new Date(n.CreatedDate).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : ''
                }));
            })
            .catch(err => console.error('Error loading notes:', err));
    }

    get hasNotes() { return this.notes.length > 0; }
    get notesCount() { return this.notes.length; }
    get isSaveDisabled() { return !this.newNoteText || !this.newNoteText.trim(); }

    get totalPages() { return Math.ceil(this.notes.length / PAGE_SIZE) || 1; }
    get pagedNotes() {
        const start = (this.currentPage - 1) * PAGE_SIZE;
        return this.notes.slice(start, start + PAGE_SIZE);
    }
    get pageLabel() { return `${this.currentPage} of ${this.totalPages}`; }
    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }
    get showPaging() { return this.notes.length > PAGE_SIZE; }

    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

    handleNoteInput(event) {
        this.newNoteText = event.target.value;
    }

    async handleSaveNote() {
        if (!this.newNoteText || !this.newNoteText.trim()) return;
        try {
            await saveNote({ noteText: this.newNoteText.trim(), opportunityId: this.recordId });
            this.newNoteText = '';
            this.currentPage = 1;
            const ta = this.template.querySelector('.notes-textarea');
            if (ta) ta.value = '';
            this.loadNotes();
            this.dispatchEvent(new ShowToastEvent({
                title: 'Note Added', message: 'Vendor note saved successfully.', variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error', message: error.body?.message || 'Failed to save note.', variant: 'error'
            }));
        }
    }
}
