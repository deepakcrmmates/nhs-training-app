public class BoxFileService {

    private static final String BOX_API_URL = 'https://api.box.com/2.0';
    private static final String BOX_UPLOAD_URL = 'https://upload.box.com/api/2.0/files/content';
    private static final String BOX_TOKEN_URL = 'https://api.box.com/oauth2/token';

    // ── Upload file to Box ──
    public static void uploadFileToDropbox(String accountId, Id attachmentId, String subFolderLabel, Id opportunityId, Blob fileValueBlob) {
        String accName = '';
        String base64File = '';

        if (String.isNotBlank(accountId)) {
            Account acc = [SELECT Name FROM Account WHERE Id = :accountId LIMIT 1];
            accName = sanitizeName(acc.Name);
        }

        if (attachmentId != null) {
            ContentVersion cv = [SELECT Title, FileExtension, VersionData FROM ContentVersion WHERE ContentDocumentId = :attachmentId AND IsLatest = true LIMIT 1];
            base64File = EncodingUtil.base64Encode(cv.VersionData);
        } else if (fileValueBlob != null) {
            base64File = EncodingUtil.base64Encode(fileValueBlob);
        }

        if (String.isNotBlank(base64File)) {
            uploadToBoxAsync(accountId, accName, base64File, subFolderLabel, opportunityId);
        }
    }

    @future(callout=true)
    private static void uploadToBoxAsync(String accountId, String accountName, String base64File, String subFolderLabel, Id opportunityId) {
        try {
            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) {
                System.debug('BoxFileService: Failed to get access token');
                return;
            }

            // Get or create root accounts folder
            Box_Config__c config = BoxOAuthController.getConfig();
            String rootFolderId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

            // Get or create account folder
            String accountFolderId = getOrCreateFolder(accountName, rootFolderId, accessToken);
            if (accountFolderId == null) return;

            // Get or create subfolder
            String subFolderId = getOrCreateFolder(subFolderLabel, accountFolderId, accessToken);
            if (subFolderId == null) return;

            // Build file name
            String fileName = buildFileName(accountName, subFolderLabel, opportunityId);

            // Upload file
            String fileId = uploadFile(subFolderId, fileName, base64File, accessToken);
            if (fileId == null) return;

            // Create shared link
            String sharedLink = createSharedLink(fileId, accessToken);

            // Update Account record
            if (String.isNotBlank(accountId) && sharedLink != null) {
                updateAccountWithLink(accountId, sharedLink, subFolderLabel, opportunityId);
            }
        } catch (Exception e) {
            System.debug('BoxFileService upload error: ' + e.getMessage());
        }
    }

    // ── Folder operations ──
    public static String getOrCreateFolder(String folderName, String parentId, String accessToken) {
        // Search for existing folder
        String existingId = findFolder(folderName, parentId, accessToken);
        if (existingId != null) return existingId;

        // Create new folder
        return createFolder(folderName, parentId, accessToken);
    }

    public static String findFolder(String folderName, String parentId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_API_URL + '/folders/' + parentId + '/items?fields=name,id,type&limit=1000');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 200) {
            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            List<Object> entries = (List<Object>) body.get('entries');
            for (Object entry : entries) {
                Map<String, Object> item = (Map<String, Object>) entry;
                if (item.get('type') == 'folder' && item.get('name') == folderName) {
                    return (String) item.get('id');
                }
            }
        }
        return null;
    }

    public static String createFolder(String folderName, String parentId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_API_URL + '/folders');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Content-Type', 'application/json');

        Map<String, Object> body = new Map<String, Object>();
        body.put('name', folderName);
        body.put('parent', new Map<String, Object>{ 'id' => parentId });
        req.setBody(JSON.serialize(body));

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 201) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            return (String) responseBody.get('id');
        } else if (resp.getStatusCode() == 409) {
            // Folder already exists — conflict, find it
            return findFolder(folderName, parentId, accessToken);
        }
        System.debug('Box createFolder error: ' + resp.getBody());
        return null;
    }

    // ── File upload ──
    public static String uploadFile(String folderId, String fileName, String base64Content, String accessToken) {
        Blob fileBody = EncodingUtil.base64Decode(base64Content);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_UPLOAD_URL);
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setTimeout(120000);

        // Box upload requires multipart form data
        String boundary = '---BoxUpload' + String.valueOf(DateTime.now().getTime());
        req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);

        // Build attributes JSON
        Map<String, Object> attributes = new Map<String, Object>();
        attributes.put('name', fileName);
        attributes.put('parent', new Map<String, Object>{ 'id' => folderId });
        String attributesJson = JSON.serialize(attributes);

        // Build multipart body
        String bodyStart = '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="attributes"\r\n\r\n'
            + attributesJson + '\r\n'
            + '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n'
            + 'Content-Type: application/octet-stream\r\n\r\n';
        String bodyEnd = '\r\n--' + boundary + '--';

        Blob bodyStartBlob = Blob.valueOf(bodyStart);
        Blob bodyEndBlob = Blob.valueOf(bodyEnd);

        // Combine: bodyStart + fileBody + bodyEnd
        String combined = EncodingUtil.base64Encode(bodyStartBlob)
            + EncodingUtil.base64Encode(fileBody)
            + EncodingUtil.base64Encode(bodyEndBlob);

        // Use hex approach for proper binary concatenation
        String hex = EncodingUtil.convertToHex(bodyStartBlob)
            + EncodingUtil.convertToHex(fileBody)
            + EncodingUtil.convertToHex(bodyEndBlob);
        req.setBodyAsBlob(EncodingUtil.convertFromHex(hex));

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 201) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            List<Object> entries = (List<Object>) responseBody.get('entries');
            if (!entries.isEmpty()) {
                Map<String, Object> file = (Map<String, Object>) entries[0];
                return (String) file.get('id');
            }
        }
        System.debug('Box upload error: ' + resp.getStatusCode() + ' ' + resp.getBody());
        return null;
    }

    // ── Shared link ──
    public static String createSharedLink(String fileId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_API_URL + '/files/' + fileId);
        req.setMethod('PUT');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Content-Type', 'application/json');

        Map<String, Object> body = new Map<String, Object>();
        body.put('shared_link', new Map<String, Object>{
            'access' => 'open'
        });
        req.setBody(JSON.serialize(body));

        Http http = new Http();
        HttpResponse resp = http.send(req);

        if (resp.getStatusCode() == 200) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            Map<String, Object> sharedLink = (Map<String, Object>) responseBody.get('shared_link');
            if (sharedLink != null) {
                return (String) sharedLink.get('download_url');
            }
        }
        System.debug('Box shared link error: ' + resp.getBody());
        return null;
    }

    // ── Download URL ──
    public static String getDownloadUrl(String fileId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BOX_API_URL + '/files/' + fileId + '/content');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        HttpResponse resp = http.send(req);

        // Box returns 302 redirect to download URL
        if (resp.getStatusCode() == 302) {
            return resp.getHeader('Location');
        }
        return null;
    }

    // ── Update Account ──
    private static void updateAccountWithLink(String accountId, String fileUrl, String subFolderLabel, Id opportunityId) {
        Account acc = [SELECT Id FROM Account WHERE Id = :accountId LIMIT 1];

        if (subFolderLabel == 'Logo') {
            acc.Logo_URL__c = fileUrl;
            acc.House_Builder_Logo__c = '<img src="' + fileUrl + '" alt="Account Image"/>';
        } else if (subFolderLabel == 'Application') {
            acc.Application_Pdf_Url__c = fileUrl;
        } else if (subFolderLabel == 'Valuation') {
            acc.Valuation_Assessment_PDF_Url__c = fileUrl;
        }
        update acc;
    }

    // ── Helpers ──
    private static String buildFileName(String accountName, String subFolderLabel, Id opportunityId) {
        String timestamp = String.valueOf(DateTime.now().getTime());
        if (subFolderLabel == 'Logo') {
            return 'logo_' + timestamp + '.png';
        } else if (subFolderLabel == 'Application') {
            String oppName = '';
            if (opportunityId != null) {
                Opportunity opp = [SELECT Name FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
                oppName = opp.Name;
            }
            return sanitizeName(oppName) + ' (' + accountName + ') - ' + timestamp + '.pdf';
        } else if (subFolderLabel == 'Valuation') {
            return 'Valuation Report - ' + accountName + ' - ' + timestamp + '.pdf';
        }
        return 'file_' + timestamp;
    }

    public static String sanitizeName(String name) {
        if (String.isBlank(name)) return 'Unknown';
        return name.replaceAll('[^a-zA-Z0-9\\-_ ]', '_');
    }
}
