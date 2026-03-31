public without sharing class DropboxFileService {
    private static final String DROPBOX_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
    private static final String DROPBOX_SHARED_LINK_URL = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings';
    private static final String DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
    private static final String DROPBOX_API_URL = 'https://api.dropboxapi.com/2/files';
    public static string accountIdToUpdate = '';
     public static string applicationIdToUpdate = '';
       public static string folderName = '';
    private static String CLIENT_ID;
    private static String CLIENT_SECRET;
    private static String REFRESH_TOKEN;
    private static String ACCESS_TOKEN;
    
    // Static block to initialize values from Custom Metadata
    static {
        DropBox__mdt dropboxConfig = DropBox__mdt.getInstance('Drop_Box');
        if (dropboxConfig != null) {
            CLIENT_ID = dropboxConfig.Client_Id__c;
            CLIENT_SECRET = dropboxConfig.Client_Secret__c;
            REFRESH_TOKEN = dropboxConfig.Refresh_Token__c;  // Fetch Refresh Token from Metadata
        } else {
            System.debug('❌ No DropBox configuration found.');
        }
    }
    
    /**
     * Fetches a new access token using the refresh token.
     */
    @future(callout=true)
    public static void getNewAccessToken(String accountId, string accName, String dropboxFilePath, String base64File, string subFolderLabel, Id opportunityId) {
        try {
            System.debug('🔄 [Refreshing Dropbox Access Token]');
            
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(DROPBOX_TOKEN_URL);
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            String body = 'grant_type=refresh_token' +
                '&refresh_token=' + EncodingUtil.urlEncode(REFRESH_TOKEN, 'UTF-8') +
                '&client_id=' + EncodingUtil.urlEncode(CLIENT_ID, 'UTF-8') +
                '&client_secret=' + EncodingUtil.urlEncode(CLIENT_SECRET, 'UTF-8');
            
            request.setBody(body);
            
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                ACCESS_TOKEN = (String) jsonResponse.get('access_token');
                
                System.debug('✅ New Access Token Received: ' + ACCESS_TOKEN);
                
                // Call Async Upload after getting new access token
                uploadFileToDropboxAsync(accountId, accName, dropboxFilePath, base64File, ACCESS_TOKEN, subFolderLabel, opportunityId);
            } else {
                System.debug('❌ [Error Getting Access Token] ' + response.getBody());
            }
        } catch (Exception e) {
            System.debug('❌ [Exception - Refresh Token] ' + e.getMessage());
        }
    }

     public static void uploadFileToDropboxAsync(String accountId, string accountName, String dropboxFilePaths, String base64File, String accessToken, string subFolderLabel, Id opportunityId) {
        try {
            System.debug('🔥 [Future Call] Uploading file to Dropbox for Account: ' + accountId);
     String RootPath =  getAccountDropboxFolderPath( accountName,  accountId, accessToken);
     System.debug('RootPath ----'+RootPath);
          if(RootPath != ''){
          
          }
           // Define Dropbox Folder Path
            String sanitizedAccountName = sanitizeAccountName(accountName);
            String dropboxFolderPath = RootPath + '/Logo/';
             if(subFolderLabel == 'Application'){
                dropboxFolderPath = RootPath + '/Application/';
             }//'/AccountFiles/' + sanitizedAccountName 
              if(subFolderLabel == 'Valuation'){
                dropboxFolderPath = RootPath + '/Valuation Assessment Report/';
             }

            String dropboxFilePath = dropboxFolderPath + 'logo_' + System.currentTimeMillis() + '.png';
            if(subFolderLabel == 'Application'){
                Opportunity op = [Select Id, Name from Opportunity Where Id =: opportunityId];
                dropboxFilePath = dropboxFolderPath + op.Name + ' '+ '(' + sanitizedAccountName + ') - '+ System.currentTimeMillis() + '.pdf';
            }
            if(subFolderLabel == 'Valuation'){
                dropboxFilePath = dropboxFolderPath + 'Valuation Report - '+sanitizedAccountName+' - ' + System.currentTimeMillis() + '.pdf';
            }

          
            // Upload File to Dropbox
            String uploadResponse = uploadFileToDropbox1(dropboxFilePath, base64File, accessToken);
            System.debug('📤 [Upload Response] ' + uploadResponse);
            
            if (uploadResponse != null) {
                // Get the Public Link for the Uploaded File
                String publicUrl = getDropboxFileLink(dropboxFilePath, accessToken);
                System.debug('🔗 [Public URL] ' + publicUrl);
                
                if (publicUrl != null) {
                    updateAccountWithDropboxFileLink(accountId, publicUrl, subFolderLabel);
                } else {
                    System.debug('❌ [ERROR] Failed to retrieve public link.');
                }
            } else {
                System.debug('❌ [ERROR] File upload failed.');
            }

        } catch (Exception e) {
            System.debug('❌ [Exception - Future Call] ' + e.getMessage());
        }
    }
    
    
    /**
     * Initiates file upload by retrieving ContentVersion and calling @future method.
     * @param accountId - Salesforce Account Id
     * @param attachmentId - Salesforce ContentVersion Id
     * @param subFolderLabel - Dynamic subfolder label (e.g., "Applications", "Valuation Report")
     */
    public static void uploadFileToDropbox(string accountId, Id attachmentId, String subFolderLabel, Id opportunityId, Blob fileValueBlob) {
    System.debug('🔥 [START] Preparing file upload for Account: ' + accountId);
        try {
        System.debug('🔥 [START] Preparing file upload for Account: ' + accountId);
        Account ac;
        ContentVersion att;
        String base64File = '';
        Boolean isCustomUpload = false;

        if (accountId != null) {
            // Fetch Account details
            ac = [SELECT Id, Name FROM Account WHERE Id = :accountId];
        } else {
            System.debug('❌ [ERROR] Account ID is required.');
            return;
        }
        
        if(subFolderLabel == 'Application'){
            folderName = subFolderLabel;
            system.debug('folderName - '+folderName);
            applicationIdToUpdate = opportunityId;
            
        }
         if(subFolderLabel == 'Logo'){
            folderName = subFolderLabel;
            accountIdToUpdate = opportunityId;
            
        }
        if(subFolderLabel == 'Valuation'){
            folderName = subFolderLabel;
            accountIdToUpdate = opportunityId;
            
        }
        if (attachmentId != null) {
            // Retrieve latest ContentVersion record
            att = [
                SELECT Id, Title, VersionData, FileType
                FROM ContentVersion
                WHERE ContentDocumentId = :attachmentId
                ORDER BY SystemModstamp DESC
                LIMIT 1
            ];
            System.debug('📂 [File Retrieved] Name: ' + att.Title + ', ID: ' + att.Id);
            base64File = EncodingUtil.base64Encode(att.VersionData);
        } else if (fileValueBlob != null) {
            base64File = EncodingUtil.base64Encode(fileValueBlob);
            isCustomUpload = true;
        } else {
            System.debug('❌ [ERROR] No file to upload. Aborting upload.');
            return;
        }

        // Define Dropbox folder paths
        String sanitizedAccountName = sanitizeAccountName(ac.Name);
        // String rootFolderPath = '/AccountFiles/' + sanitizedAccountName;
         String dropboxFilePath = '';

        // // Special Handling for Application Subfolder
        // if (isCustomUpload && subFolderLabel == 'Application' && opportunityId != null) {
        //     dropboxFilePath = rootFolderPath + '/Application/Opportunity_' + String.valueOf(opportunityId) + '/Documents/';
        // } else if (subFolderLabel == 'Logo') {
        //     dropboxFilePath = rootFolderPath + '/Logo/Documents/';
        // } else {
        //     dropboxFilePath = rootFolderPath + '/' + subFolderLabel + '/Documents/';
        // }

        // Handle Dropbox Access Token
        if (ACCESS_TOKEN == null) {
            getNewAccessToken(String.valueOf(accountId),ac.Name, dropboxFilePath, base64File, subFolderLabel, opportunityId);
        } else {
            getNewAccessToken(String.valueOf(accountId),ac.Name, dropboxFilePath, base64File, subFolderLabel, opportunityId);
        }

        System.debug('📤 [Async Call Initiated] File upload request sent.');

    } catch (Exception e) {
        System.debug('❌ [Exception - Main Method] ' + e.getMessage());
    }
}


    /**
     * @future method to avoid mixed DML and callout issues.
     */
   
    private static String uploadFileToDropbox1(String filePath, String base64Content, String accessToken) {
        try {
            System.debug('📤 [Uploading File to Dropbox] ' + filePath);
            
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(DROPBOX_UPLOAD_URL);
            request.setMethod('POST');
            request.setHeader('Authorization', 'Bearer ' + accessToken);
            request.setHeader('Content-Type', 'application/octet-stream');
            request.setHeader('Dropbox-API-Arg', '{"path": "' + filePath + '", "mode": "add", "autorename": true, "mute": false}');
            
            request.setBodyAsBlob(EncodingUtil.base64Decode(base64Content));
            HttpResponse response = http.send(request);
            
            return response.getStatusCode() == 200 ? response.getBody() : null;
        } catch (Exception e) {
            System.debug('❌ [Exception - Upload] ' + e.getMessage());
            return null;
        }
    }
    
    private static void updateAccountWithDropboxFileLink(String accountId, String fileUrl, String folderNames) {
        try {
             System.debug('📝 [Updating folderName] ' + folderName);
            if(folderNames == 'Logo'){
             System.debug('📝 [Updating Account with Dropbox URL] ' + fileUrl);
            Account acc = [SELECT Id, Logo_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
            acc.Logo_URL__c = fileUrl;
            update acc;
            System.debug('✅ [Account Update Successful]');
            }

            // -----------------------------------------------------------------//
              // Convert the Dropbox URL for direct download
        if (fileUrl.contains('?dl=0')) {
            fileUrl = fileUrl.replace('?dl=0', '?dl=1');
        } else if (fileUrl.contains('?rlkey=')) {
            // If URL contains rlkey but not dl parameter, append ?dl=1
            fileUrl += '&dl=1';
        }

        
            if(folderNames == 'Application'){
             System.debug('📝 [Updating Account with Dropbox URL] ' + fileUrl);
            Account acc = [SELECT Id, Application_Pdf_Url__c, House_Builder_Application_Pdf_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
            acc.House_Builder_Application_Pdf_URL__c = fileUrl;
            acc.Application_Pdf_Url__c = fileUrl;
            update acc;
            System.debug('✅ [Account Update Successful]');
            }
            if(folderNames == 'Valuation'){
             System.debug('📝 [Updating Account with Dropbox URL] ' + fileUrl);
            Account acc = [SELECT Id,Valuation_Assessment_PDF_Url__c, Agent_Valuation_Pdf_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
            acc.Agent_Valuation_Pdf_URL__c = fileUrl;
            acc.Valuation_Assessment_PDF_Url__c = fileUrl;
            update acc;
            System.debug('✅ [Account Update Successful]');
            }
           sendDropboxFileLink (fileUrl);
        } catch (Exception e) {
            System.debug('❌ [Exception - Account Update] ' + e.getMessage());
        }
    }//
    
    //Send PDF URL to Valuation Form and Housebuillder Application Form
    @AuraEnabled
    public static String sendDropboxFileLink(String filePathURL) {
        string url = '';
        if(filePathURL != null || !String.isBlank(filePathURL)){
            url = filePathURL;
        }

        return url;
    }
    public static String getDropboxFileLink(String filePath, String accessToken) {
        try {
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(DROPBOX_SHARED_LINK_URL);
            request.setMethod('POST');
            request.setHeader('Authorization', 'Bearer ' + accessToken);
            request.setHeader('Content-Type', 'application/json');
            request.setBody('{"path": "' + filePath + '"}');
            
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                if (responseMap != null && responseMap.containsKey('url')) {
                    String url = (String) responseMap.get('url');
                    return url.replace('?dl=0', '?raw=1');
                }
            }
            
            System.debug('❌ [ERROR] Failed to get Dropbox file link. Response: ' + response.getBody());
            return null;
        } catch (Exception e) {
            System.debug('❌ [Exception - Public Link] ' + e.getMessage());
            return null;
        }
    }
    
   
    
    // ✅ Properly sanitizing account name for Dropbox
    private static String sanitizeAccountName(String accountName) {
        return accountName.replaceAll('[^a-zA-Z0-9_-]', '_');
    }
    
    //  public static String getAccountDropboxFolderPath(String accountName, String accountId, String accessToken) {
    //     String parentFolderPath = '/Private Salesforce Documents/Accounts';
    //     String folderName = accountName;

    //     HttpRequest req = new HttpRequest();
    //     req.setEndpoint('https://api.dropboxapi.com/2/files/list_folder');
    //     req.setMethod('POST');
    //     req.setHeader('Authorization', 'Bearer ' + accessToken);
    //     req.setHeader('Content-Type', 'application/json');
        
    //     String requestBody = '{"path": "' + parentFolderPath + '", "recursive": false}';
    //     req.setBody(requestBody);

    //     Http http = new Http();
    //     HTTPResponse res = http.send(req);

    //     if (res.getStatusCode() == 200) {
    //         Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    //         List<Object> entries = (List<Object>) response.get('entries');

    //         for (Object entry : entries) {
    //             Map<String, Object> folderData = (Map<String, Object>) entry;
    //             String existingFolderName = (String) folderData.get('name');
    //             String existingFolderPath = (String) folderData.get('path_lower');

    //             if (existingFolderName == folderName) {
    //                 return existingFolderPath; // Return exact path if found
    //             }
    //         }
    //     }

    //     return null; // Folder does not exist
    // }

   public static String getAccountDropboxFolderPath(String accountName, String accountId, String accessToken) {
    
        String parentFolderPath = '/Private Salesforce Documents/Accounts';
        String expectedFolderPath = parentFolderPath + '/' + accountName;
        System.debug('accountName ------'+'   '+accountName+'   '+'expectedFolderPath = '+ expectedFolderPath);
        // 1️⃣ Check if Folder Exists
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.dropboxapi.com/2/files/list_folder');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Content-Type', 'application/json');
        
        String requestBody = '{"path": "' + parentFolderPath + '", "recursive": false}';
        req.setBody(requestBody);

        Http http = new Http();
        HTTPResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> entries = (List<Object>) response.get('entries');

            for (Object entry : entries) {
                Map<String, Object> folderData = (Map<String, Object>) entry;
                String existingFolderName = (String) folderData.get('name');
                String existingFolderPath = (String) folderData.get('path_lower');

                // If Folder with Account Name exists, return its path
                if (existingFolderName == accountName) {
                    return existingFolderPath;
                }
            }
        }

        // 2️⃣ Folder Not Found → Create It
        return createAccountDropboxFolder(accountName, accountId, accessToken);
    }

    @AuraEnabled
   public static String createAccountDropboxFolder(String accountName, String accountId, String accessToken) {
    String parentFolderPath = '/Private Salesforce Documents/Accounts';
    
    // ✅ Ensure spaces are preserved by trimming only, NO replacements!
    String trimmedAccountName = accountName.trim();
    String folderPath = parentFolderPath + '/' + trimmedAccountName;

    System.debug('🔍 Folder Path Sent to Dropbox: "' + folderPath + '"'); // Debugging log

    HttpRequest req = new HttpRequest();
    req.setEndpoint('https://api.dropboxapi.com/2/files/create_folder_v2');
    req.setMethod('POST');
    req.setHeader('Authorization', 'Bearer ' + accessToken);
    req.setHeader('Content-Type', 'application/json');

    // ✅ Use JSON serialization to ensure proper formatting
    String requestBody = JSON.serializePretty(new Map<String, Object>{
        'path' => folderPath,
        'autorename' => false
    });
    
    req.setBody(requestBody);
    
    Http http = new Http();
    HTTPResponse res = http.send(req);
    
    // ✅ Success Case
    if (res.getStatusCode() == 200) {
        System.debug('📁 Folder Created Successfully: ' + folderPath);
        return folderPath;
    }
    
    // ❌ Failure Case - Log Error
    System.debug('❌ Dropbox Folder Creation Failed: ' + res.getBody());
    return null;
}

   
}