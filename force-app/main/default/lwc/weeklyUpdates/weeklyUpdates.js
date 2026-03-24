import { LightningElement, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import USER_NAME_FIELD from '@salesforce/schema/User.Name';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveRecords from '@salesforce/apex/WeeklyUpdatesController.saveRecords';
import getInitialData from '@salesforce/apex/WeeklyUpdatesController.getInitialData';

export default class WeeklyUpdates extends LightningElement {
    @track weeks = [
        this.createWeek(1)
    ];
    userId = USER_ID;
    userName;
    @track jssonObject ={};
    @track jsonList = [];
    idSet = new Set();

    connectedCallback() {
        this.jssonObject['Agent1'] = '';
        this.jssonObject['Agent2'] = '';
        this.jssonObject['Agent3'] = '';
        this.jssonObject['notes1'] = '';
        this.jssonObject['notes2'] = '';
        this.jssonObject['notes3'] = '';
    }
    @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME_FIELD] })
    wiredUser({ error, data }) {
        if (data) {
            this.userName = data.fields.Name.value;
            this.weeks.forEach(week => {
                week.createdBy = this.userName;
                week.modifiedBy = this.userName;
            });
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

    createWeek(weekNumber) {
        const currentDate = new Date().toISOString().slice(0, 10); // Current date in YYYY-MM-DD format
        return {
            id: Date.now(),
            weekNumber: weekNumber,
            createdDate: currentDate,
            modifiedDate: currentDate,
            createdBy: this.userName || 'Loading...',
            modifiedBy: this.userName || 'Loading...',
            agent1: '',
            agent2: '',
            agent3: '',
            notes1:'',
            notes2:'',
            notes3:''
        };
    }

    addWeek() {
        const newWeekNumber = this.weeks.length + 1;
        this.weeks = [...this.weeks, this.createWeek(newWeekNumber)];
    }

    removeWeek(event) {
        const weekId = event.currentTarget.dataset.id;
        this.weeks = this.weeks.filter(week => week.id !== parseInt(weekId));
    }

    handleInputChange(event) {
        var temp = this.weeks.find((item) =>
      item.weekId == event.currentTarget.dataset.weekId
    );
        console.log('OUTPUT : ', JSON.stringify(temp));
        var name = event.target.name;
       // const weekId = event.target.dataset.weekId;
        const field = event.target.dataset.field;
        const agent =  event.target.dataset.agent;
        console.log('OUTPUT :agent ',agent);
        const value = event.target.value;

        // const weekIndex = this.weeks.findIndex(week => week.id === parseInt(weekId));
        // if (weekIndex !== -1) {
        //     if (agent) {
        //         this.weeks[weekIndex][agent][field] =  event.detail.id;
        //     } else {
        //         this.weeks[weekIndex][field] = value;
        //     }
        //     this.weeks[weekIndex].modifiedDate = new Date().toISOString().slice(0, 10);
        //     this.weeks[weekIndex].modifiedBy = this.userName;
        //     this.weeks = [...this.weeks];
        // }
        let a={};
        if(name == 'agent1'){
            this.jssonObject['Agent1']  = event.detail.id;
        }
        if(name == 'agent2'){
           this.jssonObject['Agent2'] = event.detail.id;
        }
        if(name == 'agent3'){
            this.jssonObject['Agent3'] = event.detail.id;
        }
        if(name == 'notes1'){
             this.jssonObject['notes1'] = event.target.value;
        }
        if(name =='notes2'){
             this.jssonObject['notes2'] = event.target.value;
        }
        if(name =='notes3'){
            this.jssonObject['notes3'] = event.target.value;
        }

        if (!this.idSet.has(temp.weekId)) {
      console.log('OUTPUT : 1');
      this.idSet.add(temp.weekId);
      this.jsonList.push(this.jssonObject);
      console.log('OUTPUT : this.uniqueList after', JSON.stringify(this.jsonList));
    }
        
       // this.jsonList.push(this.jssonObject);
        console.log('OUTPUT : list', JSON.stringify(this.jsonList) );
      //  console.log('OUTPUT : listr', (this.jsonList) );
    }

    // save() {
    //     // Logic to save data
    //     console.log(JSON.stringify(this.weeks));
    // }

    save(){
         console.log('OUTPUT : save click list', JSON.stringify(this.jssonObject));

         saveRecords({ jsonDatalist: JSON.stringify(this.jsonList) })
         .then(result => {
        // this.isDisabled = true;
        const evt = new ShowToastEvent({
                            title: 'Success..!',
                            message: 'Record saved successfully..',
                            variant: 'success',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
        //location.reload();
        console.log('Records saved successfully:', result);
        // Reset viewingsOffersData or perform any necessary actions after saving
      })
      .catch(error => {
        console.error('Error saving records:', error);
        // Handle error
      });
    }
}