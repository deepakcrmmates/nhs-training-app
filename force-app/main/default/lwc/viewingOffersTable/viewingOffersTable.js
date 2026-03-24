import { LightningElement, api, track, wire } from 'lwc';
import CONTACT_OBJECT from "@salesforce/schema/Contact";
import NAME_FIELD from '@salesforce/schema/Contact.Name';
import Email_FIELD from '@salesforce/schema/Contact.Email';
import Phone_FIELD from '@salesforce/schema/Contact.Phone';
import MobilePhone_FIELD from '@salesforce/schema/Contact.MobilePhone';
import saveRecords from '@salesforce/apex/ViewingsOffersController.saveRecords';
import getInitialData from '@salesforce/apex/ViewingsOffersController.getInitialData';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ViewingsOffersTable extends LightningElement {
  @track viewingsOffersData = [{}];
  @track recordsToSave;
  @track isDisabled = true;
  @api recordId;
  @track unitMap = new Map();
  idSet = new Set();
  @track uniqueList = [];
  @track intValue = 1;
  @track newContact = false;
  @track conId = '';
  buyingPositionOptions = [
    { label: 'FTB', value: 'FTB' },
    { label: 'INV', value: 'INV' },
    { label: 'SSTC', value: 'SSTC' },
    { label: 'HTS – OM', value: 'HTS – OM' },
    { label: 'HTS – NOM', value: 'HTS – NOM' },
    { label: 'Cash – NTS', value: 'Cash – NTS' },
    { label: 'Rented', value: 'Rented' }

  ];
  contactObject = CONTACT_OBJECT;
   fields = [NAME_FIELD, Email_FIELD, Phone_FIELD,MobilePhone_FIELD];
  @wire(getInitialData, { availabiltyId: '$recordId' })
  wiredData({ error, data }) {
    if (data) {
      console.log('Data get data', data);
      var int = 0;

      this.wireDataOne = data;
      this.oppTable = this.wireDataOne;

      this.oppTable.forEach(item => {
        int++
        console.log('OUTPUT : ', (JSON.stringify(item)));
        let a = {};
        if (item.Id != '' && item.Id != undefined) {
          a.Id = item.Id;
        } else {
          a.Id = '';
        }
        if (item.Agent__c != '' && item.Agent__c != undefined) {
          a.Agent__c = item.Agent__c;
        } else {
          a.Agent__c = '';
        }
        if (item.Date_of_Viewing__c != '' && item.Date_of_Viewing__c != undefined) {
          a.Date_of_Viewing__c = item.Date_of_Viewing__c;
        } else {
          a.Date_of_Viewing__c = '';
        }
        if (item.Viewer_Name__c != '' && item.Viewer_Name__c != undefined) {
          a.Viewer_Name__c = item.Viewer_Name__c;
        } else {
          a.Viewer_Name__c = '';
        }
        if (item.Buying_Position__c != '' && item.Buying_Position__c != undefined) {
          a.Buying_Position__c = item.Buying_Position__c;
        } else {
          a.Buying_Position__c = '';
        }
        if (item.Feedback_Chased__c != '' && item.Feedback_Chased__c != undefined) {
          a.Feedback_Chased__c = item.Feedback_Chased__c;
        } else {
          a.Feedback_Chased__c = '';
        }
        if (item.Feedback__c != '' && item.Feedback__c != undefined) {
          a.Feedback__c = item.Feedback__c;
        } else {
          a.Feedback__c = '';
        }
        if (item.Offer__c != '' && item.Offer__c != undefined) {
          a.Offer__c = item.Offer__c;
        } else {
          a.Offer__c = '';
        }
        if (item.New_Offer__c != '' && item.New_Offer__c != undefined) {
          a.New_Offer__c = item.New_Offer__c;
        } else {
          a.New_Offer__c = '';
        }
        if (item.Notes_Updates__c != '' && item.Notes_Updates__c != undefined) {
          a.Notes_Updates__c = item.Notes_Updates__c;
        } else {
          a.Notes_Updates__c = '';
        }
        if (item.Availability_Report__c != '' && item.Availability_Report__c != undefined) {
          a.Availability_Report__c = item.Availability_Report__c;
        } else {
          a.Availability_Report__c = '';
        }
        a.key = int,
          this.viewingsOffersData.push(a);
      });
      if (this.viewingsOffersData.length > 0) {
        this.viewingsOffersData.shift(); // Removes the first element (0 index) from the array
      }
      console.log('OUTPUT : New data', this.viewingsOffersData);

    } else if (error) {
      console.error('Error:', error);
    }
  }
  addRow() {
    console.log('OUTPUT : ', this.recordId);
    this.isDisabled = false;
    var len = this.viewingsOffersData.length;
    console.log('OUTPUT :len ', len);

    this.viewingsOffersData.push({
      'Id': '',
      'Agent__c': '',
      'Date_of_Viewing__c': '',
      'Viewer_Name__c': '',
      'Buying_Position__c': '',
      'Feedback_Chased__c': '',
      'Feedback__c': '',
      'Offer__c': '',
      'New_Offer__c': '',
      'Notes_Updates__c': '',
      'Availability_Report__c': this.recordId,
      'key': parseInt(len) + 1
    });
    console.log('OUTPUT : uniId +', JSON.stringify(this.viewingsOffersData));
  }

  removeRow(event) {
    var len = this.viewingsOffersData.length;
    this.isDisabled = true;
    this.viewingsOffersData.pop({
      key: len

    });
  }

  handleInputChange(event) {
    console.log('OUTPUT : key', event.currentTarget.dataset.key);
    var temp = this.viewingsOffersData.find((item) =>
      item.key == event.currentTarget.dataset.key
    );
    if (event.target.name == 'agent') {
      temp.Agent__c = event.detail.id;
    }
    if (event.target.name == 'dov') {
      temp.Date_of_Viewing__c = event.target.value;
      // console.log('OUTPUT : obj1', JSON.stringify(obj1));
    }
    if(this.newContact == true){

    }
    if (event.target.name == 'vendor') {
      temp.Viewer_Name__c = event.detail.id;
    }
    if (event.target.name == 'buypos') {
      temp.Buying_Position__c = event.target.value;
    }
    if (event.target.name == 'feedback') {
      temp.Feedback__c = event.target.value;
    }
    if (event.target.name == 'fdRec') {
      temp.Feedback_Chased__c = event.target.value;
    }
    if (event.target.name == 'offer') {
      temp.Offer__c = event.target.value;
    }
    if (event.target.name == 'noffer') {
      temp.New_Offer__c = event.target.value;
    }
    if (event.target.name == 'notesUpdates') {
      temp.Notes_Updates__c = event.target.value;
    }

    if (!this.idSet.has(temp.key)) {
      console.log('OUTPUT : 1');
      this.idSet.add(temp.key);
      this.uniqueList.push(temp);
      console.log('OUTPUT : this.uniqueList after', JSON.stringify(this.uniqueList));
    }
    console.log('OUTPUT :this.jsonList uni  ', JSON.stringify(this.uniqueList));
  }

onSubmit(){
  this.conId = event.currentTarget.dataset.key;
  this.newContact = true;
}
hideModalBox(){
  this.newContact = false;
}

handleSubmit(event) {
  event.preventDefault(); // stop the form from submitting
  const fields = event.detail.fields;
  this.template.querySelector('lightning-record-form').submit(fields);
  var coId = event.detail.id;
  this.newContact = false;
   var temp = this.viewingsOffersData.find((item) =>
      item.key == this.conId
    );
    temp.Viewer_Name__c = coId;
     if (!this.idSet.has(temp.key)) {
      this.idSet.add(temp.key);
      this.uniqueList.push(temp);
      console.log('OUTPUT : this.uniqueList after', JSON.stringify(this.uniqueList));
    }
    console.log('OUTPUT :this.jsonList uni  ', JSON.stringify(this.uniqueList));
    this.updateConId();
    }
  saveNewRecords(event) {
    console.log('OUTPUT :saveNewRecords ', JSON.stringify(this.uniqueList));
    saveRecords({ jsonDatalist: JSON.stringify(this.uniqueList) })
      .then(result => {
        this.isDisabled = true;
        const evt = new ShowToastEvent({
                            title: 'Success..!',
                            message: 'Record saved successfully..',
                            variant: 'success',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
        location.reload();
        console.log('Records saved successfully:', result);
        // Reset viewingsOffersData or perform any necessary actions after saving
      })
      .catch(error => {
        console.error('Error saving records:', error);
        // Handle error
      });
  }

  updateConId(event){
     console.log('OUTPUT :saveNewRecords ', JSON.stringify(this.uniqueList));
    saveRecords({ jsonDatalist: JSON.stringify(this.uniqueList) })
      .then(result => {
        this.isDisabled = true;
        const evt = new ShowToastEvent({
                            title: 'Success..!',
                            message: 'Viewer saved successfully..',
                            variant: 'success',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
   //     location.reload();
        console.log('Records saved successfully:', result);
        // Reset viewingsOffersData or perform any necessary actions after saving
      })
      .catch(error => {
        console.error('Error saving records:', error);
        // Handle error
      });
  }
}