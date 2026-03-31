import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAuthorizationUrl from '@salesforce/apex/DropboxOAuthController.getAuthorizationUrl';
import exchangeCodeForToken from '@salesforce/apex/DropboxOAuthController.exchangeCodeForToken';
import getConnectionStatus from '@salesforce/apex/DropboxOAuthController.getConnectionStatus';
import saveRefreshToken from '@salesforce/apex/DropboxOAuthController.saveRefreshToken';

export default class NhsDropboxSetup extends LightningElement {
    @track connectionStatus = {};
    @track showCodeInput = false;
    @track authCode = '';
    @track exchangeResult = '';
    @track exchangeResultType = '';
    isLoading = true;

    connectedCallback() {
        this.checkStatus();
        // Listen for callback message from popup
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'DROPBOX_AUTH_CODE') {
                this.authCode = event.data.code;
                this.showCodeInput = true;
            }
        });
    }

    checkStatus() {
        this.isLoading = true;
        getConnectionStatus()
            .then(result => { this.connectionStatus = result; this.isLoading = false; })
            .catch(() => { this.isLoading = false; });
    }

    get redirectUri() {
        const base = window.location.origin;
        return base + '/apex/DropboxCallback';
    }

    get statusMessage() { return this.connectionStatus.message || 'Unknown'; }
    get isConnected() { return this.connectionStatus.status === 'connected'; }

    get statusBadgeClass() {
        const s = this.connectionStatus.status;
        if (s === 'connected') return 'status-badge connected';
        if (s === 'not_connected' || s === 'token_invalid') return 'status-badge warning';
        return 'status-badge error';
    }

    get checkClientId() { return this.connectionStatus.hasClientId === 'true' ? '✓' : '✗'; }
    get checkClientSecret() { return this.connectionStatus.hasClientSecret === 'true' ? '✓' : '✗'; }
    get checkRefreshToken() { return this.connectionStatus.hasRefreshToken === 'true' ? '✓' : '✗'; }
    get checkClientIdClass() { return 'check-item ' + (this.connectionStatus.hasClientId === 'true' ? 'ok' : 'missing'); }
    get checkClientSecretClass() { return 'check-item ' + (this.connectionStatus.hasClientSecret === 'true' ? 'ok' : 'missing'); }
    get checkRefreshTokenClass() { return 'check-item ' + (this.connectionStatus.hasRefreshToken === 'true' ? 'ok' : 'missing'); }

    get isExchangeDisabled() { return !this.authCode || !this.authCode.trim(); }
    get exchangeResultClass() { return 'exchange-msg ' + this.exchangeResultType; }

    async handleConnect() {
        try {
            const url = await getAuthorizationUrl();
            this.showCodeInput = true;
            window.open(url, 'DropboxAuth', 'width=600,height=700,scrollbars=yes');
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error', message: error.body?.message || 'Failed to get auth URL.', variant: 'error'
            }));
        }
    }

    handleCodeInput(event) { this.authCode = event.target.value; }

    async handleExchangeCode() {
        if (!this.authCode || !this.authCode.trim()) return;
        this.exchangeResult = 'Exchanging code for token...';
        this.exchangeResultType = '';

        try {
            const result = await exchangeCodeForToken({ authCode: this.authCode.trim() });
            if (result.status === 'success') {
                this.exchangeResultType = 'success';
                // Save the refresh token instructions
                const saveMsg = await saveRefreshToken({ refreshToken: result.refreshToken });
                this.exchangeResult = result.message + '\n\nRefresh Token: ' + result.refreshToken + '\n\n' + saveMsg;
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Dropbox Connected!',
                    message: 'Token received. Please save the refresh token in Custom Metadata.',
                    variant: 'success'
                }));
                this.checkStatus();
            } else {
                this.exchangeResultType = 'error';
                this.exchangeResult = result.message;
            }
        } catch (error) {
            this.exchangeResultType = 'error';
            this.exchangeResult = error.body?.message || 'Exchange failed.';
        }
    }
}
