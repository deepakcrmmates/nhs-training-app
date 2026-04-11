import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getAccountDetails from '@salesforce/apex/customLookupController.getAccountDetails';
import saveDesktopValuation from '@salesforce/apex/customLookupController.saveDesktopValuation';
import updateVendorContact from '@salesforce/apex/customLookupController.updateVendorContact';
import createQuickAgent from '@salesforce/apex/customLookupController.createQuickAgent';
import findNearestAgents from '@salesforce/apex/AgentFinderController.findNearestAgents';
import assignAgent from '@salesforce/apex/AgentFinderController.assignAgent';
import getAvailableSlots from '@salesforce/apex/AgentFinderController.getAvailableSlots';
import bookAppointment from '@salesforce/apex/AgentFinderController.bookAppointment';
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

// Archive
import ARCHIVE_REASON_FIELD from '@salesforce/schema/Opportunity.Archive_Reason__c';
import ARCHIVED_DATE_TIME_FIELD from '@salesforce/schema/Opportunity.Archived_Date_Time__c';

const FIELDS = [
    NAME_FIELD, HOUSE_BUILDER_FIELD, HOUSE_BUILDER_NAME_FIELD, PROPERTY_ADDRESS_FIELD, VENDOR_1_FIELD, VENDOR_1_NAME_FIELD,
    VENDOR_2_FIELD, VENDOR_2_NAME_FIELD, APP_RECEIVED_DATE_FIELD, NOTES_FIELD, DEVELOPMENT_FIELD, PLOT_FIELD,
    VENDOR_MOBILE_FIELD, VENDOR_EXPECTATIONS_FIELD, VENDOR_PHONE_FIELD, ETA_COMP_END_FIELD, VENDOR_EMAIL_FIELD, SCHEME_FIELD, STAGE_FIELD, NHS_PROCESS_FIELD,
    AGENT_1_FIELD, AGENT_1_NAME_FIELD, AGENT_1_PHONE_FIELD, AGENT_1_EMAIL_FIELD, AGENT_1_APPT_FIELD, AGENT_1_EMAILED_FIELD, AGENT_1_VERBALLY_CONFIRMED_FIELD, AGENT_1_INITIAL_PRICE_FIELD, AGENT_1_TARGET_SALE_FIELD, AGENT_1_BOTTOM_LINE_FIELD,
    AGENT_2_FIELD, AGENT_2_NAME_FIELD, AGENT_2_PHONE_FIELD, AGENT_2_EMAIL_FIELD, AGENT_2_APPT_FIELD, AGENT_2_EMAILED_FIELD, AGENT_2_VERBALLY_CONFIRMED_FIELD, AGENT_2_INITIAL_PRICE_FIELD, AGENT_2_TARGET_SALE_FIELD, AGENT_2_BOTTOM_LINE_FIELD,
    AGENT_3_FIELD, AGENT_3_NAME_FIELD, AGENT_3_PHONE_FIELD, AGENT_3_EMAIL_FIELD, AGENT_3_APPT_FIELD, AGENT_3_EMAILED_FIELD, AGENT_3_VERBALLY_CONFIRMED_FIELD, AGENT_3_INITIAL_PRICE_FIELD, AGENT_3_TARGET_SALE_FIELD, AGENT_3_BOTTOM_LINE_FIELD,
    RECOMMENDED_MARKET_FIELD, RECOMMENDED_TARGET_FIELD, RECOMMENDED_FORCED_FIELD,
    AGENT_1_DESKTOP_VAL_FIELD, AGENT_2_DESKTOP_VAL_FIELD, AGENT_3_DESKTOP_VAL_FIELD,
    ARCHIVE_REASON_FIELD, ARCHIVED_DATE_TIME_FIELD
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
    quickAgentField = null; // 'agent1', 'agent2', or 'agent3'
    // Booking modal
    showBookingModal = false;
    bookingAgent = ''; // agent1, agent2, agent3
    availableSlots = [];
    isLoadingSlots = false;
    selectedSlotId = null;
    selectedTime = null;
    isBooking = false;

    formatApptDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    get agent1ApptDisplay() { return this.agentAppts.agent1.date ? this.formatApptDate(this.agentAppts.agent1.date) + ' — ' + this.agentAppts.agent1.time : ''; }
    get agent2ApptDisplay() { return this.agentAppts.agent2.date ? this.formatApptDate(this.agentAppts.agent2.date) + ' — ' + this.agentAppts.agent2.time : ''; }
    get agent3ApptDisplay() { return this.agentAppts.agent3.date ? this.formatApptDate(this.agentAppts.agent3.date) + ' — ' + this.agentAppts.agent3.time : ''; }
    get agent1HasAppt() { return !!this.agentAppts.agent1.date; }
    get agent2HasAppt() { return !!this.agentAppts.agent2.date; }
    get agent3HasAppt() { return !!this.agentAppts.agent3.date; }

    get bookingAgentLabel() {
        if (this.bookingAgent === 'agent1') return 'Agent 1 (' + (this.formData.agent1Name || '') + ')';
        if (this.bookingAgent === 'agent2') return 'Agent 2 (' + (this.formData.agent2Name || '') + ')';
        if (this.bookingAgent === 'agent3') return 'Agent 3 (' + (this.formData.agent3Name || '') + ')';
        return '';
    }
    get hasAvailableSlots() { return this.availableSlots.length > 0; }
    get canConfirmBooking() { return this.selectedSlotId && this.selectedTime; }
    get timeOptions() {
        if (!this.selectedSlotId) return [];
        const slot = this.availableSlots.find(s => s.id === this.selectedSlotId);
        if (!slot) return [];
        const times = [];
        if (slot.am) {
            for (let h = 8; h < 12; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const val = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    const label = (h > 12 ? h - 12 : h) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' pm' : ' am');
                    times.push({ value: val, label: label, btnClass: 'bk-time-btn' + (this.selectedTime === val ? ' bk-time-active' : '') });
                }
            }
        }
        if (slot.pm) {
            for (let h = 12; h < 18; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const val = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    const displayH = h > 12 ? h - 12 : h;
                    const label = displayH + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' pm' : ' am');
                    times.push({ value: val, label: label, btnClass: 'bk-time-btn' + (this.selectedTime === val ? ' bk-time-active' : '') });
                }
            }
        }
        return times;
    }

    showAssignAgent = false;
    nearbyAgents = [];
    isLoadingAgents = false;
    isAssigning = false;
    assignAgentInfo = '';
    assignStep = 1; // 1=radius, 2=select agents, 3=confirmation
    assignRadius = '5';
    assignedAgent2Name = '';
    assignedAgent3Name = '';

    get radiusOptions() {
        return [
            { label: '0.5 miles', value: '0.5' },
            { label: '1 mile', value: '1' },
            { label: '2 miles', value: '2' },
            { label: '3 miles', value: '3' },
            { label: '5 miles', value: '5' },
            { label: '7 miles', value: '7' },
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
    quickAgent = { name: '', email: '', firstName: '', lastName: '', mobile: '', phone: '' };
    isCreatingAgent = false;
    @track showPdfModal = false;
    @track pdfStatus = 'Generating PDF...';
    @track showCommsHub = false;
    @track showArchiveModal = false;
    @track archiveReasonInput = '';
    @track pendingArchiveOldStage = '';

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
            { label: 'Final Checks', value: 'Final Checks' },
            { label: 'Vendor Discussions', value: 'Vendor Discussions' },
            { label: 'Archived', value: 'Archived' }
        ];
    }

    async handleStageChange(event) {
        const newStage = event.detail.value;
        const oldStage = this.formData.nhsProcess;

        // Intercept Archive — prompt for reason
        if (newStage === 'Archived') {
            this.pendingArchiveOldStage = oldStage;
            this.archiveReasonInput = '';
            this.showArchiveModal = true;
            // Reset combobox to old stage visually while modal is open
            this.formData = { ...this.formData, nhsProcess: oldStage };
            return;
        }

        // Validate: moving to Agents Booked requires at least 1 future vendor slot
        if (newStage === 'Agents Booked' && oldStage === 'Vendor Availability') {
            try {
                const records = await getHourlyAvailability({ opportunityId: this.recordId });
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

        // Validate: moving to Final Checks requires all financial values
        if (newStage === 'Final Checks') {
            const fin = [
                'agent1Initial', 'agent1Target', 'agent1Bottom',
                'agent2Initial', 'agent2Target', 'agent2Bottom',
                'agent3Initial', 'agent3Target', 'agent3Bottom',
                'market', 'target', 'forced'
            ];
            const missing = fin.filter(f => !this.formData[f] || Number(this.formData[f]) <= 0);
            if (missing.length > 0) {
                this.formData = { ...this.formData, nhsProcess: oldStage };
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Cannot Move to Final Checks',
                    message: 'All financial values must be entered before moving to Final Checks: Initial Asking Price, Target Sale, Bottom Line (all 3 agents) and NHS Recommended (Market, Target, Forced).',
                    variant: 'error',
                    mode: 'sticky'
                }));
                return;
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
            console.error('Stage update error:', JSON.stringify(error));
            let msg = 'Failed to update stage.';
            if (error.body) {
                if (error.body.output && error.body.output.errors && error.body.output.errors.length) {
                    msg = error.body.output.errors.map(e => e.message).join('; ');
                } else if (error.body.output && error.body.output.fieldErrors) {
                    const fieldErrs = error.body.output.fieldErrors;
                    msg = Object.values(fieldErrs).flat().map(e => e.message).join('; ');
                } else if (error.body.message) {
                    msg = error.body.message;
                }
            } else if (error.message) {
                msg = error.message;
            }
            this.formData = { ...this.formData, nhsProcess: oldStage };
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: msg,
                variant: 'error'
            }));
        }
    }

    // ── Archive Modal ──
    handleArchiveReasonInput(e) { this.archiveReasonInput = e.detail.value; }
    handleArchiveCancel() {
        this.showArchiveModal = false;
        this.archiveReasonInput = '';
    }
    handleArchiveOverlayClick() { this.handleArchiveCancel(); }
    handleArchiveModalClick(e) { e.stopPropagation(); }

    async handleArchiveConfirm() {
        const reason = (this.archiveReasonInput || '').trim();
        if (!reason) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Reason Required',
                message: 'Please enter a reason for archiving this application.',
                variant: 'warning'
            }));
            return;
        }
        this.showArchiveModal = false;
        this.formData = { ...this.formData, nhsProcess: 'Archived' };

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[NHS_PROCESS_FIELD.fieldApiName] = 'Archived';
        fields[ARCHIVE_REASON_FIELD.fieldApiName] = reason;
        fields[ARCHIVED_DATE_TIME_FIELD.fieldApiName] = new Date().toISOString();
        try {
            await updateRecord({ fields });
            this.formData = {
                ...this.formData,
                archiveReason: reason,
                archivedDateTime: new Date().toISOString()
            };
            this.dispatchEvent(new ShowToastEvent({
                title: 'Application Archived',
                message: 'The application has been archived.',
                variant: 'success'
            }));
            await refreshApex(this._wiredResult);
        } catch (error) {
            let msg = error.body?.message || error.message || 'Failed to archive.';
            this.formData = { ...this.formData, nhsProcess: this.pendingArchiveOldStage };
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: msg, variant: 'error' }));
        }
        this.archiveReasonInput = '';
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
            { label: 'Figures Returned', value: 'Figures returned' },
            { label: 'Final Checks', value: 'Final Checks' },
            { label: 'Vendor Discussions', value: 'Vendor Discussions' }
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

    get archivedDateFormatted() {
        const dt = this.formData.archivedDateTime;
        if (!dt) return '';
        const d = new Date(dt);
        return d.toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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

    get showFinalChecks() {
        return this.formData.nhsProcess === 'Final Checks';
    }

    get notFinalChecks() {
        return this.formData.nhsProcess !== 'Final Checks';
    }

    get archivedClass() {
        return this.isArchived ? 'archived-badge active' : 'archived-badge';
    }

    _wiredResult;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord(result) {
        this._wiredResult = result;
        const { error, data } = result;
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
                : (this.formData.agent3DesktopVal || false),

            // Archive
            archiveReason: fields.Archive_Reason__c?.value || '',
            archivedDateTime: fields.Archived_Date_Time__c?.value || ''
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

    // ── Quick Agent Create ──
    get showQuickAgent() { return this.quickAgentField != null; }
    get quickAgentTitle() {
        const num = this.quickAgentField ? this.quickAgentField.replace('agent', 'Agent ') : '';
        return 'Create New ' + num;
    }

    handleOpenQuickAgent(event) {
        this.quickAgentField = event.currentTarget.dataset.agent;
        this.quickAgent = { name: '', email: '', firstName: '', lastName: '', mobile: '', phone: '' };
    }

    handleCloseQuickAgent() {
        this.quickAgentField = null;
    }

    handleQuickAgentInput(event) {
        const field = event.target.dataset.field;
        this.quickAgent = { ...this.quickAgent, [field]: event.target.value };
    }

    async handleCreateQuickAgent() {
        if (!this.quickAgent.name || !this.quickAgent.lastName) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Missing Fields', message: 'Company Name and Last Name are required.', variant: 'warning' }));
            return;
        }
        this.isCreatingAgent = true;
        try {
            const result = await createQuickAgent({
                accountName: this.quickAgent.name,
                email: this.quickAgent.email,
                contactFirstName: this.quickAgent.firstName,
                contactLastName: this.quickAgent.lastName,
                mobile: this.quickAgent.mobile,
                phone: this.quickAgent.phone
            });
            if (result.status === 'success') {
                // Set the agent lookup to the new account
                this.formData = {
                    ...this.formData,
                    [this.quickAgentField]: result.accountId,
                    [this.quickAgentField + 'Name']: result.accountName
                };
                this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: result.accountName + ' created', variant: 'success' }));
                this.quickAgentField = null;
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to create agent', variant: 'error' }));
        }
        this.isCreatingAgent = false;
    }

    // ── Booking Modal ──
    async handleOpenBooking(event) {
        this.bookingAgent = event.currentTarget.dataset.agent;
        this.showBookingModal = true;
        this.isLoadingSlots = true;
        this.availableSlots = [];
        this.selectedSlotId = null;
        this.selectedTime = null;
        try {
            const slots = await getAvailableSlots({ opportunityId: this.recordId });
            this.availableSlots = (slots || []).map(s => ({
                ...s,
                isSelected: false,
                rowClass: 'bk-slot-row'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to load slots', variant: 'error' }));
        }
        this.isLoadingSlots = false;
    }

    handleCloseBooking() {
        this.showBookingModal = false;
    }

    handleSelectSlot(event) {
        const slotId = event.currentTarget.dataset.id;
        this.selectedSlotId = slotId;
        this.selectedTime = null;
        this.availableSlots = this.availableSlots.map(s => ({
            ...s,
            isSelected: s.id === slotId,
            rowClass: 'bk-slot-row' + (s.id === slotId ? ' bk-slot-selected' : '')
        }));
    }

    handleSelectTime(event) {
        this.selectedTime = event.currentTarget.dataset.time;
    }

    async handleConfirmBooking() {
        if (!this.selectedSlotId || !this.selectedTime) return;
        this.isBooking = true;
        try {
            const result = await bookAppointment({
                opportunityId: this.recordId,
                agentSlot: this.bookingAgent,
                availabilityId: this.selectedSlotId,
                selectedTime: this.selectedTime
            });
            if (result.status === 'success') {
                this.dispatchEvent(new ShowToastEvent({ title: 'Booked', message: result.message, variant: 'success' }));
                this.showBookingModal = false;

                // Update the local appointment display
                const dt = new Date(result.dateTime);
                this.agentAppts[this.bookingAgent] = {
                    date: dt.toISOString().split('T')[0],
                    time: dt.toTimeString().split(' ')[0].substring(0, 5)
                };
                this.agentAppts = { ...this.agentAppts };

                // Refresh the Agent Booking component
                const agentBooking = this.template.querySelector('c-nhs-agent-booking');
                if (agentBooking) {
                    agentBooking.refreshData();
                }
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Booking failed', variant: 'error' }));
        }
        this.isBooking = false;
    }

    handleAgentBookedFromBooking(event) {
        const { agentNum, dateStr, time } = event.detail;
        const agentKey = 'agent' + agentNum;
        this.agentAppts[agentKey] = { date: dateStr, time: time };
        this.agentAppts = { ...this.agentAppts };
    }

    // ── Assign Agent (3-step wizard) ──
    handleOpenAssignAgent() {
        this.showAssignAgent = true;
        this.assignStep = 1;
        this.assignRadius = '5';
        this.nearbyAgents = [];
        this.assignAgentInfo = '';
        this.assignedAgent2Name = '';
        this.assignedAgent3Name = '';
    }

    handleCloseAssignAgent() {
        this.showAssignAgent = false;
    }

    handleRadiusChange(event) {
        this.assignRadius = event.detail.value;
    }

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
                    canAssignAgent2: !a.isAssigned && a.id !== this.formData.agent1,
                    canAssignAgent3: !a.isAssigned && a.id !== this.formData.agent1,
                    assignedLabel: a.isAgent2 ? 'Agent 2' : (a.isAgent3 ? 'Agent 3' : ''),
                    rowClass: 'af-row' + (a.isAssigned ? ' af-assigned' : ''),
                    rightmoveLink: a.rightmoveUrl || ('https://www.rightmove.co.uk/estate-agents/' + (a.postcode ? a.postcode.split(' ')[0] : '') + '.html?brandName=' + encodeURIComponent(a.name || '') + '&branchType=ALL')
                }));
                this.assignAgentInfo = this.nearbyAgents.length + ' agents found within ' + this.assignRadius + ' miles of ' + result.propertyPostcode;
            } else {
                this.assignAgentInfo = result.message;
            }
        } catch (error) {
            this.assignAgentInfo = error.body?.message || 'Failed to find agents';
        }
        this.isLoadingAgents = false;
    }

    handleBackToStep1() {
        this.assignStep = 1;
    }

    async handleAssignToSlot(event) {
        const agentId = event.currentTarget.dataset.id;
        const agentName = event.currentTarget.dataset.name;
        const slot = event.currentTarget.dataset.slot;
        this.isAssigning = true;
        try {
            const result = await assignAgent({ opportunityId: this.recordId, agentId: agentId, agentSlot: slot });
            if (result.status === 'success') {
                // Clear previous agent from this slot
                const prevAgentId = this.formData[slot];

                this.formData = {
                    ...this.formData,
                    [slot]: agentId,
                    [slot + 'Name']: agentName
                };
                if (slot === 'agent2') this.assignedAgent2Name = agentName;
                if (slot === 'agent3') this.assignedAgent3Name = agentName;

                // Rebuild list — unassign previous, assign new
                this.nearbyAgents = this.nearbyAgents.map(a => {
                    const isNewAgent = a.id === agentId;
                    const wasPrevAgent = a.id === prevAgentId && prevAgentId !== agentId;

                    let isA2 = a.isAgent2;
                    let isA3 = a.isAgent3;

                    if (slot === 'agent2') {
                        if (isNewAgent) isA2 = true;
                        if (wasPrevAgent) isA2 = false;
                    }
                    if (slot === 'agent3') {
                        if (isNewAgent) isA3 = true;
                        if (wasPrevAgent) isA3 = false;
                    }

                    const isAssigned = isA2 || isA3;
                    return {
                        ...a,
                        isAgent2: isA2,
                        isAgent3: isA3,
                        isAssigned: isAssigned,
                        assignedLabel: isA2 ? 'Agent 2' : (isA3 ? 'Agent 3' : ''),
                        canAssignAgent2: !isAssigned && a.id !== this.formData.agent1,
                        canAssignAgent3: !isAssigned && a.id !== this.formData.agent1,
                        rowClass: 'af-row' + (isAssigned ? ' af-assigned' : '')
                    };
                });

                // If both assigned, go to step 3
                if (this.assignedAgent2Name && this.assignedAgent3Name) {
                    this.assignStep = 3;
                }
            } else {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: result.message, variant: 'error' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to assign', variant: 'error' }));
        }
        this.isAssigning = false;
    }

    async handleUnassignAgent(event) {
        const agentId = event.currentTarget.dataset.id;
        // Determine which slot this agent is in
        const agent = this.nearbyAgents.find(a => a.id === agentId);
        if (!agent) return;
        const slot = agent.isAgent2 ? 'agent2' : 'agent3';

        this.isAssigning = true;
        try {
            // Assign null to clear the slot
            const result = await assignAgent({ opportunityId: this.recordId, agentId: null, agentSlot: slot });
            if (result.status === 'success') {
                this.formData = { ...this.formData, [slot]: null, [slot + 'Name']: '' };
                if (slot === 'agent2') this.assignedAgent2Name = '';
                if (slot === 'agent3') this.assignedAgent3Name = '';

                // Update list
                this.nearbyAgents = this.nearbyAgents.map(a => {
                    let isA2 = a.isAgent2;
                    let isA3 = a.isAgent3;
                    if (a.id === agentId) {
                        if (slot === 'agent2') isA2 = false;
                        if (slot === 'agent3') isA3 = false;
                    }
                    const isAssigned = isA2 || isA3;
                    return {
                        ...a,
                        isAgent2: isA2,
                        isAgent3: isA3,
                        isAssigned: isAssigned,
                        assignedLabel: isA2 ? 'Agent 2' : (isA3 ? 'Agent 3' : ''),
                        canAssignAgent2: !isAssigned && a.id !== this.formData.agent1,
                        canAssignAgent3: !isAssigned && a.id !== this.formData.agent1,
                        rowClass: 'af-row' + (isAssigned ? ' af-assigned' : '')
                    };
                });

                this.dispatchEvent(new ShowToastEvent({ title: 'Removed', message: agent.name + ' removed from ' + (slot === 'agent2' ? 'Agent 2' : 'Agent 3'), variant: 'info' }));
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to unassign', variant: 'error' }));
        }
        this.isAssigning = false;
    }

    handleConfirmAssignment() {
        this.showAssignAgent = false;
        this.dispatchEvent(new ShowToastEvent({ title: 'Agents Assigned', message: 'Agent 2: ' + this.assignedAgent2Name + ' | Agent 3: ' + this.assignedAgent3Name, variant: 'success' }));
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
            // Update Vendor 1 Contact details first (Mobile, Phone, Email are formula fields on Opportunity)
            if (this.formData.vendor1) {
                await updateVendorContact({
                    contactId: this.formData.vendor1,
                    mobile: this.formData.mobile || null,
                    phone: this.formData.landline || null,
                    email: this.formData.email || null
                });
            }

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

    handleRefreshData() {
        this.isLoading = true;
        refreshApex(this._wiredResult)
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Refreshed', message: 'Data refreshed successfully.', variant: 'success' }));
            })
            .catch(() => {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Failed to refresh.', variant: 'error' }));
            })
            .finally(() => { this.isLoading = false; });
    }

    handleToggleCommsHub() {
        this.showCommsHub = !this.showCommsHub;
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
