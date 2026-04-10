public with sharing class BoxOAuthController {

    private static final String BOX_AUTH_URL = 'https://account.box.com/api/oauth2/authorize';
    private static final String BOX_TOKEN_URL = 'https://api.box.com/oauth2/token';

    @AuraEnabled
    public static String getAuthorizationUrl() {
        Box_Config__c config = getConfig();
        if (config == null || String.isBlank(config.Client_Id__c)) {
            throw new AuraHandledException('Box Client ID is not configured. Go to Setup > Custom Settings > Box Config to add credentials.');
        }

        String redirectUri = getRedirectUri();
        return BOX_AUTH_URL
            + '?response_type=code'
            + '&client_id=' + config.Client_Id__c
            + '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8');
    }

    @AuraEnabled
    public static Map<String, String> exchangeCodeForToken(String authCode) {
        Map<String, String> result = new Map<String, String>();
        try {
            // Use SOQL to read config (avoids getInstance() implicit work before callout)
            List<Box_Config__c> configs = [SELECT Id, Client_Id__c, Client_Secret__c FROM Box_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].Client_Id__c)) {
                result.put('status', 'error');
                result.put('message', 'Box configuration not found.');
                return result;
            }
            Box_Config__c config = configs[0];

            HttpRequest req = new HttpRequest();
            req.setEndpoint(BOX_TOKEN_URL);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            String body = 'grant_type=authorization_code'
                + '&code=' + EncodingUtil.urlEncode(authCode, 'UTF-8')
                + '&client_id=' + EncodingUtil.urlEncode(config.Client_Id__c, 'UTF-8')
                + '&client_secret=' + EncodingUtil.urlEncode(config.Client_Secret__c, 'UTF-8');
            req.setBody(body);

            Http http = new Http();
            HttpResponse resp = http.send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                String refreshToken = (String) responseBody.get('refresh_token');

                // Save refresh token to the same record
                config.Refresh_Token__c = refreshToken;
                update config;

                result.put('status', 'success');
                result.put('accessToken', (String) responseBody.get('access_token'));
                result.put('refreshToken', refreshToken);
                result.put('message', 'Connected to Box. Refresh token saved automatically.');
            } else {
                result.put('status', 'error');
                result.put('message', 'Token exchange failed: ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> getConnectionStatus() {
        Map<String, Object> status = new Map<String, Object>();
        try {
            Box_Config__c config = getConfig();
            if (config == null) {
                status.put('status', 'not_configured');
                status.put('message', 'Box Config not found. Go to Setup > Custom Settings > Box Config > Manage.');
                status.put('hasClientId', false);
                status.put('hasClientSecret', false);
                status.put('hasRefreshToken', false);
                return status;
            }

            status.put('hasClientId', String.isNotBlank(config.Client_Id__c));
            status.put('hasClientSecret', String.isNotBlank(config.Client_Secret__c));
            status.put('hasRefreshToken', String.isNotBlank(config.Refresh_Token__c));

            if (String.isBlank(config.Client_Id__c) || String.isBlank(config.Client_Secret__c)) {
                status.put('status', 'credentials_missing');
                status.put('message', 'Client ID and/or Client Secret not configured.');
                return status;
            }

            if (String.isBlank(config.Refresh_Token__c)) {
                status.put('status', 'not_connected');
                status.put('message', 'Not connected. Please authorise with Box.');
                return status;
            }

            // Credentials present — assume connected (token validated on actual API calls)
            status.put('status', 'connected');
            status.put('message', 'Connected to Box.');
            status.put('rootFolderId', String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0');
        } catch (Exception e) {
            status.put('status', 'error');
            status.put('message', e.getMessage());
        }
        return status;
    }

    private static String cachedAccessToken;

    // Called by LWC as a separate first step — refreshes token and saves it (callout + DML in one transaction)
    @AuraEnabled
    public static Map<String, String> ensureAccessToken() {
        Map<String, String> result = new Map<String, String>();
        try {
            String token = refreshAccessToken();
            result.put('status', token != null ? 'success' : 'error');
            result.put('message', token != null ? 'Token ready' : 'Failed to get token. Please reconnect in Box Setup.');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    public static String refreshAccessToken() {
        // Return in-memory cached token if available (same transaction)
        if (String.isNotBlank(cachedAccessToken)) {
            return cachedAccessToken;
        }

        List<Box_Config__c> configs = [SELECT Id, Client_Id__c, Client_Secret__c, Refresh_Token__c, Access_Token__c, Token_Expiry__c FROM Box_Config__c LIMIT 1];
        if (configs.isEmpty() || String.isBlank(configs[0].Refresh_Token__c)) {
            return null;
        }
        Box_Config__c config = configs[0];

        // Check if we have a cached access token that hasn't expired
        if (String.isNotBlank(config.Access_Token__c) && config.Token_Expiry__c != null && config.Token_Expiry__c > Datetime.now()) {
            cachedAccessToken = config.Access_Token__c;
            return cachedAccessToken;
        }

        // Token expired or missing — refresh from Box API
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_TOKEN_URL);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String body = 'grant_type=refresh_token'
            + '&refresh_token=' + EncodingUtil.urlEncode(config.Refresh_Token__c, 'UTF-8')
            + '&client_id=' + EncodingUtil.urlEncode(config.Client_Id__c, 'UTF-8')
            + '&client_secret=' + EncodingUtil.urlEncode(config.Client_Secret__c, 'UTF-8');
        req.setBody(body);

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 200) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            cachedAccessToken = (String) responseBody.get('access_token');
            String newRefreshToken = (String) responseBody.get('refresh_token');

            // Save everything in one DML
            config.Access_Token__c = cachedAccessToken;
            config.Token_Expiry__c = Datetime.now().addMinutes(50);
            if (String.isNotBlank(newRefreshToken)) {
                config.Refresh_Token__c = newRefreshToken;
            }
            update config;

            return cachedAccessToken;
        }
        return null;
    }

    // No-op — token is saved during refresh
    public static void saveRotatedToken() {
    }

    public static Box_Config__c getConfig() {
        List<Box_Config__c> configs = [SELECT Id, Client_Id__c, Client_Secret__c, Refresh_Token__c, Root_Folder_Id__c FROM Box_Config__c LIMIT 1];
        if (configs.isEmpty() || String.isBlank(configs[0].Client_Id__c)) {
            return null;
        }
        return configs[0];
    }

    @AuraEnabled
    public static Map<String, Object> testConnection() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String accessToken = refreshAccessToken();
            if (accessToken == null) {
                result.put('status', 'error');
                result.put('message', 'Failed to get access token. Please reconnect.');
                return result;
            }

            // List root folder
            Box_Config__c config = getConfig();
            String rootId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.box.com/2.0/folders/' + rootId + '/items?fields=name,id,type&limit=50');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse resp = http.send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                result.put('status', 'success');
                result.put('totalCount', body.get('total_count'));
                result.put('entries', body.get('entries'));
                result.put('rootFolderId', rootId);
            } else {
                result.put('status', 'error');
                result.put('message', 'Box API error: ' + resp.getBody());
            }

            // Save rotated token async
            saveRotatedToken();
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> browseFolderById(String folderId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String accessToken = refreshAccessToken();
            if (accessToken == null) {
                result.put('status', 'error');
                result.put('message', 'Not connected to Box.');
                return result;
            }

            // Get folder info
            HttpRequest infoReq = new HttpRequest();
            infoReq.setEndpoint('https://api.box.com/2.0/folders/' + folderId + '?fields=name,id');
            infoReq.setMethod('GET');
            infoReq.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse infoResp = http.send(infoReq);

            if (infoResp.getStatusCode() == 200) {
                Map<String, Object> folderInfo = (Map<String, Object>) JSON.deserializeUntyped(infoResp.getBody());
                result.put('folderName', folderInfo.get('name'));
                result.put('folderId', folderInfo.get('id'));
            }

            // List items
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.box.com/2.0/folders/' + folderId + '/items?fields=name,id,type,size,modified_at&limit=100');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            HttpResponse resp = http.send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                result.put('status', 'success');
                result.put('totalCount', body.get('total_count'));
                result.put('entries', body.get('entries'));
            } else {
                result.put('status', 'error');
                result.put('message', 'Box API error: ' + resp.getBody());
            }

            saveRotatedToken();
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> uploadFile(String folderId, String fileName, String base64Content) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String accessToken = refreshAccessToken();
            if (accessToken == null) {
                result.put('status', 'error');
                result.put('message', 'Not connected to Box.');
                return result;
            }

            String fileId = BoxFileService.uploadFile(folderId, fileName, base64Content, accessToken);
            saveRotatedToken();

            if (fileId != null) {
                result.put('status', 'success');
                result.put('fileId', fileId);
                result.put('message', 'File "' + fileName + '" uploaded successfully.');
            } else {
                result.put('status', 'error');
                result.put('message', 'Failed to upload file.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static String getDownloadUrl(String fileId) {
        try {
            String accessToken = refreshAccessToken();
            if (accessToken == null) return null;

            // Get file info with download_url field
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.box.com/2.0/files/' + fileId + '?fields=download_url,name');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            Http http = new Http();
            HttpResponse resp = http.send(req);

            saveRotatedToken();

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                String downloadUrl = (String) body.get('download_url');
                if (String.isNotBlank(downloadUrl)) {
                    return downloadUrl;
                }
            }

            // Fallback: return the API download URL with token
            return 'https://api.box.com/2.0/files/' + fileId + '/content?access_token=' + EncodingUtil.urlEncode(accessToken, 'UTF-8');
        } catch (Exception e) {
            return null;
        }
    }

    @AuraEnabled
    public static Map<String, Object> createFolder(String parentFolderId, String folderName) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String accessToken = refreshAccessToken();
            if (accessToken == null) {
                result.put('status', 'error');
                result.put('message', 'Not connected to Box.');
                return result;
            }

            // Sanitize: Box doesn't allow / or \ in folder names
            String safeName = folderName.replace('/', '-').replace('\\', '-');
            String newFolderId = BoxFileService.createFolder(safeName, parentFolderId, accessToken);
            saveRotatedToken();

            if (newFolderId != null) {
                result.put('status', 'success');
                result.put('folderId', newFolderId);
                result.put('message', 'Folder "' + folderName + '" created successfully.');
            } else {
                result.put('status', 'error');
                result.put('message', 'Failed to create folder. It may already exist.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> getBoxFolderForOpportunity(Id opportunityId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Opportunity opp = [SELECT Id, Box_Folder_Id__c, Property_Address__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
            result.put('boxFolderId', opp.Box_Folder_Id__c);
            result.put('propertyAddress', opp.Property_Address__c);
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static void saveBoxFolderId(Id opportunityId, String folderId) {
        Opportunity opp = new Opportunity(Id = opportunityId);
        opp.Box_Folder_Id__c = folderId;
        update opp;
    }

    private static String getRedirectUri() {
        return URL.getOrgDomainUrl().toExternalForm() + '/apex/BoxCallback';
    }
}
