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
import getAvailableSlots from '@salesforce/apex/AgentFinderController.getAvailableSlots';
import getEmailTemplates from '@salesforce/apex/NHSCommunicationsController.getEmailTemplates';
import getRenderedTemplate from '@salesforce/apex/NHSCommunicationsController.getRenderedTemplate';
import sendEmailComplete from '@salesforce/apex/NHSCommunicationsController.sendEmailComplete';
import getAddressBook from '@salesforce/apex/NHSCommunicationsController.getAddressBook';
import isAdminUser from '@salesforce/apex/NHSCommunicationsController.isAdminUser';
import ensureAccessToken from '@salesforce/apex/BoxOAuthController.ensureAccessToken';
import browseFolderById from '@salesforce/apex/BoxOAuthController.browseFolderById';
import uploadFile from '@salesforce/apex/BoxOAuthController.uploadFile';
import getBoxFolderForOpportunity from '@salesforce/apex/BoxOAuthController.getBoxFolderForOpportunity';
import uploadFileFromContentDoc from '@salesforce/apex/BoxOAuthController.uploadFileFromContentDoc';
import bookAppointment from '@salesforce/apex/AgentFinderController.bookAppointment';
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
import PROPERTY_DESCRIPTION_FIELD from '@salesforce/schema/Opportunity.Property_Description__c';
import VENDOR_MOBILE_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Mobile__c';
import VENDOR_EXPECTATIONS_FIELD from '@salesforce/schema/Opportunity.Client_Expectations__c';
import VENDOR_PHONE_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Phone__c';
import ETA_COMP_END_FIELD from '@salesforce/schema/Opportunity.ETA_Comp_End__c';
import VENDOR_EMAIL_FIELD from '@salesforce/schema/Opportunity.Vendor_1_Email__c';
import VENDOR_2_FIELD from '@salesforce/schema/Opportunity.Vendor_2__c';
import VENDOR_2_NAME_FIELD from '@salesforce/schema/Opportunity.Vendor_2__r.Name';
import VENDOR_2_MOBILE_FIELD from '@salesforce/schema/Opportunity.Vendor_2_Mobile__c';
import VENDOR_2_PHONE_FIELD from '@salesforce/schema/Opportunity.Vendor_2_Phone__c';
import VENDOR_2_EMAIL_FIELD from '@salesforce/schema/Opportunity.Vendor_2_Email__c';
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
import AGENT_1_VAL_REPORT_ID_FIELD from '@salesforce/schema/Opportunity.Agent_1_Valuation_Report_Box_Id__c';
import AGENT_1_VAL_REPORT_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_1_Valuation_Report_Name__c';
import AGENT_2_VAL_REPORT_ID_FIELD from '@salesforce/schema/Opportunity.Agent_2_Valuation_Report_Box_Id__c';
import AGENT_2_VAL_REPORT_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_2_Valuation_Report_Name__c';
import AGENT_3_VAL_REPORT_ID_FIELD from '@salesforce/schema/Opportunity.Agent_3_Valuation_Report_Box_Id__c';
import AGENT_3_VAL_REPORT_NAME_FIELD from '@salesforce/schema/Opportunity.Agent_3_Valuation_Report_Name__c';
import uploadValuationReport from '@salesforce/apex/BoxOAuthController.uploadValuationReport';
import removeValuationReport from '@salesforce/apex/BoxOAuthController.removeValuationReport';

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
import LAST_AGENT_1_EMAILED_FIELD from '@salesforce/schema/Opportunity.Last_Agent_1_Emailed_On__c';
import LAST_AGENT_2_EMAILED_FIELD from '@salesforce/schema/Opportunity.Last_Agent_2_Emailed_On__c';
import LAST_AGENT_3_EMAILED_FIELD from '@salesforce/schema/Opportunity.Last_Agent_3_Emailed_On__c';
import RECOMMENDED_MARKET_FIELD from '@salesforce/schema/Opportunity.Current_Asking_Price__c';
import RECOMMENDED_TARGET_FIELD from '@salesforce/schema/Opportunity.Target_Sale__c';
import RECOMMENDED_FORCED_FIELD from '@salesforce/schema/Opportunity.Forced_Sale__c';

// ── Fields Array ───────────────────────────────────────────────────────────────
const FIELDS = [
    NAME_FIELD, HOUSE_BUILDER_FIELD, HOUSE_BUILDER_NAME_FIELD, PROPERTY_ADDRESS_FIELD, VENDOR_1_FIELD, VENDOR_1_NAME_FIELD,
    APP_RECEIVED_DATE_FIELD, NOTES_FIELD, DEVELOPMENT_FIELD, PLOT_FIELD, PROPERTY_DESCRIPTION_FIELD,
    VENDOR_MOBILE_FIELD, VENDOR_EXPECTATIONS_FIELD, VENDOR_PHONE_FIELD, ETA_COMP_END_FIELD, VENDOR_EMAIL_FIELD, SCHEME_FIELD, STAGE_FIELD, NHS_PROCESS_FIELD,
    VENDOR_2_FIELD, VENDOR_2_NAME_FIELD, VENDOR_2_MOBILE_FIELD, VENDOR_2_PHONE_FIELD, VENDOR_2_EMAIL_FIELD,
    AGENT_1_FIELD, AGENT_1_NAME_FIELD, AGENT_1_PHONE_FIELD, AGENT_1_EMAIL_FIELD, AGENT_1_APPT_FIELD, AGENT_1_EMAILED_FIELD, AGENT_1_VERBALLY_CONFIRMED_FIELD, AGENT_1_INITIAL_PRICE_FIELD, AGENT_1_TARGET_SALE_FIELD, AGENT_1_BOTTOM_LINE_FIELD, AGENT_1_VAL_REPORT_ID_FIELD, AGENT_1_VAL_REPORT_NAME_FIELD,
    AGENT_2_FIELD, AGENT_2_NAME_FIELD, AGENT_2_PHONE_FIELD, AGENT_2_EMAIL_FIELD, AGENT_2_APPT_FIELD, AGENT_2_EMAILED_FIELD, AGENT_2_VERBALLY_CONFIRMED_FIELD, AGENT_2_INITIAL_PRICE_FIELD, AGENT_2_TARGET_SALE_FIELD, AGENT_2_BOTTOM_LINE_FIELD, AGENT_2_VAL_REPORT_ID_FIELD, AGENT_2_VAL_REPORT_NAME_FIELD,
    AGENT_3_FIELD, AGENT_3_NAME_FIELD, AGENT_3_PHONE_FIELD, AGENT_3_EMAIL_FIELD, AGENT_3_APPT_FIELD, AGENT_3_EMAILED_FIELD, AGENT_3_VERBALLY_CONFIRMED_FIELD, AGENT_3_INITIAL_PRICE_FIELD, AGENT_3_TARGET_SALE_FIELD, AGENT_3_BOTTOM_LINE_FIELD, AGENT_3_VAL_REPORT_ID_FIELD, AGENT_3_VAL_REPORT_NAME_FIELD,
    RECOMMENDED_MARKET_FIELD, RECOMMENDED_TARGET_FIELD, RECOMMENDED_FORCED_FIELD,
    AGENT_1_DESKTOP_VAL_FIELD, AGENT_2_DESKTOP_VAL_FIELD, AGENT_3_DESKTOP_VAL_FIELD,
    LAST_AGENT_1_EMAILED_FIELD, LAST_AGENT_2_EMAILED_FIELD, LAST_AGENT_3_EMAILED_FIELD
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
    @track isAdmin = false;
    @track showEditApp = false;
    @track showVaLightbox = false;
    @track editFields = {};
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
            vendor2Id:          f.Vendor_2__c?.value,
            vendor2Name:        f.Vendor_2__r?.value?.fields?.Name?.value || '',
            vendor2Mobile:      f.Vendor_2_Mobile__c?.value || '',
            vendor2Phone:       f.Vendor_2_Phone__c?.value || '',
            vendor2Email:       f.Vendor_2_Email__c?.value || '',
            vendorExpectations: this.currencyVal(f.Client_Expectations__c?.value),
            receivedDate:       f.Date_of_Application_Received__c?.value || '',
            etaCompEnd:         f.ETA_Comp_End__c?.value || '',
            development:        f.Development__c?.value || '',
            plot:               f.Plot__c?.value || '',
            propertyDescription: f.Property_Description__c?.value || '',
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
            agent1ValReportId:      f.Agent_1_Valuation_Report_Box_Id__c?.value || '',
            agent1ValReportName:    f.Agent_1_Valuation_Report_Name__c?.value || '',

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
            agent2ValReportId:      f.Agent_2_Valuation_Report_Box_Id__c?.value || '',
            agent2ValReportName:    f.Agent_2_Valuation_Report_Name__c?.value || '',

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
            agent3ValReportId:      f.Agent_3_Valuation_Report_Box_Id__c?.value || '',
            agent3ValReportName:    f.Agent_3_Valuation_Report_Name__c?.value || '',

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

            // Last Emailed
            lastAgent1Emailed: f.Last_Agent_1_Emailed_On__c?.value || null,
            lastAgent2Emailed: f.Last_Agent_2_Emailed_On__c?.value || null,
            lastAgent3Emailed: f.Last_Agent_3_Emailed_On__c?.value || null,

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
    // ── Quick Action Buttons (conditional per stage) ─────────────────────────
    get quickActions() {
        const actions = [];
        const process = this.formData.nhsProcess || '';
        const earlyStages = ['Application', 'Vendor Availability', 'Agents Booked'];

        if (!earlyStages.includes(process)) return actions;

        // Check if future vendor availability exists
        const now = new Date();
        const hasFutureAvail = this.vaExistingRecords.some(rec => {
            if (!rec.Date__c || rec.Availability__c !== 'Available') return false;
            if (!rec.AM__c && !rec.PM__c) return false;
            const recDate = new Date(rec.Date__c + 'T23:59:59');
            return recDate >= now;
        });
        if (!hasFutureAvail) {
            actions.push({ key: 'va', label: 'Set Vendor Availability', icon: 'utility:date_input', action: 'vendorAvailability' });
        }

        // Check if agents not yet assigned
        if (!this.formData.agent1Id) {
            actions.push({ key: 'a1', label: 'Assign Agent 1', icon: 'utility:add', action: 'assignAgent1' });
        }
        if (!this.formData.agent2Id) {
            actions.push({ key: 'a2', label: 'Assign Agent 2', icon: 'utility:add', action: 'assignAgent2' });
        }
        if (!this.formData.agent3Id) {
            actions.push({ key: 'a3', label: 'Assign Agent 3', icon: 'utility:add', action: 'assignAgent3' });
        }

        return actions;
    }

    get hasQuickActions() { return this.quickActions.length > 0; }

    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        if (action === 'vendorAvailability') {
            // Set stage to Vendor Availability and open lightbox
            this.handleStageClick({ currentTarget: { dataset: { stage: 'Vendor Availability' } } });
            this.showVaLightbox = true;
        } else if (action === 'assignAgent1') {
            this.reassignSlot = 'agent1';
            this.showAssignAgent = true;
            this.assignStep = 1;
            this.assignRadius = '5';
            this.nearbyAgents = [];
            this.assignAgentInfo = '';
            this.assignedAgent2Name = '';
            this.assignedAgent3Name = '';
        } else if (action === 'assignAgent2') {
            this.reassignSlot = 'agent2';
            this.showAssignAgent = true;
            this.assignStep = 1;
            this.assignRadius = '5';
            this.nearbyAgents = [];
            this.assignAgentInfo = '';
            this.assignedAgent2Name = '';
            this.assignedAgent3Name = '';
        } else if (action === 'assignAgent3') {
            this.reassignSlot = 'agent3';
            this.showAssignAgent = true;
            this.assignStep = 1;
            this.assignRadius = '5';
            this.nearbyAgents = [];
            this.assignAgentInfo = '';
            this.assignedAgent2Name = '';
            this.assignedAgent3Name = '';
        }
    }

    get showFinalChecks() { return this.formData.nhsProcess === 'Final Checks'; }
    get notFinalChecks() { return this.formData.nhsProcess !== 'Final Checks'; }
    get propCardClass() { return 'card' + (this.showFinalChecks ? ' card-readonly' : ''); }

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

    get hasVendor2() {
        return !!this.formData.vendor2Id;
    }

    get hasAgent1() { return !!this.formData.agent1Id; }
    get hasAgent2() { return !!this.formData.agent2Id; }
    get hasAgent3() { return !!this.formData.agent3Id; }

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

    get nhsRecWrapClass() {
        return 'nhs-rec-wrap' + (this.formData.nhsProcess === 'Valuations Ready' ? ' nhs-rec-highlight' : '');
    }

    formatEmailedDate(val) {
        if (!val) return 'Not emailed';
        try {
            const d = new Date(val);
            const day = d.getDate();
            const mon = MONTHS[d.getMonth()];
            const year = d.getFullYear();
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'pm' : 'am';
            const hour = h % 12 || 12;
            return day + ' ' + mon + ' ' + year + ' ' + hour + ':' + m + ' ' + ampm;
        } catch (e) { return val; }
    }
    get agent1EmailedDisplay() { return this.formatEmailedDate(this.formData.lastAgent1Emailed); }
    get agent2EmailedDisplay() { return this.formatEmailedDate(this.formData.lastAgent2Emailed); }
    get agent3EmailedDisplay() { return this.formatEmailedDate(this.formData.lastAgent3Emailed); }

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

        // Reload Book Agents slots when entering that stage
        if (newStage === 'Agents Booked') {
            this.loadBaSlots();
        }

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
    @track agentViewMode = 'list'; // 'list' | 'map'
    @track propertyLat = null;
    @track propertyLng = null;
    @track propertyAddressSearched = '';

    get isListView() { return this.agentViewMode === 'list'; }
    get isMapView() { return this.agentViewMode === 'map'; }
    get listViewBtnClass() { return 'af-view-btn' + (this.agentViewMode === 'list' ? ' af-view-active' : ''); }
    get mapViewBtnClass() { return 'af-view-btn' + (this.agentViewMode === 'map' ? ' af-view-active' : ''); }

    handleViewList() { this.agentViewMode = 'list'; }
    handleViewMap() { this.agentViewMode = 'map'; }

    get hasMapData() {
        return this.propertyLat != null && this.propertyLng != null && this.nearbyAgents.length > 0;
    }

    get nhsMapMarkers() {
        const list = [];
        if (this.propertyLat != null && this.propertyLng != null) {
            list.push({
                id: 'property',
                lat: Number(this.propertyLat),
                lng: Number(this.propertyLng),
                title: 'Property',
                description: this.propertyAddressSearched || '',
                color: '#4A6B5E',
                isProperty: true,
                label: '★'
            });
        }
        let visibleNum = 1;
        (this.nearbyAgents || []).forEach((a, idx) => {
            if (a.latitude != null && a.longitude != null) {
                const isAssigned = a.isAgent2 || a.isAgent3;
                list.push({
                    id: a.id,
                    lat: Number(a.latitude),
                    lng: Number(a.longitude),
                    title: (idx + 1) + '. ' + a.name,
                    description: (a.fullAddress || '') + (a.distanceLabel ? ' — ' + a.distanceLabel : ''),
                    color: isAssigned ? '#D97706' : '#2563EB',
                    label: String(visibleNum)
                });
                visibleNum++;
            }
        });
        return list;
    }

    get nhsMapCenter() {
        if (this.propertyLat != null && this.propertyLng != null) {
            return { lat: Number(this.propertyLat), lng: Number(this.propertyLng) };
        }
        return null;
    }

    get mapMarkers() {
        const markers = [];
        // Google Maps marker path (teardrop/pin shape)
        const pinPath = 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z';

        // Property pin (sage)
        if (this.propertyLat != null && this.propertyLng != null) {
            markers.push({
                location: { Latitude: Number(this.propertyLat), Longitude: Number(this.propertyLng) },
                title: 'Property',
                description: this.propertyAddressSearched || 'Property Location',
                mapIcon: {
                    path: pinPath,
                    fillColor: '#4A6B5E',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                    scale: 1.2
                }
            });
        }

        // Agent pins
        this.nearbyAgents.forEach((a, idx) => {
            if (a.latitude != null && a.longitude != null) {
                const isAssigned = a.isAgent2 || a.isAgent3;
                markers.push({
                    location: { Latitude: Number(a.latitude), Longitude: Number(a.longitude) },
                    title: (idx + 1) + '. ' + a.name,
                    description: (a.fullAddress || '') + (a.distanceLabel ? ' — ' + a.distanceLabel : ''),
                    value: a.id,
                    mapIcon: {
                        path: pinPath,
                        fillColor: isAssigned ? '#D97706' : '#2563EB',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 1.0
                    }
                });
            }
        });
        return markers;
    }

    get mapCenter() {
        if (this.propertyLat != null && this.propertyLng != null) {
            return { location: { Latitude: this.propertyLat, Longitude: this.propertyLng } };
        }
        return null;
    }

    get mapZoomLevel() {
        const r = parseFloat(this.assignRadius);
        if (r <= 1) return 14;
        if (r <= 3) return 12;
        if (r <= 5) return 11;
        if (r <= 10) return 10;
        return 9;
    }
    @track isLoadingAgents = false;
    @track isAssigning = false;
    @track assignAgentInfo = '';
    @track assignStep = 1;
    @track assignRadius = '5';
    @track assignedAgent2Name = '';
    @track assignedAgent3Name = '';

    // Step 3: Booking calendar for wizard
    @track afSelectedSlot = null; // { subKey, dayLabel, slotLabel, time, availId }
    @track afCalOffset = 0;
    @track afIsBooking = false;

    // Step 4: Email preview
    @track afEmailSubject = '';
    @track afEmailBody = '';
    @track afEmailTo = '';
    @track afEmailCc = '';
    @track afEmailBcc = '';
    @track afIsLoadingEmail = false;
    @track showAfAddressBook = false;
    @track afAddressBookContacts = [];
    @track afAddressBookSearch = '';
    _afAddressBookLoaded = false;

    // Step 5: Submitting
    @track afIsSubmitting = false;

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
    get isStep4() { return this.assignStep === 4; }
    get isStep5() { return this.assignStep === 5; }
    get step1Class() { return 'af-step' + (this.assignStep === 1 ? ' af-step-active' : '') + (this.assignStep > 1 ? ' af-step-done' : ''); }
    get step2Class() { return 'af-step' + (this.assignStep === 2 ? ' af-step-active' : '') + (this.assignStep > 2 ? ' af-step-done' : ''); }
    get step3Class() { return 'af-step' + (this.assignStep === 3 ? ' af-step-active' : '') + (this.assignStep > 3 ? ' af-step-done' : ''); }
    get step4Class() { return 'af-step' + (this.assignStep === 4 ? ' af-step-active' : '') + (this.assignStep > 4 ? ' af-step-done' : ''); }
    get step5Class() { return 'af-step' + (this.assignStep === 5 ? ' af-step-active' : ''); }
    get hasNearbyAgents() { return this.nearbyAgents.length > 0; }
    // Determine which agent was last assigned (for email template selection)
    get afLastAssignedSlot() {
        // Prefer the most recently assigned agent
        if (this.assignedAgent3Name && !this.assignedAgent2Name) return 'agent3';
        if (this.assignedAgent2Name && !this.assignedAgent3Name) return 'agent2';
        // If both, default to agent2
        return 'agent2';
    }
    get afEmailAgentNum() {
        return this.afLastAssignedSlot === 'agent3' ? 3 : 2;
    }
    get afEmailAgentName() {
        return this.afEmailAgentNum === 2 ? this.assignedAgent2Name : this.assignedAgent3Name;
    }
    get afEmailTemplateLabel() {
        return this.afEmailAgentNum === 2 ? 'Template 4b — Agent 2' : 'Template 4c — Agent 3';
    }

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

            // Update Vendor 2 Contact details
            if (this.formData.vendor2Id) {
                await updateVendorContact({
                    contactId: this.formData.vendor2Id,
                    mobile: this.formData.vendor2Mobile || null,
                    phone: this.formData.vendor2Phone || null,
                    email: this.formData.vendor2Email || null
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

            // Also save Vendor Availability if on the relevant stage
            if (this.showVendorAvailability) {
                try {
                    await this.saveVendorAvailabilityData();
                } catch (vaErr) {
                    console.error('Vendor availability save error:', vaErr);
                }
            }

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
    @track reassignSlot = null; // null = normal mode, 'agent1'|'agent2'|'agent3' = reassign specific slot

    get isReassignMode() { return !!this.reassignSlot; }
    get reassignLabel() {
        if (this.reassignSlot === 'agent1') return 'Agent 1';
        if (this.reassignSlot === 'agent2') return 'Agent 2';
        if (this.reassignSlot === 'agent3') return 'Agent 3';
        return '';
    }

    handleEditAgent(event) {
        const slot = event.currentTarget.dataset.slot;
        this.reassignSlot = slot;
        this.showAssignAgent = true;
        this.assignStep = 1;
        this.assignRadius = '5';
        this.nearbyAgents = [];
        this.assignAgentInfo = '';
        this.assignedAgent2Name = '';
        this.assignedAgent3Name = '';
    }

    handleOpenAssignAgent() {
        this.reassignSlot = null;
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
                this.propertyLat = result.propertyLatitude;
                this.propertyLng = result.propertyLongitude;
                this.propertyAddressSearched = result.propertyAddress || this.formData.propertyAddress || '';
                this.nearbyAgents = (result.agents || []).map(a => {
                    // Build search URLs from agent name + postcode
                    const outcode = a.postcode ? a.postcode.split(' ')[0] : '';
                    // Strip symbols but keep hyphens for Rightmove/Zoopla matching
                    const cleanName = (a.name || '').replace(/[–—/&.,()'"!@#$%^*+=]/g, ' ').replace(/\s{2,}/g, ' ').trim();
                    const rmName = encodeURIComponent(cleanName);
                    const rmUrl = `https://www.google.com/search?q=${rmName}+rightmove+estate+agent+${encodeURIComponent(a.city || outcode)}`;

                    // Build full address
                    const addrParts = [a.street, a.city, a.postcode].filter(Boolean);
                    const fullAddress = addrParts.join(', ');
                    const mapsQuery = encodeURIComponent(fullAddress || a.name);

                    return {
                        ...a,
                        fullAddress,
                        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
                        distanceLabel: a.distance + ' miles' + (a.duration ? ' (' + a.duration + ')' : '') + (a.distanceType === 'aerial' ? ' ✈' : ' 🚗'),
                        canAssignAgent2: !a.isAssigned && a.id !== this.formData.agent1Id,
                        canAssignAgent3: !a.isAssigned && a.id !== this.formData.agent1Id,
                        assignedLabel: a.isAgent2 ? 'Agent 2' : (a.isAgent3 ? 'Agent 3' : ''),
                        rowClass: 'af-row' + (a.isAssigned ? ' af-assigned' : ''),
                        phoneLink: a.phone ? 'tel:' + a.phone.replace(/\s/g, '') : '',
                        mobileLink: a.mobile ? 'tel:' + a.mobile.replace(/\s/g, '') : '',
                        mailtoLink: a.email ? 'mailto:' + a.email : '',
                        rightmoveSearchUrl: a.rightmoveUrl || rmUrl,
                        zooplaSearchUrl: `https://www.zoopla.co.uk/find-agents/${outcode.toLowerCase()}/?q=${encodeURIComponent(outcode)}&radius=0&company_name=${rmName}&search_source=find-agents-landing-page`,
                        hasRightmoveUrl: !!a.rightmoveUrl
                    };
                });
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

                if (this.assignedAgent2Name || this.assignedAgent3Name) {
                    this.loadBaSlots();
                    this.assignStep = 3;
                }
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed', variant: 'error' }));
        }
        this.isAssigning = false;
    }

    async handleReassignToSlot(event) {
        const agentId = event.currentTarget.dataset.id;
        const agentName = event.currentTarget.dataset.name;
        const slot = event.currentTarget.dataset.slot;
        this.isAssigning = true;
        try {
            const result = await assignAgent({ opportunityId: this.recordId, agentId: agentId, agentSlot: slot });
            if (result.status === 'success') {
                this.formData = { ...this.formData, [slot + 'Id']: agentId, [slot + 'Name']: agentName };

                // Track assignment for the reassigned slot
                if (slot === 'agent2') this.assignedAgent2Name = agentName;
                if (slot === 'agent3') this.assignedAgent3Name = agentName;

                // Mark agent as assigned in the list
                this.nearbyAgents = this.nearbyAgents.map(a => {
                    const isThisAgent = a.id === agentId;
                    const isAssigned = isThisAgent;
                    return {
                        ...a,
                        isAssigned,
                        assignedLabel: isThisAgent ? this.reassignLabel : '',
                        rowClass: 'af-row' + (isAssigned ? ' af-assigned' : '')
                    };
                });

                this.dispatchEvent(new ShowToastEvent({ title: 'Agent Reassigned', message: this.reassignLabel + ' updated to ' + agentName, variant: 'success' }));

                // Continue to booking calendar (step 3)
                this.loadBaSlots();
                this.assignStep = 3;
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

    // ── Step 3: Booking Calendar (reuses baAvailSlots data) ──
    getAfMonday() {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (this.afCalOffset * 7);
        d.setDate(diff); d.setHours(0, 0, 0, 0);
        return d;
    }

    get afCalDays() {
        const monday = this.getAfMonday();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday); d.setDate(monday.getDate() + i);
            const isToday = d.getTime() === today.getTime();
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            days.push({
                key: 'afd-' + i, idx: i, date: d,
                dayName: NhsApplicationDetailV2.VA_DAY_NAMES[d.getDay()],
                dayNum: d.getDate(), isToday, isWeekend,
                thClass: 'ba-cal-table-th' + (isToday ? ' va-th-today' : '') + (isWeekend ? ' va-th-weekend' : ''),
                dateStr: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
            });
        }
        return days;
    }

    get afCalRangeLabel() {
        const monday = this.getAfMonday();
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        return monday.getDate() + ' ' + MONTHS[monday.getMonth()] + ' – ' + sunday.getDate() + ' ' + MONTHS[sunday.getMonth()] + ' ' + sunday.getFullYear();
    }

    get afCalRows() {
        const days = this.afCalDays;
        const now = new Date();
        // Minimum booking time: current time + 1 hour (agents need 1 hour notice)
        const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000);
        const selectedKey = this.afSelectedSlot ? this.afSelectedSlot.subKey : null;
        return NhsApplicationDetailV2.BA_SLOT_LABELS.map((label, si) => {
            const isAm = si <= 3;
            const hour = NhsApplicationDetailV2.BA_SLOT_HOURS[si];
            const cells = days.map((day, di) => {
                const dateStr = day.dateStr;
                const slotRec = this.baAvailSlots.find(s => s.date === dateStr);
                const vendorAvail = slotRec && ((isAm && slotRec.am) || (!isAm && slotRec.pm));
                // Slot start time must be at least 1 hour from now
                const slotStart = new Date(day.date);
                slotStart.setHours(hour, 0, 0, 0);
                const tooSoon = slotStart.getTime() < minBookingTime.getTime();
                const available = vendorAvail && !tooSoon;

                const subSlots = ['00', '15', '30', '45'].map(m => {
                    const time = String(hour).padStart(2, '0') + ':' + m;
                    const subKey = 'af-' + di + '-' + si + '-' + time;
                    const dayLabel = day.dayName + ' ' + day.dayNum + ' ' + MONTHS[day.date.getMonth()];
                    const isSelected = subKey === selectedKey;
                    return {
                        key: subKey, subKey, time, dayLabel,
                        availId: slotRec ? slotRec.id : null,
                        chipClass: 'ba-chip' + (isAm ? ' ba-chip-am' : ' ba-chip-pm') + (isSelected ? ' af-chip-selected' : '')
                    };
                });
                return {
                    key: 'afc-' + di + '-' + si, available,
                    tdClass: 'ba-cal-td' + (day.isWeekend ? ' va-td-weekend' : ''),
                    subSlots
                };
            });
            return {
                key: 'afr-' + si, label,
                tdLabelClass: isAm ? 'ba-td-am' : 'ba-td-pm',
                cells
            };
        });
    }

    handleAfSlotClick(event) {
        const subKey = event.currentTarget.dataset.subKey;
        const dayLabel = event.currentTarget.dataset.dayLabel;
        const slotLabel = event.currentTarget.dataset.slotLabel;
        const time = event.currentTarget.dataset.time;
        const availId = event.currentTarget.dataset.availId;
        this.afSelectedSlot = { subKey, dayLabel, slotLabel, time, availId };
    }

    handleAfCalPrev() { this.afCalOffset--; }
    handleAfCalNext() { this.afCalOffset++; }
    handleAfCalToday() { this.afCalOffset = 0; }

    async handleAfStep3Next() {
        if (!this.afSelectedSlot) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Select a Slot', message: 'Please select a time slot to continue', variant: 'warning' }));
            return;
        }
        // Book the appointment now so email template has the data
        this.afIsBooking = true;
        try {
            const agentSlot = this.afLastAssignedSlot;
            await bookAppointment({
                opportunityId: this.recordId,
                agentSlot: agentSlot,
                availabilityId: this.afSelectedSlot.availId,
                selectedTime: this.afSelectedSlot.time
            });
            // Refresh record so template gets appointment fields
            await refreshApex(this.wiredRecordResult);
            this.loadAfEmailTemplate();
            this.assignStep = 4;
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to book appointment', variant: 'error' }));
        }
        this.afIsBooking = false;
    }

    handleAfBackToStep2() { this.assignStep = 2; }

    // ── Step 4: Load email template ──
    async loadAfEmailTemplate() {
        this.afIsLoadingEmail = true;
        const agentNum = this.afEmailAgentNum;
        this.afEmailTo = this.formData['agent' + agentNum + 'Email'] || '';
        const templateId = NhsApplicationDetailV2.AGENT_TEMPLATE_IDS[agentNum] || null;

        try {
            if (templateId) {
                const rendered = await getRenderedTemplate({ templateId, opportunityId: this.recordId });
                this.afEmailSubject = rendered.subject || '';
                this.afEmailBody = rendered.body || '';
            }
        } catch (e) {
            this.afEmailSubject = 'Valuation Appointment Confirmation';
            this.afEmailBody = '';
        }
        this.afIsLoadingEmail = false;
    }

    handleAfEmailToChange(event) { this.afEmailTo = event.target.value; }
    handleAfEmailSubjectChange(event) { this.afEmailSubject = event.target.value; }
    handleAfEmailCcChange(event) { this.afEmailCc = event.target.value; }
    handleAfEmailBccChange(event) { this.afEmailBcc = event.target.value; }
    handleAfBackToStep3() { this.assignStep = 3; }

    // Address book for agent email step
    async handleOpenAfAddressBook() {
        this.showAfAddressBook = true;
        this.afAddressBookSearch = '';
        if (!this._afAddressBookLoaded) {
            try {
                const results = await getAddressBook({ opportunityId: this.recordId });
                this.afAddressBookContacts = (results || []).map((c, i) => ({
                    key: 'afab-' + i, role: c.role, name: c.name, email: c.email, category: c.category
                }));
                this._afAddressBookLoaded = true;
            } catch (e) {
                // Fallback: build from formData
                const contacts = [];
                const fd = this.formData;
                if (fd.vendorEmail) contacts.push({ key: 'afab-v1', role: 'Vendor 1', name: fd.vendor1Name, email: fd.vendorEmail, category: 'vendor' });
                if (fd.vendor2Email) contacts.push({ key: 'afab-v2', role: 'Vendor 2', name: fd.vendor2Name, email: fd.vendor2Email, category: 'vendor' });
                if (fd.agent1Email) contacts.push({ key: 'afab-a1', role: 'Agent 1', name: fd.agent1Name, email: fd.agent1Email, category: 'agent' });
                if (fd.agent2Email) contacts.push({ key: 'afab-a2', role: 'Agent 2', name: fd.agent2Name, email: fd.agent2Email, category: 'agent' });
                if (fd.agent3Email) contacts.push({ key: 'afab-a3', role: 'Agent 3', name: fd.agent3Name, email: fd.agent3Email, category: 'agent' });
                this.afAddressBookContacts = contacts;
                this._afAddressBookLoaded = true;
            }
        }
    }

    handleCloseAfAddressBook() { this.showAfAddressBook = false; }
    handleAfAddressBookSearch(event) { this.afAddressBookSearch = event.target.value; }

    get filteredAfAddressBook() {
        const q = this.afAddressBookSearch.toLowerCase();
        if (!q) return this.afAddressBookContacts;
        return this.afAddressBookContacts.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.role || '').toLowerCase().includes(q)
        );
    }

    get hasAfAddressBookContacts() { return this.filteredAfAddressBook.length > 0; }

    handleAfSelectContactTo(event) {
        const email = event.currentTarget.dataset.email;
        if (this.afEmailTo) {
            const existing = this.afEmailTo.split(',').map(e => e.trim().toLowerCase());
            if (!existing.includes(email.toLowerCase())) this.afEmailTo += ', ' + email;
        } else {
            this.afEmailTo = email;
        }
        this.showAfAddressBook = false;
    }

    handleAfSelectContactCc(event) {
        const email = event.currentTarget.dataset.email;
        if (this.afEmailCc) {
            const existing = this.afEmailCc.split(',').map(e => e.trim().toLowerCase());
            if (!existing.includes(email.toLowerCase())) this.afEmailCc += ', ' + email;
        } else {
            this.afEmailCc = email;
        }
        this.showAfAddressBook = false;
    }

    handleAfStep4Next() {
        this.assignStep = 5;
    }

    // ── Step 5: Summary & Submit ──
    get afSummaryItems() {
        const items = [];
        if (this.assignedAgent2Name) items.push({ label: 'Agent 2', value: this.assignedAgent2Name, cls: 'af-sum-a2' });
        if (this.assignedAgent3Name) items.push({ label: 'Agent 3', value: this.assignedAgent3Name, cls: 'af-sum-a3' });
        if (this.afSelectedSlot) items.push({ label: 'Appointment', value: this.afSelectedSlot.dayLabel + ' at ' + this.afSelectedSlot.time, cls: '' });
        if (this.afEmailTo) items.push({ label: 'Email To', value: this.afEmailTo, cls: '' });
        if (this.afEmailSubject) items.push({ label: 'Email Subject', value: this.afEmailSubject, cls: '' });
        return items;
    }

    handleAfBackToStep4() { this.assignStep = 4; }

    async handleAfSubmit() {
        this.afIsSubmitting = true;
        try {
            // Booking already done in Step 3 — send the email
            if (this.afEmailTo && this.afEmailSubject) {
                const agentNum = this.afEmailAgentNum;
                const templateId = NhsApplicationDetailV2.AGENT_TEMPLATE_IDS[agentNum] || null;
                await sendEmailComplete({
                    opportunityId: this.recordId,
                    toAddress: this.afEmailTo,
                    subject: this.afEmailSubject,
                    body: this.afEmailBody,
                    ccAddress: this.afEmailCc || '',
                    bccAddress: this.afEmailBcc || '',
                    templateId: templateId,
                    contentDocumentIds: []
                });

                // Stamp Last Agent X Emailed On
                const fields = { Id: this.recordId };
                fields['Last_Agent_' + agentNum + '_Emailed_On__c'] = new Date().toISOString();
                try { await updateRecord({ fields }); } catch (e) { /* silent */ }
            }

            this.afIsSubmitting = false;
            this.showAssignAgent = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Agent assigned, appointment booked, and email sent',
                variant: 'success'
            }));
            refreshApex(this.wiredRecordResult);
            this.loadBaSlots();
        } catch (e) {
            this.afIsSubmitting = false;
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || e.message || 'Submission failed', variant: 'error' }));
        }
    }

    handleConfirmAssignment() {
        this.showAssignAgent = false;
        this.dispatchEvent(new ShowToastEvent({ title: 'Agents Assigned', message: 'Agent 2: ' + this.assignedAgent2Name + ' | Agent 3: ' + this.assignedAgent3Name, variant: 'success' }));
        refreshApex(this.wiredRecordResult);
    }

    // ── Comms Hub ─────────────────────────────────────────────────────────────
    toggleCommsHub() {
        this.showCommsHub = !this.showCommsHub;
    }

    // ── Edit Application (Admin Only) ──────────────────────────────────────
    handleOpenEditApp() {
        this.editFields = {
            vendorExpectations: this.formData.vendorExpectations || '',
            etaCompEnd: this.formData.etaCompEnd || '',
            receivedDate: this.formData.receivedDate || '',
            scheme: this.formData.scheme || '',
            development: this.formData.development || '',
            plot: this.formData.plot || '',
            propertyDescription: this.formData.propertyDescription || '',
            propertyAddress: this.formData.propertyAddress || '',
            notes: this.formData.notes || ''
        };
        this.showEditApp = true;
    }

    handleCloseEditApp() { this.showEditApp = false; }
    handleCloseVaLightbox() { this.showVaLightbox = false; }

    handleEditFieldChange(event) {
        const field = event.target.dataset.field;
        this.editFields = { ...this.editFields, [field]: event.target.value };
    }

    async handleSaveEditApp() {
        try {
            const fields = { Id: this.recordId };
            if (this.editFields.vendorExpectations !== this.formData.vendorExpectations) fields['Client_Expectations__c'] = this.editFields.vendorExpectations ? parseFloat(this.editFields.vendorExpectations.replace(/[^0-9.]/g, '')) : null;
            if (this.editFields.etaCompEnd !== this.formData.etaCompEnd) fields['ETA_Comp_End__c'] = this.editFields.etaCompEnd || null;
            if (this.editFields.receivedDate !== this.formData.receivedDate) fields['Date_of_Application_Received__c'] = this.editFields.receivedDate || null;
            if (this.editFields.scheme !== this.formData.scheme) fields['Scheme__c'] = this.editFields.scheme || null;
            if (this.editFields.development !== this.formData.development) fields['Development__c'] = this.editFields.development || null;
            if (this.editFields.plot !== this.formData.plot) fields['Plot__c'] = this.editFields.plot || null;
            if (this.editFields.propertyDescription !== this.formData.propertyDescription) fields['Property_Description__c'] = this.editFields.propertyDescription || null;
            if (this.editFields.propertyAddress !== this.formData.propertyAddress) fields['Property_Address__c'] = this.editFields.propertyAddress || null;
            if (this.editFields.notes !== this.formData.notes) fields['Notes__c'] = this.editFields.notes || null;

            await updateRecord({ fields });
            this.showEditApp = false;
            refreshApex(this.wiredRecordResult);
            this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: 'Application updated successfully.', variant: 'success' }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to save', variant: 'error' }));
        }
    }

    handleOpenCommsHub() {
        this.showCommsHub = true;
        this._commsHubAutoCompose = false;
    }

    handleEmailVendor() {
        this.showCommsHub = true;
        this._commsHubAutoCompose = true;
    }

    @track showCallPopup = false;

    get callContacts() {
        const contacts = [];
        const fd = this.formData;

        // Vendor 1
        const v1Num = fd.vendorMobile || fd.vendorPhone || '';
        if (v1Num) {
            contacts.push({ key: 'v1', role: 'Vendor 1', name: fd.vendor1Name || 'Vendor 1', number: v1Num, href: 'tel:' + v1Num, avatarClass: 'cc-avatar cc-vendor' });
        }

        // Vendor 2
        if (fd.vendor2Id) {
            const v2Num = fd.vendor2Mobile || fd.vendor2Phone || '';
            if (v2Num) {
                contacts.push({ key: 'v2', role: 'Vendor 2', name: fd.vendor2Name || 'Vendor 2', number: v2Num, href: 'tel:' + v2Num, avatarClass: 'cc-avatar cc-vendor' });
            }
        }

        // Agent 1
        if (fd.agent1Phone) {
            contacts.push({ key: 'a1', role: 'Agent 1', name: fd.agent1Name || 'Agent 1', number: fd.agent1Phone, href: 'tel:' + fd.agent1Phone, avatarClass: 'cc-avatar cc-agent' });
        }

        // Agent 2
        if (fd.agent2Phone) {
            contacts.push({ key: 'a2', role: 'Agent 2', name: fd.agent2Name || 'Agent 2', number: fd.agent2Phone, href: 'tel:' + fd.agent2Phone, avatarClass: 'cc-avatar cc-agent' });
        }

        // Agent 3
        if (fd.agent3Phone) {
            contacts.push({ key: 'a3', role: 'Agent 3', name: fd.agent3Name || 'Agent 3', number: fd.agent3Phone, href: 'tel:' + fd.agent3Phone, avatarClass: 'cc-avatar cc-agent' });
        }

        return contacts;
    }

    get hasCallContacts() { return this.callContacts.length > 0; }

    handleCallVendor() {
        this.showCallPopup = !this.showCallPopup;
    }

    handleCloseCallPopup() {
        this.showCallPopup = false;
    }

    handleCloseCommsHub() {
        this.showCommsHub = false;
        this._commsHubAutoCompose = false;
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
    // ── Valuation Report Upload ──────────────────────────────────────────────
    @track valReportUploading = { 1: false, 2: false, 3: false };

    get showValReport1() { return !!this.formData.agent1ValReportId; }
    get showValReport2() { return !!this.formData.agent2ValReportId; }
    get showValReport3() { return !!this.formData.agent3ValReportId; }
    get valReport1Uploading() { return this.valReportUploading[1]; }
    get valReport2Uploading() { return this.valReportUploading[2]; }
    get valReport3Uploading() { return this.valReportUploading[3]; }

    handleValReportClick(event) {
        const agentNum = parseInt(event.currentTarget.dataset.agent, 10);
        const input = this.template.querySelector('input[data-val-file="' + agentNum + '"]');
        if (input) input.click();
    }

    async handleValReportUpload(event) {
        const agentNum = parseInt(event.target.dataset.valFile, 10);
        const file = event.target.files[0];
        if (!file) return;

        this.valReportUploading = { ...this.valReportUploading, [agentNum]: true };

        try {
            const base64 = await this._fileToBase64(file);
            const result = await uploadValuationReport({
                opportunityId: this.recordId,
                agentNum,
                fileName: file.name,
                base64Content: base64
            });

            if (result.status === 'success') {
                this.formData = {
                    ...this.formData,
                    ['agent' + agentNum + 'ValReportId']: result.fileId,
                    ['agent' + agentNum + 'ValReportName']: result.fileName
                };
                this.dispatchEvent(new ShowToastEvent({ title: 'Uploaded', message: 'Valuation report uploaded for Agent ' + agentNum, variant: 'success' }));
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || e.message || 'Upload failed', variant: 'error' }));
        } finally {
            this.valReportUploading = { ...this.valReportUploading, [agentNum]: false };
            event.target.value = ''; // reset so same file can be re-uploaded
        }
    }

    async handleValReportRemove(event) {
        const agentNum = parseInt(event.currentTarget.dataset.agent, 10);
        if (!confirm('Remove the uploaded valuation report for Agent ' + agentNum + '? (The file will remain in Box.)')) return;

        try {
            await removeValuationReport({ opportunityId: this.recordId, agentNum });
            this.formData = {
                ...this.formData,
                ['agent' + agentNum + 'ValReportId']: '',
                ['agent' + agentNum + 'ValReportName']: ''
            };
            this.dispatchEvent(new ShowToastEvent({ title: 'Removed', message: 'Valuation report reference removed', variant: 'success' }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to remove', variant: 'error' }));
        }
    }

    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.substring(result.indexOf(',') + 1);
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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
    // ── EMAIL AGENT (from Book Agents)
    // ═══════════════════════════════════════════════════════════════════════════

    @track showEmailAgent = false;
    @track emailAgentNum = null;
    @track emailAgentTo = '';
    @track emailSubject = '';
    @track emailBody = '';
    @track emailTemplateId = null;
    @track isLoadingEmail = false;
    @track isSendingEmail = false;

    // Template IDs: 4a = Agent 1, 4b = Agent 2, 4c = Agent 3
    static AGENT_TEMPLATE_IDS = {
        1: '00XKG00000121b42AA', // 04a - Agent 1 Valuation Confirmation
        2: '00XKG00000121bI2AQ', // 04b - Agent 2 Valuation Confirmation
        3: '00XKG00000121bJ2AQ'  // 04c - Agent 3 Valuation Confirmation
    };

    async handleEmailAgent(event) {
        const agentNum = parseInt(event.currentTarget.dataset.agent, 10);
        const agentEmail = this.formData['agent' + agentNum + 'Email'] || '';

        this.emailAgentNum = agentNum;
        this.emailAgentTo = agentEmail;
        this.emailSubject = '';
        this.emailBody = '';
        this.emailTemplateId = NhsApplicationDetailV2.AGENT_TEMPLATE_IDS[agentNum] || null;
        this.showEmailAgent = true;
        this.isLoadingEmail = true;

        try {
            if (this.emailTemplateId) {
                const rendered = await getRenderedTemplate({ templateId: this.emailTemplateId, opportunityId: this.recordId });
                this.emailSubject = rendered.subject || '';
                this.emailBody = rendered.body || '';
            }
        } catch (e) {
            // Template render failed — user can compose manually
        }
        this.isLoadingEmail = false;
    }

    handleAppNotesChange(event) {
        this.formData = { ...this.formData, notes: event.target.value };
    }

    handleEmailSubjectChange(event) { this.emailSubject = event.target.value; }
    handleCloseEmailAgent() { this.showEmailAgent = false; }

    async handleSendAgentEmail() {
        if (!this.emailAgentTo || !this.emailSubject) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Email address and subject are required', variant: 'error' }));
            return;
        }
        this.isSendingEmail = true;
        try {
            const result = await sendEmail({
                opportunityId: this.recordId,
                toAddress: this.emailAgentTo,
                subject: this.emailSubject,
                body: this.emailBody,
                ccAddress: '',
                templateId: this.emailTemplateId
            });
            if (result.status === 'success') {
                // Stamp the "Last Agent X Emailed On" field
                const emailedField = 'Last_Agent_' + this.emailAgentNum + '_Emailed_On__c';
                const fields = {};
                fields['Id'] = this.recordId;
                fields[emailedField] = new Date().toISOString();
                try { await updateRecord({ fields }); } catch (e) { /* silent */ }

                this.showEmailAgent = false;
                this.dispatchEvent(new ShowToastEvent({ title: 'Email Sent', message: 'Email sent to Agent ' + this.emailAgentNum, variant: 'success' }));
                refreshApex(this.wiredRecordResult);
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed to send', variant: 'error' }));
        }
        this.isSendingEmail = false;
    }

    get emailAgentTitle() { return 'Email Agent ' + (this.emailAgentNum || ''); }
    get emailAgentName() { return this.emailAgentNum ? (this.formData['agent' + this.emailAgentNum + 'Name'] || '') : ''; }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── WILL REPORT UPLOAD (Valuations Ready stage)
    // ═══════════════════════════════════════════════════════════════════════════

    @track wrUploading = false;
    @track wrUploadSuccess = false;
    get isValuationsReady() { return this.formData.nhsProcess === 'Valuations Ready'; }

    async handleWrUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        this.wrUploading = true;
        this.wrUploadSuccess = false;

        try {
            // Ensure Box access token
            await ensureAccessToken();

            // Find the Will Report folder inside the property's Box folder
            let willFolderId = null;
            if (this.recordId) {
                const oppData = await getBoxFolderForOpportunity({ opportunityId: this.recordId });
                if (oppData.boxFolderId) {
                    // Browse property folder to find Will Report subfolder
                    const propResult = await browseFolderById({ folderId: oppData.boxFolderId });
                    if (propResult.status === 'success') {
                        const willFolder = (propResult.entries || []).find(e => e.type === 'folder' && e.name === 'Will Report');
                        if (willFolder) willFolderId = willFolder.id;
                    }
                }
            }

            if (!willFolderId) {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Will Report folder not found in Box. Please create the NHS folder structure first.', variant: 'error' }));
                this.wrUploading = false;
                return;
            }

            // Upload each file to Box Will Report folder
            for (const file of uploadedFiles) {
                await uploadFileFromContentDoc({
                    folderId: willFolderId,
                    contentDocumentId: file.documentId
                });
            }

            this.wrUploadSuccess = true;
            this.dispatchEvent(new ShowToastEvent({ title: 'Uploaded', message: 'Will Report uploaded to Box', variant: 'success' }));

            // Refresh Box file browser
            const boxBrowser = this.template.querySelector('c-nhs-box-browser');
            if (boxBrowser && boxBrowser.handleRefresh) {
                boxBrowser.handleRefresh();
            }

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => { this.wrUploadSuccess = false; }, 4000);
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Upload failed', variant: 'error' }));
        }
        this.wrUploading = false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── FIGURES TO CHASE (Stage 4)
    // ═══════════════════════════════════════════════════════════════════════════

    get ftcSummary() {
        let booked = 0;
        [1, 2, 3].forEach(n => { if (this.formData['agent' + n + 'Appt']) booked++; });
        return booked + ' of 3 agents booked';
    }

    get ftcRows() {
        const agents = [
            { key: 'ftc-1', num: 1, name: this.formData.agent1Name || 'Agent 1', dotClass: 'ba-dot ba-dot-1', appt: this.formData.agent1Appt },
            { key: 'ftc-2', num: 2, name: this.formData.agent2Name || 'Agent 2', dotClass: 'ba-dot ba-dot-2', appt: this.formData.agent2Appt },
            { key: 'ftc-3', num: 3, name: this.formData.agent3Name || 'Agent 3', dotClass: 'ba-dot ba-dot-3', appt: this.formData.agent3Appt }
        ];

        const now = new Date();

        return agents.map((a, i) => {
            const isDV = !!this.formData['agent' + a.num + 'DesktopVal'];
            let dateDisplay = '—';
            let timeDisplay = '—';
            let apptPast = false;

            if (isDV) {
                dateDisplay = 'Desktop Valuation';
                timeDisplay = 'N/A';
                apptPast = true; // Desktop = no visit needed, treat as done
            } else if (a.appt) {
                const d = new Date(a.appt);
                dateDisplay = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
                const h = d.getHours();
                const m = String(d.getMinutes()).padStart(2, '0');
                const ampm = h >= 12 ? 'pm' : 'am';
                const hour = h % 12 || 12;
                timeDisplay = hour + ':' + m + ' ' + ampm;
                apptPast = d.getTime() < now.getTime();
            }

            const initial = parseFloat(this.formData['agent' + a.num + 'InitialPrice']) || 0;
            const target = parseFloat(this.formData['agent' + a.num + 'TargetSale']) || 0;
            const bottom = parseFloat(this.formData['agent' + a.num + 'BottomLine']) || 0;
            const hasAllFigures = initial > 0 && target > 0 && bottom > 0;
            const figuresAvailable = apptPast && hasAllFigures;

            return {
                ...a, dateDisplay, timeDisplay, isDV,
                rowClass: 'ftc-row' + (i % 2 === 0 ? '' : ' ftc-row-alt'),
                figuresAvailable,
                statusLabel: figuresAvailable ? '✓ Figures Available' : '⏳ Figures Waiting',
                statusClass: figuresAvailable ? 'ftc-status-available' : 'ftc-status-badge'
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── BOOK AGENTS (Stage 3)
    // ═══════════════════════════════════════════════════════════════════════════

    @track baBookings = {}; // { 1: { subKey, dateLabel, slotLabel, time }, 2: ..., 3: ... }
    @track baCalExpanded = true;
    @track baCalOffset = 0;
    @track baAmendingAgent = null;
    @track baAvailSlots = []; // from Apex

    static BA_SLOT_LABELS = [
        'Before 9 am', '9 am – 10 am', '10 am – 11 am', '11 am – 12 pm',
        '12 pm – 1 pm', '1 pm – 2 pm', '2 pm – 3 pm', '3 pm – 4 pm', '4 pm – 5 pm'
    ];
    static BA_SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

    get ba1Booked() { return !!this.baBookings[1]; }
    get ba2Booked() { return !!this.baBookings[2]; }
    get ba3Booked() { return !!this.baBookings[3]; }
    get ba1DateDisplay() { return this.baBookings[1]?.dateLabel || ''; }
    get ba1TimeDisplay() { return this.baBookings[1] ? this.baBookings[1].time + ' (' + this.baBookings[1].slotLabel + ')' : ''; }
    get ba2DateDisplay() { return this.baBookings[2]?.dateLabel || ''; }
    get ba2TimeDisplay() { return this.baBookings[2] ? this.baBookings[2].time + ' (' + this.baBookings[2].slotLabel + ')' : ''; }
    get ba3DateDisplay() { return this.baBookings[3]?.dateLabel || ''; }
    get ba3TimeDisplay() { return this.baBookings[3] ? this.baBookings[3].time + ' (' + this.baBookings[3].slotLabel + ')' : ''; }
    get bookingCountLabel() {
        const count = Object.keys(this.baBookings).length;
        return count + ' of 3 booked';
    }
    get baCalToggleIcon() { return this.baCalExpanded ? '▾' : '▸'; }

    get baCalRangeLabel() {
        const monday = this.getBaMonday();
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        return monday.getDate() + ' ' + MONTHS[monday.getMonth()] + ' ' + monday.getFullYear() +
            ' – ' + sunday.getDate() + ' ' + MONTHS[sunday.getMonth()] + ' ' + sunday.getFullYear();
    }

    getBaMonday() {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (this.baCalOffset * 7);
        d.setDate(diff); d.setHours(0, 0, 0, 0);
        return d;
    }

    async loadBaSlots() {
        try {
            const rawSlots = await getAvailableSlots({ opportunityId: this.recordId });
            // Normalize date to string format YYYY-MM-DD for comparison
            this.baAvailSlots = (rawSlots || []).map(s => ({
                ...s,
                date: s.date ? String(s.date) : ''
            }));
            // Pre-populate bookings from existing appointment data
            [1, 2, 3].forEach(n => {
                const appt = this.formData['agent' + n + 'Appt'];
                if (appt) {
                    const d = new Date(appt);
                    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    const dateLabel = dayNames[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
                    const h = d.getHours();
                    const m = String(d.getMinutes()).padStart(2, '0');
                    const si = h >= 8 ? h - 8 : 0;
                    const slotLabel = si < NhsApplicationDetailV2.BA_SLOT_LABELS.length ? NhsApplicationDetailV2.BA_SLOT_LABELS[si] : '';
                    this.baBookings = { ...this.baBookings, [n]: {
                        subKey: '', dateLabel, slotLabel, time: String(h).padStart(2, '0') + ':' + m
                    }};
                }
            });
        } catch (e) { /* silent */ }
    }

    get baCalDays() {
        const monday = this.getBaMonday();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday); d.setDate(monday.getDate() + i);
            const isToday = d.getTime() === today.getTime();
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            days.push({
                key: 'bd-' + i, idx: i, date: d, dayName: NhsApplicationDetailV2.VA_DAY_NAMES[d.getDay()],
                dayNum: d.getDate(), isToday, isWeekend,
                thClass: 'ba-cal-table-th' + (isToday ? ' va-th-today' : '') + (isWeekend ? ' va-th-weekend' : ''),
                dateStr: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
            });
        }
        return days;
    }

    get baCalRows() {
        const days = this.baCalDays;
        const now = new Date();
        // Minimum booking time: current time + 1 hour (agents need 1 hour notice)
        const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000);
        return NhsApplicationDetailV2.BA_SLOT_LABELS.map((label, si) => {
            const isAm = si <= 3;
            const hour = NhsApplicationDetailV2.BA_SLOT_HOURS[si];
            const cells = days.map((day, di) => {
                // Check if this slot is available from vendor availability data
                const dateStr = day.dateStr;
                const slotRec = this.baAvailSlots.find(s => s.date === dateStr);
                const vendorAvail = slotRec && ((isAm && slotRec.am) || (!isAm && slotRec.pm));

                // Slot start must be at least 1 hour from now
                const slotStart = new Date(day.date);
                slotStart.setHours(hour, 0, 0, 0);
                const tooSoon = slotStart.getTime() < minBookingTime.getTime();

                const available = vendorAvail && !tooSoon;

                const subSlots = ['00', '15', '30', '45'].map(m => {
                    const time = String(hour).padStart(2, '0') + ':' + m;
                    const subKey = di + '-' + si + '-' + time;
                    const dayLabel = day.dayName + ' ' + day.dayNum + ' ' + MONTHS[day.date.getMonth()];

                    // Check if any agent is booked here
                    const bookedAgents = [];
                    [1, 2, 3].forEach(n => {
                        if (this.baBookings[n] && this.baBookings[n].subKey === subKey) bookedAgents.push(n);
                    });
                    const hasAgents = bookedAgents.length > 0;

                    return {
                        key: 'sub-' + di + '-' + si + '-' + m,
                        subKey, time, dayLabel, hasAgents,
                        chipClass: 'ba-chip' + (isAm ? ' ba-chip-am' : ' ba-chip-pm') + (hasAgents ? ' ba-chip-booked' : ''),
                        agentDots: bookedAgents.map(n => ({ key: 'dot-' + n, dotClass: 'ba-dot ba-dot-' + n }))
                    };
                });

                return {
                    key: 'cell-' + di + '-' + si, available,
                    tdClass: available ? (isAm ? 'ba-td-avail-am' : 'ba-td-avail-pm') : 'ba-td-unavail',
                    subSlots
                };
            });

            return {
                key: 'row-' + si, label,
                tdLabelClass: isAm ? 'ba-td-am' : 'ba-td-pm',
                cells
            };
        });
    }

    handleBaToggleCal() { this.baCalExpanded = !this.baCalExpanded; }
    handleBaCalNavStop(event) { event.stopPropagation(); }
    handleBaCalPrev() { this.baCalOffset--; }
    handleBaCalNext() { this.baCalOffset++; }
    handleBaCalToday() { this.baCalOffset = 0; }

    // Agent picker popover state
    @track showBaPicker = false;
    @track baPickerDayLabel = '';
    @track baPickerSlotLabel = '';
    @track baPickerTime = '';
    @track baPickerSubKey = '';
    @track baPickerSlotRec = null;
    @track baPickerStyle = '';

    get baPicker1BookedHere() { return this.baBookings[1]?.subKey === this.baPickerSubKey; }
    get baPicker2BookedHere() { return this.baBookings[2]?.subKey === this.baPickerSubKey; }
    get baPicker3BookedHere() { return this.baBookings[3]?.subKey === this.baPickerSubKey; }
    get baPicker1BookedElsewhere() { return !this.formData.agent1DesktopVal && !!this.baBookings[1] && this.baBookings[1].subKey !== this.baPickerSubKey; }
    get baPicker2BookedElsewhere() { return !this.formData.agent2DesktopVal && !!this.baBookings[2] && this.baBookings[2].subKey !== this.baPickerSubKey; }
    get baPicker3BookedElsewhere() { return !this.formData.agent3DesktopVal && !!this.baBookings[3] && this.baBookings[3].subKey !== this.baPickerSubKey; }
    get baPicker1IsDV() { return !!this.formData.agent1DesktopVal; }
    get baPicker2IsDV() { return !!this.formData.agent2DesktopVal; }
    get baPicker3IsDV() { return !!this.formData.agent3DesktopVal; }

    handleBaAmend(event) {
        const agentNum = event.currentTarget.dataset.agent;
        this.baAmendingAgent = agentNum;
        this.baCalExpanded = true;
    }

    // Cancel booking — two-step confirmation with reason
    @track baCancelAgent = null; // which agent is being cancelled (1, 2, 3)
    @track baCancelStep = 0; // 0=none, 1=first confirm, 2=reason
    @track baCancelReason = '';

    handleBaCancel(event) {
        const agentNum = parseInt(event.currentTarget.dataset.agent, 10);
        this.baCancelAgent = agentNum;
        this.baCancelStep = 1;
        this.baCancelReason = '';
    }

    handleBaCancelKeep() {
        this.baCancelAgent = null;
        this.baCancelStep = 0;
    }

    handleBaCancelProceed() {
        this.baCancelStep = 2;
    }

    handleBaCancelReasonChange(event) {
        this.baCancelReason = event.target.value;
    }

    async handleBaCancelConfirm() {
        const agentNum = this.baCancelAgent;
        if (!agentNum) return;
        const slot = 'agent' + agentNum;
        const agentName = this.formData[slot + 'Name'] || 'Agent ' + agentNum;
        const reason = this.baCancelReason.trim();

        try {
            // Capture slot info BEFORE deleting
            const booking = this.baBookings[agentNum];
            const slotInfo = booking ? booking.dateLabel + ' ' + booking.time : 'N/A';

            // Clear the appointment
            await bookAppointment({
                opportunityId: this.recordId,
                agentSlot: slot,
                availabilityId: null,
                selectedTime: null
            });

            const newBookings = { ...this.baBookings };
            delete newBookings[agentNum];
            this.baBookings = newBookings;

            // Clear appointment from formData immediately for instant UI update
            this.formData = { ...this.formData, ['agent' + agentNum + 'Appt']: null };

            const noteText = 'BOOKING CANCELLED — ' + agentName + '\nSlot: ' + slotInfo + '\nReason: ' + (reason || 'No reason provided');
            await saveNote({ noteText: noteText, opportunityId: this.recordId });
            this.loadVendorNotes();

            this.baCancelAgent = null;
            this.baCancelStep = 0;
            this.baCancelReason = '';

            this.dispatchEvent(new ShowToastEvent({ title: 'Booking Cancelled', message: agentName + ' booking cancelled', variant: 'info' }));
            refreshApex(this.wiredRecordResult);
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed', variant: 'error' }));
        }
    }

    get showBaCancel1() { return this.baCancelStep >= 1 && this.baCancelAgent === 1; }
    get showBaCancel2() { return this.baCancelStep >= 1 && this.baCancelAgent === 2; }
    get showBaCancel3() { return this.baCancelStep >= 1 && this.baCancelAgent === 3; }
    get isBaCancelStep1() { return this.baCancelStep === 1; }
    get isBaCancelStep2() { return this.baCancelStep === 2; }
    get baCancelAgentName() {
        if (!this.baCancelAgent) return '';
        return this.formData['agent' + this.baCancelAgent + 'Name'] || 'Agent ' + this.baCancelAgent;
    }

    handleBaSlotClick(event) {
        event.stopPropagation();
        const subKey = event.currentTarget.dataset.subKey;
        const dayLabel = event.currentTarget.dataset.dayLabel;
        const slotLabel = event.currentTarget.dataset.slotLabel;
        const time = event.currentTarget.dataset.time;

        // Find the slot record
        const days = this.baCalDays;
        const diStr = subKey.split('-')[0];
        const day = days[parseInt(diStr, 10)];
        if (!day) return;
        const slotRec = this.baAvailSlots.find(s => s.date === day.dateStr);
        if (!slotRec) return;

        // Position the popover near the clicked chip
        const rect = event.currentTarget.getBoundingClientRect();
        let top = rect.bottom + 8;
        let left = rect.left;
        if (top + 220 > window.innerHeight) top = rect.top - 220;
        if (left + 260 > window.innerWidth) left = window.innerWidth - 265;

        this.baPickerSubKey = subKey;
        this.baPickerDayLabel = dayLabel;
        this.baPickerSlotLabel = slotLabel;
        this.baPickerTime = time;
        this.baPickerSlotRec = slotRec;
        this.baPickerStyle = 'top:' + top + 'px;left:' + left + 'px;';
        this.showBaPicker = true;
    }

    handleBaClosePicker() { this.showBaPicker = false; }
    handleBaPickerStop(event) { event.stopPropagation(); }

    async handleBaPickerBook(event) {
        event.stopPropagation();
        const agentNum = parseInt(event.currentTarget.dataset.agent, 10);
        if (!this.baPickerSlotRec) return;

        try {
            const result = await bookAppointment({
                opportunityId: this.recordId,
                agentSlot: 'agent' + agentNum,
                availabilityId: this.baPickerSlotRec.id,
                selectedTime: this.baPickerTime
            });

            if (result.status === 'success') {
                this.baBookings = { ...this.baBookings, [agentNum]: {
                    subKey: this.baPickerSubKey,
                    dateLabel: this.baPickerDayLabel,
                    slotLabel: this.baPickerSlotLabel,
                    time: this.baPickerTime
                }};
                this.baAmendingAgent = null;
                this.dispatchEvent(new ShowToastEvent({ title: 'Booked', message: 'Agent ' + agentNum + ' booked at ' + this.baPickerTime + ' on ' + this.baPickerDayLabel, variant: 'success' }));
                refreshApex(this.wiredRecordResult);

                // Keep picker open so user can book more agents at same slot
                // Auto-collapse calendar if all 3 booked
                if (Object.keys(this.baBookings).length === 3) {
                    this.showBaPicker = false;
                    this.baCalExpanded = false;
                }
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || 'Failed', variant: 'error' }));
        }
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
    @track vaSaveSuccess = false;
    @track vaExistingRecords = []; // from Apex
    @track vaSatEnabled = false; // persistent: true if Saturdays are enabled
    @track vaSunEnabled = false; // persistent: true if Sundays are enabled

    static VA_DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    static VA_AM_HOURS = [0, 1, 2, 3]; // Hour_08-11 (9am-12pm range)
    static VA_PM_HOURS = [4, 5, 6, 7, 8]; // Hour_12-16 (12pm-5pm range)

    connectedCallback() {
        this.loadVaData();
        this.loadBaSlots();
        this.loadVendorNotes();
        this.checkAdminAccess();
    }

    async checkAdminAccess() {
        try {
            this.isAdmin = await isAdminUser();
        } catch (e) {
            this.isAdmin = false;
        }
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
    // Shared vendor availability save logic (called from both Save Availability and Save Application)
    async saveVendorAvailabilityData() {
        const monday = this.getVaMonday();
        const dataList = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let di = 0; di < 7; di++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + di);
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

        // Skip if no future days to save
        if (dataList.length === 0) return true;

        const result = await processVendorAvailability({
            dataList: dataList,
            currentId: this.recordId
        });

        if (result === 'Success') {
            this.loadVaData();
            this.loadBaSlots();
            return true;
        }
        throw new Error(result || 'Failed to save availability');
    }

    async handleVaSave() {
        this.isVaSaving = true;
        try {
            await this.saveVendorAvailabilityData();
            this.isVaSaving = false;
            this.vaSaveSuccess = true;
            this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: 'Vendor availability updated', variant: 'success' }));
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => { this.vaSaveSuccess = false; }, 2500);
        } catch (e) {
            this.isVaSaving = false;
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: e.body?.message || e.message || 'Failed to save', variant: 'error' }));
        }
    }
}
