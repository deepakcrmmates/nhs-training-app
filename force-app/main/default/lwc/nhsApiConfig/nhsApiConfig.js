import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllConfigs from '@salesforce/apex/NHSApiConfigController.getAllConfigs';
import updateConfig from '@salesforce/apex/NHSApiConfigController.updateConfig';
import getFieldValue from '@salesforce/apex/NHSApiConfigController.getFieldValue';
import testApi from '@salesforce/apex/NHSApiHealthCheck.testApi';

export default class NhsApiConfig extends LightningElement {
    @track configs = [];
    @track isTesting = false;
    @track testResult = null;
    @track isLoading = true;
    @track editConfig = null;
    @track editFields = [];
    @track isSaving = false;
    @track viewMode = 'blocks'; // 'list' or 'blocks'

    get hasConfigs() { return this.configs.length > 0; }
    get showEditModal() { return this.editConfig !== null; }
    get isListView() { return this.viewMode === 'list'; }
    get isBlockView() { return this.viewMode === 'blocks'; }
    get listBtnClass() { return 'view-btn' + (this.viewMode === 'list' ? ' view-active' : ''); }
    get blockBtnClass() { return 'view-btn' + (this.viewMode === 'blocks' ? ' view-active' : ''); }

    handleListView() { this.viewMode = 'list'; }
    handleBlockView() { this.viewMode = 'blocks'; }
    get editTitle() { return this.editConfig ? this.editConfig.name : ''; }

    get distanceMethodOptions() {
        return [
            { label: 'Google Maps — Distance Matrix (Driving)', value: 'Distance Matrix' },
            { label: 'Google Maps — Geocoding (Aerial)', value: 'Geocoding' },
            { label: 'Postcodes.io — Free (Aerial)', value: 'Postcodes.io' }
        ];
    }

    connectedCallback() {
        this.loadConfigs();
    }

    async loadConfigs() {
        this.isLoading = true;
        try {
            const raw = await getAllConfigs();
            this.configs = raw.map(c => ({
                ...c,
                statusClass: 'status-bulb status-' + (c.healthStatus || 'unknown'),
                statusTooltip: (c.healthMessage || 'Not checked') + (c.lastCheck ? ' | Last check: ' + c.lastCheck : '')
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to load configs', variant: 'error' }));
        }
        this.isLoading = false;
    }

    async handleOpenEdit(event) {
        const key = event.currentTarget.dataset.key;
        const config = this.configs.find(c => c.key === key);
        if (!config) return;

        this.editConfig = config;

        // Load actual (unmasked) values for editable fields
        const fields = [];
        for (const f of config.fields) {
            let actualValue = f.value;
            if (f.fieldType === 'password') {
                try {
                    actualValue = await getFieldValue({ objectName: config.objectName, recordId: config.recordId, fieldName: f.apiName });
                } catch (e) { /* keep masked */ }
            }
            fields.push({
                ...f,
                actualValue: actualValue,
                isText: f.fieldType === 'text' || f.fieldType === 'url',
                isPassword: f.fieldType === 'password',
                isNumber: f.fieldType === 'number',
                isReadonly: f.fieldType === 'readonly',
                isPicklist: f.fieldType === 'picklist',
                inputType: f.fieldType === 'password' ? 'password' : (f.fieldType === 'number' ? 'number' : 'text')
            });
        }
        this.editFields = fields;
    }

    handleCloseEdit() {
        this.editConfig = null;
        this.editFields = [];
    }

    handleFieldChange(event) {
        const apiName = event.currentTarget.dataset.field;
        const value = event.detail ? event.detail.value : event.target.value;
        this.editFields = this.editFields.map(f =>
            f.apiName === apiName ? { ...f, actualValue: value } : f
        );
    }

    async handleSaveConfig() {
        this.isSaving = true;
        let success = true;
        for (const f of this.editFields) {
            if (f.isReadonly) continue;
            try {
                const result = await updateConfig({
                    objectName: this.editConfig.objectName,
                    recordId: this.editConfig.recordId,
                    fieldName: f.apiName,
                    fieldValue: f.actualValue || ''
                });
                if (result.status !== 'success') {
                    this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: f.label + ': ' + result.message, variant: 'error' }));
                    success = false;
                    break;
                }
            } catch (error) {
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: f.label + ': ' + (error.body?.message || error.message), variant: 'error' }));
                success = false;
                break;
            }
        }
        this.isSaving = false;
        if (success) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: this.editConfig.name + ' updated successfully', variant: 'success' }));
            this.editConfig = null;
            this.editFields = [];
            this.loadConfigs();
        }
    }

    async handleTestApi(event) {
        event.stopPropagation();
        if (!this.editConfig) return;
        this.isTesting = true;
        this.testResult = null;
        try {
            const result = await testApi({ apiName: this.editConfig.key });
            this.testResult = result;
        } catch (error) {
            this.testResult = { status: 'error', message: error.body?.message || 'Test failed' };
        }
        this.isTesting = false;
    }

    get testResultClass() {
        if (!this.testResult) return '';
        return 'test-result test-' + this.testResult.status;
    }

    stopProp(event) { event.stopPropagation(); }

    handleTogglePassword(event) {
        const apiName = event.currentTarget.dataset.field;
        const input = this.template.querySelector(`input[data-field="${apiName}"]`);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }
}
