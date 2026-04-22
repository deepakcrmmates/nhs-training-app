import { LightningElement, track, wire, api } from 'lwc';
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import OPPORTUNITY_OBJECT from "@salesforce/schema/Opportunity";
import TYPE_FIELD from "@salesforce/schema/Opportunity.Type_of_House__c";
import Advisor_FIELD from '@salesforce/schema/Opportunity.NHS_Sales_Advisor__c';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Import Account fields
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import ACCOUNT_PHONE from '@salesforce/schema/Account.Phone';
import ACCOUNT_EMAIL from '@salesforce/schema/Account.Email__c';
import ACCOUNT_Region from '@salesforce/schema/Account.Region__c';
import ACCOUNT_LOGO from '@salesforce/schema/Account.Logo_URL__c';
import getAccountFileUrl from '@salesforce/apex/houseBuilderApplication.getAccountFileUrl';
import saveData from '@salesforce/apex/houseBuilderApplication.saveData';
import createVendors from '@salesforce/apex/houseBuilderApplication.createVendors';
import createProperty from '@salesforce/apex/houseBuilderApplication.createProperty';
import createAgents from '@salesforce/apex/houseBuilderApplication.createAgents';
import createApplication from '@salesforce/apex/houseBuilderApplication.createApplication';
import getfs from '@salesforce/apex/AddressFinderController.getFieldSet';
import getPdfUrl from '@salesforce/apex/HouseBuilderPdfController.getPdfUrl';
import generatePdfBlob from '@salesforce/apex/HouseBuilderPdfController.generatePdfBlob';
import setupFoldersAndGeneratePdf from '@salesforce/apex/HouseBuilderPdfController.setupFoldersAndGeneratePdf';
import generatePdfToNhsFolder from '@salesforce/apex/HouseBuilderPdfController.generatePdfToNhsFolder';
import isHouseBuilderRecordType from '@salesforce/apex/accountController.isHouseBuilderRecordType';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from 'lightning/navigation';

import { refreshApex } from '@salesforce/apex';

export default class NHSApplicationForm extends NavigationMixin(LightningElement) {

    @track housebuilderId =''; // = '001KG00000E5Jw3YAF'
    @track mapData = [];
    @track applicationId = '';
    isSelectedHousebuilder = false;
    animationClass = '';
    isModalOpen = false;
    customError = false;
    isReadOnly = false;
    isLoading = false;
    disable = false;
    salesAdv = '';
    finalCheck = false;
    finalMessage = '';
    reordType = ''; // Keeping this as a placeholder if needed elsewhere
    recordType = '';
    accountRecordTypeId = '';
    logoUrl = '';
    applicationPdfUrl = '';
    successMessage = '';
    errorMessage = '';
    propertAddress = '';
    @track manualAddressMode = false;
    processResults = [];
    isAllSuccess = false;
    startDateInputs = '';
    endDateInputs = '';
    @track name = '';
    @track email = '';
    @track phone = '';
    @track region = '';
    @track activeSection = 'housebuilder';
    _observerInitialized = false;
    sectionObserver;

    get sections() {
        return [
            { id: 'housebuilder', label: 'House Builder', icon: 'utility:company' },
            { id: 'property-details', label: 'Property Details', icon: 'utility:retail_execution' },
            { id: 'vendor-details', label: 'Vendor Details', icon: 'utility:groups' },
            { id: 'property-description', label: 'Property Description', icon: 'utility:description' },
            { id: 'additional-details', label: 'Additional Details', icon: 'utility:add' }
        ].map(section => ({
            ...section,
            itemClass: this.activeSection === section.id ? 'nav-item active' : 'nav-item'
        }));
    }

    handleNavClick(event) {
        this.activeSection = event.currentTarget.dataset.id;
        const targetElement = this.template.querySelector(`[data-id="${this.activeSection}"]`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    get sideNavClass() {
        return 'side-nav-container slds-p-right_medium';
    }

    getSectionClass(sectionId) {
        return this.activeSection === sectionId ? 'nav-item active' : 'nav-item';
    }

    // Soft-validation state — once the user confirms the warning prompt once, don't ask again this session
    warningsAcknowledged = false;
    @track showWarningModal = false;
    @track warningList = [];
    _warningResolve = null;

    @track currentDateTime = new Date().toISOString().split('T')[0];
    marketStatusOptions = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];

    valByAgent = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];
    @track numberOfBedrooms = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
        { label: '6', value: '6' },
        { label: '7', value: '7' },

    ];
    has_your_house_been_valued_by_an_agents = false;
    fields = [ACCOUNT_NAME, ACCOUNT_PHONE, ACCOUNT_EMAIL, ACCOUNT_Region];
    @track formData = {
        Application: {
            "housebuilderId": "",
            "Timeonthemarket": "",
            "plot": "",
            "development": "",
            "salesAdvisor": "",
            "scheme": "",
            "dateOfApplicationReceived": this.currentDateTime,
            "expectation": "",
            "startDate": "",
            "endDate": "",
            "notes": "",
            "marketstatusYes": 'No',
            "marketstatus_Val": false,
            "Has_your_house_been_valued_by_an_agent": 'No',
            "has_your_house_been_valued_by_an_agents": false,
            "terms": true,
            "monAM": false,
            "monPM": false,
            "tueAM": false,
            "tuePM": false,
            "wedAM": false,
            "wedPM": false,
            "thuAM": false,
            "thuPM": false,
            "friAM": false,
            "friPM": false,
            "satAM": false,
            "satPM": false,
            "sunAM": false,
            "sunPM": false,
            "PurchasePrice": 0
        },
        Vendor: {
            "firstname": "",
            "lastname": "",
            "firstname1": "",
            "lastname1": "",
            "email": "",
            "mobilePhone": "",
            "email1": "",
            "mobilePhone1": ""
        },
        Property: {
            "Detached": false, "SemiDetached": false, "EndTerrace": false, "MidTerrace": false, "Apartment": false, "Maisonette": false, "Studio": false,
            "Bungalow": false, "Other": false, "Other_Note": "", "NumberofBedrooms": "", "FrontGarden": false, "BackGarden": false, "NoGarden": false, "Parking": false, "Garage": false, "Extension": false,
            "Conservatory": false, "AgeofProperty": "", "Freehold": false, "LeaseHold": false, "YearsleftofLease": "", "ServiceChargePCM": "", "GroundRentPA": "",
            "PrincipleResidence": false, "SecondHomeHolidayLet": false, "AnyExtensionssolarpanels": false, "BuildingRegsPlanningPermission": false, "TypeofHeating": ""
        },
        Agent: {
            "agentName": "", "agentPhone": "", "agentEmail": "", "street": "", "city": "", "country": "", "province": "", "postCode": "",
            "agent3Name": "", "agent3Phone": "", "agent3Email": ""
        }
    };

    connectedCallback() {

        console.log('OUTPUT : housebuilderId', this.housebuilderId);
        this.formData.Application['housebuilderId'] = this.housebuilderId;
        console.log('OUTPUT : Form', JSON.stringify(this.formData.Application));
        //  this.handleAgentSelection('001KG0000086ecbYAA');
    }

    renderedCallback() {
        if (!this._observerInitialized) {
            this.initObserver();
            this._observerInitialized = true;
        }
    }

    disconnectedCallback() {
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
    }

    initObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // When the section is roughly at the top-middle of viewport
            threshold: 0
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.activeSection = entry.target.dataset.id;
                }
            });
        }, options);

        const sections = this.template.querySelectorAll('.section-card');
        sections.forEach(section => {
            this.sectionObserver.observe(section);
        });
    }

    get _wiredHousebuilderId() {
        return this.housebuilderId && this.housebuilderId.length === 18 ? this.housebuilderId : undefined;
    }

    @wire(getAccountFileUrl, { accountId: '$_wiredHousebuilderId' })
    wiredLogo({ error, data }) {
        if (data) {
            this.logoUrl = data.Logo_URL__c || '';
            this.applicationPdfUrl = data.House_Builder_Application_Pdf_URL__c || '';
        } else if (error) {
            console.error('Error fetching logo:', error);
        }
    }


    // Fetch Account record
    @wire(getRecord, { recordId: '$housebuilderId', fields: '$fields' })
    account({ error, data }) {
        if (data) {
            this.name = getFieldValue(data, ACCOUNT_NAME);
            this.email = getFieldValue(data, ACCOUNT_EMAIL);
            this.phone = getFieldValue(data, ACCOUNT_PHONE);
            this.region = getFieldValue(data, ACCOUNT_Region);
        } else if (error) {
            console.error('Error fetching account:', error);
        }
    }

    // Getter to extract field values
    get name() {
        return getFieldValue(this.account.data, ACCOUNT_NAME);
    }

    get phone() {
        return getFieldValue(this.account.data, ACCOUNT_PHONE);
    }

    get email() {
        return getFieldValue(this.account.data, ACCOUNT_EMAIL);
    }

    get todayDate() {
        return new Date().toISOString().split('T')[0];
    }

    @wire(getfs, {
        objName: 'NHS_Property__c', fieldsetname: [
            'PropertyDetails'
        ]
    })



    getfsfields(result) {
        if (result.data) {
            for (let key in result.data) {
                this.mapData.push({ value: JSON.parse(result.data[key]), key: key });
                console.log('OUTPUT : result.data', result.data);
            }

        } else if (result.error) {
            console.log('@@@error ', result.error);
        }
    }
    get options() {
        return [
            { label: 'New Home', value: 'New Home' },
            { label: 'Part Exchange', value: 'Part Exchange' },
            { label: 'Assisted Sale', value: 'Assisted Sale' },
            { label: 'PX or AS', value: 'PX or AS' },
            { label: 'Home Change', value: 'Home Change' },
            { label: 'Assisted Move', value: 'Assisted Move' },
            { label: 'Move Assist', value: 'Move Assist' },
            { label: 'Smooth Move', value: 'Smooth Move' },
            { label: 'Easy Move', value: 'Easy Move' },
            { label: 'Movemaker', value: 'Movemaker' }
        ];
    }
    @wire(getObjectInfo, { objectApiName: OPPORTUNITY_OBJECT })
    results({ error, data }) {
        if (data) {
            this.accountRecordTypeId = data.defaultRecordTypeId;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.accountRecordTypeId = undefined;
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: TYPE_FIELD })
    picklistResults({ error, data }) {
        if (data) {
            this.type = data.values;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.type = undefined;
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: Advisor_FIELD })
    picklistResults1({ error, data }) {
        if (data) {
            this.salesAdv = data.values;
            console.log('OUTPUT : ', this.salesAdv);
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.salesAdv = undefined;
        }
    }

    handleApplicationChange(event) {

        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        const startDateInput = event.target.id;
        console.log('OUTPUT :startDateInput ', startDateInput);
        console.log('OUTPUT :val  ', value);
        const field = event.target.name;

        if (field == 'scheme') {
            this.reordType = value;
        }
        if (startDateInput.includes('startDateInput')) {
            this.formData.Application['startDate'] = value;
            this.startDateInputs = this.formatDate(value);
        }
        if (startDateInput.includes('endDateInput')) {
            this.formData.Application['endDate'] = value;
            this.endDateInputs = this.formatDate(value);
        }

        if (field == 'marketstatus') {
            this.formData.Application['marketstatusYes'] = value;
            this.formData.Application['marketstatus_Val'] = value === 'Yes' ? true : false;

            // this.formData.Application['Has_your_house_been_valued_by_an_agent'] = false;
        }


        if (field == "Has_your_house_been_valued_by_an_agent") {
            //   this.formData.Application['marketstatusYes'] = false;
            this.formData.Application['Has_your_house_been_valued_by_an_agent'] = value;
            this.formData.Application['has_your_house_been_valued_by_an_agents'] = value === 'Yes' ? true : false;


        }



        if (field == 'dateOfApplicationReceived') {
            const inputDate = event.target.value; // Get selected date
            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

            if (inputDate > today) {
                this.customError = true;


                //this.addResult('Error', 'Date cannot be in the future!');
                this.addResultWithDelay('Error', 'Date cannot be in the future', 0);
                event.target.setCustomValidity('Date cannot be in the future!');
                setTimeout(() => {
                    this.customError = false;
                }, 4000);
                return;
            } else {
                this.customError = false;
                this.errorMessage = '';
                event.target.setCustomValidity('');
            }

            event.target.reportValidity(); // Show error if any
            this.formData.Application.dateOfApplicationReceived = inputDate;

        }
        else {
            this.formData.Application[field] = value;

        }
        console.log('OUTPUT : handleApplicationChange', JSON.stringify(this.formData));

    }

    formatDate(input) {
        const [year, month] = input.split('-'); // Split "2025-03" into ["2025", "03"]
        const date = new Date(year, month - 1); // Create Date object (month is 0-based)
        return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // Format to "Mar, 2025"
    }

    handleVendorChange(event) {
        const field = event.target.name;
        this.formData.Vendor[field] = event.target.value;
        console.log('OUTPUT : handleVendorChange', JSON.stringify(this.formData));
    }

    handleAgentChange(event) {
        const field = event.target.name;
        this.formData.Agent[field] = event.target.value;
        console.log('OUTPUT : handleAgentChange', JSON.stringify(this.formData.Agent));
    }

    handleAddressChange(event) {
        // Extract address details from the event
        const addressDetails = event.detail;

        // Update the contact object with address details
        this.formData.Agent = {
            ...this.formData.Agent,
            street: addressDetails.street,
            city: addressDetails.city,
            country: addressDetails.country,
            province: addressDetails.province,
            postCode: addressDetails.postCode
        };
        //this.propertAddress = addressDetails.street + ' ' + addressDetails.city + ' ' + addressDetails.province + ' ' + addressDetails.postCode + ' ' +  addressDetails.country
        console.log('Updated Agent data:', JSON.stringify(this.formData.Agent));
        console.log('OUTPUT :propertAddress ', this.propertAddress);
    }

    handleValueSelectedOnAccounts(event) {
        console.log('OUTPUT : Ideal Postcode ', JSON.stringify(event.detail.dta));
        const street = this.template.querySelector('[data-field-name="Address__Street__s"]');
        street.value = JSON.parse(event.detail.dta).line_1 + ', ' + JSON.parse(event.detail.dta).line_2;
        const city = this.template.querySelector('[data-field-name="Address__City__s"]');
        city.value = JSON.parse(event.detail.dta).post_town
        const pcode = this.template.querySelector('[data-field-name="Address__PostalCode__s"]');
        pcode.value = JSON.parse(event.detail.dta).postcode;
        //  const country = this.template.querySelector('[data-field-name="Address__CountryCode__s"]');
        // country.value = 'United Kingdom';

        this.formData.Property['street'] = street.value;
        this.formData.Property['city'] = city.value;
        this.formData.Property['pcode'] = pcode.value;
        this.formData.Property['country'] = 'United Kingdom';
        console.log('OUTPUT : handlePropertyChange', JSON.stringify(this.formData.Property));
        console.log('OUTPUT : Ideal Postcode ', JSON.stringify(event.detail.dta));

        this.propertAddress = this.formData.Property.street + ' ' + this.formData.Property.city + ' ' + this.formData.Property.pcode + ' ' + this.formData.Property.country
    }

    get addressToggleTitle() {
        return this.manualAddressMode ? 'Switch back to address search' : 'Enter the address manually';
    }

    handleToggleAddressMode() {
        this.manualAddressMode = !this.manualAddressMode;
        if (this.manualAddressMode && !this.formData.Property.country) {
            this.formData.Property.country = 'United Kingdom';
        }
    }

    handleManualAddressChange(event) {
        const key = event.target.dataset.manual;
        const value = event.target.value || '';
        this.formData.Property[key] = value;

        const fieldMap = {
            street: 'Address__Street__s',
            city: 'Address__City__s',
            pcode: 'Address__PostalCode__s'
        };
        const hiddenField = fieldMap[key];
        if (hiddenField) {
            const el = this.template.querySelector(`[data-field-name="${hiddenField}"]`);
            if (el) el.value = value;
        }

        const p = this.formData.Property;
        this.propertAddress = [p.street, p.city, p.pcode, p.country].filter(Boolean).join(' ');
    }

    handlePropertChange(event) {
        const field = event.target.name;
        const isCheckbox = event.target.type === 'checkbox';
        const value = isCheckbox ? event.target.checked : event.target.value;

        // List of property type fields that should behave like radio buttons
        const propertyTypes = [
            'Detached', 'SemiDetached', 'EndTerrace', 'MidTerrace',
            'Apartment', 'Maisonette', 'Studio', 'Bungalow', 'Other'
        ];

        if (isCheckbox && propertyTypes.includes(field)) {
            if (value) {
                // Allow up to 2 selections — if already 2 checked, uncheck the oldest
                const currentlyChecked = propertyTypes.filter(t => this.formData.Property[t] && t !== field);
                if (currentlyChecked.length >= 2) {
                    // Uncheck the first one to make room
                    this.formData.Property[currentlyChecked[0]] = false;
                }
                this.formData.Property[field] = true;
            } else {
                this.formData.Property[field] = false;
            }
        } else {
            // Standard update for other fields
            this.formData.Property[field] = value;
        }

        console.log('OUTPUT : handlePropertChange', JSON.stringify(this.formData.Property));
    }

    handleValueSelectedOnAccount(event) {
        console.log('OUTPUT property: ', event.detail.id);
        const accountId = event.detail.id;

        isHouseBuilderRecordType({ accountId })
            .then((isHouseBuilder) => {

                console.log('OUTPUT : isHouseBuilder', isHouseBuilder);
                if (isHouseBuilder) {
                    this.isSelectedHousebuilder = false;
                    console.log('OUTPUT property: ', accountId);
                    this.housebuilderId = accountId;
                    this.formData.Application['housebuilderId'] = accountId;
                } else {
                    this.isSelectedHousebuilder = true;
                    console.warn('Selected account is not a Housebuilder');
                    // Optional: display a message to the user

                    const evt = new ShowToastEvent({
                        title: 'Warning..!',
                        message: 'Selected account is not a Housebuilder.',
                        variant: 'warning',
                        mode: 'Pester '
                    });
                    this.dispatchEvent(evt);
                }
            })
            .catch((error) => {
                console.error('Error checking account record type: ', error);
            });
    }

    async handleSaveAndSubmit() {
        this.processResults = [];
        let missingFields = [];
        let formDataToSend = { ...this.formData };

        if (this.isSelectedHousebuilder == true) {
            const evt = new ShowToastEvent({
                title: 'Warning..!',
                message: 'Please select correct Housebuilder.',
                variant: 'warning',
                mode: 'Pester '
            });
            this.dispatchEvent(evt);
            return;
        }

        // Validation for house valuation
        if (this.formData.Application.Has_your_house_been_valued_by_an_agent == '') {
            this.customError = true;
            this.animationClass = 'animated-checkbox error';
            this.addResultWithDelay('Error', 'Has your house been valued by an agent?', 0);

            setTimeout(() => {
                this.customError = false;
            }, 4000);
            return;
        }

        // Check missing Agent details if house valuation is required
        if (this.formData.Application.has_your_house_been_valued_by_an_agents && this.formData.Application.marketstatus_Val == true) {
            const requiredFields = {
                Agent: {
                    agentName: 'Agent Name',
                    agentEmail: 'Agent Email',
                    agentPhone: 'Agent Phone',
                    agent3Name: 'Valued by Agent Name',
                    agent3Email: 'Valued by Agent Email',
                    agent3Phone: 'Valued by Agent Phone',
                    street: 'Street',
                    city: 'City',
                    country: 'Country',
                    province: 'Province'
                },
                Application: {
                    Timeonthemarket: 'Time on the Market',
                    CurrentAskingPrice: 'Current Asking Price',
                    NumberofViewings: 'Number of Viewings',
                    Previousaskingprice: 'Previous Asking Price',
                    Anypreviousoffers: 'Any Previous Offers'
                }
            };

            Object.entries(requiredFields).forEach(([section, fields]) => {
                Object.keys(fields).forEach(field => {
                    if (!this.formData[section] || !this.formData[section][field]) {
                        missingFields.push(fields[field]);
                    }
                });
            });
        }

        if (this.formData.Application.has_your_house_been_valued_by_an_agents && this.formData.Application.marketstatus_Val == false) {
            const requiredFields = {
                Agent: {
                    agent3Name: 'Valued by Agent Name',
                    agent3Email: 'Valued by Agent Email',
                    agent3Phone: 'Valued by Agent Phone',
                }
            };

            Object.entries(requiredFields).forEach(([section, fields]) => {
                Object.keys(fields).forEach(field => {
                    if (!this.formData[section] || !this.formData[section][field]) {
                        missingFields.push(fields[field]);
                    }
                });
            });
        }

        if (!this.formData || !this.formData.Vendor) {
            this.addResultWithDelay('Error', 'formData or Vendor object is undefined.', 0);
            return;
        }

        const vendorLastName = this.formData.Vendor.lastname;
        const vendorLastNameInput = this.template.querySelector("lightning-input[data-field-name='lastname']");

        if (!vendorLastName) {
            missingFields.push('Last name of Vendor 1');
            if (vendorLastNameInput) {
                vendorLastNameInput.setCustomValidity('Last name of Vendor 1 is required!');
                vendorLastNameInput.reportValidity();
            }
        }

        missingFields.forEach((field, index) => {
            this.addResultWithDelay('Error', `${field} Required`, index);
        });

        if (missingFields.length > 0) {
            this.customError = true;
            this.animationClass = 'animated-checkbox error';
            setTimeout(() => {
                this.customError = false;
                if (vendorLastNameInput) {
                    vendorLastNameInput.setCustomValidity('');
                    vendorLastNameInput.reportValidity();
                }
            }, 9000);
            return;
        }

        if (vendorLastNameInput) {
            vendorLastNameInput.setCustomValidity('');
            vendorLastNameInput.reportValidity();
        }

        // ── Soft validation: warn but allow the user to proceed ──
        if (!this.warningsAcknowledged) {
            const warnings = this.collectSoftWarnings();
            if (warnings.length > 0) {
                const proceed = await this._showWarningModal(warnings);
                if (!proceed) return;
                this.warningsAcknowledged = true;
            }
        }

        this.isLoading = true;
        this.isModalOpen = true;

        try {
            // STEP 1: CREATE VENDORS
            this.addResultWithDelay('Progress', 'Creating Vendors...', 0);
            const vendorResult = await createVendors({ vendorData: this.formData.Vendor });
            if (vendorResult.n) throw new Error(vendorResult.n);
            
            this.addResultWithDelay('Success', `Vendor 1 ${vendorResult.vaendor1name} created.`, 1);
            if (vendorResult.vaendor2name) {
                this.addResultWithDelay('Success', `Vendor 2 ${vendorResult.vaendor2name} created.`, 2);
            }

            // STEP 2: CREATE PROPERTY
            this.addResultWithDelay('Progress', 'Creating Property...', 3);
            const propertyResult = await createProperty({ propertyData: this.formData.Property });
            if (propertyResult.n) throw new Error(propertyResult.n);
            this.addResultWithDelay('Success', `Property ${propertyResult.propname} created.`, 4);

            // STEP 3: CREATE AGENTS
            this.addResultWithDelay('Progress', 'Processing Agents...', 5);
            const agentResult = await createAgents({ agentData: this.formData.Agent });
            if (agentResult.n) throw new Error(agentResult.n);
            if (agentResult.agentname) this.addResultWithDelay('Success', `Agent ${agentResult.agentname} registered.`, 6);
            if (agentResult.agent3name) this.addResultWithDelay('Success', `Valuation Agent ${agentResult.agent3name} registered.`, 7);

            // STEP 4: CREATE APPLICATION
            this.addResultWithDelay('Progress', 'Finalizing Application...', 8);
            const appResult = await createApplication({
                appData: this.formData.Application,
                recordType: this.recordType,
                vendor1Id: vendorResult.vendor1Id,
                vendor2Id: vendorResult.vendor2Id,
                propertyId: propertyResult.propertyId,
                agentId: agentResult.agentId,
                agent3Id: agentResult.agent3Id
            });
            if (appResult.n) throw new Error(appResult.n);

            this.applicationId = appResult.y;
            this.addResultWithDelay('Success', 'Application successfully submitted.', 9);

            // STEP 5: CREATE BOX FOLDER STRUCTURE
            this.addResultWithDelay('Progress', 'Creating Box folder structure...', 10);
            try {
                const boxResult = await setupFoldersAndGeneratePdf({ recordId: this.applicationId });
                if (boxResult && boxResult.status === 'success') {
                    this.addResultWithDelay('Success', 'Box folders created.', 11);
                } else if (boxResult && boxResult.status === 'skipped') {
                    this.addResultWithDelay('Success', 'Box folders already existed.', 11);
                } else {
                    const msg = (boxResult && boxResult.message) || 'Unknown Box setup error';
                    console.warn('Box folder setup reported error:', msg);
                    this.addResultWithDelay('Error', 'Box folder setup failed: ' + msg + ' — use Retry from the Application page.', 11);
                }
            } catch (boxErr) {
                console.error('Box folder error:', boxErr);
                const msg = boxErr?.body?.message || boxErr?.message || 'Unknown error';
                this.addResultWithDelay('Error', 'Box folder setup failed: ' + msg + ' — use Retry from the Application page.', 11);
            }

            // STEP 6: GENERATE PDF AND UPLOAD TO BOX
            this.addResultWithDelay('Progress', 'Generating PDF...', 12);

            this.finalMessage = `Thank you ${this.name}, your application has been successfully submitted.`;
            this.animationClass = 'animated-checkbox success';
            this.disable = true;
            this.isReadOnly = true;
            this.isLoading = false;

            // PDF generation needs delay for Queueable folder creation to complete
            setTimeout(() => {
                generatePdfToNhsFolder({ recordId: this.applicationId })
                    .then(() => {
                        console.log('PDF generated and uploaded to NHS Box folder');
                        return refreshApex(this.applicationPdfUrl);
                    })
                    .catch(e => console.error('PDF generation error:', e));
            }, 8000);

            setTimeout(() => { 
                this.isModalOpen = false; 
                this.finalCheck = true; 
            }, 8000);

        } catch (error) {
            console.error('Save Error:', error);
            this.addResultWithDelay('Error', error.message || 'An unexpected error occurred.', 0);
            this.isLoading = false;
            this.customError = true;
            this.animationClass = 'animated-checkbox error';
            this.finalCheck = false;
            // Optionally close modal after error
            // setTimeout(() => { this.isModalOpen = false; }, 5000);
        }
    }




    // Show the NHS-branded warning modal and resolve with true (proceed) / false (cancel).
    _showWarningModal(warnings) {
        this.warningList = warnings.map((label, i) => ({ key: 'w' + i, label }));
        this.showWarningModal = true;
        return new Promise(resolve => { this._warningResolve = resolve; });
    }

    handleWarningContinue() {
        this.showWarningModal = false;
        const resolve = this._warningResolve;
        this._warningResolve = null;
        if (resolve) resolve(true);
    }

    handleWarningCancel() {
        this.showWarningModal = false;
        const resolve = this._warningResolve;
        this._warningResolve = null;
        if (resolve) resolve(false);
    }

    // Collect recommended-but-not-filled fields. Returns an array of human labels.
    // Submission proceeds regardless — this drives only the pre-submit warning prompt.
    collectSoftWarnings() {
        const warnings = [];
        const p = this.formData.Property || {};
        const v = this.formData.Vendor || {};
        const a = this.formData.Application || {};

        const anyPropertyType = p.Detached || p.SemiDetached || p.EndTerrace || p.MidTerrace
            || p.Apartment || p.Maisonette || p.Studio || p.Bungalow || p.Other;
        if (!anyPropertyType) warnings.push('Type of property');
        if (!p.NumberofBedrooms) warnings.push('Number of bedrooms');
        if (!v.mobilePhone || String(v.mobilePhone).trim() === '') warnings.push('Phone number of Vendor 1');
        if (!v.email || String(v.email).trim() === '') warnings.push('Email address of Vendor 1');
        if (!a.expectation || String(a.expectation).trim() === '') warnings.push("Vendor's expectations");

        return warnings;
    }

    // Function to show messages one by one with delay
    addResultWithDelay(status, message, index, delay = 500) {
        setTimeout(() => {
            let animationClass = 'animated-checkbox';
            if (status === 'Success') animationClass += ' success';
            else if (status === 'Error') animationClass += ' error';
            else if (status === 'Progress') animationClass += ' progress';

            const newResult = {
                id: this.processResults.length + 1, // Unique ID for each result
                status,
                message,
                animationClass
            };

            this.processResults = [...this.processResults, newResult];

            // Update success state
            this.isAllSuccess = this.processResults.every(result => result.status === 'Success' || result.status === 'Progress');
        }, index * delay); // Ensures sequential appearance
    }

    handleGoToApplication() {
        if (!this.applicationId) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Application not available',
                message: 'Application record not found yet — please wait for submission to finish.',
                variant: 'warning'
            }));
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.applicationId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }

    handleDownloadPdf() {

        //  generatePdfBlob({ recordId: '006KG000002F3qKYAS' })
        //                     .then(result => {
        //                         console.log('OUTPUT : file upload to dropbox successfully...');
        //                     });



        getPdfUrl({ recordId: this.applicationId })
            .then(pdfUrl => {
                // Create a hidden download link 006KG000002F3qKYAS this.housebuilderId

                const link = document.createElement('a');
                link.href = pdfUrl //pdfUrl;
                link.target = '_blank'; // Open in a new tab this.housebuilderId
                link.download = this.getFormattedFilename(); // Suggested filename
                link.click();

            })
            .catch(error => {
                console.error('Error generating PDF:', error);
            });
    }

    getFormattedFilename() {
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(2)}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        return `${this.propertAddress} (${this.name})- ${formattedDate}.pdf`;
    }
    // getFormattedFilename(url) {
    //     const fileId = extractFileId(url) || "Unknown";
    //     return `Housebuilder Application - ${this.name} - ${fileId}.pdf`;
    // }
    // extractFileId(url) {
    //     const match = url.match(/-(\d+)\.pdf/);
    //     return match ? match[1] : null;
    // }


    //  handleDownloadPdf() {
    //     getPdfUrl({ recordId: '006KG000002F3qKYAS' })
    //         .then(pdfUrl => {
    //             // Open the PDF URL in a new tab
    //             window.open(pdfUrl, '_blank');
    //         })
    //         .catch(error => {
    //             console.error('Error generating PDF:', error);
    //         });
    // }


    closeModal() {
        this.finalCheck = false;
        this.isModalOpen = false;
        this.customError = false;
    }
}