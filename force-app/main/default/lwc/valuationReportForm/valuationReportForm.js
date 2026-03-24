import { LightningElement, api } from 'lwc';
import {FlowAttributeChangeEvent} from 'lightning/flowSupport';
export default class ValuationReportForm extends LightningElement {

@api reactiveValue;
@api street;
@api city ;
@api pcode ;
@api country ;
handleValueSelectedOnAccounts(event) {
        //const street = this.template.querySelector('[data-field-name="Address__Street__s"]');
        this.street = JSON.parse(event.detail.dta).line_1 + ', '+JSON.parse(event.detail.dta).line_2;
       // const city = this.template.querySelector('[data-field-name="Address__City__s"]');
        this.city = JSON.parse(event.detail.dta).district
      //  const pcode = this.template.querySelector('[data-field-name="Address__PostalCode__s"]');
        this.pcode = JSON.parse(event.detail.dta).postcode;
       // const country = this.template.querySelector('[data-field-name="Address__CountryCode__s"]');
        this.country = 'United Kingdom'; //JSON.parse(event.detail.dta).country;
        console.log('OUTPUT : ',  this.country);

        ["street", "city","pcode", "country"].forEach((loc) =>
        this.dispatchEvent(new FlowAttributeChangeEvent(loc, this[loc]))
      );
       
    }
}