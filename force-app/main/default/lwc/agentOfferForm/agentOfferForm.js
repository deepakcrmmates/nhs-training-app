import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { CurrentPageReference } from 'lightning/navigation';
import createContact from '@salesforce/apex/OfferController.createContact';
import displayApplicationData from '@salesforce/apex/OfferController.displayApplicationData';
import createOffer from '@salesforce/apex/OfferController.createOffer';
import { NavigationMixin } from 'lightning/navigation';
import searchContact from '@salesforce/apex/OfferController.searchContact';
import searchAccounts from '@salesforce/apex/OfferController.searchAccounts';
import uploadFiles from '@salesforce/apex/OfferController.uploadFiles';
import createAccount from '@salesforce/apex/OfferController.createAccount';
import createLender from '@salesforce/apex/OfferController.createLender';

export default class AgentOfferForm extends NavigationMixin(LightningElement) {

    @track offer = { 'yes': true }; // Object to store form data
    @track errors = {}; // Object to store validation errors
    @api recordId; // Record ID passed from the parent component
    @track accountId = '';
    @track solicitorId = '';
    @track solicitorName = '';
    @track PurchaserName = '';
    @track LenderId;

    @track LenderName = '';
    @track LenderAddress = '';
    @track LenderEmail = '';
    @track LenderPhone = '';
    @track newLender = false;
    @track agentOptions = []; // Options for Agent search
    @track contactOption = [
        {
            label: 'None', // Default label
            value: null
        }
    ];
    @track newContact = false;
    @track newAccount = false;
    @track isLoading = false;
    @track fileUploads = {};
    checkboxStates = {};
    @track account = { Name: '', Phone: '', Email__c: '', BillingStreet: '', BillingCity: '', BillingState: '', BillingPostalCode: '', BillingCountry: '' };
    @track Lender = { FirstName: '', LastName: '', Phone: '', Email__c: '', BillingStreet: '', BillingCity: '', BillingState: '', BillingPostalCode: '', BillingCountry: '' };
    @track buyingPositionOptions = [
        { label: 'First Time Buyer', value: 'First Time Buyer' },
        { label: 'Sold Subject to Contract', value: 'Sold Subject to Contract' },
        { label: 'Full Cash Buyer', value: 'Full Cash Buyer' },
        { label: 'Investor', value: 'Investor' },
        { label: 'Second Property', value: 'Second Property' },
        { label: 'Rented', value: 'Rented' }
    ];
    @track PurchaserId = '';
    @track ContactAddress = '';
    @track purchaserSolicitorsAddress = '';
    @track solicitors = {
        Email: '',
        Phone: ''
    };
    @track ContactEmail = '';
    @track contactPhone = '';
    @track propertyName = '';
    @track applicationData = {}; // Application data from Apex
    @track contact = { FirstName: '', LastName: '', Email: '', Phone: '', MailingStreet: '', MailingCity: '', MailingCountry: '', MailingState: '', MailingPostalCode: '' };
    @track deposit = 0;
    @track offerAmount = 0;
    agentEmail = '';
    agentPhone = '';
    agentAddress = ''
    currentDateTime = '';
    @track Vendor = { Name: '', Phone: '', Email: '', City: '', Street: '', Pincode: '', State: '', Country: '' };
    ContactFullName = '';


    connectedCallback() {
        const currentDateTime = new Date();
        this.currentDateTime = currentDateTime;
        this.offer = { ['Property']: this.recordId, 'yes': true };
    }

    @wire(CurrentPageReference)
    getCurrentPageReference(currentPageReference) {
        if (currentPageReference) {
            // Accessing query parameters from state
            this.recordId = currentPageReference.state.c__recordId;
            console.log('Record ID:', this.recordId);
            console.log('Opportunity ID:', this.recordId);
        }
    }

    // Fetch application data based on the recordId
    @wire(displayApplicationData, { recordId: '$recordId' })
    wiredApplicationData({ data, error }) {
        if (data) {
            console.log('Data returned by Apex:', JSON.stringify(data));

            // Ensure data is an array and has the expected structure
            if (Array.isArray(data) && data.length > 0) {
                const applications = data[0].Application; // Access the Application data

                if (Array.isArray(applications)) {
                    this.agentOptions = []; // Reset agentOptions
                    this.applicationData = {}; // Initialize as an empty object

                    // Iterate through each application and extract agent data
                    applications.forEach(application => {
                        this.Vendor.Name = application.Applicant__r.Name ? application.Applicant__r.Name : '';
                        this.Vendor.Phone = application.Applicant__r.Phone ? application.Applicant__r.Phone : '';
                        this.Vendor.Email = application.Applicant__r.Email ? application.Applicant__r.Email : '';
                        this.propertyName = application.Name ? application.Name : '';
                        // Add a default option
                        this.agentOptions.push({
                            label: '---None---',
                            value: ''
                        });

                        // Add Agent 1 if available
                        if (application.Agent_1__r) {
                            this.agentOptions.push({
                                label: application.Agent_1__r.Name,
                                value: application.Agent_1__c
                            });
                            // Add Agent 1's email and phone to applicationData
                            this.applicationData[application.Agent_1__c] = [{
                                email: application.Agent_1__r.Email__c || "",
                                phone: application.Agent_1__r.Phone || "",
                                city: application.Agent_1__r.BillingCity || '',
                                street: application.Agent_1__r.BillingStreet || '',
                                pinCode: application.Agent_1__r.BillingPostalCode || '',
                                state: application.Agent_1__r.BillingState || '',
                                country: application.Agent_1__r.BillingCountry || ''
                            }];
                        }

                        // Add Agent 2 if available
                        if (application.Agent_2__r) {
                            this.agentOptions.push({
                                label: application.Agent_2__r.Name,
                                value: application.Agent_2__c
                            });
                            // Add Agent 2's email and phone to applicationData
                            this.applicationData[application.Agent_2__c] = [{
                                email: application.Agent_2__r.Email__c || "",
                                phone: application.Agent_2__r.Phone || "",
                                city: application.Agent_2__r.BillingCity || '',
                                street: application.Agent_2__r.BillingStreet || '',
                                pinCode: application.Agent_2__r.BillingPostalCode || '',
                                state: application.Agent_2__r.BillingState || '',
                                country: application.Agent_2__r.BillingCountry || ''
                            }];
                        }

                        // Add Agent 3 if available
                        if (application.Agent_3__r) {
                            this.agentOptions.push({
                                label: application.Agent_3__r.Name,
                                value: application.Agent_3__c
                            });
                            // Add Agent 3's email and phone to applicationData
                            this.applicationData[application.Agent_3__c] = [{
                                email: application.Agent_3__r.Email__c || "",
                                phone: application.Agent_3__r.Phone || "",
                                city: application.Agent_3__r.BillingCity || '',
                                street: application.Agent_3__r.BillingStreet || '',
                                pinCode: application.Agent_3__r.BillingPostalCode || '',
                                state: application.Agent_3__r.BillingState || '',
                                country: application.Agent_3__r.BillingCountry || ''
                            }];
                        }
                    });

                    console.log('Application data loaded:', JSON.stringify(this.agentOptions));
                    console.log('Agent data with emails and phones:', JSON.stringify(this.applicationData));
                } else {
                    console.error('Invalid data structure: Application data is not an array');
                }
            } else {
                console.error('Invalid data structure: Expected an array with at least one element');
            }
        } else if (error) {
            this.handleError(error, 'Error fetching application data');
        }
    }

    handleFileChange(event) {
        const file = event.target.files[0]; // Get the uploaded file
        const fieldName = event.target.name; // Get the field name (e.g., "Upload Id")

        if (file) {
            // Read the file as a base64 string
            const reader = new FileReader();
            reader.onload = () => {
                const fileContent = reader.result.split(',')[1]; // Extract base64 data
                const fileName = file.name; // Get the file name

                // Store the file content and file name in the fileUploads object
                this.fileUploads = {
                    ...this.fileUploads,
                    [fieldName]: {
                        content: fileContent, // Base64-encoded file content
                        name: fileName // File name
                    }
                };

                console.log('File uploaded:', fieldName, this.fileUploads[fieldName]);
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            console.error('No file selected.');
        }
    }

    get uploadedFiles() {
        return Object.keys(this.fileUploads).map((fieldName) => {
            return {
                fieldName: fieldName,
                name: this.fileUploads[fieldName].name
            };
        });
    }


    handleChange(event) {
        const fieldName = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

        // Handle Offer Amount
        if (fieldName === 'OfferAmount') {
            this.offerAmount = value;
        }
        if (fieldName === 'no' && event.target.checked) {
            this.offer['yes'] = false;
        }
console.log('OUTPUT :  this.offerAmount ',  this.offerAmount )  ;
        // Handle Deposit validation
        if (fieldName === 'Deposit') {
            // Convert value to a number
            const depositValue = parseFloat(value);
            const offerAmountValue = parseFloat(this.offerAmount);

            // Check if both values are valid numbers
            if (isNaN(depositValue) || isNaN(offerAmountValue)) {
                this.showToast('Warning..!', 'Invalid Deposit or Offer Amount value.', 'warning');
                event.target.value = '';
                value = 0;
                return; // Stop further processing
            }

            // Check if Deposit is greater than Offer Amount
            if (depositValue > offerAmountValue) {
                this.showToast('Warning..!', 'Deposit must be less than or equal to Offer Amount.', 'warning');

                event.target.value = ''; // Clear the input field
                this.offer['Deposit'] = parseFloat(0);
                return; // Stop further processing
            }
        }

        // Validate dates for Exchange Deadline and Estimated Completion Date
        if (fieldName === 'ExchangeDeadline' || fieldName === 'BuyerawareofEstimatedCompletionDate') {
            if (!this.validateFutureDate(value)) {
                event.target.value = ''; // Clear the invalid date
                return; // Stop further processing
            }
        }

        // Validate Date offer received (must be in the past)
        if (fieldName === 'Date offer received') {
            const selectedDate = new Date(value);
            const currentDate = new Date();

            // Check if the selected date is in the future
            if (selectedDate > currentDate) {
                this.showToast('Warning..!', 'Date must be in the Past.', 'warning');
                event.target.value = ''; // Clear the invalid date
                return; // Stop further processing
            }
        }

        // Handle checkbox groups
        this.handleCheckboxGroups(fieldName);

        // Update the offer object
        this.updateOfferObject(fieldName, value);

        // Handle checkbox changes for conditional file upload validation
        if (event.target.type === 'checkbox') {
            // Update the checkbox state
            this.checkboxStates = {
                ...this.checkboxStates,
                [fieldName]: value // true or false
            };

            console.log('Checkbox state updated:', fieldName, value);
        }
    }

    // Validate if a date is in the future
    validateFutureDate(dateValue) {
        const selectedDate = new Date(dateValue);
        const currentDate = new Date();

        if (selectedDate <= currentDate) {
            this.showToast('Warning..!', 'Date must be in the future.', 'warning');
            return false;
        }
        return true;
    }

    // Handle checkbox groups (e.g., dpYes/dpgNo, mtgYes/mtgNo, yes/no)
    handleCheckboxGroups(fieldName) {
        const checkboxGroups = {
            dpYes: 'dpgNo',
            dpgNo: 'dpYes',
            mtgYes: 'mtgNo',
            mtgNo: 'mtgYes',
            yes: 'no',
            no: 'yes'
        };

        if (checkboxGroups[fieldName]) {
            this.offer[checkboxGroups[fieldName]] = false; // Uncheck the other checkbox
        }
    }

    // Update the offer object dynamically
    updateOfferObject(fieldName, value) {
        this.offer = {
            ...this.offer,
            [fieldName]: value
        };

        console.log('Updated offer object:', JSON.stringify(this.offer));
    }

    // Handle value selection from child component
    handleAgentLenderSelection(event) {
        console.log('OUTPUT : lender ', event.detail.value);
        const { name, value } = event.detail;
        this.updateOfferObject(event.currentTarget.dataset.key, event.detail.id);
        this.accountId = event.detail.id; // Store the account ID

        // Default the combobox to 'None'
        this.contactOption = [{ label: 'None', value: '' }];
        this.selectedContactId = '';

        // Call Apex method to fetch account details
        searchAccounts({ accountId: this.accountId })
            .then((result) => {
                if (result) {
                    // Check if the account has associated contacts
                    if (result.Contacts && result.Contacts.length > 0) {
                        // Map contacts to combobox options
                        this.contactOption = [
                            { label: 'None', value: '' }, // Add 'None' as the first option
                            ...result.Contacts.map(contact => ({
                                label: `${contact.FirstName} ${contact.LastName}`,
                                value: contact.Id
                            }))
                        ];
                        console.log('Contact options:', this.contactOption);
                    } else {
                        this.showToast('Info', 'No contacts found for this account.', 'info');
                    }
                } else {
                    this.showToast('Error', 'Account not found.', 'error');
                }
            })
            .catch((error) => {
                // Improved error handling
                const errorMessage = error?.body?.message || 'Unknown error occurred';
                this.showToast('Error', `Error: ${errorMessage}`, 'error');
                console.error('Error while fetching account:', error);
            });
    }

    handleContactSelection(event) {
        console.log('OUTPUT :  contact ', event.detail.value);
        console.log('OUTPUT :  contact ', event.currentTarget.dataset.key);
        const { name, value } = event.detail;
        this.updateOfferObject(event.currentTarget.dataset.key, event.detail.id);
    }

    handleAgentSelection() {
        console.log('OUTPUT : account agent ', event.detail.value);
        const { name, value } = event.detail;
        this.updateOfferObject(name, value);
        const agentId = event.detail.value;
        // Retrieve the agent's data
        const agentData = this.applicationData[agentId];
        if (agentData) {
            console.log(`Agent Data for ${agentId}:`, agentData);
            const email = agentData[0].email;
            const phone = agentData[0].phone;
            const agentAddress = {
                city: agentData[0].city,
                street: agentData[0].street,
                pinCode: agentData[0].pinCode,
                state: agentData[0].state,
                country: agentData[0].country
            };

            this.agentEmail = email;
            this.agentPhone = phone;
            const Address = `${agentAddress.street}, ${agentAddress.city}, ${agentAddress.state}, ${agentAddress.country}  ${agentAddress.pinCode}`;
            this.agentAddress = Address;


            console.log(`Email: ${email}, Phone: ${phone}`);
        } else {
            console.log(`No data found for Agent ID: ${agentId} `);
        }
    }

    handleSolicitorsSelection(event) {
        console.log('OUTPUT : contact id', event.detail.id);
        console.log('OUTPUT : contact name', event.currentTarget.dataset.key);

        // Update offer object
        this.updateOfferObject(event.currentTarget.dataset.key, event.detail.id);

        // Call Apex method to fetch account details
        searchAccounts({ accountId: event.detail.id })
            .then((result) => {
                if (result) {
                    console.log('OUTPUT : ', result);
                    console.log('OUTPUT : 1', JSON.stringify(result));

                    // Build the solicitors object
                    this.solicitors.Email = result.Email__c || ''; // Use default empty string if value is null
                    this.solicitors.Phone = result.Phone || '';

                    // Build the purchaserSolicitorsAddress string
                    const { BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry } = result;
                    const addressParts = [BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry];
                    this.purchaserSolicitorsAddress = addressParts.filter(part => part).join(', ');

                    console.log('Solicitors Address:', this.purchaserSolicitorsAddress);
                } else {
                    this.showToast('Error', 'Account not found.', 'error');
                }
            })
            .catch((error) => {
                // Improved error handling
                const errorMessage = error?.body?.message || 'Unknown error occurred';
                this.showToast('Error', `Error: ${errorMessage}`, 'error');
                console.error('Error while fetching account:', error);
            });

    }


    handleValueSelectedOnContact(event) {
        console.log('OUTPUT :  contact id', event.detail.id);
        this.offer = {
            ...this.offer,
            ['PurchaserId']: event.detail.id
        };
        searchContact({ contactId: event.detail.id })
            .then((result) => {
                if (result) {
                    console.log('OUTPUT : ', result);
                    console.log('OUTPUT : 1', JSON.stringify(result));
                    this.ContactEmail = result.Email ? result.Email : '';
                    this.contactPhone = result.Phone ? result.Phone : ''
                    // Join address fields into a single string (with checks)
                    const addressParts = [
                        result.MailingStreet ? result.MailingStreet : '',
                        result.MailingCity ? result.MailingCity : '',
                        result.MailingState ? result.MailingState : '',
                        result.MailingPostalCode ? result.MailingPostalCode : '',
                        result.MailingCountry ? result.MailingCountry : ''
                    ];

                    // Filter out empty values and join with a comma
                    this.ContactAddress = addressParts.filter(part => part).join(', ');

                    console.log('Contact Address:', this.ContactAddress);
                } else {
                    this.showToast('Error', 'Contact not created ', 'error');
                }


            })
            .catch((error) => {
                this.showToast('Error', `Error: ${error.body.message} `, 'error');

            })


        console.log('Updated offer object:', JSON.stringify(this.offer));
    }

    handleInputChange(event) {
        const field = event.target.label.replace(' ', '');
        this.contact[field] = event.target.value;
        console.log('OUTPUT : contacts data', JSON.stringify(this.contact));
    }
    handleAddressChange(event) {
        // Extract address details from the event
        const addressDetails = event.detail;

        // Update the contact object with address details
        this.contact = {
            ...this.contact,
            MailingStreet: addressDetails.street,
            MailingCity: addressDetails.city,
            MailingCountry: addressDetails.country,
            MailingState: addressDetails.province,
            MailingPostalCode: addressDetails.postalCode
        };
        this.ContactAddress = this.contact.MailingStreet + ' ' + this.contact.MailingCity + ' ' + this.contact.MailingState + ' ' + this.contact.MailingPostalCode + ' ' + this.contact.MailingCountry
        console.log('Updated contact data:', JSON.stringify(this.contact));
    }
    handleAddContact() {
        this.newContact = true;
        console.log('New Contact flag set to true');
    }

    cancelContact() {
        this.newContact = false;
    }

    handleAddAccount() {
        this.newAccount = true;
    }

     handleAddLender() {
        this.newLender = true;
    }

    cancelAccount() {
        this.newAccount = false
    }
    // Handle input changes for Name, Phone, and Email
    handleAccountInputChange(event) {
        const field = event.target.dataset.field;
        this.account[field] = event.target.value;
        console.log(field, ':', this.account[field]);
    }

    handleLenderInputChange(event) {
        const field = event.target.dataset.field;
        this.Lender[field] = event.target.value;
        console.log(field, ':', this.Lender[field]);
    }

    // Handle address changes
    handleAccountAddressChange(event) {
        const address = event.detail;
        this.account.BillingStreet = address.street;
        this.account.BillingCity = address.city;
        this.account.BillingState = address.province;
        this.account.BillingPostalCode = address.postalCode;
        this.account.BillingCountry = address.country;
        console.log('Billing Address:', address);
    }

    handleLenderAddressChange(event) {
        const address = event.detail;
        this.account.BillingStreet = address.street;
        this.account.BillingCity = address.city;
        this.account.BillingState = address.province;
        this.account.BillingPostalCode = address.postalCode;
        this.account.BillingCountry = address.country;
        console.log('Billing Address:', address);
    }

    // Save the Account
    saveAccount() {
        if (this.account.Name == '') {
            this.showToast('Warning', 'Please fill Account Name', 'warning');
            return
        }
        createAccount({ accountData: this.account })
            .then((result) => {
                if (result.error) {
                    // Display the error message
                    this.showToast('Error', result.error, 'error');
                } else {
                    // Display the success message and log the Account Id
                    this.showToast('Success', result.message, 'success');
                    console.log('Account Id:', result.accountId);
                    this.solicitorId = result.accountId ? result.accountId : '';
                    // Assign values to tracked properties
                    this.solicitorName = this.account.Name;
                    this.purchaserSolicitorsAddress = this.formatAddress(this.account);
                    this.solicitors.Email = this.account.Email__c ? this.account.Email__c : '';
                    this.solicitors.Phone = this.account.Phone ? this.account.Phone : '';

                    // Hide the form and reset fields
                    this.hideAccountForm();
                    this.resetForm();
                }
            })
            .catch((error) => {
                // Handle unexpected errors
                const errorMessage = error.body.message || 'Unknown error occurred';
                this.showToast('Error', errorMessage, 'error');
                console.error('Error creating account:', error);
            });
    }

    //Save New Lender
    // Save the Account
    saveLender() {
        if (this.account.Name == '') {
            this.showToast('Warning', 'Please fill Account Name', 'warning');
            return
        }
        createLender({ accountData: this.Lender })
            .then((result) => {
                if (result.status === 'error') {
                    this.showToast('Error', result.message, 'error');
                } else {
                    this.showToast('Success', result.message, 'success');
                    console.log('Account Id:', result.accountId);
                    this.LenderId = result.accountId ? result.accountId : '';
                    this.LenderName = this.Lender.FirstName + ' ' + this.Lender.LastName;
                    this.LenderAddress = this.formatAddress1(this.Lender);
                    this.LenderEmail = this.Lender.Email__c ? this.Lender.Email__c : '';
                    this.LenderPhone = this.Lender.Phone ? this.Lender.Phone : '';
                    this.newLender = false;
                }
            })
            .catch((error) => {
                const errorMessage = error.body.message || 'Unknown error occurred';
                this.showToast('Error', errorMessage, 'error');
                console.error('Error creating account:', error);
            });
    }
    formatAddress1(lender) {
        // Implement your address formatting logic here
        return `${lender.BillingStreet}, ${lender.BillingCity}, ${lender.BillingState}, ${lender.BillingPostalCode}, ${lender.BillingCountry}`;
    }
    // Format the Billing Address
    formatAddress(account) {
        const street = account.BillingStreet || '';
        const city = account.BillingCity || '';
        const state = account.BillingState || '';
        const postalCode = account.BillingPostalCode || '';
        const country = account.BillingCountry || '';

        return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
    }

    // Hide the form
    hideAccountForm() {
        this.newAccount = false;
    }
    cancelLender(){
        this.newLender = false;
    }
    // Reset form fields
    resetForm() {
        this.account = {
            Name: '',
            Phone: '',
            Email__c: '',
            BillingStreet: '',
            BillingCity: '',
            BillingState: '',
            BillingPostalCode: '',
            BillingCountry: ''
        };
    }



    saveContact() {
        this.isLoading = true;
        if (this.contact.LastName == '') {
            this.showToast('Warning', 'Please fill Last Name', 'warning');
            return
        }
        createContact({ contact: this.contact })
            .then((result) => {
                if (result.yes) {
                    this.showToast('Success', `Contact created successfully with ID: ${result.yes} `, 'success');
                    this.newContact = false;
                    this.offer = {
                        ...this.offer,
                        ['PurchaserId']: result.yes
                    };
                    this.PurchaserId = result.yes;
                    this.ContactFullName = this.contact.FirstName + ' ' + this.contact.LastName;
                    this.contactPhone = this.contact.Phone;
                    this.ContactEmail = this.contact.Email;
                    this.contact = {};
                } else {
                    this.showToast('Error', 'Contact not created ', 'error');
                }


            })
            .catch((error) => {
                this.showToast('Error', `Error: ${error.body.message} `, 'error');

            })
            .finally(() => {
                // Hide spinner with a delay after success or error
                setTimeout(() => {
                    this.isLoading = false;
                }, 1000); // Delay of 1 second
            });
    }

    // Handle cancel action
    handleCancel() {
        this.offer = { Property: this.recordId }; // Reset the offer object
        console.log('Offer form reset');
    }


    async handleSubmit() {
        // Update the offer object with the property ID
        this.offer = {
            ...this.offer,
            ['Property']: this.recordId
        };

        // Define the mapping between checkboxes and file uploads
        const checkboxToFileMapping = {
            'IdVerified': 'Upload Id',
            'DecisioninPrinciple': 'Upload Decision in Principle',
            'AMLCheck': 'Upload AML Check',
            'ProofofFunding': 'Upload Proof of Income'
        };

        // Check if required files are uploaded based on checkbox states
        const missingFiles = [];
        Object.keys(checkboxToFileMapping).forEach((checkboxName) => {
            const fileFieldName = checkboxToFileMapping[checkboxName];

            console.log('OUTPUT : ', !this.fileUploads[fileFieldName]);
            console.log('OUTPUT : ', this.checkboxStates[checkboxName]);
            // If the checkbox is ticked and the corresponding file is not uploaded
            if (this.checkboxStates[checkboxName] && !this.fileUploads[fileFieldName]) {
                missingFiles.push(checkboxName); // Add the checkbox name to the missing files list
            }
        });

        // If there are missing files, show a warning message
        if (missingFiles.length > 0) {
            const missingFilesMessage = `Please upload files for the following: ${missingFiles.join(', ')}`;
            this.showToast('Warning', missingFilesMessage, 'warning');
            return; // Stop further execution
        }

        // Proceed with form submission
        console.log('All required files are uploaded:', this.fileUploads);
        this.isLoading = true; // Show spinner
        this.message = '';


        try {
            // Convert the offer object to a JSON string
            const offerDataJson = JSON.stringify(this.offer);

            // Call Apex method to create the offer
            const result = await createOffer({ offerDataJson });
            console.log('Offer creation result:', result);

            if (result) {
                if (result.Status === 'Yes') {
                    const offerId = result.Id;
                    this.showToast('Success', 'Offer created successfully. ID: ' + offerId, 'success');

                    // Now proceed to upload files and link them to the newly created offer
                    console.log('Uploading files for offer ID:', offerId);

                    try {
                        // Convert the fileUploads object to a JSON-serializable format
                        const formData = {};
                        Object.keys(this.fileUploads).forEach((key) => {
                            formData[key] = this.fileUploads[key].content; // Ensure this contains the file data
                        });

                        // Append the offer ID to the form data
                        formData['offerId'] = offerId;

                        // Debug the formData being sent
                        console.log('FormData being sent:', JSON.stringify(formData));

                        // Call the Apex method to upload files
                        const uploadResult = await uploadFiles({ formDataJson: JSON.stringify(formData) });
                        console.log('File upload result:', uploadResult);

                        if (uploadResult === 'Success') {
                            this.showToast('Success', 'Files uploaded and linked to the offer successfully.', 'success');
                        } else {
                            this.showToast('Error', 'Files were not uploaded successfully.', 'error');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        this.showToast('Error', 'An unexpected error occurred: ' + error.body.message, 'error');
                    }

                    // Simulate an async operation (e.g., calling an Apex method or performing DML)
                    setTimeout(() => {
                        // Set a timeout before redirecting
                        setTimeout(() => {
                            // Redirect to the newly created Offer record
                            const baseUrl = window.location.origin; // Get the base URL
                            window.location.href = `${baseUrl}/lightning/r/Offer__c/${offerId}/view`;
                        }, 3000); // 2-second delay before redirecting

                        this.isLoading = false; // Hide the spinner
                    }, 300); // Simulate a 3-second delay for the async operation

                } else {
                    this.isLoading = false;
                    this.showToast('Error', 'Failed to create offer: ' + result.ErrorMessage, 'error');
                }
            } else {
                this.showToast('Error', 'An unexpected error occurred: No response received.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error', 'An unexpected error occurred: ' + error.body.message, 'error');
        } finally {
            this.isLoading = false; // Hide spinner
        }
    }


    reloadPageAfterDelay() {
        setTimeout(() => {
            window.location.reload(); // Reload the page after a delay
        }, 1600); // Delay time in milliseconds (e.g., 1000 ms = 1 second)
    }

    // Show a toast message
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title,
            message,
            variant,
            mode: 'pester'
        });
        this.dispatchEvent(evt);
    }

    // Handle errors from Apex calls
    handleError(error, message) {
        console.error(message, error);
        this.showToast('Error', message, 'error');
    }
}