public with sharing class DropboxOAuthController {

    @AuraEnabled
    public static String getAuthorizationUrl() {
        DropBox__mdt config = getConfig();
        if (config == null || String.isBlank(config.Client_Id__c)) {
            throw new AuraHandledException('Dropbox Client ID not configured. Please set it in DropBox__mdt Custom Metadata.');
        }
        String redirectUri = getRedirectUri();
        return 'https://www.dropbox.com/oauth2/authorize'
            + '?client_id=' + config.Client_Id__c
            + '&response_type=code'
            + '&token_access_type=offline'
            + '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8');
    }

    @AuraEnabled
    public static Map<String, String> exchangeCodeForToken(String authCode) {
        DropBox__mdt config = getConfig();
        if (config == null) throw new AuraHandledException('DropBox__mdt not configured.');

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.dropboxapi.com/oauth2/token');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody(
            'code=' + EncodingUtil.urlEncode(authCode, 'UTF-8') +
            '&grant_type=authorization_code' +
            '&client_id=' + config.Client_Id__c +
            '&client_secret=' + config.Client_Secret__c +
            '&redirect_uri=' + EncodingUtil.urlEncode(getRedirectUri(), 'UTF-8')
        );

        Http http = new Http();
        HttpResponse res = http.send(req);

        Map<String, String> result = new Map<String, String>();
        if (res.getStatusCode() == 200) {
            Map<String, Object> tokenResp = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            String refreshToken = (String) tokenResp.get('refresh_token');
            String accountId = (String) tokenResp.get('account_id');
            result.put('status', 'success');
            result.put('refreshToken', refreshToken);
            result.put('accountId', accountId != null ? accountId : '');
            result.put('message', 'Dropbox connected successfully. Refresh token received.');
        } else {
            result.put('status', 'error');
            result.put('message', 'Token exchange failed: ' + res.getBody());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, String> getConnectionStatus() {
        Map<String, String> result = new Map<String, String>();
        DropBox__mdt config = getConfig();

        if (config == null) {
            result.put('status', 'not_configured');
            result.put('message', 'DropBox__mdt record not found.');
            return result;
        }

        result.put('hasClientId', String.isNotBlank(config.Client_Id__c) ? 'true' : 'false');
        result.put('hasClientSecret', String.isNotBlank(config.Client_Secret__c) ? 'true' : 'false');
        result.put('hasRefreshToken', String.isNotBlank(config.Refresh_Token__c) ? 'true' : 'false');

        if (String.isBlank(config.Client_Id__c) || String.isBlank(config.Client_Secret__c)) {
            result.put('status', 'credentials_missing');
            result.put('message', 'Client ID and/or Client Secret not set.');
            return result;
        }

        if (String.isBlank(config.Refresh_Token__c)) {
            result.put('status', 'not_connected');
            result.put('message', 'Credentials set but not connected to Dropbox yet.');
            return result;
        }

        // Test the connection
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.dropboxapi.com/oauth2/token');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setBody(
                'grant_type=refresh_token' +
                '&refresh_token=' + config.Refresh_Token__c +
                '&client_id=' + config.Client_Id__c +
                '&client_secret=' + config.Client_Secret__c
            );
            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                result.put('status', 'connected');
                result.put('message', 'Connected to Dropbox.');
            } else {
                result.put('status', 'token_invalid');
                result.put('message', 'Refresh token expired or invalid. Please reconnect.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', 'Connection test failed: ' + e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static String saveRefreshToken(String refreshToken) {
        // Custom Metadata can't be updated via DML — store in a Custom Setting or return for manual save
        // For now, return instructions
        return 'To save the refresh token, go to Setup → Custom Metadata Types → DropBox → Manage Records → Edit "Drop_Box" → paste the Refresh Token: ' + refreshToken;
    }

    private static DropBox__mdt getConfig() {
        List<DropBox__mdt> configs = [SELECT Client_Id__c, Client_Secret__c, Refresh_Token__c
                                      FROM DropBox__mdt WHERE DeveloperName = 'Drop_Box' LIMIT 1];
        return configs.isEmpty() ? null : configs[0];
    }

    private static String getRedirectUri() {
        return URL.getOrgDomainUrl().toExternalForm() + '/apex/DropboxCallback';
    }
}
