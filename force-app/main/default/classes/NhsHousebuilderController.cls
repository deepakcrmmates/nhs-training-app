public with sharing class NhsHousebuilderController {

    private static Id getHousebuilderRecordTypeId() {
        Map<String, Schema.RecordTypeInfo> rtMap = Account.SObjectType.getDescribe().getRecordTypeInfosByDeveloperName();
        if (rtMap.containsKey('House_Builder')) return rtMap.get('House_Builder').getRecordTypeId();
        if (rtMap.containsKey('Housebuilder')) return rtMap.get('Housebuilder').getRecordTypeId();
        // Fallback: match by label
        Map<String, Schema.RecordTypeInfo> byName = Account.SObjectType.getDescribe().getRecordTypeInfosByName();
        if (byName.containsKey('House Builder')) return byName.get('House Builder').getRecordTypeId();
        return null;
    }

    @AuraEnabled
    public static Id createHousebuilder(String accountDataJson, String contactsJson, String logoBase64, String logoFileName) {
        Savepoint sp = Database.setSavepoint();
        try {
            Map<String, Object> accountData = (Map<String, Object>) JSON.deserializeUntyped(accountDataJson);
            List<Object> contactRows = contactsJson != null ? (List<Object>) JSON.deserializeUntyped(contactsJson) : new List<Object>();

            Account acc = new Account();
            acc.Name = (String) accountData.get('name');
            acc.Phone = (String) accountData.get('phone');
            acc.Website = (String) accountData.get('website');
            acc.BillingStreet = (String) accountData.get('street');
            acc.BillingCity = (String) accountData.get('city');
            acc.BillingPostalCode = (String) accountData.get('postcode');
            acc.BillingCountry = (String) accountData.get('country');

            // Custom Email__c field
            String email = (String) accountData.get('email');
            if (String.isNotBlank(email)) acc.put('Email__c', email);

            // Companies House enrichment (optional)
            String companyNumber = (String) accountData.get('companyNumber');
            if (String.isNotBlank(companyNumber)) acc.put('Company_Number__c', companyNumber);
            String sicCodes = (String) accountData.get('sicCodes');
            if (String.isNotBlank(sicCodes)) acc.put('SIC_Codes__c', sicCodes);

            // Per-housebuilder setting flags
            if (accountData.get('useTimelineValuations') == true) acc.put('Use_Timeline_Valuations__c', true);
            if (accountData.get('vendorDiscussionApproved') == true) acc.put('Vendor_Discussion_Approved__c', true);

            Id rtId = getHousebuilderRecordTypeId();
            if (rtId != null) acc.RecordTypeId = rtId;

            insert acc;

            // Create contacts
            if (contactRows != null && !contactRows.isEmpty()) {
                List<Contact> contacts = new List<Contact>();
                for (Object row : contactRows) {
                    Map<String, Object> c = (Map<String, Object>) row;
                    String firstName = (String) c.get('firstName');
                    String lastName = (String) c.get('lastName');
                    if (String.isBlank(firstName) && String.isBlank(lastName)) continue;
                    Contact con = new Contact(
                        AccountId = acc.Id,
                        FirstName = firstName,
                        LastName = String.isNotBlank(lastName) ? lastName : 'Contact',
                        Email = (String) c.get('email'),
                        MobilePhone = (String) c.get('mobile'),
                        Title = (String) c.get('jobTitle')
                    );
                    contacts.add(con);
                }
                if (!contacts.isEmpty()) insert contacts;
            }

            // Upload logo to Box with public shared link (callouts must be outside transaction for long-running but here it's fine)
            if (String.isNotBlank(logoBase64) && String.isNotBlank(logoFileName)) {
                try {
                    String logoUrl = uploadLogoToBox(acc.Id, acc.Name, logoFileName, logoBase64);
                    if (String.isNotBlank(logoUrl)) {
                        Account toUpd = new Account(Id = acc.Id);
                        try { toUpd.put('Logo_URL__c', logoUrl); } catch (Exception e) { /* field not present */ }
                        try { toUpd.put('House_Builder_Logo__c', '<img src="' + logoUrl + '" alt="' + acc.Name + ' Logo"/>'); } catch (Exception e) { /* optional */ }
                        update toUpd;
                    }
                } catch (Exception e) {
                    System.debug('Logo upload failed (non-fatal): ' + e.getMessage());
                }
            }

            return acc.Id;
        } catch (Exception e) {
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static String uploadLogoToBox(Id accountId, String accountName, String fileName, String base64Content) {
        // Path: Housebuilder / {sanitized name} / Logo / {file}
        String accessToken = BoxOAuthController.refreshAccessToken();
        if (accessToken == null) {
            throw new AuraHandledException('Could not get a Box access token — check the Box Config refresh token on NHS Config.');
        }

        Box_Config__c config = BoxOAuthController.getConfig();
        String rootFolderId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

        String housebuilderRootId = BoxFileService.getOrCreateFolder('Housebuilder', rootFolderId, accessToken);
        if (housebuilderRootId == null) {
            throw new AuraHandledException('Could not create/open the "Housebuilder" folder at the Box root (id=' + rootFolderId + ').');
        }

        String sanitizedName = BoxFileService.sanitizeName(accountName);
        String builderFolderId = BoxFileService.getOrCreateFolder(sanitizedName, housebuilderRootId, accessToken);
        if (builderFolderId == null) {
            throw new AuraHandledException('Could not create the "' + sanitizedName + '" folder under Housebuilder.');
        }

        String logoFolderId = BoxFileService.getOrCreateFolder('Logo', builderFolderId, accessToken);
        if (logoFolderId == null) {
            throw new AuraHandledException('Could not create the "Logo" subfolder under ' + sanitizedName + '.');
        }

        // Uniquify filename to avoid Box 409 Conflict when re-uploading
        String uniqueName = fileName;
        Integer dot = fileName.lastIndexOf('.');
        String stem = dot > 0 ? fileName.substring(0, dot) : fileName;
        String ext  = dot > 0 ? fileName.substring(dot) : '';
        uniqueName = stem + '-' + String.valueOf(DateTime.now().getTime()) + ext;

        String fileId = BoxFileService.uploadFile(logoFolderId, uniqueName, base64Content, accessToken);
        if (fileId == null) {
            throw new AuraHandledException('Box upload returned no file id — likely a name conflict, file too large, or quota exceeded. Check debug logs for the full Box response.');
        }

        String sharedUrl = BoxFileService.createSharedLink(fileId, accessToken);
        if (String.isBlank(sharedUrl)) {
            throw new AuraHandledException('File uploaded (id=' + fileId + ') but creating a public shared link failed.');
        }
        return sharedUrl;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getHousebuilderDetail(Id accountId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Account acc = [
                SELECT Id, Name, Phone, Website,
                       BillingStreet, BillingCity, BillingPostalCode, BillingCountry,
                       Email__c, Logo_URL__c, House_Builder_Logo__c, RecordType.Name,
                       Use_Timeline_Valuations__c, Vendor_Discussion_Approved__c
                FROM Account WHERE Id = :accountId LIMIT 1
            ];
            result.put('id', acc.Id);
            result.put('name', acc.Name);
            result.put('phone', acc.Phone);
            result.put('website', acc.Website);
            result.put('street', acc.BillingStreet);
            result.put('city', acc.BillingCity);
            result.put('postcode', acc.BillingPostalCode);
            result.put('country', acc.BillingCountry);
            result.put('email', acc.Email__c);
            result.put('logoUrl', acc.Logo_URL__c);
            result.put('logoHtml', acc.House_Builder_Logo__c);
            result.put('recordType', acc.RecordType != null ? acc.RecordType.Name : '');
            result.put('useTimelineValuations', acc.Use_Timeline_Valuations__c == true);
            result.put('vendorDiscussionApproved', acc.Vendor_Discussion_Approved__c == true);

            // Contacts
            List<Contact> contacts = [
                SELECT Id, FirstName, LastName, Name, Email, MobilePhone, Phone, Title
                FROM Contact WHERE AccountId = :accountId ORDER BY LastName, FirstName
            ];
            List<Map<String, Object>> contactList = new List<Map<String, Object>>();
            for (Contact c : contacts) {
                Map<String, Object> m = new Map<String, Object>();
                m.put('id', c.Id);
                m.put('firstName', c.FirstName);
                m.put('lastName', c.LastName);
                m.put('fullName', c.Name);
                m.put('email', c.Email);
                m.put('mobile', c.MobilePhone);
                m.put('phone', c.Phone);
                m.put('jobTitle', c.Title);
                contactList.add(m);
            }
            result.put('contacts', contactList);

            // Applications (Opportunities where House_Builder__c = this account)
            List<Opportunity> apps = [
                SELECT Id, Name, StageName, NHS_Process__c, Property_Address__c, CreatedDate, ETA_Comp_End__c,
                       Vendor_1__r.Name, Development__c, Plot__c
                FROM Opportunity WHERE House_Builder__c = :accountId
                ORDER BY CreatedDate DESC LIMIT 100
            ];
            List<Map<String, Object>> appList = new List<Map<String, Object>>();
            for (Opportunity o : apps) {
                Map<String, Object> m = new Map<String, Object>();
                m.put('id', o.Id);
                m.put('name', o.Name);
                m.put('stage', o.StageName);
                m.put('nhsProcess', o.NHS_Process__c);
                m.put('propertyAddress', o.Property_Address__c);
                m.put('createdDate', o.CreatedDate);
                m.put('etaCompEnd', o.ETA_Comp_End__c);
                m.put('vendorName', o.Vendor_1__r != null ? o.Vendor_1__r.Name : '');
                m.put('development', o.Development__c);
                m.put('plot', o.Plot__c);
                appList.add(m);
            }
            result.put('applications', appList);

            // Comms History — latest emails across all this housebuilder's opportunities
            Set<Id> oppIds = new Set<Id>();
            for (Opportunity o : apps) oppIds.add(o.Id);

            List<Map<String, Object>> commsList = new List<Map<String, Object>>();
            if (!oppIds.isEmpty()) {
                List<EmailMessage> emails = [
                    SELECT Id, Subject, FromAddress, FromName, ToAddress, MessageDate, Incoming, TextBody, RelatedToId
                    FROM EmailMessage WHERE RelatedToId IN :oppIds
                    ORDER BY MessageDate DESC LIMIT 50
                ];
                for (EmailMessage em : emails) {
                    Map<String, Object> m = new Map<String, Object>();
                    m.put('id', em.Id);
                    m.put('channel', 'Email');
                    m.put('direction', em.Incoming ? 'Inbound' : 'Outbound');
                    m.put('subject', em.Subject);
                    m.put('from', em.FromName != null ? em.FromName : em.FromAddress);
                    m.put('to', em.ToAddress);
                    m.put('date', em.MessageDate);
                    m.put('preview', em.TextBody != null && em.TextBody.length() > 120 ? em.TextBody.substring(0, 120) + '...' : em.TextBody);
                    m.put('opportunityId', em.RelatedToId);
                    commsList.add(m);
                }
            }
            result.put('commsHistory', commsList);

            // Preferred Agents
            List<Map<String, Object>> prefList = new List<Map<String, Object>>();
            for (NHS_Preferred_Agent__c pa : [
                SELECT Id, Name, Priority__c, Status__c, Notes__c, Added_Date__c,
                       Estate_Agent__c, Estate_Agent__r.Name, Estate_Agent__r.Phone,
                       Estate_Agent__r.Email__c, Estate_Agent__r.BillingCity
                FROM NHS_Preferred_Agent__c
                WHERE Housebuilder__c = :accountId
                ORDER BY Priority__c ASC NULLS LAST, Added_Date__c DESC
            ]) {
                Map<String, Object> m = new Map<String, Object>();
                m.put('id', pa.Id);
                m.put('name', pa.Name);
                m.put('priority', pa.Priority__c);
                m.put('status', pa.Status__c);
                m.put('notes', pa.Notes__c);
                m.put('addedDate', pa.Added_Date__c);
                m.put('agentId', pa.Estate_Agent__c);
                m.put('agentName', pa.Estate_Agent__r != null ? pa.Estate_Agent__r.Name : '');
                m.put('agentPhone', pa.Estate_Agent__r != null ? pa.Estate_Agent__r.Phone : '');
                m.put('agentEmail', pa.Estate_Agent__r != null ? pa.Estate_Agent__r.Email__c : '');
                m.put('agentCity', pa.Estate_Agent__r != null ? pa.Estate_Agent__r.BillingCity : '');
                prefList.add(m);
            }
            result.put('preferredAgents', prefList);
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> getEmailMessage(Id emailMessageId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            EmailMessage em = [
                SELECT Id, Subject, FromAddress, FromName, ToAddress, CcAddress, BccAddress,
                       MessageDate, Incoming, HtmlBody, TextBody, HasAttachment, RelatedToId
                FROM EmailMessage WHERE Id = :emailMessageId LIMIT 1
            ];
            result.put('id', em.Id);
            result.put('subject', em.Subject);
            result.put('from', em.FromName != null ? em.FromName + ' <' + em.FromAddress + '>' : em.FromAddress);
            result.put('to', em.ToAddress);
            result.put('cc', em.CcAddress);
            result.put('bcc', em.BccAddress);
            result.put('date', em.MessageDate);
            result.put('direction', em.Incoming ? 'Inbound' : 'Outbound');
            result.put('htmlBody', em.HtmlBody);
            result.put('textBody', em.TextBody);
            result.put('hasAttachment', em.HasAttachment);
            result.put('opportunityId', em.RelatedToId);

            // Attachments (ContentDocumentLinks on this EmailMessage)
            List<Map<String, Object>> atts = new List<Map<String, Object>>();
            for (ContentDocumentLink link : [
                SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.ContentSize,
                       ContentDocument.FileType, ContentDocument.LatestPublishedVersionId
                FROM ContentDocumentLink WHERE LinkedEntityId = :emailMessageId
            ]) {
                Map<String, Object> a = new Map<String, Object>();
                a.put('id', link.ContentDocumentId);
                a.put('name', link.ContentDocument.Title);
                a.put('size', link.ContentDocument.ContentSize);
                a.put('type', link.ContentDocument.FileType);
                a.put('downloadUrl', '/sfc/servlet.shepherd/version/download/' + link.ContentDocument.LatestPublishedVersionId);
                atts.add(a);
            }
            result.put('attachments', atts);

            result.put('status', 'success');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static List<Map<String, Object>> searchEstateAgents(Id housebuilderId, String searchTerm) {
        Id agentRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Estate_Agents').getRecordTypeId();
        // Exclude agents already preferred by this housebuilder
        Set<Id> already = new Set<Id>();
        for (NHS_Preferred_Agent__c pa : [
            SELECT Estate_Agent__c FROM NHS_Preferred_Agent__c WHERE Housebuilder__c = :housebuilderId
        ]) already.add(pa.Estate_Agent__c);

        String likeTerm = '%' + (searchTerm == null ? '' : String.escapeSingleQuotes(searchTerm.trim())) + '%';
        String q = 'SELECT Id, Name, BillingCity, BillingPostalCode, Phone, Email__c FROM Account ' +
                   'WHERE RecordTypeId = :agentRT AND Id NOT IN :already ';
        if (String.isNotBlank(searchTerm)) q += 'AND (Name LIKE :likeTerm OR BillingCity LIKE :likeTerm OR BillingPostalCode LIKE :likeTerm) ';
        q += 'ORDER BY Name ASC LIMIT 25';

        List<Map<String, Object>> out = new List<Map<String, Object>>();
        for (Account a : Database.query(q)) {
            Map<String, Object> m = new Map<String, Object>();
            m.put('id', a.Id);
            m.put('name', a.Name);
            m.put('city', a.BillingCity);
            m.put('postcode', a.BillingPostalCode);
            m.put('phone', a.Phone);
            m.put('email', a.Email__c);
            out.add(m);
        }
        return out;
    }

    @AuraEnabled
    public static Id addPreferredAgent(Id housebuilderId, Id agentId, Decimal priority, String notes) {
        // Guard against dupes just in case (LWC excludes already-preferred, but be safe)
        List<NHS_Preferred_Agent__c> existing = [
            SELECT Id FROM NHS_Preferred_Agent__c
            WHERE Housebuilder__c = :housebuilderId AND Estate_Agent__c = :agentId LIMIT 1
        ];
        if (!existing.isEmpty()) {
            throw new AuraHandledException('This agent is already a preferred partner for the housebuilder.');
        }
        NHS_Preferred_Agent__c pa = new NHS_Preferred_Agent__c(
            Housebuilder__c = housebuilderId,
            Estate_Agent__c = agentId,
            Priority__c     = priority,
            Notes__c        = notes,
            Status__c       = 'Active',
            Added_Date__c   = Date.today()
        );
        insert pa;
        return pa.Id;
    }

    @AuraEnabled
    public static void updatePreferredAgent(Id preferredId, Decimal priority, String status, String notes) {
        NHS_Preferred_Agent__c pa = new NHS_Preferred_Agent__c(Id = preferredId);
        if (priority != null) pa.Priority__c = priority;
        if (String.isNotBlank(status)) pa.Status__c = status;
        pa.Notes__c = notes;
        update pa;
    }

    @AuraEnabled
    public static void deletePreferredAgent(Id preferredId) {
        delete new NHS_Preferred_Agent__c(Id = preferredId);
    }

    @AuraEnabled
    public static Id addContactToHousebuilder(Id accountId, String firstName, String lastName, String email, String mobile, String jobTitle) {
        Contact c = new Contact(
            AccountId = accountId,
            FirstName = firstName,
            LastName = String.isNotBlank(lastName) ? lastName : 'Contact',
            Email = email,
            MobilePhone = mobile,
            Title = jobTitle
        );
        insert c;
        return c.Id;
    }

    @AuraEnabled
    public static void deleteContact(Id contactId) {
        delete new Contact(Id = contactId);
    }

    @AuraEnabled
    public static void updateContact(Id contactId, String firstName, String lastName, String email, String mobile, String phone, String jobTitle) {
        Contact c = new Contact(
            Id = contactId,
            FirstName = firstName,
            LastName = String.isNotBlank(lastName) ? lastName : 'Contact',
            Email = email,
            MobilePhone = mobile,
            Phone = phone,
            Title = jobTitle
        );
        update c;
    }

    @AuraEnabled
    public static void updateHousebuilder(Id accountId, String accountDataJson) {
        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(accountDataJson);
        Account acc = new Account(Id = accountId);
        if (data.containsKey('name'))     acc.Name = (String) data.get('name');
        if (data.containsKey('phone'))    acc.Phone = (String) data.get('phone');
        if (data.containsKey('email'))    acc.Email__c = (String) data.get('email');
        if (data.containsKey('website'))  acc.Website = (String) data.get('website');
        if (data.containsKey('street'))   acc.BillingStreet = (String) data.get('street');
        if (data.containsKey('city'))     acc.BillingCity = (String) data.get('city');
        if (data.containsKey('postcode')) acc.BillingPostalCode = (String) data.get('postcode');
        if (data.containsKey('country'))  acc.BillingCountry = (String) data.get('country');
        if (data.containsKey('useTimelineValuations')) acc.Use_Timeline_Valuations__c = (Boolean) data.get('useTimelineValuations');
        if (data.containsKey('vendorDiscussionApproved')) acc.Vendor_Discussion_Approved__c = (Boolean) data.get('vendorDiscussionApproved');
        update acc;
    }

    @AuraEnabled
    public static void updateHousebuilderSettings(Id accountId, Boolean useTimelineValuations, Boolean vendorDiscussionApproved) {
        update new Account(
            Id = accountId,
            Use_Timeline_Valuations__c = useTimelineValuations == true,
            Vendor_Discussion_Approved__c = vendorDiscussionApproved == true
        );
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getHousebuilderLogoBase64(Id accountId) {
        Account acc = [SELECT Id, Name, Logo_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
        if (String.isBlank(acc.Logo_URL__c)) return null;

        String accessToken = BoxOAuthController.refreshAccessToken();
        if (accessToken == null) return null;

        Box_Config__c cfg = BoxOAuthController.getConfig();
        String rootId = cfg != null && String.isNotBlank(cfg.Root_Folder_Id__c) ? cfg.Root_Folder_Id__c : '0';

        // Walk: root / Housebuilder / {sanitized name} / Logo
        String hbFolderId = BoxFileService.getOrCreateFolder('Housebuilder', rootId, accessToken);
        if (hbFolderId == null) return null;
        String sanitized = BoxFileService.sanitizeName(acc.Name);
        String builderFolderId = BoxFileService.getOrCreateFolder(sanitized, hbFolderId, accessToken);
        if (builderFolderId == null) return null;
        String logoFolderId = BoxFileService.getOrCreateFolder('Logo', builderFolderId, accessToken);
        if (logoFolderId == null) return null;

        // List files; pick the most recent
        HttpRequest lsReq = new HttpRequest();
        lsReq.setEndpoint('https://api.box.com/2.0/folders/' + logoFolderId + '/items?fields=id,name,type,modified_at&sort=date&direction=DESC');
        lsReq.setMethod('GET');
        lsReq.setHeader('Authorization', 'Bearer ' + accessToken);
        HttpResponse lsResp = new Http().send(lsReq);
        if (lsResp.getStatusCode() != 200) return null;
        Map<String, Object> lsBody = (Map<String, Object>) JSON.deserializeUntyped(lsResp.getBody());
        List<Object> entries = (List<Object>) lsBody.get('entries');
        if (entries == null || entries.isEmpty()) return null;

        String fileId;
        String fileName;
        for (Object o : entries) {
            Map<String, Object> m = (Map<String, Object>) o;
            if ('file'.equals((String) m.get('type'))) {
                fileId = (String) m.get('id');
                fileName = (String) m.get('name');
                break; // first = most recent (DESC sort)
            }
        }
        if (fileId == null) return null;

        // Download content (follow 302 redirect to CDN)
        HttpRequest dlReq = new HttpRequest();
        dlReq.setEndpoint('https://api.box.com/2.0/files/' + fileId + '/content');
        dlReq.setMethod('GET');
        dlReq.setHeader('Authorization', 'Bearer ' + accessToken);
        HttpResponse dlResp = new Http().send(dlReq);
        if (dlResp.getStatusCode() == 302 || dlResp.getStatusCode() == 301) {
            HttpRequest redir = new HttpRequest();
            redir.setEndpoint(dlResp.getHeader('Location'));
            redir.setMethod('GET');
            dlResp = new Http().send(redir);
        }
        if (dlResp.getStatusCode() != 200) return null;

        Blob body = dlResp.getBodyAsBlob();
        // Infer content type from file extension if Box doesn't return one
        String contentType = dlResp.getHeader('Content-Type');
        if (String.isBlank(contentType) || contentType.startsWith('application/octet-stream')) {
            String lower = fileName != null ? fileName.toLowerCase() : '';
            if (lower.endsWith('.svg')) contentType = 'image/svg+xml';
            else if (lower.endsWith('.png')) contentType = 'image/png';
            else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
            else if (lower.endsWith('.gif')) contentType = 'image/gif';
            else if (lower.endsWith('.webp')) contentType = 'image/webp';
            else contentType = 'application/octet-stream';
        }
        return new Map<String, String>{
            'base64' => EncodingUtil.base64Encode(body),
            'contentType' => contentType,
            'fileName' => fileName
        };
    }

    @AuraEnabled
    public static String replaceLogo(Id accountId, String logoBase64, String logoFileName) {
        if (String.isBlank(logoBase64) || String.isBlank(logoFileName)) {
            throw new AuraHandledException('Logo file data is missing.');
        }
        Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId LIMIT 1];
        String url = uploadLogoToBox(acc.Id, acc.Name, logoFileName, logoBase64);
        if (String.isBlank(url)) {
            throw new AuraHandledException('Logo upload to Box failed — check Box configuration.');
        }
        Account toUpd = new Account(Id = acc.Id);
        toUpd.put('Logo_URL__c', url);
        try { toUpd.put('House_Builder_Logo__c', '<img src="' + url + '" alt="' + acc.Name + ' Logo"/>'); } catch (Exception e) { /* optional */ }
        update toUpd;
        return url;
    }
}
