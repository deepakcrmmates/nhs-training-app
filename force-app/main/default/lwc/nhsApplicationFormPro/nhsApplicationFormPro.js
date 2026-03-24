import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccountRecordTypeId from '@salesforce/apex/NHS_FormSupport.getAccountRecordTypeId';

export default class NhsApplicationFormPro extends LightningElement {
  // ----- UI State -----
  @track isLoading = true;

  // Optional: logo binding if you have one
  accountLogoUrl;

  // ----- Form Model -----
  @track form = {
    houseBuilderId: null,
    developmentName: '',
    siteAddress: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    currentAddress: '',
    plotType: '',
    bedrooms: null,
    askingPrice: null,
    features: { garden: false, parking: false, warranty: false },
    tenure: null,
    budget: null,
    deposit: null,
    aip: null,
    incentives: '',
    agentName: '',
    agentPhone: '',
    valuationNotes: '',
    acceptTerms: false,
    acceptPrivacy: false
  };

  tenureOptions = [
    { label: 'Freehold', value: 'Freehold' },
    { label: 'Leasehold', value: 'Leasehold' },
    { label: 'Share of Freehold', value: 'Share of Freehold' }
  ];

  yesNoOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'In Progress', value: 'In Progress' }
  ];

  // ----- Housebuilder Record Type Filtering for lightning-record-picker -----
  housebuilderRecordTypeId;
  housebuilderDisplayFields = ['Name', 'BillingCity', 'Phone'];

  get housebuilderMatchingInfo() {
    const base = {
      primaryField: { fieldApiName: 'Name' },
      additionalFields: this.housebuilderDisplayFields.map((f) => ({ fieldApiName: f }))
    };
    if (!this.housebuilderRecordTypeId) return base;

    return {
      ...base,
      filter: {
        conditions: [
          {
            fieldApiName: 'RecordTypeId',
            operator: 'eq',
            value: this.housebuilderRecordTypeId
          }
        ],
        filterLogic: '1'
      }
    };
  }

  // Readable label for summary
  get housebuilderName() {
    const rp = this.template?.querySelector('lightning-record-picker');
    // @ts-ignore runtime property in some releases
    return rp && rp.valueLabel ? rp.valueLabel : (this.form.houseBuilderId || '');
  }

  // IMPORTANT: pass your Record Type *DeveloperName* here → "House_Builder"
  @wire(getAccountRecordTypeId, { developerNameOrName: 'House_Builder' })
  wiredRt({ data, error }) {
    if (data) {
      this.housebuilderRecordTypeId = data;
      this.isLoading = false;
    } else if (error) {
      // Still render without filter so users aren’t blocked
      // eslint-disable-next-line no-console
      console.error('RecordType describe failed', error);
      this.isLoading = false;
    }
  }

  // Safety net: never get stuck on spinner
  connectedCallback() {
    Promise.resolve().then(() => {
      if (this.isLoading) this.isLoading = false;
    });
  }

  // ----- Handlers -----
  handleChange = (evt) => {
    const field = evt.currentTarget?.dataset?.field;
    if (!field) return;
    const value = evt.target.type === 'checkbox' ? evt.target.checked : evt.target.value;
    this.form = { ...this.form, [field]: value };
  };

  handleFeatureChange = (evt) => {
    const field = evt.currentTarget?.dataset?.field;
    if (!field) return;
    const checked = evt.target.checked;
    this.form = { ...this.form, features: { ...this.form.features, [field]: checked } };
  };

  // lightning-record-picker selection
  handleHousebuilderSelect = (evt) => {
    const sel = evt?.detail;
    this.form = { ...this.form, houseBuilderId: sel?.value || null };
  };

  // ----- Actions -----
  handleSaveDraft = () => {
    // Hook to your real Draft save
    this._toast('Draft saved', 'success');
  };

  handleSubmit = () => {
    const missing = [];
    if (!this.form.houseBuilderId) missing.push('House Builder');
    if (!this.form.firstName) missing.push('First Name');
    if (!this.form.lastName) missing.push('Last Name');
    if (!this.form.email) missing.push('Email');
    if (!this.form.acceptTerms) missing.push('Terms Acceptance');

    if (missing.length) {
      this._toast(`Please complete: ${missing.join(', ')}`, 'error');
      return;
    }

    // Replace with real submit logic
    this._toast('Application submitted', 'success');
  };

  // ----- Utilities -----
  _toast(message, variant = 'info') {
    this.dispatchEvent(
      new ShowToastEvent({
        title: variant === 'error' ? 'Error' : variant === 'success' ? 'Success' : 'Notice',
        message,
        variant
      })
    );
  }
}