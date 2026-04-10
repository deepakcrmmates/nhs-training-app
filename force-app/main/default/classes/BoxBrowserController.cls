public with sharing class BoxBrowserController {

    private static final String BOX_API_URL = 'https://api.box.com/2.0';

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getBoxFolder(String propertyAddress) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('folderExists', false);
        result.put('files', new List<Map<String, Object>>());
        result.put('subfolders', new List<String>());

        try {
            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) {
                result.put('error', 'Not connected to Box. Please configure Box in Setup.');
                return result;
            }

            Box_Config__c config = BoxOAuthController.getConfig();
            String rootFolderId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

            // Find account folder
            String accountFolderId = BoxFileService.findFolder(propertyAddress, rootFolderId, accessToken);
            if (accountFolderId == null) {
                // Try sanitized name
                accountFolderId = BoxFileService.findFolder(BoxFileService.sanitizeName(propertyAddress), rootFolderId, accessToken);
            }

            if (accountFolderId == null) {
                result.put('folderExists', false);
                return result;
            }

            result.put('folderExists', true);
            result.put('folderId', accountFolderId);

            // List all items recursively (folder + subfolders)
            List<Map<String, Object>> allFiles = new List<Map<String, Object>>();
            Set<String> subfolderNames = new Set<String>();

            // List root folder items
            listFolderItems(accountFolderId, 'Root', allFiles, subfolderNames, accessToken);

            // List subfolder items
            for (String sfName : subfolderNames) {
                String sfId = BoxFileService.findFolder(sfName, accountFolderId, accessToken);
                if (sfId != null) {
                    listFolderItems(sfId, sfName, allFiles, null, accessToken);
                }
            }

            result.put('files', allFiles);
            result.put('subfolders', new List<String>(subfolderNames));

            // Token save skipped — will be saved on next Box Setup interaction
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }
        return result;
    }

    private static void listFolderItems(String folderId, String subfolderLabel, List<Map<String, Object>> files, Set<String> subfolderNames, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_API_URL + '/folders/' + folderId + '/items?fields=name,id,type,size,modified_at,shared_link&limit=1000');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 200) {
            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            List<Object> entries = (List<Object>) body.get('entries');

            for (Object entry : entries) {
                Map<String, Object> item = (Map<String, Object>) entry;
                String itemType = (String) item.get('type');

                if (itemType == 'folder' && subfolderNames != null) {
                    subfolderNames.add((String) item.get('name'));
                } else if (itemType == 'file') {
                    Map<String, Object> fileMap = new Map<String, Object>();
                    fileMap.put('id', item.get('id'));
                    fileMap.put('name', item.get('name'));
                    fileMap.put('size', item.get('size'));
                    fileMap.put('modified', item.get('modified_at'));
                    fileMap.put('subfolder', subfolderLabel);

                    // Get shared link if available
                    Map<String, Object> sharedLink = (Map<String, Object>) item.get('shared_link');
                    if (sharedLink != null) {
                        fileMap.put('downloadUrl', sharedLink.get('download_url'));
                        fileMap.put('previewUrl', sharedLink.get('url'));
                    }

                    files.add(fileMap);
                }
            }
        }
    }

    @AuraEnabled
    public static Map<String, Object> createPropertyFolder(String propertyAddress) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) {
                result.put('status', 'error');
                result.put('message', 'Not connected to Box.');
                return result;
            }

            Box_Config__c config = BoxOAuthController.getConfig();
            String rootFolderId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

            // Create account folder — sanitize name (Box doesn't allow / or \)
            String safeName = propertyAddress.replace('/', '-').replace('\\', '-');
            String accountFolderId = BoxFileService.getOrCreateFolder(safeName, rootFolderId, accessToken);
            if (accountFolderId == null) {
                result.put('status', 'error');
                result.put('message', 'Failed to create account folder.');
                return result;
            }

            // Create NHS subfolders
            BoxFileService.getOrCreateFolder('Application', accountFolderId, accessToken);
            BoxFileService.getOrCreateFolder('Valuations', accountFolderId, accessToken);
            BoxFileService.getOrCreateFolder('Photos', accountFolderId, accessToken);
            BoxFileService.getOrCreateFolder('Will Report', accountFolderId, accessToken);

            // Token save skipped — will be saved on next Box Setup interaction

            result.put('status', 'success');
            result.put('folderId', accountFolderId);
            result.put('message', 'Folder structure created successfully.');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static String getFileDownloadUrl(String fileId) {
        try {
            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) return null;
            String url = BoxFileService.getDownloadUrl(fileId, accessToken);
            BoxOAuthController.saveRotatedToken();
            return url;
        } catch (Exception e) {
            return null;
        }
    }
}
