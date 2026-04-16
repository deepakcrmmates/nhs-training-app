import { LightningElement, api, wire, track } from 'lwc';
import myImage from '@salesforce/resourceUrl/NHSLogo';
import mySvgResource from '@salesforce/resourceUrl/svgfile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getData from '@salesforce/apex/accountController.getData';
import getAccountFileUrl from '@salesforce/apex/accountController.getAccountFileUrl';
import getOppData from '@salesforce/apex/accountController.getOppData';
//import getPickListValues1 from '@salesforce/apex/accountController.getPickListValues';
import createForm from '@salesforce/apex/accountController.createForm';
import getOrderIDs from '@salesforce/apex/SendValuationFormPdf.getOrderIDs';
import getPdfUrl from '@salesforce/apex/valuatonFormPdfController.getPdfUrl';
import generatePdfBlob from '@salesforce/apex/valuatonFormPdfController.generatePdfBlob';


import { createRecord } from "lightning/uiRecordApi";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import VALUATION_OBJECT from "@salesforce/schema/Valuation_Assessment__c";
import NAME_FIELD from "@salesforce/schema/Valuation_Assessment__c.Name";
import GARAGE_FIELD from "@salesforce/schema/Valuation_Assessment__c.Garage__c";
import GARDEN_FIELD from "@salesforce/schema/Valuation_Assessment__c.Garden__c";
import GARDENS_FIELD from "@salesforce/schema/Valuation_Assessment__c.Gardens__c";
import PROPERTY_TYPE_FIELD from "@salesforce/schema/Valuation_Assessment__c.Property_Type__c";
import CENTRAL_HEATING_FIELD from "@salesforce/schema/Valuation_Assessment__c.Central_Heating__c";
import DOUBLE_GLAZING_FIELD from "@salesforce/schema/Valuation_Assessment__c.Double_Glazing__c";
import INTERIOR_FIELD from "@salesforce/schema/Valuation_Assessment__c.Interior__c";
import KITCHEN_FIELD from "@salesforce/schema/Valuation_Assessment__c.Kitchen__c";
import BATHROOM_FIELD from "@salesforce/schema/Valuation_Assessment__c.Bathroom_En_Suites__c";
import EXTERIOR_FIELD from "@salesforce/schema/Valuation_Assessment__c.Exterior__c";
import APPLIANCES_FIELD from "@salesforce/schema/Valuation_Assessment__c.Appliances__c";
import OUTBUILDINGS_FIELD from "@salesforce/schema/Valuation_Assessment__c.Outbuildings__c";
import RESALE_FIELD from "@salesforce/schema/Valuation_Assessment__c.Resale__c";


export default class ValuationForm extends LightningElement {

  @track isModalOpen = false;
  @track processResults = [];
  @track customError = false;
  @track isAllSuccess = false;
  @track errorMessage = '';
  @track housebuilderId = '';
  @track currentDateTime = '';//new Date().toISOString();

  @api note;
  @api agentId; //this will comes from vf page 
  @api recordsId;//this will comes from vf page 

  @track mainValidator = false;
  @track doar = false;
  @track showError = false;
  @track errorMessages = '';
  @track visibleError = false;
  @track visibleSuccess = false;
  @track errorMessage = '';
  @track successMessage = '';
  appointment = '';
  custommAppointment = '';

  accountRecordTypeId;
  valueId;

  freeholdval = false;
  leaseholdval = false;
  url = '';
  filenames = '';
  formatDate = '';

  name = '';
  email = '';
  phone = '';
  customerId = '';
  customerName = '';
  customerPhone = '';
  customerEmail = '';
  customerApplication = '';
  customerProperty = '';
  applicationRefNo = '';
  empty = '';
  @track fields = {};

  @track garage1 = '';
  @track garden1 = '';
  @track gardens1 = '';
  @track central_Heating1 = '';
  @track double_Glazing1 = '';
  @track interior1 = '';
  @track kitchen1 = '';
  @track bathroom_En_Suites1 = '';
  @track exterior1 = '';
  @track appliances1 = '';
  @track outbuildings1 = '';
  @track resales = '';
  @track propertyType = '';
  @track richTextValue;
  @track base64;
  @track fileData = {};
  @track terms = false;
  kitchen = '';
  bathroom = '';
  bedroom = '';
  garden = '';
  parking = '';
  living = '';
  others = '';



  renderedCallback() {
    // 1️⃣ Select input fields
    let agentNameInput = this.template.querySelector(".agent-name");
    let appraisalDateTime = this.template.querySelector(".appraisal-datetime");
    let imageContainer = this.template.querySelector(".account-image");

    // Debugging logs
    console.log("Agent Name Input:", agentNameInput);
    console.log("Appraisal DateTime:", appraisalDateTime);
    console.log("Image Container:", imageContainer);

    // 2️⃣ Update values if elements exist
    if (agentNameInput) {
      agentNameInput.value = ""; // Example update
    } else {
      console.error("Agent Name Input not found!");
    }

    if (appraisalDateTime) {
      // Get the current date and time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      // Format as YYYY-MM-DDTHH:MM
      //const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Set the value of the input field to the current date and time
      // appraisalDateTime.value = currentDateTime;
    } else {
      console.error("Appraisal DateTime not found!");
    }

    if (imageContainer) {
      imageContainer.src = "https://cdn.pixabay.com/photo/2017/01/08/21/37/flame-1964066_640.png"; // Placeholder image
    } else {
      console.error("Image Container not found!");
    }
  }

  connectedCallback() {
    this.isLoading = false; // Ensure content renders
  }


  //Updated On 19/07/2024
  openfileUpload(event) {
    const names = event.target.name;
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.base64 = reader.result.split(",")[1];
      this.fileData = { filename: file.name, base64: this.base64 };

      if (this.fields) {
        if (names == 'Kitchen') {
          this.kitchen = this.fileData.filename;
          this.fields['Kitchen_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'Bed') {
          this.bedroom = this.fileData.filename;
          this.fields['Bed_Room_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'BathRoom') {
          this.bathroom = this.fileData.filename;
          this.fields['Bath_Room_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'Living') {
          this.living = this.fileData.filename;
          this.fields['Living_Room_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'Parking') {
          this.parking = this.fileData.filename;
          this.fields['Parking_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'Garden') {
          this.garden = this.fileData.filename;
          this.fields['Garden_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        } else if (names == 'other') {
          this.others = this.fileData.filename;
          this.fields['Other_Photo__c'] = '<p><img src="data:image/jpeg;base64,' + this.base64 + '" alt="rtaImage.jpeg" width="600" height="400"></img></p>';
        }
      } else {
        console.error('this.fields is not defined');
      }

      console.log('OUTPUT : ', this.base64);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    if (file) {
      reader.readAsDataURL(file);
    } else {
      console.error('No file selected');
    }
  }


  @wire(getObjectInfo, { objectApiName: VALUATION_OBJECT })
  results({ error, data }) {
    if (data) {
      this.accountRecordTypeId = data.defaultRecordTypeId;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.accountRecordTypeId = undefined;
    }
  }

  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: GARAGE_FIELD })
  picklistResults1({ error, data }) {
    if (data) {
      this.garage1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.garage1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: GARDEN_FIELD })
  picklistResults2({ error, data }) {
    if (data) {
      this.garden1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.garden1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: GARDENS_FIELD })
  picklistResults3({ error, data }) {
    if (data) {
      this.gardens1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.gardens1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: CENTRAL_HEATING_FIELD })
  picklistResults4({ error, data }) {
    if (data) {
      this.central_Heating1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.central_Heating1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: DOUBLE_GLAZING_FIELD })
  picklistResults5({ error, data }) {
    if (data) {
      this.double_Glazing1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.double_Glazing1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: INTERIOR_FIELD })
  picklistResults060({ error, data }) {
    if (data) {
      this.interior1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.interior1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: KITCHEN_FIELD })
  picklistResults7({ error, data }) {
    if (data) {
      this.kitchen1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.kitchen1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: BATHROOM_FIELD })
  picklistResults8({ error, data }) {
    if (data) {
      this.bathroom_En_Suites1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.bathroom_En_Suites1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: EXTERIOR_FIELD })
  picklistResults9({ error, data }) {
    if (data) {
      this.exterior1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.exterior1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: APPLIANCES_FIELD })
  picklistResults0({ error, data }) {
    if (data) {
      this.appliances1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.appliances1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: OUTBUILDINGS_FIELD })
  picklistResults010({ error, data }) {
    if (data) {
      this.outbuildings1 = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.outbuildings1 = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: PROPERTY_TYPE_FIELD })
  picklistResults0101({ error, data }) {
    if (data) {
      console.log('OUTPUT ---= : ', data);
      this.propertyType = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.propertyType = undefined;
    }
  }
  @wire(getPicklistValues, { recordTypeId: "$accountRecordTypeId", fieldApiName: RESALE_FIELD })
  picklistResults02({ error, data }) {
    if (data) {
      this.resales = data.values;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.resales = undefined;
    }
  }


  @wire(getData, { recId: '$agentId' })
  wiredData({ error, data }) {
    if (data) {
      console.log('Data', data);
      this.name = data.Name;
      this.email = data.Email__c;
      this.phone = data.Phone;
      // this.richTextValue = 'https://nhsolutions--training.sandbox.file.force.com/sfc/dist/version/renditionDownload?rendition=ORIGINAL_Png&versionId=068KG000000MOoY&operationContext=DELIVERY&contentId=05TKG000000BkKs&page=0&d=/a/KG000000CfeI/PE6qtVBBrMnmiKGGI7ArNV6X74OUVD3hbjsZv9f2xqg&oid=00D7a0000005DDN&dpt=null&viewId='; //'https://nhsolutions--training.sandbox.file.force.com/sfc/dist/version/renditionDownload?rendition=ORIGINAL_Jpeg&versionId=068KG000000MOI6&operationContext=DELIVERY&contentId=05TKG000000BjL6&page=0&d=/a/KG000000CfeD/gFQt0b_5Pn5HApk4ly5bkWYGUosqrPKwsnquBWuqbhI&oid=00D7a0000005DDN&dpt=null&viewId=';
      //this.extractImageUrls(data.Logo_URL__c);
      // console.log('this.richTextValue', this.richTextValue);

    } else if (error) {
      console.error('Error:', error);
    }
  }

  @wire(getAccountFileUrl, { accountId: '$agentId' })
  wiredLogo({ error, data }) {
    if (data) {
      console.log('data fetching logo:', data);
      this.richTextValue = data;

    } else if (error) {
      console.error('Error fetching logo:', error);
    }
  }

  @wire(getOppData, { recsId: '$recordsId', acId: '$agentId' })
  wiredData1({ error, data }) {
    if (data) {
      console.log('Op Data', data);
      var dte;
      //this.customerId = data.Applicant__c;
      this.customerApplication = data.Name;
      this.customerEmail = data.Applicant__r.Email;
      this.customerName = data.Applicant__r.Name;
      this.customerPhone = data.Applicant__r.Phone;
      this.customerProperty = data.Property__r.Name;

      if (data.Agent_1__c == this.agentId) {
        this.formatDate = this.formatDatetime(data.Agent_1_Valuation_Requested_Date_Time__c);
        this.appointment = this.formatDatetime1(data.Agent_1_Appointment__c);
        this.custommAppointment = data.Agent_1_Appointment__c;
        this.currentDateTime = data.Agent_1_Appointment__c;
      }
      if (data.Agent_2__c == this.agentId) {
        this.formatDate = this.formatDatetime(data.Agent_2_Valuation_Requested_Date_Time__c);
        this.appointment = this.formatDatetime1(data.Agent_2_Appointment__c);
        this.custommAppointment = data.Agent_2_Appointment__c;
        this.currentDateTime = data.Agent_2_Appointment__c;
      }
      if (data.Agent_3__c == this.agentId) {
        this.formatDate = this.formatDatetime(data.Agent_3_Valuation_Requested_Date_Time__c);
        this.appointment = this.formatDatetime1(data.Agent_3_Appointment__c);
        this.custommAppointment = data.Agent_3_Appointment__c;
        this.currentDateTime = data.Agent_3_Appointment__c;
      }


      console.log('OUTPUT this.appointment: ', this.appointment);
      this.applicationRefNo = 'Valuation Form ' + '  ' + '|' + '  ' + data.Application_Reference_Number__c + '  ' + '|' + '  ' + this.formatDate;
      console.log('OUTPUT : this.applicationRefNo ', this.applicationRefNo);
    } else if (error) {
      console.error('Error:', error);
    }
  }

  extractImageUrls(htmlContent) {
    console.log('htmlContent -------', htmlContent);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const imgTags = doc.getElementsByTagName('img');
    const urls = [];
    for (let img of imgTags) {
      urls.push(img.src);
    }
    console.log('urls -------', urls);

    return urls;
  }

  formatDatetime(datetime) {
    if (!datetime) {
      return '';
    }

    const options = {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    try {
      const date = new Date(datetime);
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      return 'Invalid Date';
    }
  }

  formatDatetime1(datetime) {
    if (!datetime) {
      return '';
    }

    const options = {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    };

    try {
      const date = new Date(datetime);
      const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

      // Manually insert "at" to match your desired format
      const [datePart, timePart] = formattedDate.split(', ');
      return `${datePart}`;
    } catch (error) {
      return 'Invalid Date';
    }
  }
  //Updated On 19/07/2024
  // Utility function to handle property data updates
  handlePropertyData(event, cityField, countryField, postalCodeField, streetField) {
    try {
      const eventData = JSON.parse(event.detail.dta);
      console.log('OUTPUT : Address', JSON.stringify(eventData));
      this.fields[cityField] = eventData.district;
      this.fields[countryField] = 'GB';
      this.fields[postalCodeField] = eventData.postcode;
      this.fields[streetField] = eventData.line_1 + ', ' + eventData.line_2;

      console.log('OUTPUT:', JSON.stringify(this.fields));
    } catch (error) {
      console.error('Error handling property data:', error);
    }
  }

  // Handle different properties using the utility function 
  //Updated On 19/07/2024
  handleProperty1(event) {
    this.handlePropertyData(event, 'Sold_Property_1__City__s', 'Sold_Property_1__CountryCode__s', 'Sold_Property_1__PostalCode__s', 'Sold_Property_1__Street__s');
  }

  handleProperty2(event) {
    this.handlePropertyData(event, 'Sold_Property_2__City__s', 'Sold_Property_2__CountryCode__s', 'Sold_Property_2__PostalCode__s', 'Sold_Property_2__Street__s');
  }

  handleProperty3(event) {
    this.handlePropertyData(event, 'On_Market_Property_1__City__s', 'On_Market_Property_1__CountryCode__s', 'On_Market_Property_1__PostalCode__s', 'On_Market_Property_1__Street__s');
  }

  handleProperty4(event) {
    this.handlePropertyData(event, 'On_Market_Property_2__City__s', 'On_Market_Property_2__CountryCode__s', 'On_Market_Property_2__PostalCode__s', 'On_Market_Property_2__Street__s');
  }


  //Updated On 19/07/2024
  handleChange(event) {
    const name = event.target.name;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    console.log('OUTPUT : value', value);
    console.log('OUTPUT : name', name);

    // Ensure this.fields is initialized
    if (!this.fields) {
      this.fields = {};
    }

    const fieldMappings = {
      'propertyType': 'Property_Type__c',
      'typeOfConstruction': 'Type_of_Construction__c',
      'date': 'Date_and_Time_of_Appraisal__c',
      'garage1': 'Garage__c',
      'garden1': 'Garden__c',
      'gardens1': 'Gardens__c',
      'central_Heating1': 'Central_Heating__c',
      'double_Glazing1': 'Double_Glazing__c',
      'interior1': 'Interior__c',
      'kitchen1': 'Kitchen__c',
      'bathroom_En_Suites1': 'Bathroom_En_Suites__c',
      'exterior1': 'Exterior__c',
      'appliances1': 'Appliances__c',
      'outbuildings1': 'Outbuildings__c',
      'resale': 'Resale__c',
      'freehold': 'Freehold__c',
      'leasehold': 'Leasehold__c',
      'yearsLeft': 'Years_Left__c',
      'groundRent': 'Ground_Rent__c',
      'soldPropertyAgent1': 'Sold_Property_Agent_1__c',
      'soldPropertyAgent2': 'Sold_Property_Agent_2__c',
      'marketPropertyAgent1': 'On_Market_Property_Agent_1__c',
      'marketPropertyAgent2': 'On_Market_Property_Agent_2__c',
      'ageOfProperty': 'Age_of_Property__c',
      'noOfBedroom': 'Number_of_Bedrooms__c',
      'receptionleaving': 'Reception_Living__c',
      'otherRoom': 'List_of_Any_other_Additional_Rooms__c',
      'anyComment': 'Any_other_comments_on_the_property__c',
      'anyRepair': 'Any_essential_repairs_prior_to_marteting__c',
      'positiveAspect': 'Positive_Aspects_of_the_Property__c',
      'negativeAspect': 'Negative_Aspects_of_the_Property__c',
      'currentMarket': 'Please_outline_the_current_local_market__c',
      'soldDescription': 'Description__c',
      'soldAskingprice': 'Asking_Price__c',
      'soldTimeInMarket': 'Time_on_Market__c',
      'soldprice': 'Sold_Price__c',
      'DescriptionOnMarket': 'Description_On_Market__c',
      'marketAskingprice': 'Asking_Price_On_Market__c',
      'TimeInMarket': 'Time_on_Market_s__c',
      'visitingProperty': 'What_other_tools_for_accurate_valuation__c',
      'marketprice': 'Market_Price__c',
      '6weekprice': 'X6_Week_Sale__c',
      'forceprice': 'Forced_Sale__c',
      'soldDescription1': 'Description_ext__c',
      'DescriptionOnMarket1': 'Description_On_Market_ext__c',
      'soldAskingprice1': 'Asking_Price_ext__c',
      'marketAskingprice1': 'Asking_Price_On_Market_ext__c',
      'soldTimeInMarket1': 'Time_on_Market_ext__c',
      'TimeInMarket1': 'Time_on_Market_s_ext__c',
      'soldprice1': 'Sold_Price_ext__c'
    };

    // Assign the value to the correct field if it exists in the mapping
    if (fieldMappings[name]) {
      this.fields[fieldMappings[name]] = value;
    }

    // Handle Terms and Condition Checkbox
    if (name === 'Terms_and_Condition') {
      this.fields['Terms_and_Condition__c'] = event.target.checked;
      this.terms = this.fields['Terms_and_Condition__c'];
    }
    if (name === 'date') {
      const selectedDate = new Date(value);
      const appointmentDate = new Date(this.custommAppointment);

      // Strip the time portion (set time to midnight)
      selectedDate.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);

      console.log('OUTPUT :selectedDate ', selectedDate);
      console.log('OUTPUT :appointmentDate ', appointmentDate);

      if (selectedDate.getTime() !== appointmentDate.getTime()) {
        this.fields['Date_and_Time_of_Appraisal__c'] = this.custommAppointment;

        this.isLoading = false;
        this.customError = true;
        this.addResult('Error', 'Selected date must match the appointment date.');
        setTimeout(() => {
          this.closeModal();
        }, 3000);
        return;
      } else {
        this.fields['Date_and_Time_of_Appraisal__c'] = value; // Use original value
      }
    }



    // Handle Freehold and Leasehold Toggle Logic
    if (name === 'freehold') {
      this.fields['Freehold__c'] = value;
      this.fields['Leasehold__c'] = false;
      this.freeholdval = value;
      this.leaseholdval = !value;
    }

    if (name === 'leasehold') {
      this.fields['Leasehold__c'] = value;
      this.fields['Freehold__c'] = false;
      this.freeholdval = !value;
      this.leaseholdval = value;
    }

    // Handle Sold Date Validation
    if (name === 'soldDate' || name === 'soldDate1') {
      console.log('OUTPUT : Raw datetime value:', value);

      if (!value || isNaN(Date.parse(value))) {
        console.error('Invalid datetime format:', value);
        return; // Prevent further execution if invalid
      }

      const selectedDate = new Date(value);
      console.log('OUTPUT : Parsed Date Object:', selectedDate);
      const currentDate = new Date();

      const inputField = this.template.querySelector(name === 'soldDate' ? ".dateCls" : ".dateCls1");

      if (selectedDate > currentDate) {
        this.doar = true;
        inputField.setCustomValidity("Future date is not allowed.");
      } else {
        this.doar = false;
        inputField.setCustomValidity("");
        this.fields[name === 'soldDate' ? 'Sold_Date__c' : 'Sold_Date_ext__c'] = value;
      }
      inputField.reportValidity();
    }

    // Update common fields
    this.fields['Application__c'] = this.recordsId;
    this.fields['Agent__c'] = this.agentId;
    this.fields['Contact_Name__c'] = this.agentId;
    this.fields['Agent_On_Market__c'] = this.agentId;
    this.fields['Name'] = this.customerApplication;

    console.log('OUTPUT : fields', JSON.stringify(this.fields, null, 2));
  }


  handleClick(event) {
    const fields = this.fields;
    console.log('OUTPUT : this.terms ', this.terms);
    console.log('OUTPUT : this.doar ', this.doar);

    // Clear previous results and open the modal
    this.processResults = [];
    this.isLoading = true;

    // Validation for sold date
    if (this.doar == true) {
      this.isLoading = false;
      this.customError = true;
      this.addResult('Error', 'Please Check Sold Date are in the past.');
      setTimeout(() => {
        this.closeModal();
      }, 3000);
      return;
    }

    // Validation for terms and conditions
    if (this.terms == false) {
      this.isLoading = false;
      this.customError = true;
      this.addResult('Error', 'Please accept Terms and Condition');
      setTimeout(() => {
        this.closeModal();
      }, 3000);
      return;
    }

    // Validation for freehold/leasehold selection
    if (this.freeholdval === this.leaseholdval) {
      this.isLoading = false;
      this.customError = true;
      this.addResult('Error', 'Please select either Freehold or Leasehold');
      setTimeout(() => {
        this.closeModal();
      }, 3000);
      return;
    }

    // Call the Apex method to create the form
    createForm({ jsonDatalist: fields })
      .then(result => {
        let res = result;

        if (res.hasOwnProperty('success')) {
          this.isModalOpen = true;
          this.isLoading = false;
          // Add success result
          this.addResult('Success', 'Form submitted successfully.');
          this.housebuilderId = res.success;
          // Fetch order IDs (if needed)

          getOrderIDs({ soIdList: res.success })
            .then(result => {
              let idRes = result;
              console.log('OUTPUT : ', idRes);
            });

          // Set the URL for the PDF
          this.url = 'https://' + location.host + '/apex/ValuatonFormPDF?id=' + res.success;
          console.log('OUTPUT : ', this.url);


          // Show success message

          this.successMessage = `Thank you, ${this.name}. Your valuation form for the property ${this.customerProperty} has been submitted successfully. We have sent you a copy of submission via email.`;
          this.addResult('Success', `Thank you, ${this.name}. Your valuation form for the property ${this.customerProperty} has been submitted successfully. We have sent you a copy of submission via email.`);

          generatePdfBlob({ recordId: res.success })
            .then(result => {
              console.log('OUTPUT : file upload to dropbox successfully...');
            });
          // setTimeout(() => {
          //   this.closeModal();
          // }, 5000);

        } else if (res.hasOwnProperty('fail')) {
          this.customError = true;
          this.isLoading = false;
          // Add failure result
          this.addResult('Error', 'Form submission failed. Please try again.' + (res.fail));

          setTimeout(() => {
            this.closeModal();
          }, 5000);
        }
      })
      .catch(error => {
        this.customError = true;
        this.isLoading = false;
        setTimeout(() => {
          this.closeModal();
        }, 5000);
        // Add error result
        this.addResult('Error', 'An unexpected error occurred. Please try again.');

        // Log the error
        console.error('Error submitting form:', error);
      });
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

  handleDownloadPdf() {

    // generatePdfBlob({ recordId: 'a0bKG000000TdWwYAK' })
    //   .then(result => {
    //     console.log('OUTPUT : file upload to dropbox successfully...');
    //   });

    getPdfUrl({ recordId: this.housebuilderId })
      .then(pdfUrl => {
        console.log('OUTPUT : ', pdfUrl);//'a0bKG000000TdWwYAK'
        //const pdfUrls = 'https://nhsolutions--training.sandbox.my.salesforce-sites.com/valueForm/apex/ValuationAssessmentPDF?Id=a0bKG000000TdWwYAK';
        // Create a hidden download link
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank'; // Open in a new tab
        link.download = this.getFormattedFilename(); // Suggested filename
        link.click();

        // generatePdfBlob({ recordId: this.housebuilderId })
        // .then(result => {
        //   console.log('OUTPUT : file upload to dropbox successfully...');
        // });
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
      });
  }

  getFormattedFilename() {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(2)}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    return `Valuation Report - ${this.name} - ${formattedDate}.pdf`;
  }

  updateAllSuccessStatus() {
    // Check if all results have a status of 'Success'
    this.isAllSuccess = this.processResults.every(result => result.status === 'Success');
  }

  closeModal() {
    this.isModalOpen = false;
    this.customError = false;
  }

}