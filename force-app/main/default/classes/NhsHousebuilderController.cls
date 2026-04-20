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
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }
        return result;
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
}
