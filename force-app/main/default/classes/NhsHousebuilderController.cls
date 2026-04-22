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
        String accessToken = BoxOAuthController.refreshAccessToken();
        if (accessToken == null) return null;

        Box_Config__c config = BoxOAuthController.getConfig();
        String rootFolderId = config != null && String.isNotBlank(config.Root_Folder_Id__c) ? config.Root_Folder_Id__c : '0';

        // Create an "NHS Logos" folder (or get existing) at the root
        String logoFolderId = BoxFileService.getOrCreateFolder('NHS Logos', rootFolderId, accessToken);
        if (logoFolderId == null) return null;

        // Create a folder per housebuilder for organization
        String sanitizedName = BoxFileService.sanitizeName(accountName);
        String subFolderId = BoxFileService.getOrCreateFolder(sanitizedName, logoFolderId, accessToken);
        if (subFolderId == null) return null;

        // Upload
        String fileId = BoxFileService.uploadFile(subFolderId, fileName, base64Content, accessToken);
        if (fileId == null) return null;

        // Create public shared link
        String sharedUrl = BoxFileService.createSharedLink(fileId, accessToken);
        return sharedUrl;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getHousebuilderDetail(Id accountId) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            Account acc = [
                SELECT Id, Name, Phone, Website,
                       BillingStreet, BillingCity, BillingPostalCode, BillingCountry,
                       Email__c, Logo_URL__c, House_Builder_Logo__c, RecordType.Name
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
        update acc;
    }
}
