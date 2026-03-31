import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getAccountDetails from '@salesforce/apex/customLookupController.getAccountDetails';
import saveDesktopValuation from '@salesforce/apex/customLookupController.saveDesktopValuation';
import generatePDF from '@salesforce/apex/PdfGeneratorController.generatePDF';
import getHourlyAvailability from '@salesforce/apex/VendorAvailabilityService.getHourlyAvailability';

// Field Imports
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import HOUSE_BUILDER_FIELD from '@salesforce/schema/Opportunity.House_Builder__c';
import HOUSE_BUILDER_NAME_FIELD from '@salesforce/schema/Opportunity.House_Builder__r.Name';
import PROPERTY_ADDRESS_FIELD from '@salesforce/schema/Opportunity.Property_Address__c';
import VENDOR_1_FIELD from '@salesforce/schema/Opportunity.Vendor_1__c';
import VENDOR_1_NAME_FIELD from '@salesforce/schema/Opportunity.Vendor_1__r.Name';
import VENDOR_2_FIELD from '@salesforce/schema/Opportunity.Vendor_2__c';
import VENDOR_2_NAME_FIELD from '@salesforce/schema/Opportunity.Vendor_2__r.Name';
import APP_RECEIVED_DATE_FIELD from '@salesforce/schema/Opportunity.Date_of_Application_Received__c';
import NOTES_FIELD from '@salesforce/schema/Opportunity.Notes__c';
import DEVELOPMENT_FIELD from '@salesforce/schema/Opportunity.Development__c';
import PLOT_FIELD from '@salesforce/schema/Opportunity.Plot__c';
import VENDOR_MOBILE_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Mobile__c';
import VENDOR_EXPECTATIONS_FIELD from '@salesforce/schema/Opportunity.Client_Expectations__c';
import VENDOR_PHONE_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Phone__c';
import ETA_COMP_END_FIELD from '@salesforce/schema/Opportunity.ETA_Comp_End__c';
import VENDOR_EMAIL_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Email__c';
import SCHEME_FIELD from '@salesforce/schema/Opportunity.Scheme__c';
import STAGE_FIELD from '@salesforce/schema/Opportunity.StageName';
import NHS_PROCESS_FIELD from '@salesforce/schema/Opportunity.NHS_Process__c';

// Agent 1
import AGENT_1_FIELD from '@salesforce/schema/Opportunity.Agent_1__c';
import AGENT_1_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_1__r.Name';
import AGENT_1_PHONE_FIELD from '@salesforce/schema/Opportunity.Agent_1_Phone__c';
import AGENT_1_EMAIL_FIELD from '@salesforce/schema/Opportunity.Agent_1_Email__c';
import AGENT_1_APPT_FIELD from '@salesforce/schema/Opportunity.Agent_1_Appointment__c';
import AGENT_1_EMAILED_FIELD from '@salesforce/schema/Opportunity.Agent_1_Emailed__c';
import AGENT_1_VERBALLY_CONFIRMED_FIELD from '@salesforce/schema/Opportunity.Agent_1_Verbally_Confirmed__c';
import AGENT_1_INITIAL_PRICE_FIELD from '@salesforce/schema/Opportunity.Agent_1_Initial_Asking_Price__c';
import AGENT_1_TARGET_SALE_FIELD from '@salesforce/schema/Opportunity.Agent_1_Target_Sale__c';
import AGENT_1_BOTTOM_LINE_FIELD from '@salesforce/schema/Opportunity.Agent_1_Bottom_Line__c';

// Agent 2
import AGENT_2_FIELD from '@salesforce/schema/Opportunity.Agent_2__c';
import AGENT_2_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_2__r.Name';
import AGENT_2_PHONE_FIELD from '@salesforce/schema/Opportunity.Agent_2_Phone__c';
import AGENT_2_EMAIL_FIELD from '@salesforce/schema/Opportunity.Agent_2_Email__c';
import AGENT_2_APPT_FIELD from '@salesforce/schema/Opportunity.Agent_2_Appointment__c';
import AGENT_2_EMAILED_FIELD from '@salesforce/schema/Opportunity.Agent_2_Agent_Emailed__c';
import AGENT_2_VERBALLY_CONFIRMED_FIELD from '@salesforce/schema/Opportunity.Agent_2_Verbally_Confirmed__c';
import AGENT_2_INITIAL_PRICE_FIELD from '@salesforce/schema/Opportunity.Agent_2_Initial_Asking_Price__c';
import AGENT_2_TARGET_SALE_FIELD from '@salesforce/schema/Opportunity.Agent_2_Target_Sale__c';
import AGENT_2_BOTTOM_LINE_FIELD from '@salesforce/schema/Opportunity.Agent_2_Bottom_Line__c';

// Agent 3
import AGENT_3_FIELD from '@salesforce/schema/Opportunity.Agent_3__c';
import AGENT_3_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_3__r.Name';
import AGENT_3_PHONE_FIELD from '@salesforce/schema/Opportunity.Agent_3_Phone__c';
import AGENT_3_EMAIL_FIELD from '@salesforce/schema/Opportunity.Agent_3_Email__c';
import AGENT_3_APPT_FIELD from '@salesforce/schema/Opportunity.Agent_3_Appointment__c';
import AGENT_3_EMAILED_FIELD from '@salesforce/schema/Opportunity.Agent_3_Agent_Emailed__c';
import AGENT_3_VERBALLY_CONFIRMED_FIELD from '@salesforce/schema/Opportunity.Agent_3_Verbally_Confirmed__c';
import AGENT_3_INITIAL_PRICE_FIELD from '@salesforce/schema/Opportunity.Agent_3_Initial_Asking_Price__c';
import AGENT_3_TARGET_SALE_FIELD from '@salesforce/schema/Opportunity.Agent_3_Target_Sale__c';
import AGENT_3_BOTTOM_LINE_FIELD from '@salesforce/schema/Opportunity.Agent_3_Bottom_Line__c';

// Desktop Valuation
import AGENT_1_DESKTOP_VAL_FIELD from '@salesforce/schema/Opportunity.Agent_1_Desktop_Valuation__c';
import AGENT_2_DESKTOP_VAL_FIELD from '@salesforce/schema/Opportunity.Agent_2_Desktop_Valuation__c';
import AGENT_3_DESKTOP_VAL_FIELD from '@salesforce/schema/Opportunity.Agent_3_Desktop_Valuation__c';

// NHS Recommended
import RECOMMENDED_MARKET_FIELD from '@salesforce/schema/Opportunity.Current_Asking_Price__c';
import RECOMMENDED_TARGET_FIELD from '@salesforce/schema/Opportunity.Target_Sale__c';
import RECOMMENDED_FORCED_FIELD from '@salesforce/schema/Opportunity.Forced_Sale__c';

const FIELDS = [
    NAME_FIELD, HOUSE_BUILDER_FIELD, HOUSE_BUILDER_NAME_FIELD, PROPERTY_ADDRESS_FIELD, VENDOR_1_FIELD, VENDOR_1_NAME_FIELD,
    VENDOR_2_FIELD, VENDOR_2_NAME_FIELD, APP_RECEIVED_DATE_FIELD, NOTES_FIELD, DEVELOPMENT_FIELD, PLOT_FIELD,
    VENDOR_MOBILE_FIELD, VENDOR_EXPECTATIONS_FIELD, VENDOR_PHONE_FIELD, ETA_COMP_END_FIELD, VENDOR_EMAIL_FIELD, SCHEME_FIELD, STAGE_FIELD, NHS_PROCESS_FIELD,
    AGENT_1_FIELD, AGENT_1_NAME_FIELD, AGENT_1_PHONE_FIELD, AGENT_1_EMAIL_FIELD, AGENT_1_APPT_FIELD, AGENT_1_EMAILED_FIELD, AGENT_1_VERBALLY_CONFIRMED_FIELD, AGENT_1_INITIAL_PRICE_FIELD, AGENT_1_TARGET_SALE_FIELD, AGENT_1_BOTTOM_LINE_FIELD,
    AGENT_2_FIELD, AGENT_2_NAME_FIELD, AGENT_2_PHONE_FIELD, AGENT_2_EMAIL_FIELD, AGENT_2_APPT_FIELD, AGENT_2_EMAILED_FIELD, AGENT_2_VERBALLY_CONFIRMED_FIELD, AGENT_2_INITIAL_PRICE_FIELD, AGENT_2_TARGET_SALE_FIELD, AGENT_2_BOTTOM_LINE_FIELD,
    AGENT_3_FIELD, AGENT_3_NAME_FIELD, AGENT_3_PHONE_FIELD, AGENT_3_EMAIL_FIELD, AGENT_3_APPT_FIELD, AGENT_3_EMAILED_FIELD, AGENT_3_VERBALLY_CONFIRMED_FIELD, AGENT_3_INITIAL_PRICE_FIELD, AGENT_3_TARGET_SALE_FIELD, AGENT_3_BOTTOM_LINE_FIELD,
    RECOMMENDED_MARKET_FIELD, RECOMMENDED_TARGET_FIELD, RECOMMENDED_FORCED_FIELD,
    AGENT_1_DESKTOP_VAL_FIELD, AGENT_2_DESKTOP_VAL_FIELD, AGENT_3_DESKTOP_VAL_FIELD
];

export default class NhsOpportunityDetailedView extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;

    @track formData = {};
    @track agentAppts = {
        agent1: { date: '', time: '' },
        agent2: { date: '', time: '' },
        agent3: { date: '', time: '' }
    };

    isLoading = true;
    @track showPdfModal = false;
    @track pdfStatus = 'Generating PDF...';

    get schemeOptions() {
        return [
            { label: 'Part Exchange', value: 'Part Exchange' },
            { label: 'Assisted Sale', value: 'Assisted Sale' },
            { label: 'New Home', value: 'New Home' }
        ];
    }

    get nhsProcessOptions() {
        return [
            { label: 'Application', value: 'Application' },
            { label: 'Vendor Availability', value: 'Vendor Availability' },
            { label: 'Book Agents', value: 'Agents Booked' },
            { label: 'Figures to Chase', value: 'Figures to chased' },
            { label: 'Valuations Ready', value: 'Valuations Ready' },
            { label: 'Figures Returned', value: 'Figures returned' },
            { label: 'Archived', value: 'Archived' }
        ];
    }

    async handleStageChange(event) {
        const newStage = event.detail.value;
        const oldStage = this.formData.nhsProcess;

        // Validate: moving to Agents Booked requires at least 1 future vendor slot
        if (newStage === 'Agents Booked' && oldStage === 'Vendor Availability') {
            try {
                const records = await getHourlyAvailability({ opportunityId: this.recordId });
                // Filter to tomorrow onwards only
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tmrStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;

                const futureSlots = (records || []).filter(r => r.Date__c && r.Date__c >= tmrStr);
                if (futureSlots.length === 0) {
                    this.formData = { ...this.formData, nhsProcess: oldStage };
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Cannot Move',
                        message: 'At least 1 vendor availability slot (from tomorrow onwards) is required before moving to Book Agents.',
                        variant: 'error'
                    }));
                    return;
                }
            } catch (err) {
                console.error('Error checking availability:', err);
            }
        }

        this.formData = { ...this.formData, nhsProcess: newStage };
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[NHS_PROCESS_FIELD.fieldApiName] = newStage;
        try {
            await updateRecord({ fields });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Stage Updated',
                message: `NHS Process set to "${newStage}"`,
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || error.message || 'Failed to update stage.',
                variant: 'error'
            }));
        }
    }

    get yesNoOptions() {
        return [
            { label: 'No', value: 'No' },
            { label: 'Yes', value: 'Yes' }
        ];
    }

    get stages() {
        // Display labels vs NHS_Process__c picklist values
        const mainStages = [
            { label: 'New Application', value: 'Application' },
            { label: 'Vendor Availability', value: 'Vendor Availability' },
            { label: 'Book Agents', value: 'Agents Booked' },
            { label: 'Figures to Chase', value: 'Figures to chased' },
            { label: 'Valuations Ready', value: 'Valuations Ready' },
            { label: 'Figures Returned', value: 'Figures returned' }
        ];
        const current = this.formData.nhsProcess || '';
        const currentIdx = mainStages.findIndex(s => s.value === current);

        return mainStages.map((stage, idx) => {
            let status = 'upcoming';
            if (idx === 0 && currentIdx > 0) {
                // New Application completed once we move past it
                status = 'completed';
            } else if (currentIdx >= 0 && idx < currentIdx) {
                status = 'completed';
            } else if (idx === currentIdx) {
                status = 'active';
            }
            return {
                label: stage.label,
                status,
                isCompleted: status === 'completed',
                isActive: status === 'active',
                cssClass: `stage-step ${status}`
            };
        });
    }

    get statusTagLabel() {
        return this.computeStatus().label;
    }

    get statusTagClass() {
        return `status-tag ${this.computeStatus().color}`;
    }

    computeStatus() {
        const process = this.formData.nhsProcess || '';

        // Cancelled / Archived
        if (process === 'Archived') {
            return { label: 'Cancelled', color: 'tag-red' };
        }

        // Check if all 3 agents have appointments set
        const a1 = this.agentAppts.agent1.date;
        const a2 = this.agentAppts.agent2.date;
        const a3 = this.agentAppts.agent3.date;
        const allBooked = a1 && a2 && a3;

        if (allBooked) {
            // Check if all appointments have passed
            const now = new Date();
            const appts = [this.agentAppts.agent1, this.agentAppts.agent2, this.agentAppts.agent3];
            const allPassed = appts.every(a => {
                const dt = new Date(`${a.date}T${a.time || '23:59'}:00`);
                return dt < now;
            });
            if (allPassed) {
                return { label: 'Completed', color: 'tag-blue' };
            }
            return { label: 'Booked', color: 'tag-green' };
        }

        // Availability In — vendor availability has been added
        if (['Vendor Availability', 'Agents Booked', 'Figures to chased', 'Valuations Ready', 'Figures returned'].includes(process)) {
            if (process === 'Agents Booked' || process === 'Figures to chased' || process === 'Valuations Ready' || process === 'Figures returned') {
                return { label: 'Availability In', color: 'tag-teal' };
            }
            return { label: 'Availability In', color: 'tag-teal' };
        }

        // Default — New application
        return { label: 'New', color: 'tag-green' };
    }

    get isArchived() {
        return this.formData.nhsProcess === 'Archived';
    }

    get showVendorAvailability() {
        return this.formData.nhsProcess === 'Vendor Availability';
    }

    get showAgentBooking() {
        const stagesWithBooking = [
            'Agents Booked', 'Figures to chased', 'Valuations Ready', 'Figures returned'
        ];
        return stagesWithBooking.includes(this.formData.nhsProcess);
    }

    get archivedClass() {
        return this.isArchived ? 'archived-badge active' : 'archived-badge';
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            this.isLoading = false;
            this.mapDataToForm(data);
        } else if (error) {
            this.isLoading = false;
            console.error('Error loading record', JSON.stringify(error));
        }
    }

    // Return null for zero/empty currency so placeholder "0.00" shows instead of bare "0"
    currencyVal(v) {
        return (v !== null && v !== undefined && v !== 0) ? v : null;
    }

    mapDataToForm(data) {
        const fields = data.fields;
        this.formData = {
            houseBuilder: fields.House_Builder__c?.value,
            houseBuilderName: fields.House_Builder__r?.value?.fields?.Name?.value || '',
            propertyAddress: fields.Property_Address__c?.value || '',
            vendor1: fields.Vendor_1__c?.value,
            vendor1Name: fields.Vendor_1__r?.value?.fields?.Name?.value || '',
            vendor2: fields.Vendor_2__c?.value,
            vendor2Name: fields.Vendor_2__r?.value?.fields?.Name?.value || '',
            dateReceived: fields.Date_of_Application_Received__c?.value || '',
            notes: fields.Notes__c?.value || '',
            development: fields.Development__c?.value || '',
            plot: fields.Plot__c?.value || '',
            mobile: fields.Vendor_1_Mobile__c?.value || '',
            expectations: this.currencyVal(fields.Client_Expectations__c?.value),
            landline: fields.Vendor_1_Phone__c?.value || '',
            alcd: fields.ETA_Comp_End__c?.value ? fields.ETA_Comp_End__c.value.substring(0, 7) : '',
            email: fields.Vendor_1_Email__c?.value || '',
            scheme: fields.Scheme__c?.value || '',
            stageName: fields.StageName?.value || '',
            nhsProcess: fields.NHS_Process__c?.value || '',
            
            // Agent 1
            agent1: fields.Agent_1__c?.value,
            agent1Name: fields.Agent_1__r?.value?.fields?.Name?.value || '',
            agent1Phone: fields.Agent_1_Phone__c?.value || '',
            agent1Email: fields.Agent_1_Email__c?.value || '',
            agent1Emailed: fields.Agent_1_Emailed__c?.value ? 'Yes' : 'No',
            agent1Confirmed: fields.Agent_1_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent1Initial: this.currencyVal(fields.Agent_1_Initial_Asking_Price__c?.value),
            agent1Target: this.currencyVal(fields.Agent_1_Target_Sale__c?.value),
            agent1Bottom: this.currencyVal(fields.Agent_1_Bottom_Line__c?.value),

            // Agent 2
            agent2: fields.Agent_2__c?.value,
            agent2Name: fields.Agent_2__r?.value?.fields?.Name?.value || '',
            agent2Phone: fields.Agent_2_Phone__c?.value || '',
            agent2Email: fields.Agent_2_Email__c?.value || '',
            agent2Emailed: fields.Agent_2_Agent_Emailed__c?.value ? 'Yes' : 'No',
            agent2Confirmed: fields.Agent_2_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent2Initial: this.currencyVal(fields.Agent_2_Initial_Asking_Price__c?.value),
            agent2Target: this.currencyVal(fields.Agent_2_Target_Sale__c?.value),
            agent2Bottom: this.currencyVal(fields.Agent_2_Bottom_Line__c?.value),

            // Agent 3
            agent3: fields.Agent_3__c?.value,
            agent3Name: fields.Agent_3__r?.value?.fields?.Name?.value || '',
            agent3Phone: fields.Agent_3_Phone__c?.value || '',
            agent3Email: fields.Agent_3_Email__c?.value || '',
            agent3Emailed: fields.Agent_3_Agent_Emailed__c?.value ? 'Yes' : 'No',
            agent3Confirmed: fields.Agent_3_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent3Initial: this.currencyVal(fields.Agent_3_Initial_Asking_Price__c?.value),
            agent3Target: this.currencyVal(fields.Agent_3_Target_Sale__c?.value),
            agent3Bottom: this.currencyVal(fields.Agent_3_Bottom_Line__c?.value),

            // NHS Recommended
            market: this.currencyVal(fields.Current_Asking_Price__c?.value),
            target: this.currencyVal(fields.Target_Sale__c?.value),
            forced: this.currencyVal(fields.Forced_Sale__c?.value),

            // Desktop Valuation flags (preserve local state if fields don't exist in org)
            agent1DesktopVal: fields.Agent_1_Desktop_Valuation__c
                ? (fields.Agent_1_Desktop_Valuation__c.value || false)
                : (this.formData.agent1DesktopVal || false),
            agent2DesktopVal: fields.Agent_2_Desktop_Valuation__c
                ? (fields.Agent_2_Desktop_Valuation__c.value || false)
                : (this.formData.agent2DesktopVal || false),
            agent3DesktopVal: fields.Agent_3_Desktop_Valuation__c
                ? (fields.Agent_3_Desktop_Valuation__c.value || false)
                : (this.formData.agent3DesktopVal || false)
        };

        // Split Appointments
        this.splitAppointment('agent1', fields.Agent_1_Appointment__c?.value);
        this.splitAppointment('agent2', fields.Agent_2_Appointment__c?.value);
        this.splitAppointment('agent3', fields.Agent_3_Appointment__c?.value);

        // Check if Desktop Valuation fields exist in org
        this._hasDesktopValFields = !!fields.Agent_1_Desktop_Valuation__c;
    }

    get alcdDisplay() {
        const val = this.formData.alcd;
        if (!val) return '';
        try {
            const date = new Date(val.length === 7 ? `${val}-01` : val);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
            }
        } catch (e) {
            // Fall through to raw value
        }
        return val;
    }

    splitAppointment(agentKey, dtime) {
        if (dtime) {
            const dt = new Date(dtime);
            this.agentAppts[agentKey] = {
                date: dt.toISOString().split('T')[0],
                time: dt.toTimeString().split(' ')[0].substring(0, 5)
            };
        }
    }

    handleInputChange(event) {
        // Handle both standard inputs and lightning components
        const field = event.target.dataset.field || event.target.name;
        const value = event.target.value !== undefined ? event.target.value : event.detail.value;
        // Update the reactive object
        this.formData = { ...this.formData, [field]: value };
    }

    handleDesktopValToggle(event) {
        const agent = event.target.dataset.agent;
        const field = agent + 'DesktopVal';
        this.formData = { ...this.formData, [field]: event.target.checked };
    }

    handleApptChange(event) {
        const agent = event.target.dataset.agent;
        const type = event.target.dataset.type;
        this.agentAppts = {
            ...this.agentAppts,
            [agent]: { ...this.agentAppts[agent], [type]: event.target.value }
        };
    }

    handleLookupChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.id || event.detail.recordId || event.detail.value;
        this.formData = { ...this.formData, [field]: value };

        // Auto-populate phone/email for Agent 2 and Agent 3
        if ((field === 'agent2' || field === 'agent3') && value) {
            this.fetchAgentDetails(field, value);
        }
    }

    fetchAgentDetails(agentField, accountId) {
        getAccountDetails({ accountId })
            .then(result => {
                const phoneField = agentField + 'Phone';
                const emailField = agentField + 'Email';
                this.formData = {
                    ...this.formData,
                    [phoneField]: result.phone || '',
                    [emailField]: result.email || ''
                };
            })
            .catch(error => {
                console.error('Error fetching agent details:', error);
            });
    }

    handleGetDirection() {
        if (this.formData.propertyAddress) {
            const encodedAddress = encodeURIComponent(this.formData.propertyAddress);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            window.open(url, '_blank');
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No Address',
                    message: 'Please enter a property address first.',
                    variant: 'warning'
                })
            );
        }
    }

    async handleSave() {
        this.isLoading = true;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[HOUSE_BUILDER_FIELD.fieldApiName] = this.formData.houseBuilder;
        // Property_Address__c is a formula field — not writeable
        fields[VENDOR_1_FIELD.fieldApiName] = this.formData.vendor1;
        fields[VENDOR_2_FIELD.fieldApiName] = this.formData.vendor2;
        fields[APP_RECEIVED_DATE_FIELD.fieldApiName] = this.formData.dateReceived;
        fields[NOTES_FIELD.fieldApiName] = this.formData.notes;
        fields[DEVELOPMENT_FIELD.fieldApiName] = this.formData.development;
        fields[PLOT_FIELD.fieldApiName] = this.formData.plot;
        // Vendor Mobile, Phone, Email are formula fields — not writeable
        fields[VENDOR_EXPECTATIONS_FIELD.fieldApiName] = this.formData.expectations;
        fields[ETA_COMP_END_FIELD.fieldApiName] = this.formData.alcd ? `${this.formData.alcd}-01` : null;
        fields[SCHEME_FIELD.fieldApiName] = this.formData.scheme;

        // Appointments
        fields[AGENT_1_APPT_FIELD.fieldApiName] = this.combineDateTime(this.agentAppts.agent1);
        fields[AGENT_2_APPT_FIELD.fieldApiName] = this.combineDateTime(this.agentAppts.agent2);
        fields[AGENT_3_APPT_FIELD.fieldApiName] = this.combineDateTime(this.agentAppts.agent3);

        // Agent 1 (Phone/Email are formula fields — not writeable)
        fields[AGENT_1_FIELD.fieldApiName] = this.formData.agent1;
        fields[AGENT_1_EMAILED_FIELD.fieldApiName] = this.formData.agent1Emailed === 'Yes';
        fields[AGENT_1_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent1Confirmed === 'Yes';
        fields[AGENT_1_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent1Initial;
        fields[AGENT_1_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent1Target;
        fields[AGENT_1_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent1Bottom;

        // Agent 2
        fields[AGENT_2_FIELD.fieldApiName] = this.formData.agent2;
        fields[AGENT_2_EMAILED_FIELD.fieldApiName] = this.formData.agent2Emailed === 'Yes';
        fields[AGENT_2_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent2Confirmed === 'Yes';
        fields[AGENT_2_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent2Initial;
        fields[AGENT_2_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent2Target;
        fields[AGENT_2_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent2Bottom;

        // Agent 3
        fields[AGENT_3_FIELD.fieldApiName] = this.formData.agent3;
        fields[AGENT_3_EMAILED_FIELD.fieldApiName] = this.formData.agent3Emailed === 'Yes';
        fields[AGENT_3_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent3Confirmed === 'Yes';
        fields[AGENT_3_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent3Initial;
        fields[AGENT_3_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent3Target;
        fields[AGENT_3_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent3Bottom;

        // NHS Recommended
        fields[RECOMMENDED_MARKET_FIELD.fieldApiName] = this.formData.market;
        fields[RECOMMENDED_TARGET_FIELD.fieldApiName] = this.formData.target;
        fields[RECOMMENDED_FORCED_FIELD.fieldApiName] = this.formData.forced;

        const recordInput = { fields };

        try {
            await updateRecord(recordInput);

            // Save Desktop Valuation via Apex (UI API doesn't support these fields)
            await saveDesktopValuation({
                oppId: this.recordId,
                agent1DV: this.formData.agent1DesktopVal || false,
                agent2DV: this.formData.agent2DesktopVal || false,
                agent3DV: this.formData.agent3DesktopVal || false
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Application updated successfully',
                    variant: 'success'
                })
            );
        } catch (error) {
            let msg = 'An unexpected error occurred';
            if (error.body) {
                if (error.body.output?.errors?.length) {
                    msg = error.body.output.errors.map(e => e.message).join('; ');
                } else if (error.body.output?.fieldErrors) {
                    const fe = error.body.output.fieldErrors;
                    msg = Object.keys(fe).map(f => `${f}: ${fe[f].map(e => e.message).join(', ')}`).join('; ');
                } else {
                    msg = error.body.message || msg;
                }
            } else if (error.message) {
                msg = error.message;
            }
            console.error('Save error:', JSON.stringify(error));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating record',
                    message: msg,
                    variant: 'error'
                })
            );
        } finally {
            this.isLoading = false;
        }
    }

    async handleGeneratePdf() {
        this.showPdfModal = true;
        this.pdfStatus = 'Generating PDF...';

        try {
            const downloadUrl = await generatePDF({ recordId: this.recordId });

            if (downloadUrl) {
                this.pdfStatus = 'Downloading...';
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { url: downloadUrl }
                });

                // eslint-disable-next-line @lwc/lwc/no-async-operation
                setTimeout(() => {
                    this.showPdfModal = false;
                }, 1500);
            } else {
                this.showPdfModal = false;
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error', message: 'PDF generation returned no file.', variant: 'error'
                }));
            }
        } catch (error) {
            this.showPdfModal = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'PDF Error',
                message: error.body?.message || error.message || 'Failed to generate PDF.',
                variant: 'error'
            }));
        }
    }

    combineDateTime(appt) {
        if (appt.date && appt.time) {
            // Build a local Date object so Salesforce receives the correct local time
            const [year, month, day] = appt.date.split('-').map(Number);
            const [hours, minutes] = appt.time.split(':').map(Number);
            const dt = new Date(year, month - 1, day, hours, minutes, 0);
            return dt.toISOString();
        }
        return null;
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }
}
