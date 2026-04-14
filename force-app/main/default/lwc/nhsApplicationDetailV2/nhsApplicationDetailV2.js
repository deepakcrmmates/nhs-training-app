import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getAccountDetails from '@salesforce/apex/customLookupController.getAccountDetails';
import saveDesktopValuation from '@salesforce/apex/customLookupController.saveDesktopValuation';
import updateVendorContact from '@salesforce/apex/customLookupController.updateVendorContact';
import generatePDF from '@salesforce/apex/PdfGeneratorController.generatePDF';
import findNearestAgents from '@salesforce/apex/AgentFinderController.findNearestAgents';
import assignAgent from '@salesforce/apex/AgentFinderController.assignAgent';
import getNotes from '@salesforce/apex/VendorNoteController.getNotes';
import saveNote from '@salesforce/apex/VendorNoteController.saveNote';
import getHourlyAvailability from '@salesforce/apex/VendorAvailabilityService.getHourlyAvailability';
import processVendorAvailability from '@salesforce/apex/VendorAvailabilityService.processVendorAvailability';

// ── Field Imports ──────────────────────────────────────────────────────────────
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import HOUSE_BUILDER_FIELD from '@salesforce/schema/Opportunity.House_Builder__c';
import HOUSE_BUILDER_NAME_FIELD from '@salesforce/schema/Opportunity.House_Builder__r.Name';
import PROPERTY_ADDRESS_FIELD from '@salesforce/schema/Opportunity.Property_Address__c';
import VENDOR_1_FIELD from '@salesforce/schema/Opportunity.Vendor_1__c';
import VENDOR_1_NAME_FIELD from '@salesforce/schema/Opportunity.Vendor_1__r.Name';
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

// ── Fields Array ───────────────────────────────────────────────────────────────
const FIELDS = [
    NAME_FIELD, HOUSE_BUILDER_FIELD, HOUSE_BUILDER_NAME_FIELD, PROPERTY_ADDRESS_FIELD, VENDOR_1_FIELD, VENDOR_1_NAME_FIELD,
    APP_RECEIVED_DATE_FIELD, NOTES_FIELD, DEVELOPMENT_FIELD, PLOT_FIELD,
    VENDOR_MOBILE_FIELD, VENDOR_EXPECTATIONS_FIELD, VENDOR_PHONE_FIELD, ETA_COMP_END_FIELD, VENDOR_EMAIL_FIELD, SCHEME_FIELD, STAGE_FIELD, NHS_PROCESS_FIELD,
    AGENT_1_FIELD, AGENT_1_NAME_FIELD, AGENT_1_PHONE_FIELD, AGENT_1_EMAIL_FIELD, AGENT_1_APPT_FIELD, AGENT_1_EMAILED_FIELD, AGENT_1_VERBALLY_CONFIRMED_FIELD, AGENT_1_INITIAL_PRICE_FIELD, AGENT_1_TARGET_SALE_FIELD, AGENT_1_BOTTOM_LINE_FIELD,
    AGENT_2_FIELD, AGENT_2_NAME_FIELD, AGENT_2_PHONE_FIELD, AGENT_2_EMAIL_FIELD, AGENT_2_APPT_FIELD, AGENT_2_EMAILED_FIELD, AGENT_2_VERBALLY_CONFIRMED_FIELD, AGENT_2_INITIAL_PRICE_FIELD, AGENT_2_TARGET_SALE_FIELD, AGENT_2_BOTTOM_LINE_FIELD,
    AGENT_3_FIELD, AGENT_3_NAME_FIELD, AGENT_3_PHONE_FIELD, AGENT_3_EMAIL_FIELD, AGENT_3_APPT_FIELD, AGENT_3_EMAILED_FIELD, AGENT_3_VERBALLY_CONFIRMED_FIELD, AGENT_3_INITIAL_PRICE_FIELD, AGENT_3_TARGET_SALE_FIELD, AGENT_3_BOTTOM_LINE_FIELD,
    RECOMMENDED_MARKET_FIELD, RECOMMENDED_TARGET_FIELD, RECOMMENDED_FORCED_FIELD,
    AGENT_1_DESKTOP_VAL_FIELD, AGENT_2_DESKTOP_VAL_FIELD, AGENT_3_DESKTOP_VAL_FIELD
];

// ── Constants ──────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
    { value: 'Application', label: 'Application', num: 1 },
    { value: 'Vendor Availability', label: 'Vendor Availability', num: 2 },
    { value: 'Agents Booked', label: 'Book Agents', num: 3 },
    { value: 'Figures to chased', label: 'Figures to Chase', num: 4 },
    { value: 'Valuations Ready', label: 'Valuations Ready', num: 5 },
    { value: 'Figures returned', label: 'Figures Returned', num: 6 },
    { value: 'Final Checks', label: 'Final Checks', num: 7 },
    { value: 'Vendor Discussions', label: 'Vendor Discussions', num: 8 }
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Field name to schema reference mapping for handleFieldChange
const FIELD_MAP = {
    houseBuilder:       HOUSE_BUILDER_FIELD,
    vendor1:            VENDOR_1_FIELD,
    dateReceived:       APP_RECEIVED_DATE_FIELD,
    notes:              NOTES_FIELD,
    development:        DEVELOPMENT_FIELD,
    plot:               PLOT_FIELD,
    expectations:       VENDOR_EXPECTATIONS_FIELD,
    etaCompEnd:         ETA_COMP_END_FIELD,
    scheme:             SCHEME_FIELD,
    agent1:             AGENT_1_FIELD,
    agent1Emailed:      AGENT_1_EMAILED_FIELD,
    agent1Confirmed:    AGENT_1_VERBALLY_CONFIRMED_FIELD,
    agent1InitialPrice: AGENT_1_INITIAL_PRICE_FIELD,
    agent1TargetSale:   AGENT_1_TARGET_SALE_FIELD,
    agent1BottomLine:   AGENT_1_BOTTOM_LINE_FIELD,
    agent2:             AGENT_2_FIELD,
    agent2Emailed:      AGENT_2_EMAILED_FIELD,
    agent2Confirmed:    AGENT_2_VERBALLY_CONFIRMED_FIELD,
    agent2InitialPrice: AGENT_2_INITIAL_PRICE_FIELD,
    agent2TargetSale:   AGENT_2_TARGET_SALE_FIELD,
    agent2BottomLine:   AGENT_2_BOTTOM_LINE_FIELD,
    agent3:             AGENT_3_FIELD,
    agent3Emailed:      AGENT_3_EMAILED_FIELD,
    agent3Confirmed:    AGENT_3_VERBALLY_CONFIRMED_FIELD,
    agent3InitialPrice: AGENT_3_INITIAL_PRICE_FIELD,
    agent3TargetSale:   AGENT_3_TARGET_SALE_FIELD,
    agent3BottomLine:   AGENT_3_BOTTOM_LINE_FIELD,
    recommendedMarket:  RECOMMENDED_MARKET_FIELD,
    recommendedTarget:  RECOMMENDED_TARGET_FIELD,
    recommendedForced:  RECOMMENDED_FORCED_FIELD
};

// Boolean fields that store Yes/No in formData but true/false in Salesforce
const BOOLEAN_FIELDS = new Set([
    'agent1Emailed', 'agent1Confirmed',
    'agent2Emailed', 'agent2Confirmed',
    'agent3Emailed', 'agent3Confirmed'
]);

export default class NhsApplicationDetailV2 extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;

    @track formData = {};
    @track agentCardExpanded = true;
    @track showCommsHub = false;
    @track showPdfModal = false;
    @track pdfStatus = 'Generating PDF...';

    isLoading = true;
    wiredRecordResult;

    // ── Wire: Load Record ──────────────────────────────────────────────────────
    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord(result) {
        this.wiredRecordResult = result;
        const { error, data } = result;
        if (data) {
            this.isLoading = false;
            this.mapDataToForm(data);
        } else if (error) {
            this.isLoading = false;
            console.error('Error loading record', JSON.stringify(error));
        }
    }

    // ── Map Wire Data to formData ──────────────────────────────────────────────
    currencyVal(v) {
        return (v !== null && v !== undefined && v !== 0) ? v : null;
    }

    mapDataToForm(data) {
        const f = data.fields;
        this.formData = {
            // Property & Vendor
            propertyAddress:    f.Property_Address__c?.value || '',
            houseBuilderId:     f.House_Builder__c?.value,
            houseBuilderName:   f.House_Builder__r?.value?.fields?.Name?.value || '',
            vendor1Id:          f.Vendor_1__c?.value,
            vendor1Name:        f.Vendor_1__r?.value?.fields?.Name?.value || '',
            vendorMobile:       f.Vendor_1_Mobile__c?.value || '',
            vendorPhone:        f.Vendor_1_Phone__c?.value || '',
            vendorEmail:        f.Vendor_1_Email__c?.value || '',
            vendorExpectations: this.currencyVal(f.Client_Expectations__c?.value),
            receivedDate:       f.Date_of_Application_Received__c?.value || '',
            etaCompEnd:         f.ETA_Comp_End__c?.value || '',
            development:        f.Development__c?.value || '',
            plot:               f.Plot__c?.value || '',
            scheme:             f.Scheme__c?.value || '',
            nhsProcess:         f.NHS_Process__c?.value || '',
            stageName:          f.StageName?.value || '',
            notes:              f.Notes__c?.value || '',

            // Agent 1
            agent1Id:               f.Agent_1__c?.value,
            agent1Name:             f.Agent_1__r?.value?.fields?.Name?.value || '',
            agent1Phone:            f.Agent_1_Phone__c?.value || '',
            agent1Email:            f.Agent_1_Email__c?.value || '',
            agent1Appt:             f.Agent_1_Appointment__c?.value || '',
            agent1Emailed:          f.Agent_1_Emailed__c?.value ? 'Yes' : 'No',
            agent1VerballyConfirmed: f.Agent_1_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent1InitialPrice:     this.currencyVal(f.Agent_1_Initial_Asking_Price__c?.value),
            agent1TargetSale:       this.currencyVal(f.Agent_1_Target_Sale__c?.value),
            agent1BottomLine:       this.currencyVal(f.Agent_1_Bottom_Line__c?.value),

            // Agent 2
            agent2Id:               f.Agent_2__c?.value,
            agent2Name:             f.Agent_2__r?.value?.fields?.Name?.value || '',
            agent2Phone:            f.Agent_2_Phone__c?.value || '',
            agent2Email:            f.Agent_2_Email__c?.value || '',
            agent2Appt:             f.Agent_2_Appointment__c?.value || '',
            agent2Emailed:          f.Agent_2_Agent_Emailed__c?.value ? 'Yes' : 'No',
            agent2VerballyConfirmed: f.Agent_2_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent2InitialPrice:     this.currencyVal(f.Agent_2_Initial_Asking_Price__c?.value),
            agent2TargetSale:       this.currencyVal(f.Agent_2_Target_Sale__c?.value),
            agent2BottomLine:       this.currencyVal(f.Agent_2_Bottom_Line__c?.value),

            // Agent 3
            agent3Id:               f.Agent_3__c?.value,
            agent3Name:             f.Agent_3__r?.value?.fields?.Name?.value || '',
            agent3Phone:            f.Agent_3_Phone__c?.value || '',
            agent3Email:            f.Agent_3_Email__c?.value || '',
            agent3Appt:             f.Agent_3_Appointment__c?.value || '',
            agent3Emailed:          f.Agent_3_Agent_Emailed__c?.value ? 'Yes' : 'No',
            agent3VerballyConfirmed: f.Agent_3_Verbally_Confirmed__c?.value ? 'Yes' : 'No',
            agent3InitialPrice:     this.currencyVal(f.Agent_3_Initial_Asking_Price__c?.value),
            agent3TargetSale:       this.currencyVal(f.Agent_3_Target_Sale__c?.value),
            agent3BottomLine:       this.currencyVal(f.Agent_3_Bottom_Line__c?.value),

            // Desktop Valuations
            agent1DesktopVal: f.Agent_1_Desktop_Valuation__c
                ? (f.Agent_1_Desktop_Valuation__c.value || false)
                : (this.formData.agent1DesktopVal || false),
            agent2DesktopVal: f.Agent_2_Desktop_Valuation__c
                ? (f.Agent_2_Desktop_Valuation__c.value || false)
                : (this.formData.agent2DesktopVal || false),
            agent3DesktopVal: f.Agent_3_Desktop_Valuation__c
                ? (f.Agent_3_Desktop_Valuation__c.value || false)
                : (this.formData.agent3DesktopVal || false),

            // NHS Recommended
            recommendedMarket: this.currencyVal(f.Current_Asking_Price__c?.value),
            recommendedTarget: this.currencyVal(f.Target_Sale__c?.value),
            recommendedForced: this.currencyVal(f.Forced_Sale__c?.value)
        };
    }

    // ── Pipeline Steps Getter ──────────────────────────────────────────────────
    get pipelineSteps() {
        const currentProcess = this.formData.nhsProcess || '';
        const currentIdx = PIPELINE_STAGES.findIndex(s => s.value === currentProcess);

        return PIPELINE_STAGES.map((stage, idx) => {
            const done = currentIdx >= 0 && idx < currentIdx;
            const active = idx === currentIdx;

            return {
                value: stage.value,
                label: stage.label,
                num: stage.num,
                stepClass: 'pipe-step' + (done ? ' done' : '') + (active ? ' active' : ''),
                dotClass: 'pipe-dot',
                dotLabel: done ? '\u2713' : String(stage.num)
            };
        });
    }

    // ── Stage Visibility Getters ───────────────────────────────────────────────
    get showVendorAvailability() {
        return this.formData.nhsProcess === 'Vendor Availability';
    }

    get showBookAgents() {
        return this.formData.nhsProcess === 'Agents Booked';
    }

    get showFiguresToChase() {
        return this.formData.nhsProcess === 'Figures to chased';
    }

    get agentCardAutoCollapsed() {
        const process = this.formData.nhsProcess;
        return process === 'Vendor Availability' || process === 'Agents Booked';
    }

    // ── Formatted Display Getters ──────────────────────────────────────────────
    get propertyAddress() {
        return this.formData.propertyAddress;
    }

    get receivedDateDisplay() {
        const dateStr = this.formData.receivedDate;
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            const day = parseInt(parts[2], 10);
            const monthIdx = parseInt(parts[1], 10) - 1;
            const year = parts[0];
            return day + ' ' + MONTHS[monthIdx] + ' ' + year;
        } catch (e) {
            return dateStr;
        }
    }

    get vendorExpectationsDisplay() {
        const val = this.formData.vendorExpectations;
        if (val === null || val === undefined) return '';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    }

    get googleMapsUrl() {
        const addr = this.formData.propertyAddress || '';
        return 'https://www.google.com/maps/place/' + encodeURIComponent(addr.replace(/\s+/g, '+'));
    }

    formatApptDateTime(val) {
        if (!val) return 'Not booked';
        try {
            const d = new Date(val);
            const day = d.getDate();
            const mon = MONTHS[d.getMonth()];
            const year = d.getFullYear();
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'pm' : 'am';
            const hour = h % 12 || 12;
            return day + ' ' + mon + ' ' + year + ' — ' + hour + ':' + m + ' ' + ampm;
        } catch (e) {
            return val;
        }
    }

    get agent1ApptDisplay() { return this.formatApptDateTime(this.formData.agent1Appt); }
    get agent2ApptDisplay() { return this.formatApptDateTime(this.formData.agent2Appt); }
    get agent3ApptDisplay() { return this.formatApptDateTime(this.formData.agent3Appt); }

    get isSchemePartExchange() { return this.formData.scheme === 'Part Exchange'; }
    get isSchemeAssistedSale() { return this.formData.scheme === 'Assisted Sale'; }
    get isSchemeNewHome() { return this.formData.scheme === 'New Home'; }

    get etaCompEndDisplay() {
        const dateStr = this.formData.etaCompEnd;
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            const monthIdx = parseInt(parts[1], 10) - 1;
            const year = parts[0];
            return MONTHS[monthIdx] + ' ' + year;
        } catch (e) {
            return dateStr;
        }
    }

    // ── Scheme Options ─────────────────────────────────────────────────────────
    get schemeOptions() {
        return [
            { label: 'Part Exchange', value: 'Part Exchange' },
            { label: 'Assisted Sale', value: 'Assisted Sale' },
            { label: 'New Home', value: 'New Home' }
        ];
    }

    // ── Stage Click (Pipeline) ─────────────────────────────────────────────────
    handleStageClick(event) {
        const newStage = event.currentTarget.dataset.stage;
        if (newStage && newStage !== this.formData.nhsProcess) {
            this.handleStageChange(newStage);
        }
    }

    async handleStageChange(newStage) {
        const oldStage = this.formData.nhsProcess;

        // Validate: moving to Agents Booked requires at least 1 future vendor slot
        if (newStage === 'Agents Booked' && oldStage === 'Vendor Availability') {
            try {
                const records = await getHourlyAvailability({ opportunityId: this.recordId });
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tmrStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

                const futureSlots = (records || []).filter(r => r.Date__c && r.Date__c >= tmrStr);
                if (futureSlots.length === 0) {
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

        // Update local state
        this.formData = { ...this.formData, nhsProcess: newStage };

        // Persist to Salesforce
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
            console.error('Stage update error:', JSON.stringify(error));
            let msg = 'Failed to update stage.';
            if (error.body) {
                if (error.body.output?.errors?.length) {
                    msg = error.body.output.errors.map(e => e.message).join('; ');
                } else if (error.body.output?.fieldErrors) {
                    const fe = error.body.output.fieldErrors;
                    msg = Object.values(fe).flat().map(e => e.message).join('; ');
                } else if (error.body.message) {
                    msg = error.body.message;
                }
            } else if (error.message) {
                msg = error.message;
            }
            // Revert to old stage on failure
            this.formData = { ...this.formData, nhsProcess: oldStage };
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: msg,
                variant: 'error'
            }));
        }
    }

    // ── Inline Field Change (immediate persist) ────────────────────────────────
    async handleFieldChange(event) {
        const fieldName = event.currentTarget.dataset.field;
        const value = event.target.value !== undefined ? event.target.value : event.detail.value;

        // Update local state
        this.formData = { ...this.formData, [fieldName]: value };

        // Resolve Salesforce field reference
        const sfField = FIELD_MAP[fieldName];
        if (!sfField) {
            console.warn('No field mapping for:', fieldName);
            return;
        }

        // Build update payload
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;

        if (BOOLEAN_FIELDS.has(fieldName)) {
            fields[sfField.fieldApiName] = value === 'Yes';
        } else {
            fields[sfField.fieldApiName] = value;
        }

        try {
            await updateRecord({ fields });
        } catch (error) {
            console.error('Field update error:', fieldName, JSON.stringify(error));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to update field.',
                variant: 'error'
            }));
        }
    }

    // ── Scheme Change ──────────────────────────────────────────────────────────
    async handleSchemeChange(event) {
        const newScheme = event.detail.value;
        this.formData = { ...this.formData, scheme: newScheme };

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[SCHEME_FIELD.fieldApiName] = newScheme;

        try {
            await updateRecord({ fields });
        } catch (error) {
            console.error('Scheme update error:', JSON.stringify(error));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Failed to update scheme.',
                variant: 'error'
            }));
        }
    }

    @track isSaving = false;
    @track saveSuccess = false;

    // Assign Agent wizard
    @track showAssignAgent = false;
    @track nearbyAgents = [];
    @track isLoadingAgents = false;
    @track isAssigning = false;
    @track assignAgentInfo = '';
    @track assignStep = 1;
    @track assignRadius = '5';
    @track assignedAgent2Name = '';
    @track assignedAgent3Name = '';

    get radiusOptions() {
        return [
            { label: '0.5 miles', value: '0.5' }, { label: '1 mile', value: '1' },
            { label: '2 miles', value: '2' }, { label: '3 miles', value: '3' },
            { label: '5 miles', value: '5' }, { label: '7 miles', value: '7' },
            { label: '10 miles', value: '10' }
        ];
    }
    get isStep1() { return this.assignStep === 1; }
    get isStep2() { return this.assignStep === 2; }
    get isStep3() { return this.assignStep === 3; }
    get step1Class() { return 'af-step' + (this.assignStep === 1 ? ' af-step-active' : '') + (this.assignStep > 1 ? ' af-step-done' : ''); }
    get step2Class() { return 'af-step' + (this.assignStep === 2 ? ' af-step-active' : '') + (this.assignStep > 2 ? ' af-step-done' : ''); }
    get step3Class() { return 'af-step' + (this.assignStep === 3 ? ' af-step-active' : ''); }
    get hasNearbyAgents() { return this.nearbyAgents.length > 0; }

    // ── Full Save (all modified fields) ────────────────────────────────────────
    async handleSave() {
        this.isSaving = true;
        this.saveSuccess = false;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;

        // Property & Application
        fields[HOUSE_BUILDER_FIELD.fieldApiName] = this.formData.houseBuilderId;
        fields[VENDOR_1_FIELD.fieldApiName] = this.formData.vendor1Id;
        fields[APP_RECEIVED_DATE_FIELD.fieldApiName] = this.formData.receivedDate;
        fields[NOTES_FIELD.fieldApiName] = this.formData.notes;
        fields[DEVELOPMENT_FIELD.fieldApiName] = this.formData.development;
        fields[PLOT_FIELD.fieldApiName] = this.formData.plot;
        fields[VENDOR_EXPECTATIONS_FIELD.fieldApiName] = this.formData.vendorExpectations;
        fields[ETA_COMP_END_FIELD.fieldApiName] = this.formData.etaCompEnd || null;
        fields[SCHEME_FIELD.fieldApiName] = this.formData.scheme;

        // Agent 1
        fields[AGENT_1_FIELD.fieldApiName] = this.formData.agent1Id;
        fields[AGENT_1_EMAILED_FIELD.fieldApiName] = this.formData.agent1Emailed === 'Yes';
        fields[AGENT_1_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent1VerballyConfirmed === 'Yes';
        fields[AGENT_1_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent1InitialPrice;
        fields[AGENT_1_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent1TargetSale;
        fields[AGENT_1_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent1BottomLine;

        // Agent 2
        fields[AGENT_2_FIELD.fieldApiName] = this.formData.agent2Id;
        fields[AGENT_2_EMAILED_FIELD.fieldApiName] = this.formData.agent2Emailed === 'Yes';
        fields[AGENT_2_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent2VerballyConfirmed === 'Yes';
        fields[AGENT_2_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent2InitialPrice;
        fields[AGENT_2_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent2TargetSale;
        fields[AGENT_2_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent2BottomLine;

        // Agent 3
        fields[AGENT_3_FIELD.fieldApiName] = this.formData.agent3Id;
        fields[AGENT_3_EMAILED_FIELD.fieldApiName] = this.formData.agent3Emailed === 'Yes';
        fields[AGENT_3_VERBALLY_CONFIRMED_FIELD.fieldApiName] = this.formData.agent3VerballyConfirmed === 'Yes';
        fields[AGENT_3_INITIAL_PRICE_FIELD.fieldApiName] = this.formData.agent3InitialPrice;
        fields[AGENT_3_TARGET_SALE_FIELD.fieldApiName] = this.formData.agent3TargetSale;
        fields[AGENT_3_BOTTOM_LINE_FIELD.fieldApiName] = this.formData.agent3BottomLine;

        // NHS Recommended
        fields[RECOMMENDED_MARKET_FIELD.fieldApiName] = this.formData.recommendedMarket;
        fields[RECOMMENDED_TARGET_FIELD.fieldApiName] = this.formData.recommendedTarget;
        fields[RECOMMENDED_FORCED_FIELD.fieldApiName] = this.formData.recommendedForced;

        try {
            // Update Vendor 1 Contact details (Mobile, Phone, Email are formula fields on Opportunity)
            if (this.formData.vendor1Id) {
                await updateVendorContact({
                    contactId: this.formData.vendor1Id,
                    mobile: this.formData.vendorMobile || null,
                    phone: this.formData.vendorPhone || null,
                    email: this.formData.vendorEmail || null
                });
            }

            await updateRecord({ fields });

            // Save Desktop Valuation via Apex (UI API may not support these fields)
            await saveDesktopValuation({
                oppId: this.recordId,
                agent1DV: this.formData.agent1DesktopVal || false,
                agent2DV: this.formData.agent2DesktopVal || false,
                agent3DV: this.formData.agent3DesktopVal || false
            });

            this.isSaving = false;
            this.saveSuccess = true;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Application updated successfully',
                variant: 'success'
            }));
            // Hide success after 3 seconds
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => { this.saveSuccess = false; }, 3000);
        } catch (error) {
            let msg = 'An unexpected error occurred';
            if (error.body) {
                if (error.body.output?.errors?.length) {
                    msg = error.body.output.errors.map(e => e.message).join('; ');
                } else if (error.body.output?.fieldErrors) {
                    const fe = error.body.output.fieldErrors;
                    msg = Object.keys(fe).map(k => `${k}: ${fe[k].map(e => e.message).join(', ')}`).join('; ');
                } else {
                    msg = error.body.message || msg;
                }
            } else if (error.message) {
                msg = error.message;
            }
            console.error('Save error:', JSON.stringify(error));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error updating record',
                message: msg,
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
            this.isSaving = false;
        }
    }

    // ── Housebuilder Lookup ────────────────────────────────────────────────────
    handleHousebuilderSelected(event) {
        const selectedId = event.detail.id || event.detail.recordId || event.detail.value;
        const selectedName = event.detail.name || event.detail.title || '';
        this.formData = {
            ...this.formData,
            houseBuilderId: selectedId,
            houseBuilderName: selectedName
        };
    }

    // ── Agent Lookup Change ────────────────────────────────────────────────────
    handleLookupChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.id || event.detail.recordId || event.detail.value;
        this.formData = { ...this.formData, [field]: value };

        // Auto-populate phone/email for agents
        if (value) {
            this.fetchAgentDetails(field, value);
        }
    }

    fetchAgentDetails(agentField, accountId) {
        getAccountDetails({ accountId })
            .then(result => {
                // Derive the phone/email keys from agentField (e.g. 'agent2Id' -> 'agent2')
                const agentKey = agentField.replace('Id', '');
                this.formData = {
                    ...this.formData,
                    [agentKey + 'Phone']: result.phone || '',
                    [agentKey + 'Email']: result.email || ''
                };
            })
            .catch(error => {
                console.error('Error fetching agent details:', error);
            });
    }

    // ── Input Change (local state only) ────────────────────────────────────────
    handleInputChange(event) {
        const field = event.target.dataset.field || event.target.name;
        const value = event.target.value !== undefined ? event.target.value : event.detail.value;
        this.formData = { ...this.formData, [field]: value };
    }

    // ── Toggle Agent Card ──────────────────────────────────────────────────────
    get agentCardToggleIcon() {
        return this.agentCardExpanded ? '▾' : '▸';
    }

    toggleAgentCard() {
        this.agentCardExpanded = !this.agentCardExpanded;
    }

    handleAssignAgentStop(event) {
        event.stopPropagation();
        this.handleOpenAssignAgent();
    }

    handleAssignAgent() {
        this.handleOpenAssignAgent();
    }

    // ── Assign Agent 3-Step Wizard ────────────────────────────────────────────
    handleOpenAssignAgent() {
        this.showAssignAgent = true;
        this.assignStep = 1;
        this.assignRadius = '5';
        this.nearbyAgents = [];
        this.assignAgentInfo = '';
        this.assignedAgent2Name = '';
        this.assignedAgent3Name = '';
    }

    handleCloseAssignAgent() { this.showAssignAgent = false; }
    handleAssignModalClick(event) { event.stopPropagation(); }
    handleRadiusChange(event) { this.assignRadius = event.detail.value; }

    async handleSearchAgents() {
        this.assignStep = 2;
        this.isLoadingAgents = true;
        this.nearbyAgents = [];
        this.assignAgentInfo = '';
        try {
            const result = await findNearestAgents({ opportunityId: this.recordId, maxDistanceMiles: parseFloat(this.assignRadius) });
            if (result.status === 'success') {
                this.nearbyAgents = (result.agents || []).map(a => ({
                    ...a,
                    distanceLabel: a.distance + ' miles' + (a.duration ? ' (' + a.duration + ')' : '') + (a.distanceType === 'aerial' ? ' ✈' : ' 🚗'),
                    canAssignAgent2: !a.isAssigned && a.id !== this.formData.agent1Id,
                    canAssignAgent3: !a.isAssigned && a.id !== this.formData.agent1Id,
                    assignedLabel: a.isAgent2 ? 'Agent 2' : (a.isAgent3 ? 'Agent 3' : ''),
                    rowClass: 'af-row' + (a.isAssigned ? ' af-assigned' : ''),
                    rightmoveLink: a.rightmoveUrl || ''
                }));
                this.assignAgentInfo = this.nearbyAgents.length + ' agents found within ' + this.assignRadius + ' miles';
            } else {
                this.assignAgentInfo = result.message;
            }
        } catch (error) {
            this.assignAgentInfo = error.body?.message || 'Failed to find agents';
        }
        this.isLoadingAgents = false;
    }

    handleBackToStep1() { this.assignStep = 1; }

    async handleAssignToSlot(event) {
        const agentId = event.currentTarget.dataset.id;
        const agentName = event.currentTarget.dataset.name;
        const slot = event.currentTarget.dataset.slot;
        this.isAssigning = true;
        try {
            const result = await assignAgent({ opportunityId: this.recordId, agentId: agentId, agentSlot: slot });
            if (result.status === 'success') {
                const prevAgentId = this.formData[slot + 'Id'];
                this.formData = { ...this.formData, [slot + 'Id']: agentId, [slot + 'Name']: agentName };
                if (slot === 'agent2') this.assignedAgent2Name = agentName;
                if (slot === 'agent3') this.assignedAgent3Name = agentName;

                this.nearbyAgents = this.nearbyAgents.map(a => {
                    let isA2 = a.isAgent2;
                    let isA3 = a.isAgent3;
                    if (slot === 'agent2') {
                        if (a.id === agentId) isA2 = true;
                        if (a.id === prevAgentId && prevAgentId !== agentId) isA2 = false;
                    }
                    if (slot === 'agent3') {
                        if (a.id === agentId) isA3 = true;
                        if (a.id === prevAgentId && prevAgentId !== agentId) isA3 = false;
                    }
                    const isAssigned = isA2 || isA3;
                    return {
                        ...a, isAgent2: isA2, isAgent3: isA3, isAssigned,
                        assignedLabel: isA2 ? 'Agent 2' : (isA3 ? 'Agent 3' : ''),
                        canAssignAgent2: !isAssigned && a.id !== this.formData.agent1Id,
                        canAssignAgent3: !isAssigned && a.id !== this.formData.agent1Id,
                        rowClass: 'af-row' + (isAssigned ? ' af-assigned' : '')
                    };
                });

                if (this.assignedAgent2Name && this.assignedAgent3Name) this.assignStep = 3;
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed', variant: 'error' }));
        }
        this.isAssigning = false;
    }

    async handleUnassignAgent(event) {
        const agentId = event.currentTarget.dataset.id;
        const agent = this.nearbyAgents.find(a => a.id === agentId);
        if (!agent) return;
        const slot = agent.isAgent2 ? 'agent2' : 'agent3';
        this.isAssigning = true;
        try {
            const result = await assignAgent({ opportunityId: this.recordId, agentId: null, agentSlot: slot });
            if (result.status === 'success') {
                this.formData = { ...this.formData, [slot + 'Id']: null, [slot + 'Name']: '' };
                if (slot === 'agent2') this.assignedAgent2Name = '';
                if (slot === 'agent3') this.assignedAgent3Name = '';
                this.nearbyAgents = this.nearbyAgents.map(a => {
                    let isA2 = a.isAgent2, isA3 = a.isAgent3;
                    if (a.id === agentId) { if (slot === 'agent2') isA2 = false; if (slot === 'agent3') isA3 = false; }
                    const isAssigned = isA2 || isA3;
                    return { ...a, isAgent2: isA2, isAgent3: isA3, isAssigned,
                        assignedLabel: isA2 ? 'Agent 2' : (isA3 ? 'Agent 3' : ''),
                        canAssignAgent2: !isAssigned, canAssignAgent3: !isAssigned,
                        rowClass: 'af-row' + (isAssigned ? ' af-assigned' : '') };
                });
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed', variant: 'error' }));
        }
        this.isAssigning = false;
    }

    handleConfirmAssignment() {
        this.showAssignAgent = false;
        this.dispatchEvent(new ShowToastEvent({ title: 'Agents Assigned', message: 'Agent 2: ' + this.assignedAgent2Name + ' | Agent 3: ' + this.assignedAgent3Name, variant: 'success' }));
        refreshApex(this.wiredRecordResult);
    }

    // ── Toggle Comms Hub ───────────────────────────────────────────────────────
    toggleCommsHub() {
        this.showCommsHub = !this.showCommsHub;
    }

    // ── Refresh Data ───────────────────────────────────────────────────────────
    handleRefresh() {
        this.isLoading = true;
        refreshApex(this.wiredRecordResult)
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Refreshed',
                    message: 'Data refreshed successfully.',
                    variant: 'success'
                }));
            })
            .catch(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to refresh.',
                    variant: 'error'
                }));
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // ── Generate PDF ───────────────────────────────────────────────────────────
    async handleGeneratePDF() {
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
                    title: 'Error',
                    message: 'PDF generation returned no file.',
                    variant: 'error'
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

    // ── Desktop Valuation Toggle ───────────────────────────────────────────────
    handleDesktopValToggle(event) {
        const agent = event.currentTarget.querySelector('input')?.dataset?.agent || event.target.dataset.agent;
        const checked = event.target.checked;
        const field = agent + 'DesktopVal';
        this.formData = { ...this.formData, [field]: checked };

        // Persist to Salesforce
        saveDesktopValuation({
            oppId: this.recordId,
            agent1DV: agent === 'agent1' ? checked : this.formData.agent1DesktopVal,
            agent2DV: agent === 'agent2' ? checked : this.formData.agent2DesktopVal,
            agent3DV: agent === 'agent3' ? checked : this.formData.agent3DesktopVal
        }).catch(() => {});
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── VENDOR NOTES
    // ═══════════════════════════════════════════════════════════════════════════

    @track vendorNotes = [];
    @track newNote = '';
    @track notesPageSize = 5;
    @track notesPageNum = 1;
    get hasVendorNotes() { return this.vendorNotes.length > 0; }
    get notesTotalPages() { return Math.ceil(this.vendorNotes.length / this.notesPageSize) || 1; }
    get pagedNotes() {
        const start = (this.notesPageNum - 1) * this.notesPageSize;
        return this.vendorNotes.slice(start, start + this.notesPageSize);
    }
    get notesRangeStart() { return ((this.notesPageNum - 1) * this.notesPageSize) + 1; }
    get notesRangeEnd() { return Math.min(this.notesPageNum * this.notesPageSize, this.vendorNotes.length); }
    get notesCountLabel() { return this.notesRangeStart + '–' + this.notesRangeEnd + ' of ' + this.vendorNotes.length; }
    get isNotesPrevDisabled() { return this.notesPageNum <= 1; }
    get isNotesNextDisabled() { return this.notesPageNum >= this.notesTotalPages; }
    get vn5Class() { return 'vn-page-btn' + (this.notesPageSize === 5 ? ' vn-page-active' : ''); }
    get vn10Class() { return 'vn-page-btn' + (this.notesPageSize === 10 ? ' vn-page-active' : ''); }
    get vn25Class() { return 'vn-page-btn' + (this.notesPageSize === 25 ? ' vn-page-active' : ''); }

    async loadVendorNotes() {
        try {
            const notes = await getNotes({ opportunityId: this.recordId });
            this.vendorNotes = (notes || []).map(n => ({
                id: n.Id,
                author: n.CreatedBy?.Name || 'Unknown',
                dateDisplay: this.formatNoteDate(n.CreatedDate),
                body: n.Notes__c || ''
            }));
        } catch (e) { /* silent */ }
    }

    formatNoteDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
            d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }

    // Quick Note popup
    @track showQuickNote = false;
    @track quickNoteText = '';
    @track isQuickNoteSaving = false;

    handleToggleQuickNote() { this.showQuickNote = !this.showQuickNote; }
    handleQuickNoteChange(event) { this.quickNoteText = event.target.value; }

    async handleSaveQuickNote() {
        if (!this.quickNoteText || !this.quickNoteText.trim()) return;
        this.isQuickNoteSaving = true;
        try {
            await saveNote({ noteText: this.quickNoteText.trim(), opportunityId: this.recordId });
            this.quickNoteText = '';
            this.showQuickNote = false;
            this.loadVendorNotes();
            this.dispatchEvent(new ShowToastEvent({ title: 'Note Added', message: 'Quick note saved', variant: 'success' }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed', variant: 'error' }));
        }
        this.isQuickNoteSaving = false;
    }

    handleNotesPageSize(event) {
        this.notesPageSize = parseInt(event.currentTarget.dataset.size, 10);
        this.notesPageNum = 1;
    }
    handleNotesPrev() { if (this.notesPageNum > 1) this.notesPageNum--; }
    handleNotesNext() { if (this.notesPageNum < this.notesTotalPages) this.notesPageNum++; }

    handleNoteChange(event) {
        this.newNote = event.target.value;
    }

    async handleAddNote() {
        if (!this.newNote || !this.newNote.trim()) return;
        try {
            await saveNote({ noteText: this.newNote.trim(), opportunityId: this.recordId });
            this.newNote = '';
            // Clear textarea
            const ta = this.template.querySelector('.vn-textarea');
            if (ta) ta.value = '';
            this.loadVendorNotes();
            this.dispatchEvent(new ShowToastEvent({ title: 'Note Added', message: 'Vendor note saved', variant: 'success' }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to save note', variant: 'error' }));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── VENDOR AVAILABILITY CALENDAR (AM/PM Model)
    // ═══════════════════════════════════════════════════════════════════════════

    @track vaSlots = {}; // key: 'di-period' (e.g. '0-am', '3-pm'), value: true/false
    @track vaCalOffset = 0;
    @track isVaSaving = false;
    @track vaExistingRecords = []; // from Apex
    @track vaSatEnabled = false; // persistent: true if Saturdays are enabled
    @track vaSunEnabled = false; // persistent: true if Sundays are enabled

    static VA_DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    static VA_AM_HOURS = [0, 1, 2, 3]; // Hour_08-11 (9am-12pm range)
    static VA_PM_HOURS = [4, 5, 6, 7, 8]; // Hour_12-16 (12pm-5pm range)

    connectedCallback() {
        this.loadVaData();
        this.loadVendorNotes();
    }

    async loadVaData() {
        try {
            const records = await getHourlyAvailability({ opportunityId: this.recordId });
            this.vaExistingRecords = records || [];
            this.rebuildVaSlots();
        } catch (e) { /* silent */ }
    }

    rebuildVaSlots() {
        const monday = this.getVaMonday();
        const slots = {};

        // Detect if any Sat/Sun records exist (enables weekends globally)
        this.vaExistingRecords.forEach(rec => {
            if (!rec.Date__c) return;
            const recDate = new Date(rec.Date__c + 'T00:00:00');
            if (rec.Availability__c === 'Available' && (rec.AM__c || rec.PM__c)) {
                if (recDate.getDay() === 6) this.vaSatEnabled = true;
                if (recDate.getDay() === 0) this.vaSunEnabled = true;
            }
        });

        // Map records to current week's slots
        this.vaExistingRecords.forEach(rec => {
            if (!rec.Date__c) return;
            const recDate = new Date(rec.Date__c + 'T00:00:00');
            for (let di = 0; di < 7; di++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + di);
                if (d.getFullYear() === recDate.getFullYear() &&
                    d.getMonth() === recDate.getMonth() &&
                    d.getDate() === recDate.getDate()) {
                    if (rec.AM__c) slots[di + '-am'] = true;
                    if (rec.PM__c) slots[di + '-pm'] = true;
                }
            }
        });
        this.vaSlots = { ...slots };
    }

    getVaMonday() {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (this.vaCalOffset * 7);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    get vaRangeLabel() {
        const monday = this.getVaMonday();
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return monday.getDate() + ' ' + MONTHS[monday.getMonth()] +
            ' – ' + sunday.getDate() + ' ' + MONTHS[sunday.getMonth()] + ' ' + sunday.getFullYear();
    }

    get vaDays() {
        const monday = this.getVaMonday();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = [];

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const isToday = d.getTime() === today.getTime();
            const isPast = d.getTime() <= today.getTime(); // today and before are disabled
            const isSat = d.getDay() === 6;
            const isSun = d.getDay() === 0;
            const isWeekend = isSat || isSun;
            const weekendEnabled = (isSat && this.vaSatEnabled) || (isSun && this.vaSunEnabled);
            const isDisabled = isPast || (isWeekend && !weekendEnabled);
            const amOn = !!this.vaSlots[i + '-am'];
            const pmOn = !!this.vaSlots[i + '-pm'];
            const allOn = amOn && pmOn;

            days.push({
                key: 'day-' + i,
                idx: String(i),
                dayName: NhsApplicationDetailV2.VA_DAY_NAMES[d.getDay()],
                dayNum: d.getDate(),
                date: d,
                isPast,
                isWeekend,
                isDisabled,
                weekendEnabled,
                showWeekendToggle: isWeekend && !isPast,
                thClass: 'va-table-th' + (isToday ? ' va-th-today' : '') + (isWeekend ? ' va-th-weekend' : '') + (isPast ? ' va-th-past' : ''),
                amActive: amOn,
                pmActive: pmOn,
                allBtnClass: 'va-day-btn' + (allOn ? ' va-day-btn-active' : '') + (isDisabled ? ' va-day-btn-disabled' : ''),
                amBtnClass: 'va-day-btn' + (amOn ? ' va-day-btn-active' : '') + (isDisabled ? ' va-day-btn-disabled' : ''),
                pmBtnClass: 'va-day-btn' + (pmOn ? ' va-day-btn-active' : '') + (isDisabled ? ' va-day-btn-disabled' : ''),
                amCellClass: 'va-cell' + (amOn ? ' va-cell-am-active' : '') + (isWeekend ? ' va-cell-weekend' : '') + (isDisabled ? ' va-cell-disabled' : ''),
                pmCellClass: 'va-cell' + (pmOn ? ' va-cell-pm-active' : '') + (isWeekend ? ' va-cell-weekend' : '') + (isDisabled ? ' va-cell-disabled' : '')
            });
        }
        return days;
    }

    // Check if day index is disabled (computed inline to avoid getter recursion)
    isDayDisabled(di) {
        const idx = parseInt(di, 10);
        const monday = this.getVaMonday();
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = d.getTime() <= today.getTime();
        const isSat = d.getDay() === 6;
        const isSun = d.getDay() === 0;
        const isWeekend = isSat || isSun;
        const weekendEnabled = (isSat && this.vaSatEnabled) || (isSun && this.vaSunEnabled);
        return isPast || (isWeekend && !weekendEnabled);
    }

    // Cell click toggles
    handleVaCellClick(event) {
        const di = event.currentTarget.dataset.di;
        if (this.isDayDisabled(di)) return;
        const period = event.currentTarget.dataset.period;
        const key = di + '-' + period;
        this.vaSlots = { ...this.vaSlots, [key]: !this.vaSlots[key] };
    }

    // Per-day buttons
    handleVaDayAll(event) {
        const di = event.currentTarget.dataset.di;
        if (this.isDayDisabled(di)) return;
        const allOn = this.vaSlots[di + '-am'] && this.vaSlots[di + '-pm'];
        this.vaSlots = { ...this.vaSlots, [di + '-am']: !allOn, [di + '-pm']: !allOn };
    }
    handleVaDayAm(event) {
        const di = event.currentTarget.dataset.di;
        if (this.isDayDisabled(di)) return;
        this.vaSlots = { ...this.vaSlots, [di + '-am']: !this.vaSlots[di + '-am'] };
    }
    handleVaDayPm(event) {
        const di = event.currentTarget.dataset.di;
        if (this.isDayDisabled(di)) return;
        this.vaSlots = { ...this.vaSlots, [di + '-pm']: !this.vaSlots[di + '-pm'] };
    }

    // Weekend toggle — enables/disables Sat or Sun globally for all weeks
    handleWeekendToggle(event) {
        const di = parseInt(event.currentTarget.dataset.di, 10);
        const monday = this.getVaMonday();
        const d = new Date(monday);
        d.setDate(monday.getDate() + di);

        if (d.getDay() === 6) {
            this.vaSatEnabled = !this.vaSatEnabled;
            if (!this.vaSatEnabled) {
                this.vaSlots = { ...this.vaSlots, [di + '-am']: false, [di + '-pm']: false };
            }
        } else if (d.getDay() === 0) {
            this.vaSunEnabled = !this.vaSunEnabled;
            if (!this.vaSunEnabled) {
                this.vaSlots = { ...this.vaSlots, [di + '-am']: false, [di + '-pm']: false };
            }
        }
    }

    // Bulk buttons (skip disabled days)
    handleVaBulkAll() {
        const days = this.vaDays;
        const enabledDays = days.filter(d => !d.isDisabled);
        const allOn = enabledDays.every(d => this.vaSlots[d.idx + '-am'] && this.vaSlots[d.idx + '-pm']);
        const newSlots = { ...this.vaSlots };
        enabledDays.forEach(d => { newSlots[d.idx + '-am'] = !allOn; newSlots[d.idx + '-pm'] = !allOn; });
        this.vaSlots = newSlots;
    }
    handleVaBulkAm() {
        const days = this.vaDays;
        const enabledDays = days.filter(d => !d.isDisabled);
        const allOn = enabledDays.every(d => !!this.vaSlots[d.idx + '-am']);
        const newSlots = { ...this.vaSlots };
        enabledDays.forEach(d => { newSlots[d.idx + '-am'] = !allOn; });
        this.vaSlots = newSlots;
    }
    handleVaBulkPm() {
        const days = this.vaDays;
        const enabledDays = days.filter(d => !d.isDisabled);
        const allOn = enabledDays.every(d => !!this.vaSlots[d.idx + '-pm']);
        const newSlots = { ...this.vaSlots };
        enabledDays.forEach(d => { newSlots[d.idx + '-pm'] = !allOn; });
        this.vaSlots = newSlots;
    }
    handleVaBulkClear() {
        this.vaSlots = {};
    }

    // Navigation
    handleVaPrev() { this.vaCalOffset--; this.rebuildVaSlots(); }
    handleVaNext() { this.vaCalOffset++; this.rebuildVaSlots(); }
    handleVaToday() { this.vaCalOffset = 0; this.rebuildVaSlots(); }

    // Save
    async handleVaSave() {
        this.isVaSaving = true;
        try {
            const monday = this.getVaMonday();
            const dataList = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let di = 0; di < 7; di++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + di);

                // Skip past days (today and before)
                if (d.getTime() <= today.getTime()) continue;

                const dateStr = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');

                const amOn = !!this.vaSlots[di + '-am'];
                const pmOn = !!this.vaSlots[di + '-pm'];

                dataList.push({
                    'Date__c': dateStr,
                    'Availability__c': (amOn || pmOn) ? 'Available' : 'Unavailable',
                    'AM__c': amOn,
                    'PM__c': pmOn,
                    'Notes__c': '',
                    'Id': ''
                });
            }

            const result = await processVendorAvailability({
                dataList: dataList,
                currentId: this.recordId
            });

            if (result === 'Success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: 'Vendor availability updated', variant: 'success' }));
                this.loadVaData();
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result, variant: 'error' }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to save', variant: 'error' }));
        }
        this.isVaSaving = false;
    }
}
