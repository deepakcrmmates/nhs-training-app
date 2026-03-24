import { LightningElement, api, wire, track } from 'lwc';
//import Pagination2 from 'c/Pagination2';
import getInitialData from '@salesforce/apex/WeeklyUpdatesController.getInitialData';
import geAvailabilityDatas from '@salesforce/apex/ViewingsOffersController.geAvailabilityData';
import saveRecords from '@salesforce/apex/WeeklyUpdatesController.saveRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import USER_NAME_FIELD from '@salesforce/schema/User.Name';
export default class WeeklyUpdateCmp extends LightningElement {
  @api recordId;
  @track weekData = [{}];
  @track wireDataOne;
  @track lengths = 0;
  @track oppTable = [];
  @track jssonObject = {};
  @track formattedDate;
  @track formattedDate1;
  @track jsonList = [];
  @track uniqueList = [];
  @track lastwkno;
  applications = '';
  agents1 = '';
  agents2 = '';
  agents3 = '';
  idSet = new Set();
  userId = USER_ID;
  userName;
  @track visibleAccounts;
  connectedCallback() {

    console.log('this.recordId;', this.recordId);
  }

  @wire(geAvailabilityDatas, { availablityId: '$recordId' })
  getwiredData({ error, data }) {
    if (data) {
       console.log('OUTPUT : data ---', data);
      console.log('OUTPUT : data ---', data.length);
      this.agents1 = data.Application__r.Agent_1__c;
      this.agents2 = data.Application__r.Agent_2__c;
      this.agents3 = data.Application__r.Agent_3__c;
      this.applications = data.Application__c;
      console.log('Data', data);
    } else if (error) {
      console.error('Error:', error);
    }
  }

  @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME_FIELD] })
  wiredUser({ error, data }) {
    if (data) {
      this.userName = data.fields.Name.value;

    } else if (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error loading user',
          message: error.body.message,
          variant: 'error',
        }),
      );
    }
  }

  @wire(getInitialData, {recId : '$recordId'})
  wiredData({ error, data }) {
    if (data) {
      //   console.log('Data---------', data);

      this.wireDataOne = data;
      this.oppTable = this.wireDataOne;
      var int = 0;
      this.oppTable.forEach(item => {
        const date = new Date(item.CreatedDate);
        const date1 = new Date(item.LastModifiedDate);

        // Format the date using Intl.DateTimeFormat
        this.formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
        this.formattedDate1 = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date1);

        let a = {}
        if (item.Id != '' && item.Id != undefined) {
          a.Id = item.Id;
        } else {
          a.Id = '';
        }
         a.createDate = this.formattedDate;
        a.modifyDate = this.formattedDate1;
        a.createby = item.CreatedBy.Name;
        a.modifyby = item.LastModifiedBy.Name;
        a.weekNum = item.week_number__c;
        a.key = int += 1;
        if( this.applications !='' &&  this.applications != undefined){
          a.application =  this.applications;
           
        }else{
          return
        }
        if(item.Instructions_to_Market__c !='' && item.Instructions_to_Market__c != undefined){
           a.availabiltyId = item.Instructions_to_Market__c;
        }else{
          a.availabiltyId  ='';
        }
       
        if (item.Agent_1__c != '' && item.Agent_1__c != undefined) {
          a.agent1 = item.Agent_1__c;
        } else {
          a.agent1 = '';
        }
        if (item.Agent_2__c != '' && item.Agent_2__c != undefined) {
          a.agent2 = item.Agent_2__c;
        } else {
          a.agent2 = '';
        }
        if (item.Agent_3__c != '' && item.Agent_3__c != undefined) {
          a.agent3 = item.Agent_3__c;
        } else {
          a.agent3 = '';
        }
        if (item.Agent_1_Notes__c != '' && item.Agent_1_Notes__c != undefined) {
          a.notes1 = item.Agent_1_Notes__c;
        } else {
          a.notes1 = '';
        }
        if (item.Agent_2_Notes__c != '' && item.Agent_2_Notes__c != undefined) {
          a.notes2 = item.Agent_2_Notes__c;
        } else {
          a.notes2 = '';
        }
        if (item.Agent_3_Notes__c != '' && item.Agent_3_Notes__c != undefined) {
          a.notes3 = item.Agent_3_Notes__c;
        } else {
          a.notes3 = '';
        }
        
       
        console.log('OUTPUT :  int0===', int);
        this.lengths = int;
        this.lastwkno = item.week_number__c;
        console.log('OUTPUT :lastwk ', this.lastwkno);

        this.weekData.push(a);

      });
      this.jsonList = this.weekData;
      console.log('OUTPUT : initial jsonList ', JSON.stringify(this.jsonList));

      if (this.weekData.length > 0) {
        //this.weekData.shift(); // Removes the first element (0 index) from the array
      }
      console.log('OUTPUT : initial data ', JSON.stringify(this.weekData));
    } else if (error) {
      console.error('Error:', error);
    }
  }
  
  sortedDirection = 'asc';
  handleSort() {
    // this.weekData = [...this.weekData].sort((a, b) =>parseInt(a.weekNum.split('-')[1])  - parseInt(b.weekNum.split('-')[1]));
    this.sortedDirection = this.sortedDirection === 'asc' ? 'desc' : 'asc';
    this.weekData = [...this.weekData].sort((a, b) => {
      if (this.sortedDirection === 'asc') {
        return a.weekNum.localeCompare(b.weekNum, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return b.weekNum.localeCompare(a.weekNum, undefined, { numeric: true, sensitivity: 'base' });
      }
    });
  }

  addWeek() {
    const currentDate = new Date().toISOString().slice(0, 10);
    var len = this.weekData != null ? this.weekData.length : 0;
    const wk = this.lastwkno != null ? parseInt(this.lastwkno.split('-')[1]) :0;

    console.log('OUTPUT : ', this.weekData.length );

    this.weekData.push({
      'availabiltyId':this.recordId,
      'agent1': this.agents1,
      'agent2': this.agents2,
      'agent3': this.agents3,
      'notes1': '',
      'notes2': '',
      'notes3': '',
      'application': this.applications,
      'createDate': currentDate,
      'modifyDate': currentDate,
      'createby': this.userName,
      'modifyby': this.userName,
      'weekNum': 'Week -' + (parseInt(wk) + 1),
      'key': parseInt( this.lengths) + 1
    });
    this.lengths = parseInt( this.lengths) + 1;
    //this.jsonList = this.weekData;
    this.lastwkno = 'Week -' + (parseInt(wk) + 1);
    console.log('OUTPUT : uniId +', JSON.stringify(this.weekData));
  }

  removeWeek(event) {
    var len = this.weekData.length;
    const wk = parseInt(this.lastwkno.split('-')[1]);
    console.log('OUTPUT : - id', event.currentTarget.dataset.id);
    console.log('OUTPUT : -key ', event.detail.key);
    this.weekData.pop({
      key: event.detail.key

    });
    this.lastwkno = 'Week -' + (parseInt(wk) - 1);
    this.lengths = parseInt( this.lengths) - 1;
  }

  handleInputChange() {
    const name = event.target.name;
    const value = event.target.value;
    const key = event.currentTarget.dataset.key;
    console.log('OUTPUT : ', value);
    console.log(`Handling input change for key: ${key}, field: ${name}`);

    // Find the week data item with the matching key
    let temp = this.weekData.find(item => item.key == key);
    let item = JSON.parse(JSON.stringify(temp));

    console.log('OUTPUT : ', item);

    item['key'] = key;
    if (event.target.name == 'agent1') {
      item['agent1'] = event.detail.id;
    }
    if (event.target.name == 'agent2') {
      item['agent2'] = event.detail.id;
    }
    if (event.target.name == 'agent3') {
      item['agent3'] = event.detail.id;
    }
    if (event.target.name == 'notes1') {
      item['notes1'] = event.target.value;
    }
    if (event.target.name == 'notes2') {
      item['notes2'] = event.target.value;
    }
    if (event.target.name == 'notes3') {
      item.notes3 = event.target.value;
    }

    const existingIndex = this.uniqueList.findIndex(items => items.key == key);
    if (existingIndex != -1) {

      let updatedItem = { ...this.uniqueList[existingIndex] }; // Copy existing item
      if (name === 'agent1') {
        updatedItem.agent1 = event.detail.id;
      } else if (name === 'agent2') {
        updatedItem.agent2 = event.detail.id;
      } else if (name === 'agent3') {
        updatedItem.agent3 = event.detail.id;
      } else if (name === 'notes1') {
        updatedItem.notes1 = event.target.value;
      } else if (name === 'notes2') {
        updatedItem.notes2 = event.target.value;
      } else if (name === 'notes3') {
        updatedItem.notes3 = event.target.value;
      }

      // Replace the old item with the updated item
      this.uniqueList[existingIndex] = updatedItem;

      console.log('Updated uniqueList:', JSON.stringify(this.uniqueList));
    } else {
      console.error(`No matching item found for key: ${key}`);

      // Add new item if not already present
      this.idSet.add(item.key);
      this.uniqueList.push(item);
    }

    console.log('OUTPUT : this.uniqueList after', JSON.stringify(this.uniqueList));

  }

  save(event) {
    console.log('OUTPUT : this.uniqueList after', JSON.stringify(this.uniqueList));
    saveRecords({ jsonDatalist: JSON.stringify(this.uniqueList) })
      .then(result => {
        // this.isDisabled = true;
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
  updateAccountHandler(event) {
    this.weekData = [...event.detail.records]
    console.log('------------------', event.detail.records);
  }
}