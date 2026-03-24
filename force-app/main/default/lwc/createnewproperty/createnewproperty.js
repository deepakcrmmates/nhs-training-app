// createAccountRecord.js
import { LightningElement, wire, track,api } from 'lwc';
import getfs from '@salesforce/apex/AddressFinderController.getFieldSet';
import { NavigationMixin } from "lightning/navigation";
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Createnewproperty extends NavigationMixin(LightningElement) {    
    @track mapData = [];

    @wire(getfs, { objName : 'NHS_Property__c', fieldsetname : [
        'prop_info_fields', 'prop_data_fields', 'flow_data_fields', 'prop_avail_fields', 'prop_detail_fields', 'aver_detail_fields',
        'app_fields', 'sys_info_fields'
    ]})
    getfsfields(result) {
        if(result.data) {
            for (let key in result.data) {
                this.mapData.push({value:JSON.parse(result.data[key]), key:key});
            }

        } else if(result.error) {
            //console.log('@@@error ', result.error);
        } 
    }

    handleSuccess(event) {
        // Handle success event
    }

    handleValueSelectedOnAccount(event) {
        const street = this.template.querySelector('[data-field-name="Address__Street__s"]');
        street.value = JSON.parse(event.detail.dta).line_1 + ', '+JSON.parse(event.detail.dta).line_2;
        const city = this.template.querySelector('[data-field-name="Address__City__s"]');
        city.value = JSON.parse(event.detail.dta).district
        const pcode = this.template.querySelector('[data-field-name="Address__PostalCode__s"]');
        pcode.value = JSON.parse(event.detail.dta).postcode;
    }

    handleSuccess(evnt) {
        this.recrdId= evnt.detail.id;
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.dispatchEvent(new CloseActionScreenEvent());
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Property Saved!',
                variant: 'success'
            })
        );
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
              objectApiName: "NHS_Property__c",
              actionName: "view",
              recordId: this.recrdId
            }
          });
    }

    cancelhandle() {
        this[NavigationMixin.Navigate]({
            type: "standard__objectPage",
            attributes: {
              objectApiName: "NHS_Property__c",
              actionName: "home",
            },
          });
    }
}