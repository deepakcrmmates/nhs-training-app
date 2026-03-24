import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { CurrentPageReference } from 'lightning/navigation';
import createContact from '@salesforce/apex/OfferController.createContact';
import displayApplicationData from '@salesforce/apex/OfferController.displayApplicationData';
import createOffer from '@salesforce/apex/OfferController.createOffer';
import { NavigationMixin } from 'lightning/navigation';
import uploadFiles from '@salesforce/apex/OfferController.uploadFiles';

import saveRecords from '@salesforce/apex/frontFacingAgentController.saveRecords';
export default class FrontFacingAgentOfferForm extends LightningElement {
    @api agentId;
    @api recordId;

    MortgageRequired = false;
    @track customError = false;
    @track errorMessage = ''
    @track isAllSuccess = false;
    @track processResults = [];
    @track isModalOpen = false;
    @track allData = {}; // Tracked variable to store all data
    @track deposit = 0;
    @track offerAmount = 0;
    @track AgentName = '';
    @track LogoUrl = '';
    @track offer = { 'yes': true };
    @track agent = { Name: '', Email: '', Phone: '', Address: '' };
    @track property = { Name: '', VendorName: '', VendorEmail: '', VendorPhone: '', VendorAddress: '' };
    @track account = { Name: '', Phone: '', Email__c: '', BillingStreet: '', BillingCity: '', BillingState: '', BillingPostalCode: '', BillingCountry: '' };

    @track Lender = { accountName: '', Email: '', Phone: '', Street: '', City: '', Country: '', Province: '', PostalCode: '' };
    @track FinancialAdvisor = { FirstName: '', LastName: '', Email: '', Phone: '' };
    @track SolicitorCompany = { Name: '', Phone: '', Email: '', BillingStreet: '', BillingCity: '', BillingCountry: '', BillingState: '', BillingPostalCode: '' };
    @track SolicitorPerson = { FirstName: '', LastName: '', Phone: '', Email: '' };

    @track contact = { FirstName: '', LastName: '', Email: '', Phone: '', MailingStreet: '', MailingCity: '', MailingCountry: '', MailingState: '', MailingPostalCode: '' };
    @track agentOptions = [];
    @track Vendor = { Name: '', Phone: '', Email: '', City: '', Street: '', Pincode: '', State: '', Country: '' };
    ContactFullName = '';
    @track buyingPositionOptions = [
        { label: 'First Time Buyer', value: 'First Time Buyer' },
        { label: 'Sold Subject to Contract', value: 'Sold Subject to Contract' },
        { label: 'Full Cash Buyer', value: 'Full Cash Buyer' },
        { label: 'Investor', value: 'Investor' },
        { label: 'Second Property', value: 'Second Property' },
        { label: 'Rented', value: 'Rented' }
    ];
    @track newContact = false;
    @track newAccount = false;
    @track newLender = false;
    @track isLoading = false;
    @track fileUploads = {};
    @track checkboxStates = {};
    @track currentDateTime = new Date().toISOString();

    connectedCallback() {
        // this.recordId = '006KG000002EZX7';
        // this.agentId = '001KG0000086ecbYAA';
        this.offer = { ['Property']: this.recordId, 'yes': true, ['Date offer received']: this.currentDateTime, ['AgentName']: this.agentId };
        console.log('OUTPUT :agentId ', this.agentId);
        console.log('OUTPUT : recordId', this.recordId);
        //  this.handleAgentSelection('001KG0000086ecbYAA');
    }

    // @wire(CurrentPageReference)
    // getCurrentPageReference(currentPageReference) {
    //     if (currentPageReference) {
    //         this.recordId ='006KG000002EZX7'; //currentPageReference.state.c__recordId;
    //     }
    // }

    @wire(displayApplicationData, { recordId: '$recordId' })
    wiredApplicationData({ error, data }) {
        if (data) {
            console.log('Data returned by Apex:', JSON.stringify(data));

            try {
                // Ensure data is an array and has the expected structure
                if (Array.isArray(data) && data.length > 0) {
                    const applications = data[0].Application; // Access the Application data

                    if (Array.isArray(applications)) {
                        // Initialize or reset relevant variables
                        this.agentOptions = [];
                        this.applicationData = {};
                        //   this.Vendor = { Name: '', Phone: '', Email: '' }; // Reset Vendor details

                        // Iterate through each application and extract agent data
                        applications.forEach((application) => {
                            this.Vendor.Name = application?.Applicant__r?.Name || '';
                            this.Vendor.Phone = application?.Applicant__r?.MobilePhone || '';
                            this.Vendor.Email = application?.Applicant__r?.Email || '';
                            this.propertyName = application?.Name || '';

                            // Add a default "None" option
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
                                this.applicationData[application.Agent_1__c] = [{
                                    name: application.Agent_1__r.Name,
                                    email: application.Agent_1__r.Email__c || '',
                                    phone: application.Agent_1__r.Phone || '',
                                    city: application.Agent_1__r.BillingCity || '',
                                    street: application.Agent_1__r.BillingStreet || '',
                                    pinCode: application.Agent_1__r.BillingPostalCode || '',
                                    state: application.Agent_1__r.BillingState || '',
                                    country: application.Agent_1__r.BillingCountry || '',
                                    logo : application.Agent_1__r.Logo_URL__c || ''
                                }];
                            }

                            // Add Agent 2 if available
                            if (application.Agent_2__r) {
                                this.agentOptions.push({
                                    label: application.Agent_2__r.Name,
                                    value: application.Agent_2__c
                                });
                                this.applicationData[application.Agent_2__c] = [{
                                    name: application.Agent_2__r.Name,
                                    email: application.Agent_2__r.Email__c || '',
                                    phone: application.Agent_2__r.Phone || '',
                                    city: application.Agent_2__r.BillingCity || '',
                                    street: application.Agent_2__r.BillingStreet || '',
                                    pinCode: application.Agent_2__r.BillingPostalCode || '',
                                    state: application.Agent_2__r.BillingState || '',
                                    country: application.Agent_2__r.BillingCountry || '',
                                    logo : application.Agent_1__r.Logo_URL__c || ''
                                }];
                            }

                            // Add Agent 3 if available
                            if (application.Agent_3__r) {
                                this.agentOptions.push({
                                    label: application.Agent_3__r.Name,
                                    value: application.Agent_3__c
                                });
                                this.applicationData[application.Agent_3__c] = [{
                                    name: application.Agent_3__r.Name,
                                    email: application.Agent_3__r.Email__c || '',
                                    phone: application.Agent_3__r.Phone || '',
                                    city: application.Agent_3__r.BillingCity || '',
                                    street: application.Agent_3__r.BillingStreet || '',
                                    pinCode: application.Agent_3__r.BillingPostalCode || '',
                                    state: application.Agent_3__r.BillingState || '',
                                    country: application.Agent_3__r.BillingCountry || '',
                                    logo : application.Agent_1__r.Logo_URL__c || ''
                                }];
                            }
                        });

                        // Set the default agent and handle agent selection
                       // this.agentId = '001KG0000086ecbYAA';
                        this.handleAgentSelection(this.agentId);

                        console.log('Agent options loaded:', JSON.stringify(this.agentOptions));
                        console.log('Application data with agent details:', JSON.stringify(this.applicationData));
                    } else {
                        console.error('Invalid data structure: Application data is not an array.');
                    }
                } else {
                    console.error('Invalid data structure: Expected an array with at least one element.');
                }
            } catch (processingError) {
                console.error('Error processing application data:', processingError);
                this.handleError(processingError, 'Error while processing the application data');
            }
        } else if (error) {
            console.error('Error fetching application data:', error);
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

        // Handle Deposit validation
        if (fieldName === 'Deposit') {
            // Convert value to a number
            const depositValue = parseFloat(value);
            const offerAmountValue = parseFloat(this.offerAmount);

            // Check if both values are valid numbers
            if (isNaN(depositValue) || isNaN(offerAmountValue)) {
                this.showToast('Error!', 'Please check deposit or offer amount', 'warning');
                this.customToastMessage('Please check deposit or offer amount.');
                this.customError = true;

                event.target.value = '';
                value = 0;
                return; // Stop further processing
            }

            // Check if Deposit is greater than Offer Amount
            if (depositValue > offerAmountValue) {
              //  this.showToast('Error!', 'Deposit amount should be less than or equal to Offer Amount.', 'warning');
                this.customToastMessage('Deposit amount should be less than or equal to Offer Amount.');
                event.target.value = ''; // Clear the input field
                this.offer['Deposit'] = parseFloat(0);
                return; // Stop further processing
            }
        }

        // Validate dates for Exchange Deadline and Estimated Completion Date
        if (fieldName === 'ExchangeDeadline' || fieldName === 'BuyerawareofEstimatedCompletionDate') {
            if (!this.validateFutureDate(value)) {
                this.customToastMessage('Please submit a future date.');
                event.target.value = ''; // Clear the invalid date
                return; // Stop further processing
            }
        }

        if (fieldName === 'MortgageRequired') {
            this.MortgageRequired = value;
            console.log('OUTPUT :this.MortgageRequired ', this.MortgageRequired);
        }

        // Validate Date offer received (must be in the past)
        if (fieldName === 'Date offer received') {
            const selectedDate = new Date(value);
            const currentDate = new Date();

            // Check if the selected date is in the future
            if (selectedDate > currentDate) {
               // this.showToast('Error!', 'Date must be in the Past.', 'warning');
                this.customToastMessage('Please submit an older or today`s date only.');
                event.target.value = ''; // Clear the invalid date
                return; // Stop further processing
            }
        }

        // Handle checkbox groups
        // this.handleCheckboxGroups(fieldName);

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

        console.log('OUTPUT : Offer to be updated ', JSON.stringify(this.offer));
    }

    customToastMessage(message) {
        this.customError = true;
        this.errorMessage = message;
        console.log('OUTPUT : ', this.customError);
        setTimeout(() => {
            this.customError = false;
        }, 4000);
    }
    // Validate if a date is in the future
    validateFutureDate(dateValue) {
        const selectedDate = new Date(dateValue);
        const currentDate = new Date();

        if (selectedDate <= currentDate) {
            this.showToast('Error!', 'Date must be in the future.', 'warning');
            return false;
        }
        return true;
    }

    // Update the offer object dynamically
    updateOfferObject(fieldName, value) {
        this.offer = {
            ...this.offer,
            [fieldName]: value
        };

        console.log('Updated offer object:', JSON.stringify(this.offer));
    }

    handleAgentSelection(agentIds) {
        const agentId = agentIds;
        const agentData = this.applicationData[agentId];
        if (agentData) {
            this.AgentName = agentData[0].name;
            this.agentEmail = agentData[0].email;
            this.agentPhone = agentData[0].phone;
            this.LogoUrl = agentData[0].logo;
            this.agentAddress = `${agentData[0].street}, ${agentData[0].city}, ${agentData[0].state}, ${agentData[0].country} ${agentData[0].pinCode}`;
       
       console.log('OUTPUT :this.LogoUrl ', this.LogoUrl);
        }
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


    // Handle Input Changes for Lender
    handleLenderInputChange(event) {
        const field = event.target.dataset.field;
        this.Lender[field] = event.target.value;
    }

    handleLenderAddressChange(event) {
        this.Lender.Street = event.detail.street;
        this.Lender.City = event.detail.city;
        this.Lender.Country = event.detail.country;
        this.Lender.Province = event.detail.province;
        this.Lender.PostalCode = event.detail.postalCode;
    }

    // Handle Input Changes for Financial Advisor
    handleAdvisorInputChange(event) {
        const field = event.target.dataset.field;
        this.FinancialAdvisor[field] = event.target.value;
    }

    // Handle Input Changes for Solicitor's Company
    handleSolicitorCompanyInputChange(event) {
        const field = event.target.dataset.field;
        this.SolicitorCompany[field] = event.target.value;
        console.log('OUTPUT : SolicitorCompanyInput', JSON.stringify(this.SolicitorCompany));
    }

    handleSolicitorCompanyAddressChange(event) {
        this.SolicitorCompany.BillingStreet = event.detail.street;
        this.SolicitorCompany.BillingCity = event.detail.city;
        this.SolicitorCompany.BillingCountry = event.detail.country;
        this.SolicitorCompany.BillingState = event.detail.province;
        this.SolicitorCompany.BillingPostalCode = event.detail.postalCode;
        console.log('OUTPUT : SolicitorCompanyInput Final Update', JSON.stringify(this.SolicitorCompany));
    }

    // Handle Input Changes for Solicitor's Person
    handleSolicitorPersonInputChange(event) {
        const field = event.target.dataset.field;
        this.SolicitorPerson[field] = event.target.value;
        console.log('OUTPUT : SolicitorPerson', JSON.stringify(this.SolicitorPerson));
    }


    /* ********************************************************************  Handle Submit *********************************************************** */

    async handleSaveAndSubmit() {
        // Clear results and open modal at the start
        this.processResults = [];
        this.isModalOpen = true;

        try {
            // Validate all fields upfront
            const validationErrors = [];

            // Step 1: Validate Contact
            if (!this.contact.LastName) {
                validationErrors.push(' Purchaser `Last Name` is required.');
            }

            // Step 2: Validate Lender Data
            const requiredFields = [
                { field: this.SolicitorCompany?.Name, message: 'Solicitor `Company Name` is required.' },
                { field: this.SolicitorPerson?.FirstName, message: 'Solicitor `First Name` is required.' },
                { field: this.SolicitorPerson?.LastName, message: 'Solicitor `Last Name` is required.' }
            ];

            if (this.MortgageRequired) {
                requiredFields.push(
                    { field: this.Lender?.accountName, message: 'Lender `Company Name` is required.' },
                    { field: this.FinancialAdvisor?.FirstName, message: 'Financial Advisor `First Name` is required.' },
                    { field: this.FinancialAdvisor?.LastName, message: 'Financial Advisor `Last Name` is required.' }
                );
            }

            requiredFields.forEach(field => {
                if (!field.field) {
                    validationErrors.push(field.message);
                }
            });

            // Step 3: Validate File Uploads
            const checkboxToFileMapping = {
                IdVerified: 'Upload Id',
                DecisioninPrinciple: 'Upload Decision in Principle',
                AMLCheck: 'Upload AML Check',
                ProofofFunding: 'Upload Proof of Income'
            };

            const missingFiles = [];
            Object.keys(checkboxToFileMapping).forEach(checkboxName => {
                const fileFieldName = checkboxToFileMapping[checkboxName];
                if (this.checkboxStates[checkboxName] && !this.fileUploads[fileFieldName]) {
                    missingFiles.push(fileFieldName);
                }
            });

            if (missingFiles.length > 0) {
                validationErrors.push(`Please upload files for the following: ${missingFiles.join(', ')}`);
            }

            // If there are any validation errors, stop execution
            if (validationErrors.length > 0) {
                validationErrors.forEach(error => this.addResult('Error', error));
                return;
            }

            // All validations passed; proceed with execution
            this.addResult('Success', 'All technical checks done.');


            // Step 4: Save Contact
            const contactResult = await createContact({ contact: this.contact });
            if (!contactResult.contact) {
                this.addResult('Error', 'Purchaser was not submitted.');
                return;
            }
            this.addResult('Success', 'Purchaser has been submitted successfully.');
            if (!contactResult.Account) {
                this.addResult('Error', 'Purchaser household not submitted.');
                return;
            } else {
                this.addResult('Success', 'Purchaser household has been submitted successfully.');
            }


            // Collect all data
            this.allData = {
                contact: { ...this.contact, Id: contactResult.contact },
                lender: this.Lender,
                financialAdvisor: this.FinancialAdvisor,
                solicitorCompany: this.SolicitorCompany,
                solicitorPerson: this.SolicitorPerson,
                offer: {
                    ...this.offer,
                    PurchaserId: contactResult.contact,
                    Property: this.recordId,
                    AgentName: this.agentId
                },
                fileUploads: this.fileUploads,
                checkboxStates: this.checkboxStates
            };

            // Step 5: Save Lender Records
            const saveResult = await saveRecords({
                lender: this.allData.lender,
                advisor: this.allData.financialAdvisor,
                solicitorCompany: this.allData.solicitorCompany,
                solicitorPerson: this.allData.solicitorPerson,
                mortgageRequired: this.MortgageRequired
            });

            if (!saveResult) {
                this.addResult('Error', 'System Error! Please contact system administrator.');
                return;
            }
            // this.addResult('Success', saveResult.message || 'Records created successfully.');
            if (!saveResult.solicitorAccountId) {
                this.addResult('Error', 'Purchaser solicitor has not been submitted.');
                return;
            }
            this.addResult('Success', 'Purchaser solicitor has been submitted successfully.');

            if (this.MortgageRequired) {
                if (!saveResult.lenderAccountId) {
                    this.addResult('Error', 'Lender has not been submitted.');
                    return;
                }
                this.addResult('Success', 'Lender has been submitted.');
                if (!saveResult.financialAdvisorId) {
                    this.addResult('Error', 'Financial advisor has not been submitted.');
                    return;
                }
                this.addResult('Success', 'Financial advisor has been submitted successfully.');
            }


            // Update Offer Object 
            this.allData.offer = {
                ...this.allData.offer, // Spread existing properties
                ...(saveResult.lenderAccountId && { NameOfLender: saveResult.lenderAccountId }),
                ...(saveResult.financialAdvisorId && { FinancialAdvisor: saveResult.financialAdvisorId }),
                ...(saveResult.solicitorAccountId && { PurchasorSolicitorsname: saveResult.solicitorAccountId })
            };

            // Step 6: Create Offer
            const offerDataJson = JSON.stringify(this.allData.offer);
            const createOfferResult = await createOffer({ offerDataJson });

            if (createOfferResult.Status !== 'Yes') {
                this.addResult('Error', `Failed to create offer: ${createOfferResult.ErrorMessage}`);
                return;
            }
            this.addResult('Success', `Offer has been submitted successfully.`);

            // Step 7: Upload Files
            const formData = {};
            if (this.allData.fileUploads && Object.keys(this.allData.fileUploads).length > 0) {
                Object.keys(this.allData.fileUploads).forEach(key => {
                    formData[key] = this.allData.fileUploads[key].content;
                });
                formData.offerId = createOfferResult.Id;

                const uploadResult = await uploadFiles({ formDataJson: JSON.stringify(formData) });
                if (uploadResult === 'Success') {
                    this.addResult('Success', 'Files have been uploaded successfully.');
                  
                } else {
                    this.addResult('Error', 'Files have not been uploaded.');
                    this.isReadOnly = false;
                    this.isLoading = false;
                }
            } 

            if (this.isAllSuccess) {
                  this.isReadOnly = true;
                  this.isLoading = true;
                   setTimeout(() => {
                this.isLoading = false;
            }, 4000);
                setTimeout(() => {
                    this.isModalOpen = false;
                }, 5000);
            }

        } catch (error) {
            const errorMessage = error?.body?.message || error?.message || 'An unexpected error occurred.';
            this.addResult('Error', errorMessage);
        } finally {
           
        }
    }
    // Helper function to add results dynamically
    addResult(status, message) {
        const animationClass =
            status === 'Success' ? 'animated-checkbox success' : 'animated-checkbox error';

        // Add the new result
        this.processResults = [
            ...this.processResults,
            {
                id: this.processResults.length + 1, // Unique ID for each result
                status,
                message,
                animationClass
            }
        ];

        // Update the `isAllSuccess` property based on the statuses of all results
        this.isAllSuccess = this.processResults.every(result => result.status === 'Success');
    }


    updateAllSuccessStatus() {
        // Check if all results have a status of 'Success'
        this.isAllSuccess = this.processResults.every(result => result.status === 'Success');
    }

    closeModal() {
        this.isModalOpen = false;
        this.customError = false;
    }

    /* *********************************************************************************************************************************************** */

    // Cancel and Clear Form
    cancelAccount() {
        //  this.clearForm();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant, mode: 'pester' }));
    }

    handleError(error, message) {
        console.error(message, error);
        this.showToast('Error', message, 'error');
    }
}