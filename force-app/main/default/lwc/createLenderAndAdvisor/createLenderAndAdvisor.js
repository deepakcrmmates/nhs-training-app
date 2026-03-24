import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { CurrentPageReference } from 'lightning/navigation';
import createContact from '@salesforce/apex/OfferController.createContact';
import displayApplicationData from '@salesforce/apex/OfferController.displayApplicationData';
import createOffer from '@salesforce/apex/OfferController.createOffer';
import { NavigationMixin } from 'lightning/navigation';
import uploadFiles from '@salesforce/apex/OfferController.uploadFiles';
import createAccount from '@salesforce/apex/OfferController.createAccount';
//import saveLenderAndAdvisor from '@salesforce/apex/frontFacingAgentController.saveLenderAndAdvisor';

export default class CreateLenderAndAdvisor extends LightningElement {
    }