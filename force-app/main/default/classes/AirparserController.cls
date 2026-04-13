public with sharing class AirparserController {

    private static final String AIRPARSER_BASE = 'https://api.airparser.com';

    // ── Config ──

    @AuraEnabled
    public static Map<String, Object> getConfig() {
        Map<String, Object> result = new Map<String, Object>();
        List<NHS_API_Config__c> configs = [SELECT Airparser_API_Key__c, Airparser_Inbox_Id__c FROM NHS_API_Config__c LIMIT 1];
        if (configs.isEmpty()) {
            result.put('configured', false);
            return result;
        }
        result.put('configured', String.isNotBlank(configs[0].Airparser_API_Key__c));
        result.put('hasInbox', String.isNotBlank(configs[0].Airparser_Inbox_Id__c));
        result.put('inboxId', configs[0].Airparser_Inbox_Id__c);
        // Mask API key
        String key = configs[0].Airparser_API_Key__c;
        if (String.isNotBlank(key)) {
            result.put('apiKeyMasked', key.length() > 8 ? key.substring(0, 4) + '****' + key.substring(key.length() - 4) : '****');
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static String getHouseBuilderRtId() {
        return Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
    }

    // ── List Airparser Inboxes ──

    @AuraEnabled
    public static Map<String, Object> listInboxes() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/inboxes', null);
            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                result.put('status', 'success');
                result.put('inboxes', JSON.deserializeUntyped(resp.getBody()));
            } else if (resp.getStatusCode() == 200) {
                result.put('status', 'success');
                result.put('inboxes', new List<Object>());
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Get Inbox Details ──

    @AuraEnabled
    public static Map<String, Object> getInboxDetails(String inboxId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/inboxes/' + inboxId, null);
            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                result.put('status', 'success');
                result.put('inbox', JSON.deserializeUntyped(resp.getBody()));
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Get Schema ──

    @AuraEnabled
    public static Map<String, Object> getSchema(String inboxId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/inboxes/' + inboxId, null);
            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                Map<String, Object> inbox = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                result.put('status', 'success');
                result.put('schema', inbox.get('schema'));
                result.put('rawResponse', resp.getBody());
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Fetch Raw Parsed Documents (no mapping) ──

    @AuraEnabled
    public static Map<String, Object> fetchRawDocuments(String inboxId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/inboxes/' + inboxId + '/docs?per_page=50', null);
            if (resp.getStatusCode() != 200) {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
                return result;
            }

            String body = resp.getBody();
            if (String.isBlank(body)) {
                result.put('status', 'success');
                result.put('documents', new List<Object>());
                return result;
            }

            Object parsed = JSON.deserializeUntyped(body);
            List<Object> docs;
            if (parsed instanceof List<Object>) {
                docs = (List<Object>) parsed;
            } else if (parsed instanceof Map<String, Object>) {
                Map<String, Object> respMap = (Map<String, Object>) parsed;
                if (respMap.containsKey('data')) {
                    docs = (List<Object>) respMap.get('data');
                } else if (respMap.containsKey('docs')) {
                    docs = (List<Object>) respMap.get('docs');
                } else {
                    docs = new List<Object>();
                }
            } else {
                docs = new List<Object>();
            }

            // Just return the listing — no individual doc fetches (fast)
            result.put('status', 'success');
            result.put('documents', docs);
            result.put('totalListed', docs.size());
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Parse Single Document (fetch parsed data on demand) ──

    @AuraEnabled
    public static Map<String, Object> parseDocument(String docId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            // Use extended endpoint for more details including file URL
            HttpResponse resp = callAirparser('GET', '/docs/' + docId + '/extended', null);
            if (resp.getStatusCode() != 200 || String.isBlank(resp.getBody())) {
                // Fallback to compact endpoint
                resp = callAirparser('GET', '/docs/' + docId, null);
            }

            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                Map<String, Object> docData = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                result.put('status', 'success');
                result.put('document', docData);

                // Extract file URL if available
                String fileUrl = findFileUrl(docData);
                if (String.isNotBlank(fileUrl)) {
                    result.put('fileUrl', fileUrl);
                }
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + (String.isNotBlank(resp.getBody()) ? resp.getBody() : 'Empty response'));
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Get document preview info ──

    @AuraEnabled
    public static Map<String, Object> getDocumentFileUrl(String docId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/docs/' + docId + '/extended', null);
            if (resp.getStatusCode() != 200 || String.isBlank(resp.getBody())) {
                resp = callAirparser('GET', '/docs/' + docId, null);
            }

            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                Map<String, Object> docData = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());

                String inboxId = (String) docData.get('inbox_id');

                // Build Airparser web app URL for preview
                String webUrl = 'https://app.airparser.com/' + inboxId + '/docs/' + docId;

                result.put('status', 'success');
                result.put('webUrl', webUrl);
                result.put('fileName', docData.get('name'));
                result.put('contentType', docData.get('content_type'));
                result.put('format', docData.get('format'));
            } else {
                result.put('status', 'error');
                result.put('message', 'Could not fetch document details.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Fetch single preview page as base64 ──

    @AuraEnabled
    public static Map<String, Object> getPreviewPage(String pageUrl) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            String apiKey = getApiKey();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(pageUrl);
            req.setMethod('GET');
            req.setHeader('X-API-Key', apiKey);
            req.setTimeout(15000);
            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 200) {
                String contentType = resp.getHeader('Content-Type');
                if (String.isBlank(contentType)) contentType = 'image/png';
                String b64 = 'data:' + contentType + ';base64,' + EncodingUtil.base64Encode(resp.getBodyAsBlob());
                result.put('status', 'success');
                result.put('imageData', b64);
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // Search for file URL in various possible field names
    private static String findFileUrl(Map<String, Object> docData) {
        // Check img_preview first (confirmed available from Airparser)
        List<String> urlKeys = new List<String>{
            'img_preview', 'file_url', 'source_url', 'original_url', 'url',
            'download_url', 'file', 'source', 'document_url', 'pdf_url', 'image_url'
        };
        for (String key : urlKeys) {
            Object val = docData.get(key);
            if (val != null && val instanceof String && String.isNotBlank((String) val)) {
                return (String) val;
            }
        }
        // img_preview is a list of objects with 'path' key
        if (docData.containsKey('img_preview') && docData.get('img_preview') instanceof List<Object>) {
            List<Object> previews = (List<Object>) docData.get('img_preview');
            if (!previews.isEmpty()) {
                Object first = previews[0];
                if (first instanceof Map<String, Object>) {
                    String path = (String) ((Map<String, Object>) first).get('path');
                    if (String.isNotBlank(path)) return 'https://api.airparser.com/img/' + path;
                } else if (first instanceof String) {
                    return (String) first;
                }
            }
        }
        // pages might contain image URLs
        if (docData.containsKey('pages') && docData.get('pages') instanceof List<Object>) {
            List<Object> pages = (List<Object>) docData.get('pages');
            for (Object page : pages) {
                if (page instanceof Map<String, Object>) {
                    Map<String, Object> pageMap = (Map<String, Object>) page;
                    for (String key : urlKeys) {
                        Object val = pageMap.get(key);
                        if (val != null && val instanceof String && String.isNotBlank((String) val)) {
                            return (String) val;
                        }
                    }
                } else if (page instanceof String) {
                    return (String) page;
                }
            }
        }
        return null;
    }

    // Get ALL preview images (for multi-page PDFs)
    // img_preview is a list of objects: {content_type=image/png, height=1568, page=0, path=69dc.../page_1.png, width=1108}
    private static List<String> findAllPreviewUrls(Map<String, Object> docData) {
        List<String> urls = new List<String>();
        String baseUrl = 'https://api.airparser.com/img/';

        if (!docData.containsKey('img_preview')) return urls;

        Object imgPreview = docData.get('img_preview');

        if (imgPreview instanceof List<Object>) {
            for (Object item : (List<Object>) imgPreview) {
                if (item instanceof Map<String, Object>) {
                    Map<String, Object> pageObj = (Map<String, Object>) item;
                    String path = (String) pageObj.get('path');
                    if (String.isNotBlank(path)) {
                        urls.add(baseUrl + path);
                    }
                } else if (item instanceof String && String.isNotBlank((String) item)) {
                    urls.add((String) item);
                }
            }
        } else if (imgPreview instanceof String && String.isNotBlank((String) imgPreview)) {
            urls.add((String) imgPreview);
        }

        return urls;
    }

    // ── Upload & Parse Document ──

    @AuraEnabled
    public static Map<String, Object> uploadAndParse(String inboxId, String contentDocumentId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            // Get the file content from Salesforce
            ContentVersion cv = [
                SELECT Title, FileExtension, VersionData
                FROM ContentVersion
                WHERE ContentDocumentId = :contentDocumentId AND IsLatest = true
                LIMIT 1
            ];

            String fileName = cv.Title + (String.isNotBlank(cv.FileExtension) ? '.' + cv.FileExtension : '');
            Blob fileBody = cv.VersionData;

            // Build multipart request
            String boundary = '---AirparserBoundary' + String.valueOf(Datetime.now().getTime());
            String apiKey = getApiKey();

            HttpRequest req = new HttpRequest();
            req.setEndpoint(AIRPARSER_BASE + '/inboxes/' + inboxId + '/upload-sync');
            req.setMethod('POST');
            req.setHeader('X-API-Key', apiKey);
            req.setTimeout(60000); // 60s for sync parsing

            // Build multipart body
            String header = '--' + boundary + '\r\n' +
                'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
                'Content-Type: application/pdf\r\n\r\n';
            String footer = '\r\n--' + boundary + '--';

            Blob headerBlob = Blob.valueOf(header);
            Blob footerBlob = Blob.valueOf(footer);

            // Concatenate: header + file + footer
            String headerEncoded = EncodingUtil.base64Encode(headerBlob);
            String bodyEncoded = EncodingUtil.base64Encode(fileBody);
            String footerEncoded = EncodingUtil.base64Encode(footerBlob);

            // Combine via hex to avoid encoding issues
            Blob bodyBlob;
            String last4Header = headerEncoded.substring(headerEncoded.length() - 4);

            if (last4Header.endsWith('==')) {
                headerEncoded = headerEncoded.substring(0, headerEncoded.length() - 4);
                bodyEncoded = EncodingUtil.base64Encode(
                    Blob.valueOf(
                        EncodingUtil.base64Decode(last4Header).toString() +
                        EncodingUtil.base64Decode(bodyEncoded).toString()
                    )
                );
            } else if (last4Header.endsWith('=')) {
                headerEncoded = headerEncoded.substring(0, headerEncoded.length() - 4);
                bodyEncoded = EncodingUtil.base64Encode(
                    Blob.valueOf(
                        EncodingUtil.base64Decode(last4Header).toString() +
                        EncodingUtil.base64Decode(bodyEncoded).toString()
                    )
                );
            }

            // Use hex concatenation for binary safety
            String combined = headerEncoded + bodyEncoded + footerEncoded;
            req.setBodyAsBlob(EncodingUtil.base64Decode(combined));
            req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);

            HttpResponse resp = new Http().send(req);

            // Clean up the uploaded file from Salesforce
            delete [SELECT Id FROM ContentDocument WHERE Id = :contentDocumentId];

            if (resp.getStatusCode() == 200 && String.isNotBlank(resp.getBody())) {
                Map<String, Object> parsed = (Map<String, Object>) System.JSON.deserializeUntyped(resp.getBody());
                result.put('status', 'success');
                result.put('document', parsed);

                Boolean inProgress = parsed.get('parsing_in_progress') == true;
                result.put('parsingInProgress', inProgress);
                result.put('message', inProgress ? 'Document uploaded. Parsing in progress...' : 'Document parsed successfully.');
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static String getApiKey() {
        List<NHS_API_Config__c> configs = [SELECT Airparser_API_Key__c FROM NHS_API_Config__c LIMIT 1];
        if (configs.isEmpty() || String.isBlank(configs[0].Airparser_API_Key__c)) {
            throw new AuraHandledException('Airparser API key not configured.');
        }
        return configs[0].Airparser_API_Key__c;
    }

    // ── Fetch & Import Parsed Documents ──

    @AuraEnabled
    public static Map<String, Object> fetchParsedDocuments() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT Airparser_API_Key__c, Airparser_Inbox_Id__c FROM NHS_API_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].Airparser_Inbox_Id__c)) {
                result.put('status', 'error');
                result.put('message', 'Airparser inbox not configured.');
                return result;
            }

            String inboxId = configs[0].Airparser_Inbox_Id__c;

            // Fetch recent parsed docs from Airparser
            HttpResponse resp = callAirparser('GET', '/inboxes/' + inboxId + '/docs?status[]=parsed&per_page=50', null);
            if (resp.getStatusCode() != 200) {
                result.put('status', 'error');
                result.put('message', 'Airparser API error: HTTP ' + resp.getStatusCode());
                return result;
            }

            // Response may be a list or a map with a data/docs key
            Object parsed = JSON.deserializeUntyped(resp.getBody());
            List<Object> docs;
            if (parsed instanceof List<Object>) {
                docs = (List<Object>) parsed;
            } else if (parsed instanceof Map<String, Object>) {
                Map<String, Object> respMap = (Map<String, Object>) parsed;
                // Try common keys: data, docs, results
                if (respMap.containsKey('data')) {
                    docs = (List<Object>) respMap.get('data');
                } else if (respMap.containsKey('docs')) {
                    docs = (List<Object>) respMap.get('docs');
                } else {
                    docs = new List<Object>();
                }
            } else {
                docs = new List<Object>();
            }

            // Get existing doc IDs to avoid duplicates
            Set<String> existingDocIds = new Set<String>();
            for (Parsed_Application__c pa : [SELECT Airparser_Doc_Id__c FROM Parsed_Application__c WHERE Airparser_Doc_Id__c != null]) {
                existingDocIds.add(pa.Airparser_Doc_Id__c);
            }

            List<Parsed_Application__c> toInsert = new List<Parsed_Application__c>();
            Integer imported = 0;
            Integer skipped = 0;

            for (Object docObj : docs) {
                Map<String, Object> doc = (Map<String, Object>) docObj;
                String docId = (String) doc.get('id');

                if (existingDocIds.contains(docId)) {
                    skipped++;
                    continue;
                }

                // Fetch full parsed data for this doc
                HttpResponse docResp = callAirparser('GET', '/docs/' + docId, null);
                if (docResp.getStatusCode() != 200 || String.isBlank(docResp.getBody())) continue;

                Map<String, Object> docData = (Map<String, Object>) JSON.deserializeUntyped(docResp.getBody());

                // The parsed JSON may be in 'json' key or directly in the response
                Map<String, Object> parsedJson;
                if (docData.containsKey('json') && docData.get('json') instanceof Map<String, Object>) {
                    parsedJson = (Map<String, Object>) docData.get('json');
                } else {
                    parsedJson = docData;
                }
                if (parsedJson == null || parsedJson.isEmpty()) continue;

                Parsed_Application__c pa = mapJsonToStagingRecord(parsedJson, docId, inboxId);
                String jsonStr = System.JSON.serialize(parsedJson);
                pa.Raw_JSON__c = jsonStr.left(131072);
                pa.Parsed_Date__c = Datetime.now();

                toInsert.add(pa);
                imported++;

                // Respect callout limits
                if (imported >= 20) break;
            }

            if (!toInsert.isEmpty()) {
                insert toInsert;
            }

            result.put('status', 'success');
            result.put('imported', imported);
            result.put('skipped', skipped);
            result.put('message', 'Imported ' + imported + ' new applications' + (skipped > 0 ? ' (' + skipped + ' already imported)' : ''));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Get Staged Applications ──

    @AuraEnabled
    public static List<Parsed_Application__c> getStagedApplications(String statusFilter) {
        String query = 'SELECT Id, Name, Status__c, Vendor_1_First_Name__c, Vendor_1_Last_Name__c, ' +
            'Vendor_1_Email__c, Vendor_1_Mobile__c, Vendor_2_First_Name__c, Vendor_2_Last_Name__c, ' +
            'Property_Street__c, Property_City__c, Property_Postcode__c, Property_Type__c, Number_Of_Bedrooms__c, ' +
            'Agent_Name__c, Agent_Email__c, Housebuilder_Name__c, Development__c, Plot__c, ' +
            'Purchase_Price__c, Client_Expectation__c, Scheme__c, Region__c, Notes__c, ' +
            'Parsed_Date__c, Application__c, Airparser_Doc_Id__c ' +
            'FROM Parsed_Application__c';

        if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
            String safeFilter = String.escapeSingleQuotes(statusFilter);
            query += ' WHERE Status__c = :safeFilter';
            return Database.query(query);
        }
        query += ' ORDER BY Parsed_Date__c DESC LIMIT 100';
        return Database.query(query);
    }

    // ── Approve & Create Application ──

    @AuraEnabled
    public static Map<String, Object> approveAndCreate(Id parsedAppId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Parsed_Application__c pa = [
                SELECT Id, Status__c, Vendor_1_First_Name__c, Vendor_1_Last_Name__c, Vendor_1_Email__c, Vendor_1_Mobile__c,
                       Vendor_2_First_Name__c, Vendor_2_Last_Name__c, Vendor_2_Email__c, Vendor_2_Mobile__c,
                       Property_Street__c, Property_City__c, Property_Postcode__c, Property_Type__c, Number_Of_Bedrooms__c,
                       Agent_Name__c, Agent_Phone__c, Agent_Email__c,
                       Housebuilder_Name__c, Development__c, Plot__c,
                       Purchase_Price__c, Client_Expectation__c, Scheme__c, Region__c, Notes__c
                FROM Parsed_Application__c WHERE Id = :parsedAppId LIMIT 1
            ];

            if (pa.Status__c == 'Created') {
                result.put('status', 'error');
                result.put('message', 'Application already created.');
                return result;
            }

            // Build form data matching houseBuilderApplication.saveData() format
            Map<String, Object> vendorData = new Map<String, Object>{
                'firstname' => pa.Vendor_1_First_Name__c,
                'lastname' => pa.Vendor_1_Last_Name__c,
                'email' => pa.Vendor_1_Email__c,
                'mobilePhone' => pa.Vendor_1_Mobile__c,
                'firstname1' => pa.Vendor_2_First_Name__c,
                'lastname1' => pa.Vendor_2_Last_Name__c,
                'email1' => pa.Vendor_2_Email__c,
                'mobilePhone1' => pa.Vendor_2_Mobile__c
            };

            Map<String, Object> propertyData = new Map<String, Object>{
                'street' => pa.Property_Street__c,
                'city' => pa.Property_City__c,
                'pcode' => pa.Property_Postcode__c,
                'NumberofBedrooms' => pa.Number_Of_Bedrooms__c
            };

            // Set property type booleans
            if (String.isNotBlank(pa.Property_Type__c)) {
                String pt = pa.Property_Type__c.toLowerCase();
                if (pt.contains('detach') && !pt.contains('semi')) propertyData.put('Detached', true);
                if (pt.contains('semi')) propertyData.put('SemiDetached', true);
                if (pt.contains('end') && pt.contains('terrace')) propertyData.put('EndTerrace', true);
                if (pt.contains('mid') && pt.contains('terrace')) propertyData.put('MidTerrace', true);
                if (pt.contains('apartment') || pt.contains('flat')) propertyData.put('Apartment', true);
                if (pt.contains('maisonette')) propertyData.put('Maisonette', true);
                if (pt.contains('bungalow')) propertyData.put('Bungalow', true);
            }

            Map<String, Object> agentData = new Map<String, Object>{
                'agentName' => pa.Agent_Name__c,
                'agentPhone' => pa.Agent_Phone__c,
                'agentEmail' => pa.Agent_Email__c
            };

            // Find housebuilder by name
            String hbId = null;
            if (String.isNotBlank(pa.Housebuilder_Name__c)) {
                Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
                List<Account> hbs = [SELECT Id FROM Account WHERE Name = :pa.Housebuilder_Name__c AND RecordTypeId = :hbRT LIMIT 1];
                if (!hbs.isEmpty()) hbId = hbs[0].Id;
            }

            Map<String, Object> appData = new Map<String, Object>{
                'scheme' => String.isNotBlank(pa.Scheme__c) ? pa.Scheme__c : 'Part Exchange',
                'development' => pa.Development__c,
                'plot' => pa.Plot__c,
                'PurchasePrice' => pa.Purchase_Price__c,
                'ClientsEstimatedValuation' => pa.Client_Expectation__c,
                'Region' => pa.Region__c,
                'notes' => pa.Notes__c,
                'housebuilderId' => hbId,
                'terms' => true
            };

            Map<String, Object> formData = new Map<String, Object>{
                'Vendor' => vendorData,
                'Property' => propertyData,
                'Agent' => agentData,
                'Application' => appData
            };

            Map<String, String> saveResult = houseBuilderApplication.saveData(formData, 'Part Exchange - Applications');

            if (saveResult.containsKey('y')) {
                pa.Status__c = 'Created';
                pa.Application__c = saveResult.get('y');
                update pa;

                result.put('status', 'success');
                result.put('applicationId', saveResult.get('y'));
                result.put('message', 'Application created successfully.');
            } else {
                result.put('status', 'error');
                result.put('message', saveResult.containsKey('n') ? saveResult.get('n') : 'Failed to create application.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Reject ──

    @AuraEnabled
    public static Map<String, String> rejectApplication(Id parsedAppId) {
        Map<String, String> result = new Map<String, String>();
        try {
            Parsed_Application__c pa = [SELECT Id, Status__c FROM Parsed_Application__c WHERE Id = :parsedAppId LIMIT 1];
            pa.Status__c = 'Rejected';
            update pa;
            result.put('status', 'success');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Setup Schema on Airparser Inbox ──

    @AuraEnabled
    public static Map<String, Object> setupSchema() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT Airparser_Inbox_Id__c FROM NHS_API_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].Airparser_Inbox_Id__c)) {
                result.put('status', 'error');
                result.put('message', 'Inbox ID not configured.');
                return result;
            }

            Map<String, Object> schema = new Map<String, Object>{
                'fields' => new List<Object>{
                    // Vendor Details (object)
                    buildObject('vendor_details', 'Vendor/applicant contact details', new List<Object>{
                        buildScalar('name', 'string', 'Full name of the vendor/applicant'),
                        buildScalar('address', 'string', 'Full address of the vendor property'),
                        buildScalar('email_address', 'string', 'Email address'),
                        buildScalar('contact_number_1', 'string', 'Primary phone/mobile number'),
                        buildScalar('contact_number_2', 'string', 'Secondary phone number if present')
                    }),
                    // Signed owners
                    buildField('signed_owner_1', 'string', 'Name of first owner who signed', ''),
                    buildField('signed_owner_2', 'string', 'Name of second owner who signed if present', ''),
                    // Description of Property (object)
                    buildObject('description_of_property', 'Property details and features', new List<Object>{
                        buildScalar('number_of_bedrooms', 'string', 'Number of bedrooms'),
                        buildScalar('age_of_property', 'string', 'Age or year built'),
                        buildScalar('type_of_heating', 'string', 'Heating type e.g. Combi Boiler, Gas Central'),
                        buildScalar('detached', 'string', 'Is detached'),
                        buildScalar('semi_detached', 'string', 'Is semi-detached'),
                        buildScalar('end_terrace', 'string', 'Is end terrace'),
                        buildScalar('mid_terrace', 'string', 'Is mid terrace'),
                        buildScalar('apartment', 'string', 'Is apartment/flat'),
                        buildScalar('bungalow', 'string', 'Is bungalow'),
                        buildScalar('maisonette', 'string', 'Is maisonette'),
                        buildScalar('freehold', 'string', 'Is freehold'),
                        buildScalar('lease_hold', 'string', 'Is leasehold'),
                        buildScalar('years_left_of_lease', 'string', 'Years remaining on lease'),
                        buildScalar('service_charge_pcm', 'string', 'Service charge per month'),
                        buildScalar('ground_rent_pa', 'string', 'Ground rent per annum'),
                        buildScalar('front_garden', 'string', 'Has front garden'),
                        buildScalar('back_garden', 'string', 'Has back garden'),
                        buildScalar('no_garden', 'string', 'No garden'),
                        buildScalar('parking_drive', 'string', 'Parking or driveway details'),
                        buildScalar('garage', 'string', 'Has garage'),
                        buildScalar('extension', 'string', 'Has extension'),
                        buildScalar('conservatory', 'string', 'Has conservatory'),
                        buildScalar('principle_residence', 'string', 'Is principal residence'),
                        buildScalar('building_regs_planning_permission_obtained', 'string', 'Building regs or planning permission obtained'),
                        buildScalar('any_extensions_loft_conversation_solar_panels', 'string', 'Extensions, loft conversions, solar panels')
                    }),
                    // Agent Details (object)
                    buildObject('details_of_current_agent', 'Current estate agent details', new List<Object>{
                        buildScalar('agent_name_number', 'string', 'Agent name and phone number'),
                        buildScalar('current_asking_price', 'string', 'Current asking price'),
                        buildScalar('previous_asking_price', 'string', 'Previous asking price'),
                        buildScalar('number_of_viewings', 'string', 'Number of viewings'),
                        buildScalar('any_previous_offers', 'string', 'Any previous offers received'),
                        buildScalar('time_on_the_market', 'string', 'Time on the market')
                    }),
                    // Client Availability (object)
                    buildObject('client_availability', 'Client availability for viewings', new List<Object>{
                        buildScalar('mon_am', 'string', 'Monday AM'),
                        buildScalar('mon_pm', 'string', 'Monday PM'),
                        buildScalar('tues_am', 'string', 'Tuesday AM'),
                        buildScalar('tues_pm', 'string', 'Tuesday PM'),
                        buildScalar('wed_am', 'string', 'Wednesday AM'),
                        buildScalar('wed_pm', 'string', 'Wednesday PM'),
                        buildScalar('thurs_am', 'string', 'Thursday AM'),
                        buildScalar('thurs_pm', 'string', 'Thursday PM'),
                        buildScalar('fri_am', 'string', 'Friday AM'),
                        buildScalar('fri_pm', 'string', 'Friday PM')
                    }),
                    // Top-level fields
                    buildField('name_of_house_builder', 'string', 'Housebuilder/developer company name', ''),
                    buildField('development', 'string', 'Development or site name', ''),
                    buildField('plot_no_house_type', 'string', 'Plot number and house type', ''),
                    buildField('purchase_price', 'string', 'Purchase price of new property with currency', ''),
                    buildField('clients_estimated_valuation', 'string', 'Client estimated valuation of existing property with currency', ''),
                    buildField('outstanding_mortgage', 'string', 'Outstanding mortgage amount and details', ''),
                    buildField('qualified_by_house_builders_fa', 'string', 'Qualified by housebuilder financial advisor', ''),
                    buildField('region', 'string', 'Region or area', ''),
                    buildField('sales_advisor', 'string', 'Sales advisor name', ''),
                    buildField('date_of_enquiry', 'string', 'Date of enquiry', ''),
                    buildField('date_signed', 'string', 'Date the form was signed', ''),
                    buildField('anticipated_completion_date', 'string', 'Anticipated completion date', '')
                }
            };

            String inboxId = configs[0].Airparser_Inbox_Id__c;
            HttpResponse resp = callAirparser('POST', '/inboxes/' + inboxId + '/schema', System.JSON.serialize(schema));

            if (resp.getStatusCode() == 200 || resp.getStatusCode() == 201) {
                result.put('status', 'success');
                result.put('message', 'Schema configured successfully on Airparser inbox.');
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Test Connection ──

    @AuraEnabled
    public static Map<String, Object> testConnection() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpResponse resp = callAirparser('GET', '/inboxes', null);
            if (resp.getStatusCode() == 200) {
                Object parsed = JSON.deserializeUntyped(resp.getBody());
                List<Object> inboxes;
                if (parsed instanceof List<Object>) {
                    inboxes = (List<Object>) parsed;
                } else if (parsed instanceof Map<String, Object>) {
                    Map<String, Object> respMap = (Map<String, Object>) parsed;
                    inboxes = respMap.containsKey('data') ? (List<Object>) respMap.get('data') : new List<Object>();
                } else {
                    inboxes = new List<Object>();
                }
                result.put('status', 'success');
                result.put('message', 'Connected. ' + inboxes.size() + ' inbox(es) found.');
                result.put('inboxCount', inboxes.size());
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode() + ': ' + resp.getBody());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Private Helpers ──

    private static Map<String, Object> buildField(String name, String scalarType, String description, String defaultValue) {
        return new Map<String, Object>{
            'type' => 'scalar',
            'data' => new Map<String, Object>{
                'name' => name,
                'type' => scalarType,
                'description' => description,
                'default_value' => defaultValue
            }
        };
    }

    private static Map<String, Object> buildScalar(String name, String scalarType, String description) {
        return new Map<String, Object>{
            'name' => name,
            'type' => scalarType,
            'description' => description
        };
    }

    private static Map<String, Object> buildObject(String name, String description, List<Object> attributes) {
        return new Map<String, Object>{
            'type' => 'object',
            'data' => new Map<String, Object>{
                'name' => name,
                'description' => description,
                'attributes' => attributes
            }
        };
    }

    private static Parsed_Application__c mapJsonToStagingRecord(Map<String, Object> json, String docId, String inboxId) {
        Parsed_Application__c pa = new Parsed_Application__c();
        pa.Airparser_Doc_Id__c = docId;
        pa.Airparser_Inbox_Id__c = inboxId;
        pa.Status__c = 'New';

        pa.Vendor_1_First_Name__c = getStr(json, 'vendor_1_first_name');
        pa.Vendor_1_Last_Name__c = getStr(json, 'vendor_1_last_name');
        pa.Vendor_1_Email__c = getStr(json, 'vendor_1_email');
        pa.Vendor_1_Mobile__c = getStr(json, 'vendor_1_mobile');
        pa.Vendor_2_First_Name__c = getStr(json, 'vendor_2_first_name');
        pa.Vendor_2_Last_Name__c = getStr(json, 'vendor_2_last_name');
        pa.Vendor_2_Email__c = getStr(json, 'vendor_2_email');
        pa.Vendor_2_Mobile__c = getStr(json, 'vendor_2_mobile');

        pa.Property_Street__c = getStr(json, 'property_street');
        pa.Property_City__c = getStr(json, 'property_city');
        pa.Property_Postcode__c = getStr(json, 'property_postcode');
        pa.Property_Type__c = getStr(json, 'property_type');
        pa.Number_Of_Bedrooms__c = getDec(json, 'number_of_bedrooms');

        pa.Agent_Name__c = getStr(json, 'agent_name');
        pa.Agent_Phone__c = getStr(json, 'agent_phone');
        pa.Agent_Email__c = getStr(json, 'agent_email');

        pa.Housebuilder_Name__c = getStr(json, 'housebuilder_name');
        pa.Development__c = getStr(json, 'development');
        pa.Plot__c = getStr(json, 'plot');
        pa.Purchase_Price__c = getDec(json, 'purchase_price');
        pa.Client_Expectation__c = getDec(json, 'client_expectation');
        pa.Scheme__c = getStr(json, 'scheme');
        pa.Region__c = getStr(json, 'region');
        pa.Notes__c = getStr(json, 'notes');

        return pa;
    }

    private static String getStr(Map<String, Object> json, String key) {
        Object val = json.get(key);
        return val != null ? String.valueOf(val).left(255) : null;
    }

    private static Decimal getDec(Map<String, Object> json, String key) {
        Object val = json.get(key);
        if (val == null) return null;
        try { return Decimal.valueOf(String.valueOf(val)); } catch (Exception e) { return null; }
    }

    private static HttpResponse callAirparser(String method, String path, String body) {
        List<NHS_API_Config__c> configs = [SELECT Airparser_API_Key__c FROM NHS_API_Config__c LIMIT 1];
        if (configs.isEmpty() || String.isBlank(configs[0].Airparser_API_Key__c)) {
            throw new AuraHandledException('Airparser API key not configured.');
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint(AIRPARSER_BASE + path);
        req.setMethod(method);
        req.setHeader('X-API-Key', configs[0].Airparser_API_Key__c);
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(60000);

        if (String.isNotBlank(body)) {
            req.setBody(body);
        }

        return new Http().send(req);
    }

    // ══════════════════════════════════════════════════════
    // ── TRANSFORMATION RULES & APPLICATION CREATION ──
    // ══════════════════════════════════════════════════════

    // Target field options for the mapping UI
    @AuraEnabled
    public static List<Map<String, String>> getTargetFieldOptions() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        // Vendor 1
        options.add(opt('Vendor 1', 'fullName', 'Full Name (auto-splits first/last)'));
        options.add(opt('Vendor 1', 'firstname', 'First Name'));
        options.add(opt('Vendor 1', 'lastname', 'Last Name'));
        options.add(opt('Vendor 1', 'email', 'Email'));
        options.add(opt('Vendor 1', 'mobilePhone', 'Mobile'));
        // Vendor 2
        options.add(opt('Vendor 2', 'fullName1', 'Full Name (auto-splits first/last)'));
        options.add(opt('Vendor 2', 'firstname1', 'First Name'));
        options.add(opt('Vendor 2', 'lastname1', 'Last Name'));
        options.add(opt('Vendor 2', 'email1', 'Email'));
        options.add(opt('Vendor 2', 'mobilePhone1', 'Mobile'));
        // Property
        options.add(opt('Property', 'fullAddress', 'Full Address (auto-splits street/city/postcode)'));
        options.add(opt('Property', 'street', 'Street'));
        options.add(opt('Property', 'city', 'City'));
        options.add(opt('Property', 'pcode', 'Postcode'));
        options.add(opt('Property', 'NumberofBedrooms', 'Number of Bedrooms'));
        options.add(opt('Property', 'Detached', 'Detached'));
        options.add(opt('Property', 'SemiDetached', 'Semi-Detached'));
        options.add(opt('Property', 'EndTerrace', 'End Terrace'));
        options.add(opt('Property', 'MidTerrace', 'Mid Terrace'));
        options.add(opt('Property', 'Apartment', 'Apartment'));
        options.add(opt('Property', 'Bungalow', 'Bungalow'));
        options.add(opt('Property', 'Maisonette', 'Maisonette'));
        options.add(opt('Property', 'Freehold', 'Freehold'));
        options.add(opt('Property', 'LeaseHold', 'Leasehold'));
        options.add(opt('Property', 'YearsleftofLease', 'Years Left of Lease'));
        options.add(opt('Property', 'ServiceChargePCM', 'Service Charge PCM'));
        options.add(opt('Property', 'GroundRentPA', 'Ground Rent PA'));
        options.add(opt('Property', 'AgeofProperty', 'Age of Property'));
        options.add(opt('Property', 'TypeofHeating', 'Type of Heating'));
        options.add(opt('Property', 'FrontGarden', 'Front Garden'));
        options.add(opt('Property', 'BackGarden', 'Back Garden'));
        options.add(opt('Property', 'Parking', 'Parking'));
        options.add(opt('Property', 'Garage', 'Garage'));
        options.add(opt('Property', 'Extension', 'Extension'));
        options.add(opt('Property', 'Conservatory', 'Conservatory'));
        options.add(opt('Property', 'PrincipleResidence', 'Principle Residence'));
        options.add(opt('Property', 'BuildingRegsPlanningPermission', 'Building Regs/Planning'));
        options.add(opt('Property', 'AnyExtensionssolarpanels', 'Extensions/Loft/Solar'));
        // Agent
        options.add(opt('Agent', 'agentName', 'Agent Name'));
        options.add(opt('Agent', 'agentPhone', 'Agent Phone'));
        options.add(opt('Agent', 'agentEmail', 'Agent Email'));
        // Application
        options.add(opt('Application', 'scheme', 'Scheme'));
        options.add(opt('Application', 'development', 'Development'));
        options.add(opt('Application', 'plot', 'Plot'));
        options.add(opt('Application', 'PurchasePrice', 'Purchase Price'));
        options.add(opt('Application', 'ClientsEstimatedValuation', 'Client Estimated Valuation'));
        options.add(opt('Application', 'OutstandingMortgage', 'Outstanding Mortgage'));
        options.add(opt('Application', 'Region', 'Region'));
        options.add(opt('Application', 'salesAdvisor', 'Sales Advisor'));
        options.add(opt('Application', 'notes', 'Notes'));
        options.add(opt('Application', 'housebuilderId', 'Housebuilder (Name Lookup)'));
        options.add(opt('Application', 'dateOfApplicationReceived', 'Date of Application'));
        options.add(opt('Application', 'OutstandingMortgageQualified', 'Qualified by FA'));
        // Availability
        options.add(opt('Application', 'monAM', 'Mon AM'));
        options.add(opt('Application', 'monPM', 'Mon PM'));
        options.add(opt('Application', 'tueAM', 'Tue AM'));
        options.add(opt('Application', 'tuePM', 'Tue PM'));
        options.add(opt('Application', 'wedAM', 'Wed AM'));
        options.add(opt('Application', 'wedPM', 'Wed PM'));
        options.add(opt('Application', 'thuAM', 'Thu AM'));
        options.add(opt('Application', 'thuPM', 'Thu PM'));
        options.add(opt('Application', 'friAM', 'Fri AM'));
        options.add(opt('Application', 'friPM', 'Fri PM'));
        return options;
    }

    private static Map<String, String> opt(String section, String fieldKey, String fieldLabel) {
        return new Map<String, String>{
            'section' => section,
            'fieldKey' => fieldKey,
            'fieldLabel' => fieldLabel,
            'value' => section + '.' + fieldKey
        };
    }

    // ── Get all mappings ──
    @AuraEnabled
    public static List<Airparser_Field_Mapping__c> getMappings() {
        return [
            SELECT Id, Airparser_Field__c, Target_Section__c, Target_Field__c, Target_Field_Label__c, Is_Active__c, Sort_Order__c
            FROM Airparser_Field_Mapping__c
            ORDER BY Sort_Order__c ASC NULLS LAST, Airparser_Field__c ASC
        ];
    }

    // ── Save mappings (upsert) ──
    @AuraEnabled
    public static Map<String, String> saveMappings(List<Map<String, Object>> mappings) {
        Map<String, String> result = new Map<String, String>();
        try {
            // Delete existing
            delete [SELECT Id FROM Airparser_Field_Mapping__c];

            List<Airparser_Field_Mapping__c> toInsert = new List<Airparser_Field_Mapping__c>();
            Integer idx = 0;
            for (Map<String, Object> m : mappings) {
                Airparser_Field_Mapping__c mapping = new Airparser_Field_Mapping__c();
                mapping.Airparser_Field__c = (String) m.get('airparserField');
                mapping.Target_Section__c = (String) m.get('targetSection');
                mapping.Target_Field__c = (String) m.get('targetField');
                mapping.Target_Field_Label__c = (String) m.get('targetFieldLabel');
                mapping.Is_Active__c = m.get('isActive') != null ? (Boolean) m.get('isActive') : true;
                mapping.Sort_Order__c = idx++;
                toInsert.add(mapping);
            }
            insert toInsert;
            result.put('status', 'success');
            result.put('message', 'Saved ' + toInsert.size() + ' mapping rule(s).');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Create Default Mappings ──
    @AuraEnabled
    public static Map<String, String> createDefaultMappings() {
        List<Map<String, Object>> defaults = new List<Map<String, Object>>();
        // Vendor 1 - from nested vendor_details
        defaults.add(defMap('vendor_details.name', 'Vendor 1', 'fullName', 'Full Name'));
        defaults.add(defMap('vendor_details.email_address', 'Vendor 1', 'email', 'Email'));
        defaults.add(defMap('vendor_details.contact_number_1', 'Vendor 1', 'mobilePhone', 'Mobile'));
        // Vendor 2 - from signed_owner_2
        defaults.add(defMap('signed_owner_2', 'Vendor 2', 'fullName1', 'Full Name'));
        defaults.add(defMap('vendor_details.contact_number_2', 'Vendor 2', 'mobilePhone1', 'Mobile'));
        // Property - from nested vendor_details.address and description_of_property
        defaults.add(defMap('vendor_details.address', 'Property', 'fullAddress', 'Full Address'));
        defaults.add(defMap('description_of_property.number_of_bedrooms', 'Property', 'NumberofBedrooms', 'Bedrooms'));
        defaults.add(defMap('description_of_property.age_of_property', 'Property', 'AgeofProperty', 'Age'));
        defaults.add(defMap('description_of_property.type_of_heating', 'Property', 'TypeofHeating', 'Heating'));
        defaults.add(defMap('description_of_property.detached', 'Property', 'Detached', 'Detached'));
        defaults.add(defMap('description_of_property.semi_detached', 'Property', 'SemiDetached', 'Semi-Detached'));
        defaults.add(defMap('description_of_property.end_terrace', 'Property', 'EndTerrace', 'End Terrace'));
        defaults.add(defMap('description_of_property.mid_terrace', 'Property', 'MidTerrace', 'Mid Terrace'));
        defaults.add(defMap('description_of_property.apartment', 'Property', 'Apartment', 'Apartment'));
        defaults.add(defMap('description_of_property.bungalow', 'Property', 'Bungalow', 'Bungalow'));
        defaults.add(defMap('description_of_property.freehold', 'Property', 'Freehold', 'Freehold'));
        defaults.add(defMap('description_of_property.lease_hold', 'Property', 'LeaseHold', 'Leasehold'));
        defaults.add(defMap('description_of_property.front_garden', 'Property', 'FrontGarden', 'Front Garden'));
        defaults.add(defMap('description_of_property.back_garden', 'Property', 'BackGarden', 'Back Garden'));
        defaults.add(defMap('description_of_property.parking_drive', 'Property', 'Parking', 'Parking'));
        defaults.add(defMap('description_of_property.garage', 'Property', 'Garage', 'Garage'));
        defaults.add(defMap('description_of_property.extension', 'Property', 'Extension', 'Extension'));
        defaults.add(defMap('description_of_property.conservatory', 'Property', 'Conservatory', 'Conservatory'));
        defaults.add(defMap('description_of_property.principle_residence', 'Property', 'PrincipleResidence', 'Principle Residence'));
        // Agent
        defaults.add(defMap('details_of_current_agent.agent_name_number', 'Agent', 'agentName', 'Agent Name'));
        // Application
        defaults.add(defMap('name_of_house_builder', 'Application', 'housebuilderId', 'Housebuilder'));
        defaults.add(defMap('development', 'Application', 'development', 'Development'));
        defaults.add(defMap('plot_no_house_type', 'Application', 'plot', 'Plot'));
        defaults.add(defMap('purchase_price', 'Application', 'PurchasePrice', 'Purchase Price'));
        defaults.add(defMap('clients_estimated_valuation', 'Application', 'ClientsEstimatedValuation', 'Client Valuation'));
        defaults.add(defMap('outstanding_mortgage', 'Application', 'OutstandingMortgage', 'Outstanding Mortgage'));
        defaults.add(defMap('region', 'Application', 'Region', 'Region'));
        defaults.add(defMap('sales_advisor', 'Application', 'salesAdvisor', 'Sales Advisor'));
        defaults.add(defMap('qualified_by_house_builders_fa', 'Application', 'OutstandingMortgageQualified', 'Qualified by FA'));
        defaults.add(defMap('date_of_enquiry', 'Application', 'dateOfApplicationReceived', 'Date of Application'));
        // Availability
        defaults.add(defMap('client_availability.mon_am', 'Application', 'monAM', 'Mon AM'));
        defaults.add(defMap('client_availability.mon_pm', 'Application', 'monPM', 'Mon PM'));
        defaults.add(defMap('client_availability.tues_am', 'Application', 'tueAM', 'Tue AM'));
        defaults.add(defMap('client_availability.tues_pm', 'Application', 'tuePM', 'Tue PM'));
        defaults.add(defMap('client_availability.wed_am', 'Application', 'wedAM', 'Wed AM'));
        defaults.add(defMap('client_availability.wed_pm', 'Application', 'wedPM', 'Wed PM'));
        defaults.add(defMap('client_availability.thurs_am', 'Application', 'thuAM', 'Thu AM'));
        defaults.add(defMap('client_availability.thurs_pm', 'Application', 'thuPM', 'Thu PM'));
        defaults.add(defMap('client_availability.fri_am', 'Application', 'friAM', 'Fri AM'));
        defaults.add(defMap('client_availability.fri_pm', 'Application', 'friPM', 'Fri PM'));
        return saveMappings(defaults);
    }

    private static Map<String, Object> defMap(String apField, String section, String targetField, String label) {
        return new Map<String, Object>{
            'airparserField' => apField,
            'targetSection' => section,
            'targetField' => targetField,
            'targetFieldLabel' => label,
            'isActive' => true
        };
    }

    // ── Preview: Apply mappings and return pre-filled form data ──
    @AuraEnabled
    public static Map<String, Object> applyMappingsPreview(String parsedJsonStr) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Map<String, Object> parsedData = (Map<String, Object>) System.JSON.deserializeUntyped(parsedJsonStr);

            List<Airparser_Field_Mapping__c> mappings = [
                SELECT Airparser_Field__c, Target_Section__c, Target_Field__c
                FROM Airparser_Field_Mapping__c
                WHERE Is_Active__c = true
                ORDER BY Sort_Order__c ASC
            ];

            // Build form sections
            Map<String, String> vendor1 = new Map<String, String>();
            Map<String, String> vendor2 = new Map<String, String>();
            Map<String, String> property = new Map<String, String>();
            Map<String, String> agent = new Map<String, String>();
            Map<String, String> application = new Map<String, String>();

            for (Airparser_Field_Mapping__c m : mappings) {
                Object val = resolveNestedValue(parsedData, m.Airparser_Field__c);
                if (val == null) continue;
                String strVal = String.valueOf(val).trim();
                if (String.isBlank(strVal)) continue;

                applyMappedValue(m.Target_Section__c, m.Target_Field__c, strVal, vendor1, vendor2, property, agent, application);
            }

            // Always also try flat field matching (fills gaps not covered by dot-notation mappings)
            {
                Map<String, List<String>> flatMappings = new Map<String, List<String>>{
                    'vendor_1_first_name' => new List<String>{'Vendor 1', 'firstname'},
                    'vendor_1_last_name' => new List<String>{'Vendor 1', 'lastname'},
                    'vendor_1_email' => new List<String>{'Vendor 1', 'email'},
                    'vendor_1_mobile' => new List<String>{'Vendor 1', 'mobilePhone'},
                    'vendor_2_first_name' => new List<String>{'Vendor 2', 'firstname1'},
                    'vendor_2_last_name' => new List<String>{'Vendor 2', 'lastname1'},
                    'vendor_2_email' => new List<String>{'Vendor 2', 'email1'},
                    'vendor_2_mobile' => new List<String>{'Vendor 2', 'mobilePhone1'},
                    'property_street' => new List<String>{'Property', 'street'},
                    'property_city' => new List<String>{'Property', 'city'},
                    'property_postcode' => new List<String>{'Property', 'pcode'},
                    'property_type' => new List<String>{'Property', 'AgeofProperty'},
                    'number_of_bedrooms' => new List<String>{'Property', 'NumberofBedrooms'},
                    'agent_name' => new List<String>{'Agent', 'agentName'},
                    'agent_phone' => new List<String>{'Agent', 'agentPhone'},
                    'agent_email' => new List<String>{'Agent', 'agentEmail'},
                    'housebuilder_name' => new List<String>{'Application', 'housebuilderId'},
                    'development' => new List<String>{'Application', 'development'},
                    'plot' => new List<String>{'Application', 'plot'},
                    'purchase_price' => new List<String>{'Application', 'PurchasePrice'},
                    'client_expectation' => new List<String>{'Application', 'ClientsEstimatedValuation'},
                    'outstanding_mortgage' => new List<String>{'Application', 'OutstandingMortgage'},
                    'scheme' => new List<String>{'Application', 'scheme'},
                    'region' => new List<String>{'Application', 'Region'},
                    'sales_advisor' => new List<String>{'Application', 'salesAdvisor'},
                    'notes' => new List<String>{'Application', 'notes'}
                };

                for (String flatKey : flatMappings.keySet()) {
                    Object val = parsedData.get(flatKey);
                    if (val == null) continue;
                    String strVal = String.valueOf(val).trim();
                    if (String.isBlank(strVal)) continue;

                    List<String> target = flatMappings.get(flatKey);
                    String section = target[0];
                    String targetKey = target[1];

                    // Only fill if not already set by mapping rules
                    Boolean alreadySet = false;
                    if (section == 'Vendor 1') alreadySet = vendor1.containsKey(targetKey) && String.isNotBlank(vendor1.get(targetKey));
                    else if (section == 'Vendor 2') alreadySet = vendor2.containsKey(targetKey) && String.isNotBlank(vendor2.get(targetKey));
                    else if (section == 'Property') alreadySet = property.containsKey(targetKey) && String.isNotBlank(property.get(targetKey));
                    else if (section == 'Agent') alreadySet = agent.containsKey(targetKey) && String.isNotBlank(agent.get(targetKey));
                    else if (section == 'Application') alreadySet = application.containsKey(targetKey) && String.isNotBlank(application.get(targetKey));

                    if (!alreadySet) {
                        applyMappedValue(section, targetKey, strVal, vendor1, vendor2, property, agent, application);
                    }
                }
            }

            // Housebuilder lookup
            String hbName = application.get('housebuilderId');
            Map<String, Object> hbMatch = new Map<String, Object>();
            if (String.isNotBlank(hbName)) {
                Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
                List<Account> hbs = [SELECT Id, Name FROM Account WHERE RecordTypeId = :hbRT AND Name = :hbName LIMIT 1];
                if (!hbs.isEmpty()) {
                    hbMatch.put('matched', true);
                    hbMatch.put('id', hbs[0].Id);
                    hbMatch.put('name', hbs[0].Name);
                } else {
                    // Try partial match
                    String likeName = '%' + String.escapeSingleQuotes(hbName.trim()) + '%';
                    List<Account> partials = [SELECT Id, Name FROM Account WHERE RecordTypeId = :hbRT AND Name LIKE :likeName LIMIT 5];
                    hbMatch.put('matched', false);
                    hbMatch.put('name', hbName);
                    List<Map<String, String>> suggestions = new List<Map<String, String>>();
                    for (Account a : partials) {
                        suggestions.add(new Map<String, String>{ 'id' => a.Id, 'name' => a.Name });
                    }
                    hbMatch.put('suggestions', suggestions);
                }
            }

            result.put('status', 'success');
            result.put('vendor1', vendor1);
            result.put('vendor2', vendor2);
            result.put('property', property);
            result.put('agent', agent);
            result.put('application', application);
            result.put('housebuilder', hbMatch);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Create Application from edited form data ──
    @AuraEnabled
    public static Map<String, Object> createApplicationFromForm(String formDataJson) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Map<String, Object> form = (Map<String, Object>) System.JSON.deserializeUntyped(formDataJson);

            // Reconstruct the form data for houseBuilderApplication.saveData
            Map<String, Object> vendorData = (Map<String, Object>) form.get('Vendor');
            Map<String, Object> propertyData = (Map<String, Object>) form.get('Property');
            Map<String, Object> agentData = (Map<String, Object>) form.get('Agent');
            Map<String, Object> appData = (Map<String, Object>) form.get('Application');

            // Housebuilder name → ID lookup or create new
            if (appData != null && appData.containsKey('housebuilderId')) {
                String hbVal = (String) appData.get('housebuilderId');
                if (String.isNotBlank(hbVal) && !hbVal.startsWith('001')) {
                    Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
                    List<Account> hbs = [SELECT Id FROM Account WHERE Name = :hbVal AND RecordTypeId = :hbRT LIMIT 1];
                    if (!hbs.isEmpty()) {
                        appData.put('housebuilderId', hbs[0].Id);
                    } else {
                        // Create new Housebuilder account
                        Account newHb = new Account(Name = hbVal, RecordTypeId = hbRT);
                        insert newHb;
                        appData.put('housebuilderId', newHb.Id);
                    }
                }
            }

            if (appData != null && !appData.containsKey('scheme')) appData.put('scheme', 'Part Exchange');
            if (appData != null) appData.put('terms', true);

            Map<String, Object> formData = new Map<String, Object>{
                'Vendor' => vendorData,
                'Property' => propertyData,
                'Agent' => agentData,
                'Application' => appData
            };

            Map<String, String> saveResult = houseBuilderApplication.saveData(formData, 'Part Exchange - Applications');

            if (saveResult.containsKey('y')) {
                result.put('status', 'success');
                result.put('applicationId', saveResult.get('y'));
                result.put('message', 'Application created: ' + saveResult.get('oppname'));
            } else {
                result.put('status', 'error');
                result.put('message', saveResult.containsKey('n') ? saveResult.get('n') : 'Failed to create application.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Transform & Create Application from parsed JSON ──
    @AuraEnabled
    public static Map<String, Object> createApplicationFromParsed(String parsedJsonStr) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Map<String, Object> parsedData = (Map<String, Object>) System.JSON.deserializeUntyped(parsedJsonStr);

            // Load active mappings
            List<Airparser_Field_Mapping__c> mappings = [
                SELECT Airparser_Field__c, Target_Section__c, Target_Field__c
                FROM Airparser_Field_Mapping__c
                WHERE Is_Active__c = true
                ORDER BY Sort_Order__c ASC
            ];

            if (mappings.isEmpty()) {
                result.put('status', 'error');
                result.put('message', 'No mapping rules configured. Set up transformation rules first.');
                return result;
            }

            // Build the form data sections
            Map<String, Object> vendorData = new Map<String, Object>();
            Map<String, Object> propertyData = new Map<String, Object>();
            Map<String, Object> agentData = new Map<String, Object>();
            Map<String, Object> appData = new Map<String, Object>();

            for (Airparser_Field_Mapping__c m : mappings) {
                // Resolve nested field using dot notation
                Object val = resolveNestedValue(parsedData, m.Airparser_Field__c);
                if (val == null) continue;
                String strVal = String.valueOf(val).trim();
                if (String.isBlank(strVal)) continue;

                String section = m.Target_Section__c;
                String targetKey = m.Target_Field__c;

                if (section == 'Vendor 1') {
                    if (targetKey == 'fullName') {
                        // Split "ANTHONY WHITWELL" into first/last
                        Map<String, String> names = splitName(strVal);
                        vendorData.put('firstname', names.get('first'));
                        vendorData.put('lastname', names.get('last'));
                    } else {
                        vendorData.put(targetKey, strVal);
                    }
                } else if (section == 'Vendor 2') {
                    if (targetKey == 'fullName1') {
                        Map<String, String> names = splitName(strVal);
                        vendorData.put('firstname1', names.get('first'));
                        vendorData.put('lastname1', names.get('last'));
                    } else {
                        vendorData.put(targetKey, strVal);
                    }
                } else if (section == 'Property') {
                    if (targetKey == 'fullAddress') {
                        // Split "9 HOLDEN ROAD BRIERFIELD BB9 5DR" into street/city/postcode
                        Map<String, String> addr = splitAddress(strVal);
                        propertyData.put('street', addr.get('street'));
                        propertyData.put('city', addr.get('city'));
                        propertyData.put('pcode', addr.get('postcode'));
                    } else {
                        propertyData.put(targetKey, strVal);
                    }
                } else if (section == 'Agent') {
                    agentData.put(targetKey, strVal);
                } else if (section == 'Application') {
                    if (targetKey == 'housebuilderId') {
                        // Lookup housebuilder by name
                        Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
                        List<Account> hbs = [SELECT Id FROM Account WHERE Name = :strVal AND RecordTypeId = :hbRT LIMIT 1];
                        if (!hbs.isEmpty()) {
                            appData.put(targetKey, hbs[0].Id);
                        }
                    } else if (targetKey == 'PurchasePrice' || targetKey == 'ClientsEstimatedValuation' || targetKey == 'OutstandingMortgage') {
                        // Parse currency: "£495,000" → "495000"
                        appData.put(targetKey, parseCurrency(strVal));
                    } else {
                        appData.put(targetKey, strVal);
                    }
                }
            }

            // Set defaults
            if (!appData.containsKey('scheme')) appData.put('scheme', 'Part Exchange');
            appData.put('terms', true);

            Map<String, Object> formData = new Map<String, Object>{
                'Vendor' => vendorData,
                'Property' => propertyData,
                'Agent' => agentData,
                'Application' => appData
            };

            Map<String, String> saveResult = houseBuilderApplication.saveData(formData, 'Part Exchange - Applications');

            if (saveResult.containsKey('y')) {
                result.put('status', 'success');
                result.put('applicationId', saveResult.get('y'));
                result.put('message', 'Application created successfully: ' + saveResult.get('oppname'));
            } else {
                result.put('status', 'error');
                result.put('message', saveResult.containsKey('n') ? saveResult.get('n') : 'Failed to create application.');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // Apply a mapped value to the correct form section
    private static void applyMappedValue(String section, String targetKey, String strVal,
            Map<String, String> vendor1, Map<String, String> vendor2,
            Map<String, String> property, Map<String, String> agent, Map<String, String> application) {

        if (section == 'Vendor 1') {
            if (targetKey == 'fullName') {
                Map<String, String> names = splitName(strVal);
                vendor1.put('firstname', names.get('first'));
                vendor1.put('lastname', names.get('last'));
            } else {
                vendor1.put(targetKey, strVal);
            }
        } else if (section == 'Vendor 2') {
            if (targetKey == 'fullName1') {
                Map<String, String> names = splitName(strVal);
                vendor2.put('firstname1', names.get('first'));
                vendor2.put('lastname1', names.get('last'));
            } else {
                vendor2.put(targetKey, strVal);
            }
        } else if (section == 'Property') {
            if (targetKey == 'fullAddress') {
                Map<String, String> addr = splitAddress(strVal);
                property.put('street', addr.get('street'));
                property.put('city', addr.get('city'));
                property.put('pcode', addr.get('postcode'));
            } else {
                property.put(targetKey, strVal);
            }
        } else if (section == 'Agent') {
            agent.put(targetKey, strVal);
        } else if (section == 'Application') {
            if (targetKey == 'PurchasePrice' || targetKey == 'ClientsEstimatedValuation' || targetKey == 'OutstandingMortgage') {
                application.put(targetKey, parseCurrency(strVal));
            } else {
                application.put(targetKey, strVal);
            }
        }
    }

    // Resolve nested value using dot notation: "vendor_details.name" → parsedData['vendor_details']['name']
    private static Object resolveNestedValue(Map<String, Object> data, String path) {
        if (data == null || String.isBlank(path)) return null;

        List<String> parts = path.split('\\.');
        Object current = data;

        for (String part : parts) {
            if (current instanceof Map<String, Object>) {
                current = ((Map<String, Object>) current).get(part);
            } else {
                return null;
            }
        }
        return current;
    }

    // Split "ANTHONY WHITWELL" into first/last name
    private static Map<String, String> splitName(String fullName) {
        Map<String, String> names = new Map<String, String>();
        if (String.isBlank(fullName)) {
            names.put('first', '');
            names.put('last', '');
            return names;
        }
        fullName = fullName.trim();
        List<String> parts = fullName.split('\\s+');
        if (parts.size() == 1) {
            names.put('first', parts[0]);
            names.put('last', parts[0]);
        } else {
            names.put('first', parts[0]);
            // Everything after first word is last name
            parts.remove(0);
            names.put('last', String.join(parts, ' '));
        }
        return names;
    }

    // Split UK address: "9 HOLDEN ROAD BRIERFIELD BB9 5DR"
    private static Map<String, String> splitAddress(String addr) {
        Map<String, String> result = new Map<String, String>();
        if (String.isBlank(addr)) {
            result.put('street', '');
            result.put('city', '');
            result.put('postcode', '');
            return result;
        }
        addr = addr.trim();

        // Extract UK postcode from end
        Pattern pcPattern = Pattern.compile('([A-Z]{1,2}[0-9][0-9A-Z]?\\s?[0-9][A-Z]{2})$');
        Matcher pcMatcher = pcPattern.matcher(addr.toUpperCase());
        String postcode = '';
        if (pcMatcher.find()) {
            postcode = pcMatcher.group(1);
            addr = addr.substring(0, addr.length() - postcode.length()).trim();
        }

        // Last word before postcode is city
        List<String> parts = addr.split('\\s+');
        String city = '';
        String street = addr;
        if (parts.size() > 1) {
            city = parts[parts.size() - 1];
            parts.remove(parts.size() - 1);
            street = String.join(parts, ' ');
        }

        result.put('street', street);
        result.put('city', city);
        result.put('postcode', postcode);
        return result;
    }

    // Parse currency: "£495,000" or "Â£250,000" → "495000"
    private static String parseCurrency(String val) {
        if (String.isBlank(val)) return '';
        // Remove currency symbols, commas, spaces, and encoding artifacts
        String cleaned = val.replaceAll('[£Â\\$,\\s]', '');
        // If it contains non-numeric chars after @ (like "100,000 @ 3%"), take just the number
        if (cleaned.contains('@')) {
            cleaned = cleaned.split('@')[0].trim();
        }
        // Remove any remaining non-numeric except dots
        cleaned = cleaned.replaceAll('[^0-9.]', '');
        return String.isNotBlank(cleaned) ? cleaned : '';
    }
}
