public with sharing class DropboxBrowserController {

    private static String accessToken;

    static {
        try {
            DropBox__mdt config = [SELECT Client_Id__c, Client_Secret__c, Refresh_Token__c
                                   FROM DropBox__mdt WHERE DeveloperName = 'Drop_Box' LIMIT 1];
            // Refresh token to get access token
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.dropboxapi.com/oauth2/token');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setBody('grant_type=refresh_token' +
                         '&refresh_token=' + config.Refresh_Token__c +
                         '&client_id=' + config.Client_Id__c +
                         '&client_secret=' + config.Client_Secret__c);
            Http http = new Http();
            HttpResponse res = http.send(req);
            if (res.getStatusCode() == 200) {
                Map<String, Object> tokenResp = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                accessToken = (String) tokenResp.get('access_token');
            }
        } catch (Exception e) {
            System.debug('Dropbox token refresh failed: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Map<String, Object> getDropboxFolder(String propertyAddress) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('folderExists', false);
        result.put('files', new List<Map<String, String>>());
        result.put('subfolders', new List<String>());

        if (String.isBlank(accessToken) || String.isBlank(propertyAddress)) {
            result.put('error', 'Missing access token or property address');
            return result;
        }

        String folderPath = '/Private Salesforce Documents/Accounts/' + propertyAddress.trim();

        try {
            // List folder contents
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.dropboxapi.com/2/files/list_folder');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + accessToken);
            req.setHeader('Content-Type', 'application/json');
            req.setBody('{"path": "' + folderPath + '", "recursive": true}');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                result.put('folderExists', true);
                Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                List<Object> entries = (List<Object>) response.get('entries');

                List<Map<String, String>> files = new List<Map<String, String>>();
                Set<String> subfolders = new Set<String>();

                for (Object entry : entries) {
                    Map<String, Object> item = (Map<String, Object>) entry;
                    String tag = (String) item.get('.tag');
                    String name = (String) item.get('name');
                    String path = (String) item.get('path_display');

                    if (tag == 'folder') {
                        subfolders.add(name);
                    } else if (tag == 'file') {
                        Map<String, String> fileInfo = new Map<String, String>();
                        fileInfo.put('name', name);
                        fileInfo.put('path', path);
                        fileInfo.put('size', String.valueOf(item.get('size')));
                        fileInfo.put('modified', (String) item.get('server_modified'));
                        // Determine subfolder
                        String parentFolder = path.replace(folderPath + '/', '');
                        if (parentFolder.contains('/')) {
                            fileInfo.put('subfolder', parentFolder.split('/')[0]);
                        } else {
                            fileInfo.put('subfolder', 'Root');
                        }
                        files.add(fileInfo);
                    }
                }
                result.put('files', files);
                result.put('subfolders', new List<String>(subfolders));
            } else if (res.getStatusCode() == 409) {
                // Folder not found — create it with subfolders
                result.put('folderExists', false);
            }
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static String createPropertyFolder(String propertyAddress) {
        if (String.isBlank(accessToken) || String.isBlank(propertyAddress)) {
            throw new AuraHandledException('Missing access token or property address');
        }

        String basePath = '/Private Salesforce Documents/Accounts/' + propertyAddress.trim();
        List<String> foldersToCreate = new List<String>{ basePath, basePath + '/Application', basePath + '/Valuation' };

        try {
            Http http = new Http();
            for (String folderPath : foldersToCreate) {
                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://api.dropboxapi.com/2/files/create_folder_v2');
                req.setMethod('POST');
                req.setHeader('Authorization', 'Bearer ' + accessToken);
                req.setHeader('Content-Type', 'application/json');
                req.setBody('{"path": "' + folderPath + '", "autorename": false}');
                HttpResponse res = http.send(req);
                // 409 = folder exists, that's OK
                if (res.getStatusCode() != 200 && res.getStatusCode() != 409) {
                    System.debug('Folder creation issue for: ' + folderPath + ' — ' + res.getBody());
                }
            }
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to create folder: ' + e.getMessage());
        }
    }
}
