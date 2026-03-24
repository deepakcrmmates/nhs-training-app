import { LightningElement, api, track, wire } from 'lwc';

//import fetchStreetData from '@salesforce/apex/propertyController.fetchStreetDatas'; 
import { getRecord } from 'lightning/uiRecordApi';
const FIELDS = [ 
    'Property__c.Current_Efficiency__c',
    'Property__c.Potential_Efficiency__c'
]

export default class EPCRating extends LightningElement {
      @track recordId;
     @track color;
     @track topValue = 74;
     @track lowValue = 92;
     @track current = 0;
     @track potential = 0;

properties;

    

//     @wire(fetchStreetData, { propId: '$recordId' })
//     wiredAccount({ error, data }) {
//          console.log('OUTPUT : ',data);
//         if (data) {
//             this.properties = data;
//             this.topValue = this.properties.Current_Efficiency__c;
//             this.lowValue =this.properties.Potential_Efficiency__c;
//             console.log('OUTPUT : ',this.properties);
//         } else if (error) {
//             console.error('Error fetching account data:', error);
//         }
//     }


 @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
   record;
    get currents() {
        this.topValue = this.record.data.fields.Current_Efficiency__c.value;
        console.log('OUTPUT : ',this.topValue);
        //return this.record.data.fields.Address__Street__s.value;
    }
    get potentials() {
        this.lowValue = this.record.data.fields.Potential_Efficiency__c.value;
         console.log('OUTPUT : ',this.lowValue);
        //return this.record.data.fields.Address__PostalCode__s.value;
    }

     handleChange(event) {
          console.log('OUTPUT : ', event.target.value);
          this.topValue = event.target.value;

     }
     handlePotentialChange() {
          console.log('OUTPUT : ', event.target.value);
          this.lowValue = event.target.value;
     }
     handleClick(){
          this.topValue = this.record.data.fields.Current_Efficiency__c.value;
        console.log('OUTPUT : ',this.topValue);
          this.lowValue = this.record.data.fields.Potential_Efficiency__c.value;
         console.log('OUTPUT : ',this.lowValue);
     }
     get msgs() {
          if (this.topValue >= 95 && this.topValue <= 100) {
             this.current = 0;
               this.color = '#4CAF50';
          }
          if (this.topValue >= 92 && this.topValue < 95) {
             this.current = 6;
               this.color = '#4CAF50';
          }
          if (this.topValue >= 81 && this.topValue <= 91) {
               this.current = 50;
               this.color = '#8BC34A';
          }
          if (this.topValue >= 69 && this.topValue <= 80) {
               this.current = 86;
               this.color = '#FFEB3B';
          }
          if (this.topValue >= 55 && this.topValue <= 68) {
               this.current = 130;
               this.color = '#FFC107';
          }
          if (this.topValue >= 39 && this.topValue <= 54) {
               this.current = 176;
               this.color = '#FF9800';
          }
          if (this.topValue >= 21 && this.topValue <= 38) {
               this.current = 223;
               this.color = '#FF5722';
          }
          if (this.topValue >= 1 && this.topValue <= 20) {
               this.current = 271;
               this.color = '#F44336';
          }

          this.template.host.style.setProperty('--box-color', this.color);
          console.log('OUTPUT : this.current  ', this.current);
          return ` position: relative; top: ${this.current}px;font-size:10px;background-color:${this.color} ; border-right: 15px solid ${this.color}; `;
     }
     get potentials() {
           if (this.lowValue >= 95 &&  this.lowValue <= 100 ) {
               this.potential = 0;
               this.color = '#4CAF50';
          }
          if (this.lowValue >= 92 &&  this.lowValue < 95 ) {
               this.potential = 6;
               this.color = '#4CAF50';
          }
          if (this.lowValue >= 81 && this.lowValue <= 91) {
               this.potential = 50;
               this.color = '#8BC34A';
          }
          if (this.lowValue >= 69 && this.lowValue <= 80) {
               this.potential = 86;
               this.color = '#FFEB3B';
          }
          if (this.lowValue >= 55 && this.lowValue <= 68) {
               this.potential = 130;
               this.color = '#FFC107';
          }
          if (this.lowValue >= 39 && this.lowValue <= 54) {
               this.potential = 176;
               this.color = '#FF9800';
          }
          if (this.lowValue >= 21 && this.lowValue <= 38) {
               this.potential = 223;
               this.color = '#FF5722';
          }
          if (this.lowValue >= 1 && this.lowValue <= 20) {
               this.potential = 271;
               this.color = '#F44336';
          }

          this.template.host.style.setProperty('--box-color1', this.color);
          console.log('OUTPUT : this.pot  ', this.potential);
          return ` position: relative; top: ${this.potential}px;font-size:10px;background-color:${this.color} ; border-right: 15px solid ${this.color}; `;
     }

}