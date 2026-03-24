import { LightningElement, wire, track } from 'lwc';
import saveApplication from '@salesforce/apex/ApplicationFormController.saveApplication';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getfs from '@salesforce/apex/AddressFinderController.getFieldSet';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
export default class ApplicationForm extends  NavigationMixin(LightningElement) {

     @track mapData = [];
    @track jsonDatas = {};
    SchemeOptions = 'Scheme 1';
    @track temp1 = false;
    @track temp2 = false;
    @track temp3 = false;
    @track temp4 = false;
    @track temp5 = false;
    @track dis1 = false;
    @track dis2 = false;
    @track default1 = false;
    @track doar = false;

    connectedCallback() {
        this.jsonDatas['name'] = '';
        this.jsonDatas['expectation'] = '';
        this.jsonDatas['scheme'] = '';
        this.jsonDatas['startDate'] = '';
        this.jsonDatas['endDate'] = '';
        this.jsonDatas['plot'] = ''
        this.jsonDatas['development'] = '';
        this.jsonDatas['applicationRecDate'] = '';
        this.jsonDatas['salesAdvisor'] = '';
        this.jsonDatas['monAM'] = false;
        this.jsonDatas['monPM'] = false;
        this.jsonDatas['tueAM'] = false;
        this.jsonDatas['tuePM'] = false;
        this.jsonDatas['wenAM'] = false;
        this.jsonDatas['wenPM'] = false;
        this.jsonDatas['thuAM'] = false;
        this.jsonDatas['thuPM'] = false;
        this.jsonDatas['friAM'] = false;
        this.jsonDatas['friPM'] = false;
        this.jsonDatas['notes'] = '';
        this.jsonDatas['vendor1'] = '';
        this.jsonDatas['vendor2'] = '';
        this.jsonDatas['property'] = '';
        this.jsonDatas['houseBuilder'] = '';
        this.jsonDatas['firstname'] = '';
        this.jsonDatas['lastname'] = '';
        this.jsonDatas['email'] = '';
        this.jsonDatas['mobilePhone'] = '';
        this.jsonDatas['firstname1'] = '';
        this.jsonDatas['lastname1'] = '';
        this.jsonDatas['email1'] = '';
        this.jsonDatas['mobilePhone1'] = '';
        this.jsonDatas['temp2'] = false;
        this.jsonDatas['temp1'] = false;
        this.jsonDatas['temp3'] = false;
    }
    @wire(getfs, { objName : 'NHS_Property__c', fieldsetname : [
        'PropertyDetails'
    ]})
    getfsfields(result) {
        if(result.data) {
            for (let key in result.data) {
                this.mapData.push({value:JSON.parse(result.data[key]), key:key});
            }

        } else if(result.error) {
            console.log('@@@error ', result.error);
        } 
    }
    get options() {
        return [
            { label: 'New Home', value: 'New Home' },
            { label: 'Part Exchange', value: 'Part Exchange' },
            { label: 'Assisted Sale', value: 'Assisted Sale' },
        ];
    }
    handleChange1(event) {
        var name = event.target.name;
        var isTrue = event.target.checked;
        console.log('OUTPUT :isTrue ', isTrue);
        if (isTrue == true && name == 'new') {
            this.temp1 = true;
            this.temp2 = false;
            this.default1 = true;
            this.temp3 = true;
             this.temp5 = true;
             this.dis1 = false;
            this.jsonDatas['temp1'] = true;
            this.jsonDatas['default1'] = true;
            this.jsonDatas['temp3'] = true;
            this.jsonDatas['vendor1'] = '';
        }
        if (isTrue == false && name == 'new') {
            this.temp1 = false;
            this.default1 = false;
            this.temp3 = true;
            this.temp5 = false;
           // this.dis1 = true;
            this.jsonDatas['temp1'] = false;
            this.jsonDatas['default1'] = false;
            this.jsonDatas['temp3'] = false;
        }
        if (isTrue == true && name == 'new2') {
            this.temp2 = true;
            this.temp1 = false;
            this.default1 = true;
            this.temp4 = true;
             this.temp3 = true;
             this.dis2 = false;
            this.jsonDatas['temp2'] = true;
            this.jsonDatas['default1'] = true;
            this.jsonDatas['temp3'] = true;
            this.jsonDatas['vendor1'] = '';

        }
        if (isTrue == false && name == 'new2') {
            console.log('OUTPUT : ', this.temp2);
            this.temp2 = false;
            this.temp4 = false;
           //  this.dis2 = true;
            this.default1 = false;
            this.jsonDatas['temp2'] = false;
            this.jsonDatas['default1'] = false;
            this.jsonDatas['temp3'] = false;

        }
        if (isTrue == true && name == 'exist') {
            this.temp2 = true;
            this.temp1 = true;
            this.jsonDatas['temp2'] = false;
            this.jsonDatas['temp1'] = false;

        }
        if (isTrue == false && name == 'exist') {
            console.log('OUTPUT : ', this.temp2);
            this.temp2 = false;
            this.temp1 = false;

        }
    }
    handleChange2() {

    }
    isFutureDate(dateString) {
    // Convert the date string to a Date object
    var date = new Date(dateString);
    console.log('OUTPUT : date',date);
    // Get the current date
    var currentDate = new Date();
    console.log('OUTPUT : currentDate',currentDate);
    // Compare the input date with the current date
    return date > currentDate;
}
    handleChange(event) {
        var name = event.target.name;
        const startDateInput = event.target.id;
        console.log('OUTPUT : ', name);
        console.log('OUTPUT : ', event.target.checked);

        if (startDateInput.includes('startDateInput')) {
            this.jsonDatas['startDate'] = event.target.value;
        }
        if (startDateInput.includes('endDateInput')) {
            this.jsonDatas['endDate'] = event.target.value;
        }
        if (name == 'name') {
            this.jsonDatas['name'] = event.target.value;

        }
        if (name == 'expectation') {
            this.jsonDatas['expectation'] = event.target.value;
        }
        if (name == 'scheme') {
            this.jsonDatas['scheme'] = event.target.value;
        }

        if (name == 'monAM') {

            this.jsonDatas['monAM'] = event.target.checked;
        }
        if (name == 'monPM') {
            this.jsonDatas['monPM'] = event.target.checked;
        }
        if (name == 'tueAM') {
            this.jsonDatas['tueAM'] = event.target.checked;
        }
        if (name == 'tuePM') {
            this.jsonDatas['tuePM'] = event.target.checked;
        }
        if (name == 'wenAM') {
            this.jsonDatas['wenAM'] = event.target.checked;
        }
        if (name == 'wenPM') {
            this.jsonDatas['wenPM'] = event.target.checked;
        }
        if (name == 'thuAM') {
            this.jsonDatas['thuAM'] = event.target.checked;
        }
        if (name == 'thuPM') {
            this.jsonDatas['thuPM'] = event.target.checked;
        }
        if (name == 'friAM') {
            this.jsonDatas['friAM'] = event.target.checked;
        }
        if (name == 'friPM') {
            this.jsonDatas['friPM'] = event.target.checked;
        }
        if (name == 'notes') {
            this.jsonDatas['notes'] = event.target.value;
        }
        if (name == 'plot') {
            this.jsonDatas['plot'] = event.target.value;
        }
        if (name == 'development') {
            this.jsonDatas['development'] = event.target.value;
        }
         if (name == 'dateOfApplicationReceived') {
             console.log('OUTPUT : DOAR',event.target.value);
             const inputField = this.template.querySelector(".dateCls");;
             if(this.isFutureDate(event.target.value)){
                 this.doar = true;
                  inputField.setCustomValidity("Future Date Not Allowed...");
                  inputField.reportValidity();
                 console.log('OUTPUT : True');
             }else{
                 this.doar = false;
                  inputField.setCustomValidity("");
                  inputField.reportValidity();
                 this.jsonDatas['applicationRecDate'] = event.target.value;
             }
            
        }
         if (name == 'salesAdvisor') {
            this.jsonDatas['salesAdvisor'] = event.target.value;
        }
    }

    handleValueSelectedOnVendor1(event) {

        if (this.temp1 == false) {
            console.log('OUTPUT v1: ', event.detail.id);
            this.jsonDatas['vendor1'] = event.detail.id;
        }

    }

    handleValueSelectedOnVendor2(event) {
        if (this.temp2 == false) {
            console.log('OUTPUT v2: ', event.detail.id);
            this.jsonDatas['vendor2'] = event.detail.id;
        }

    }

    handleValueSelectedOnProperty(event) {
        console.log('OUTPUT property: ', event.detail.id);
        this.jsonDatas['property'] = event.detail.id;

        console.log('OUTPUT : ', JSON.stringify(this.jsonDatas));
    }

    handleValueSelectedOnAccount(event) {
        console.log('OUTPUT property: ', event.detail.id);
        this.jsonDatas['houseBuilder'] = event.detail.id;
    }

    handleContactChange(event) {
        name = event.target.name;
        if (name == 'firstname') {
            this.jsonDatas['firstname'] = event.target.value;
        }
        if (name == 'lastname') {
            this.jsonDatas['lastname'] = event.target.value;
            console.log('OUTPUT : lastname ', event.target.value);
            console.log('OUTPUT : ', this.jsonDatas.lastname);
        }
        if (name == 'email') {
            this.jsonDatas['email'] = event.target.value;
        }
        if (name == 'mobilePhone') {
            this.jsonDatas['mobilePhone'] = event.target.value;
        }
         if (name == 'firstname1') {
            this.jsonDatas['firstname1'] = event.target.value;
        }
        if (name == 'lastname1') {
            this.jsonDatas['lastname1'] = event.target.value;
            console.log('OUTPUT : lastname ', event.target.value);
            console.log('OUTPUT : ', this.jsonDatas.lastname);
        }
        if (name == 'email1') {
            this.jsonDatas['email1'] = event.target.value;
        }
        if (name == 'mobilePhone1') {
            this.jsonDatas['mobilePhone1'] = event.target.value;
        }
    }

 handleValueSelectedOnAccounts(event) {
        const street = this.template.querySelector('[data-field-name="Address__Street__s"]');
        street.value = JSON.parse(event.detail.dta).line_1 + ', '+JSON.parse(event.detail.dta).line_2;
        const city = this.template.querySelector('[data-field-name="Address__City__s"]');
        city.value = JSON.parse(event.detail.dta).district
        const pcode = this.template.querySelector('[data-field-name="Address__PostalCode__s"]');
        pcode.value = JSON.parse(event.detail.dta).postcode;
        const country = this.template.querySelector('[data-field-name="Address__CountryCode__s"]');
        country.value = JSON.parse(event.detail.dta).country;

        this.jsonDatas['street'] = street.value ;
        this.jsonDatas['city'] = city.value ;
        this.jsonDatas['pcode'] = pcode.value ;
        this.jsonDatas['country'] = country.value ;
        console.log('OUTPUT : -----',JSON.stringify(this.jsonDatas));
       
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
    }

    handleClickCancel(event){

    }
    handleSaveClick(event) {
        if(this.jsonDatas.lastname =='' || this.lastname1 == '' ){
            const evt = new ShowToastEvent({
                            title: 'Warning..!',
                            message: 'Fill Last Name.',
                            variant: 'warning',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
                        return
        }
        if(this.jsonDatas.street =='' || this.jsonDatas.city == ''|| this.jsonDatas.pcode == '' ){
            const evt = new ShowToastEvent({
                            title: 'Warning..!',
                            message: 'Fill Property Details.',
                            variant: 'warning',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
                        return
        }
         if(this.doar == true ){
            const evt = new ShowToastEvent({
                            title: 'Warning..!',
                            message: 'Date Of Application Received will not be future Date',
                            variant: 'warning',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);
                        return
        }
        saveApplication({ jsonData: this.jsonDatas })
            .then(result => {
                setTimeout(() => {
                    console.log('record successfully save... ');
                     var res = result;
                    if (res.hasOwnProperty('y')) {
                        console.log('record succefully save... ', result);
                        const evt = new ShowToastEvent({
                            title: 'Success..!',
                            message: 'The new application has been created successfully.',
                            variant: 'success',
                            mode: 'Pester '
                        });
                        this.dispatchEvent(evt);

                        this[NavigationMixin.Navigate]({
                            type: 'standard__recordPage',
                            attributes: {
                                objectApiName:'Opportunity',
                                recordId: res.y,
                                actionName: 'view'
                            }
                    });
                    }
                    if (res.hasOwnProperty('n')) {
                         const evt = new ShowToastEvent({
                            title: 'Error..!',
                            message: 'Something went wrong while creating Opportunity',
                            variant: 'error',
                            mode: 'Pester'
                        });
                        this.dispatchEvent(evt);
                        location.reload();
                    }
                    //location.reload();
                }, 0);
            });
    }
}