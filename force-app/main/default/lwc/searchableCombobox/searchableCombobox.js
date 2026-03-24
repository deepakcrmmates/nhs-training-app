import { LightningElement, api, track } from 'lwc';

export default class SearchableCombobox extends LightningElement {
    @api label = 'Search'; // Label for the combobox
    @api placeholder = 'Search options...'; // Placeholder for the input field
     @api name;
    @track _options = []; // Private property to store options
    @track filteredOptions = []; // Filtered options based on search term
    @track searchTerm = ''; // Current search term
    @track isDropdownOpen = false; // Controls dropdown visibility

    connectedCallback() {
        // Initialize filteredOptions with the initial options
        this.filteredOptions = [...this._options];
        console.log('OUTPUT : Child options ', JSON.stringify(this.filteredOptions));
    }

    renderedCallback() {
        console.log('Received options:', JSON.stringify(this._options));
    }

    get dropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
            this.isDropdownOpen ? 'slds-is-open' : ''
        }`;
    }

    // Update filteredOptions whenever options change
    @api
    set options(value) {
        // Ensure value is always an array
        this._options = Array.isArray(value) ? value : [];
        this.filteredOptions = [...this._options]; // Sync filteredOptions with options
    }

    get options() {
        return this._options;
    }

    handleSearch(event) {
        console.log('OUTPUT : Child', event.target.value);
        this.searchTerm = event.target.value.toLowerCase();
        this.isDropdownOpen = true; // Keep dropdown open while searching

        // Filter options based on the search term
        this.filteredOptions = this._options.filter(option =>
            option.label.toLowerCase().includes(this.searchTerm)
        );

        // Emit the search term to the parent component
        this.dispatchEvent(new CustomEvent('search', {
            detail: { searchTerm: this.searchTerm },
            bubbles: true,
            composed: true
        }));
    }

    handleSelection(event) {
        console.log('OUTPUT : 1', event.currentTarget.dataset.value);

        const selectedValue = event.currentTarget.dataset.value;

        // Find the selected option
        const selectedOption = this._options.find(option => option.value === selectedValue);

        if (selectedOption) {
            this.searchTerm = selectedOption.label || '';
            this.isDropdownOpen = false; // Close dropdown after selection

            // Dispatch selected value to the parent component
            this.dispatchEvent(new CustomEvent('select', {
                detail: { value: selectedValue,  name: this.name },
                bubbles: true,
                composed: true
            }));
        } else {
            console.error('Selected option not found in options array');
        }
    }

    handleFocus() {
        this.isDropdownOpen = true; // Open dropdown when input is focused
    }

    handleBlur() {
        // Close dropdown with a slight delay to handle click events
        setTimeout(() => {
            this.isDropdownOpen = false;
        }, 600);
    }
}