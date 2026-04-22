public with sharing class NHSCommunicationsController {

    private static final String ORG_WIDE_EMAIL = 'akash@crmmates.com';

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getCommunications(Id opportunityId) {
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        // Query EmailMessage records related to this Opportunity
        List<EmailMessage> emails = [
            SELECT Id, Subject, TextBody, HtmlBody, FromAddress, FromName,
                   ToAddress, CcAddress, MessageDate, Status, Incoming,
                   HasAttachment, RelatedToId
            FROM EmailMessage
            WHERE RelatedToId = :opportunityId
            ORDER BY MessageDate DESC
            LIMIT 200
        ];

        // Collect all email IDs (always query attachments — HasAttachment flag may not auto-update)
        Set<Id> emailIdsWithAttachments = new Set<Id>();
        for (EmailMessage em : emails) {
            emailIdsWithAttachments.add(em.Id);
        }

        // Fetch attachments via ContentDocumentLink + ContentVersion
        Map<Id, List<Map<String, Object>>> attachmentsByEmail = new Map<Id, List<Map<String, Object>>>();
        if (!emailIdsWithAttachments.isEmpty()) {
            List<ContentDocumentLink> links = [
                SELECT ContentDocumentId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId IN :emailIdsWithAttachments
            ];
            Set<Id> docIds = new Set<Id>();
            Map<Id, Id> docToEmail = new Map<Id, Id>();
            for (ContentDocumentLink link : links) {
                docIds.add(link.ContentDocumentId);
                docToEmail.put(link.ContentDocumentId, link.LinkedEntityId);
            }

            if (!docIds.isEmpty()) {
                List<ContentVersion> versions = [
                    SELECT Id, Title, FileExtension, ContentSize, ContentDocumentId
                    FROM ContentVersion
                    WHERE ContentDocumentId IN :docIds AND IsLatest = true
                ];
                for (ContentVersion cv : versions) {
                    Id emailId = docToEmail.get(cv.ContentDocumentId);
                    if (emailId == null) continue;
                    if (!attachmentsByEmail.containsKey(emailId)) {
                        attachmentsByEmail.put(emailId, new List<Map<String, Object>>());
                    }
                    Map<String, Object> att = new Map<String, Object>();
                    att.put('id', cv.Id);
                    att.put('documentId', cv.ContentDocumentId);
                    att.put('name', cv.Title + (String.isNotBlank(cv.FileExtension) ? '.' + cv.FileExtension : ''));
                    att.put('size', cv.ContentSize);
                    attachmentsByEmail.get(emailId).add(att);
                }
            }

            // Also check classic Attachment records (legacy)
            List<Attachment> classicAttachments = [
                SELECT Id, Name, BodyLength, ParentId
                FROM Attachment
                WHERE ParentId IN :emailIdsWithAttachments
            ];
            for (Attachment a : classicAttachments) {
                if (!attachmentsByEmail.containsKey(a.ParentId)) {
                    attachmentsByEmail.put(a.ParentId, new List<Map<String, Object>>());
                }
                Map<String, Object> att = new Map<String, Object>();
                att.put('id', a.Id);
                att.put('name', a.Name);
                att.put('size', a.BodyLength);
                att.put('isClassic', true);
                attachmentsByEmail.get(a.ParentId).add(att);
            }
        }

        for (EmailMessage em : emails) {
            Map<String, Object> comm = new Map<String, Object>();
            comm.put('Id', em.Id);
            comm.put('Channel__c', 'Email');
            comm.put('Direction__c', em.Incoming ? 'Inbound' : 'Outbound');
            comm.put('Contact_Name__c', em.Incoming ? em.FromName : getRecipientName(em.ToAddress));
            comm.put('Subject__c', em.Subject);
            comm.put('Preview__c', truncateText(em.TextBody, 150));
            comm.put('Body__c', em.HtmlBody != null ? em.HtmlBody : (em.TextBody != null ? em.TextBody : ''));
            comm.put('DateTime__c', em.MessageDate);
            comm.put('Status__c', getEmailStatus(em));
            comm.put('Is_Unread__c', em.Incoming && em.Status == '0'); // New/unread
            comm.put('HasAttachment', em.HasAttachment);
            comm.put('Attachments', attachmentsByEmail.containsKey(em.Id) ? attachmentsByEmail.get(em.Id) : new List<Map<String, Object>>());
            comm.put('FromAddress', em.FromAddress);
            comm.put('FromName', em.FromName);
            comm.put('ToAddress', em.ToAddress);
            comm.put('CcAddress', em.CcAddress);
            results.add(comm);
        }

        // Query TwilioSF managed package SMS messages linked to this opportunity
        List<TwilioSF__Message__c> smsMessages = [
            SELECT Id, TwilioSF__Body__c, TwilioSF__To_Number__c, TwilioSF__From_Number__c,
                   TwilioSF__Direction__c, TwilioSF__Status__c, TwilioSF__Date_Created__c,
                   TwilioSF__Unread__c, TwilioSF__Contact__r.Name, TwilioSF__Recipient_Name__c
            FROM TwilioSF__Message__c
            WHERE TwilioSF__SF_Parent_Record_Id__c = :opportunityId
            ORDER BY TwilioSF__Date_Created__c DESC
            LIMIT 100
        ];

        for (TwilioSF__Message__c sms : smsMessages) {
            Map<String, Object> comm = new Map<String, Object>();
            Boolean isInbound = sms.TwilioSF__Direction__c == 'inbound';
            String toNum = sms.TwilioSF__To_Number__c;
            String fromNum = sms.TwilioSF__From_Number__c;
            Boolean isWhatsApp = (toNum != null && toNum.startsWith('whatsapp:')) ||
                                 (fromNum != null && fromNum.startsWith('whatsapp:'));
            comm.put('Id', sms.Id);
            comm.put('Channel__c', isWhatsApp ? 'WhatsApp' : 'SMS');
            comm.put('Direction__c', isInbound ? 'Inbound' : 'Outbound');
            comm.put('Contact_Name__c', sms.TwilioSF__Contact__r != null ? sms.TwilioSF__Contact__r.Name : (sms.TwilioSF__Recipient_Name__c != null ? sms.TwilioSF__Recipient_Name__c : 'Unknown'));
            comm.put('Subject__c', isWhatsApp ? 'WhatsApp' : 'SMS');
            comm.put('Preview__c', truncateText(sms.TwilioSF__Body__c, 150));
            comm.put('Body__c', sms.TwilioSF__Body__c);
            comm.put('DateTime__c', sms.TwilioSF__Date_Created__c);
            comm.put('Status__c', sms.TwilioSF__Status__c != null ? sms.TwilioSF__Status__c : 'queued');
            comm.put('Is_Unread__c', sms.TwilioSF__Unread__c);
            comm.put('ToAddress', toNum != null ? toNum.replace('whatsapp:', '') : '');
            comm.put('FromAddress', fromNum != null ? fromNum.replace('whatsapp:', '') : '');
            results.add(comm);
        }

        // Also query Tasks logged as calls
        List<Task> calls = [
            SELECT Id, Subject, Description, ActivityDate, Status,
                   CallType, CallDurationInSeconds, Who.Name, WhoId,
                   CreatedDate
            FROM Task
            WHERE WhatId = :opportunityId
            AND TaskSubtype = 'Call'
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        for (Task t : calls) {
            Map<String, Object> comm = new Map<String, Object>();
            comm.put('Id', t.Id);
            comm.put('Channel__c', t.Status == 'Not Reached' ? 'Missed Call' : 'Call');
            comm.put('Direction__c', t.CallType == 'Inbound' ? 'Inbound' : 'Outbound');
            comm.put('Contact_Name__c', t.Who != null ? t.Who.Name : 'Unknown');
            comm.put('Subject__c', t.Subject);
            comm.put('Preview__c', truncateText(t.Description, 150));
            comm.put('DateTime__c', t.CreatedDate);
            comm.put('Status__c', t.Status == 'Not Reached' ? 'Missed' : 'Answered');
            comm.put('Is_Unread__c', false);
            comm.put('Duration__c', formatDuration(t.CallDurationInSeconds));
            results.add(comm);
        }

        return results;
    }

    @AuraEnabled
    public static List<Map<String, String>> getEmailTemplates() {
        List<Map<String, String>> templates = new List<Map<String, String>>();

        // Query across every folder named "NHS Email Templates" — there can be multiple
        // (one of Type='EmailTemplate' for Lightning templates and one of Type='Email' for Classic).
        // We don't care which folder the template lives in; we just want the full list.
        Set<Id> folderIds = new Set<Id>();
        for (Folder f : [SELECT Id FROM Folder WHERE Name = 'NHS Email Templates']) {
            folderIds.add(f.Id);
        }
        if (folderIds.isEmpty()) return templates;

        List<EmailTemplate> tpls = [
            SELECT Id, Name, Subject, Description, DeveloperName, LastModifiedDate
            FROM EmailTemplate
            WHERE FolderId IN :folderIds
            AND IsActive = true
            AND DeveloperName LIKE 'NHS_%'
            ORDER BY Name
        ];

        for (EmailTemplate t : tpls) {
            Map<String, String> tpl = new Map<String, String>();
            tpl.put('id', t.Id);
            tpl.put('name', t.Name);
            tpl.put('subject', t.Subject != null ? t.Subject : '');
            tpl.put('description', t.Description != null ? t.Description : '');
            tpl.put('developerName', t.DeveloperName);
            tpl.put('lastModified', String.valueOf(t.LastModifiedDate));
            templates.add(tpl);
        }

        return templates;
    }

    @AuraEnabled
    public static Map<String, String> getRenderedTemplate(Id templateId, Id opportunityId) {
        Map<String, String> result = new Map<String, String>();
        try {
            // Get the Opportunity's vendor contact for merge field rendering
            Opportunity opp = [SELECT Id, Vendor_1__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
            Id contactId = opp.Vendor_1__c;

            Messaging.SingleEmailMessage email = Messaging.renderStoredEmailTemplate(templateId, contactId, opportunityId);
            result.put('subject', email.getSubject());
            result.put('body', email.getHtmlBody());
            result.put('status', 'success');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, String> sendEmail(Id opportunityId, String toAddress, String subject, String body, String ccAddress, Id templateId) {
        return sendEmailWithAttachments(opportunityId, toAddress, subject, body, ccAddress, templateId, new List<Id>());
    }

    @AuraEnabled
    public static Map<String, String> sendEmailWithAttachments(Id opportunityId, String toAddress, String subject, String body, String ccAddress, Id templateId, List<Id> contentDocumentIds) {
        return sendEmailFull(opportunityId, toAddress, subject, body, ccAddress, null, templateId, contentDocumentIds);
    }

    @AuraEnabled
    public static Map<String, String> sendEmailWithBcc(Id opportunityId, String toAddress, String subject, String body, String ccAddress, String bccAddress, Id templateId) {
        return sendEmailFull(opportunityId, toAddress, subject, body, ccAddress, bccAddress, templateId, new List<Id>());
    }

    @AuraEnabled
    public static Map<String, String> sendEmailComplete(Id opportunityId, String toAddress, String subject, String body, String ccAddress, String bccAddress, Id templateId, List<Id> contentDocumentIds) {
        return sendEmailFull(opportunityId, toAddress, subject, body, ccAddress, bccAddress, templateId, contentDocumentIds);
    }

    private static Map<String, String> sendEmailFull(Id opportunityId, String toAddress, String subject, String body, String ccAddress, String bccAddress, Id templateId, List<Id> contentDocumentIds) {
        Map<String, String> result = new Map<String, String>();

        try {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

            // OWA disabled for sandbox — sends from logged-in user's address
            // To re-enable, uncomment and set a verified OWA in ORG_WIDE_EMAIL
            // List<OrgWideEmailAddress> owea = [
            //     SELECT Id, IsVerified FROM OrgWideEmailAddress
            //     WHERE Address = :ORG_WIDE_EMAIL LIMIT 1
            // ];
            // if (!owea.isEmpty() && owea[0].IsVerified) {
            //     email.setOrgWideEmailAddressId(owea[0].Id);
            // }

            email.setToAddresses(new List<String>{ toAddress });
            if (String.isNotBlank(ccAddress)) {
                List<String> ccList = new List<String>();
                for (String addr : ccAddress.split(',')) {
                    String trimmed = addr.trim();
                    if (String.isNotBlank(trimmed)) ccList.add(trimmed);
                }
                if (!ccList.isEmpty()) email.setCcAddresses(ccList);
            }
            if (String.isNotBlank(bccAddress)) {
                List<String> bccList = new List<String>();
                for (String addr : bccAddress.split(',')) {
                    String trimmed = addr.trim();
                    if (String.isNotBlank(trimmed)) bccList.add(trimmed);
                }
                if (!bccList.isEmpty()) email.setBccAddresses(bccList);
            }
            email.setSubject(subject);
            email.setHtmlBody(body);
            email.setWhatId(opportunityId);
            email.setSaveAsActivity(true);

            // Attach files from ContentDocument IDs
            if (contentDocumentIds != null && !contentDocumentIds.isEmpty()) {
                List<ContentVersion> versions = [
                    SELECT Id, Title, FileExtension, VersionData
                    FROM ContentVersion
                    WHERE ContentDocumentId IN :contentDocumentIds
                    AND IsLatest = true
                ];
                List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();
                for (ContentVersion cv : versions) {
                    Messaging.EmailFileAttachment att = new Messaging.EmailFileAttachment();
                    att.setFileName(cv.Title + '.' + cv.FileExtension);
                    att.setBody(cv.VersionData);
                    attachments.add(att);
                }
                if (!attachments.isEmpty()) {
                    email.setFileAttachments(attachments);
                }
            }

            Messaging.SendEmailResult[] results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });

            if (results[0].isSuccess()) {
                result.put('status', 'success');
                result.put('message', 'Email sent successfully');
            } else {
                result.put('status', 'error');
                result.put('message', results[0].getErrors()[0].getMessage());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, String> sendSms(Id opportunityId, String toNumber, String body) {
        Map<String, String> result = new Map<String, String>();

        try {
            // Get vendor contact for this opportunity
            Opportunity opp = [SELECT Id, Vendor_1__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // Create TwilioSF Message record — managed package trigger handles sending
            TwilioSF__Message__c msg = new TwilioSF__Message__c();
            msg.TwilioSF__To_Number__c = toNumber;
            msg.TwilioSF__Body__c = body;
            msg.TwilioSF__Direction__c = 'outbound-api';
            msg.TwilioSF__Status__c = 'queued';
            msg.TwilioSF__Date_Created__c = Datetime.now();
            msg.TwilioSF__SF_Parent_Record_Id__c = opportunityId;
            if (opp.Vendor_1__c != null) {
                msg.TwilioSF__Contact__c = opp.Vendor_1__c;
            }
            insert msg;

            result.put('status', 'success');
            result.put('message', 'SMS queued for delivery');
            result.put('messageId', msg.Id);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, String> sendWhatsApp(Id opportunityId, String toNumber, String body) {
        Map<String, String> result = new Map<String, String>();

        try {
            Opportunity opp = [SELECT Id, Vendor_1__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // WhatsApp via Twilio uses whatsapp: prefix
            String waTo = toNumber.startsWith('whatsapp:') ? toNumber : 'whatsapp:' + toNumber;

            TwilioSF__Message__c msg = new TwilioSF__Message__c();
            msg.TwilioSF__To_Number__c = waTo;
            msg.TwilioSF__Body__c = body;
            msg.TwilioSF__Direction__c = 'outbound-api';
            msg.TwilioSF__Status__c = 'queued';
            msg.TwilioSF__Date_Created__c = Datetime.now();
            msg.TwilioSF__SF_Parent_Record_Id__c = opportunityId;
            if (opp.Vendor_1__c != null) {
                msg.TwilioSF__Contact__c = opp.Vendor_1__c;
            }
            insert msg;

            result.put('status', 'success');
            result.put('message', 'WhatsApp message queued for delivery');
            result.put('messageId', msg.Id);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, String> logCall(Id opportunityId, Id vendorContactId, String subject, String description, String callType, String status) {
        Map<String, String> result = new Map<String, String>();

        try {
            Task t = new Task();
            t.WhatId = opportunityId;
            t.WhoId = vendorContactId;
            t.Subject = subject;
            t.Description = description;
            t.Status = status;
            t.Priority = 'Normal';
            t.TaskSubtype = 'Call';
            t.CallType = callType;
            t.ActivityDate = Date.today();
            insert t;

            result.put('status', 'success');
            result.put('taskId', t.Id);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getOpportunityContext(Id opportunityId) {
        Map<String, Object> ctx = new Map<String, Object>();

        Opportunity opp = [
            SELECT Id, Name, Property_Address__c,
                   Vendor_1__c, Vendor_1__r.Name, Vendor_1_Email__c, Vendor_1_Mobile__c, Vendor_1_Phone__c,
                   Vendor_2__c, Vendor_2__r.Name,
                   House_Builder__c, House_Builder__r.Name
            FROM Opportunity
            WHERE Id = :opportunityId
            LIMIT 1
        ];

        ctx.put('oppName', opp.Name);
        ctx.put('propertyAddress', opp.Property_Address__c);
        ctx.put('vendor1Id', opp.Vendor_1__c);
        ctx.put('vendor1Name', opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : '');
        ctx.put('vendor1Email', opp.Vendor_1_Email__c);
        ctx.put('vendor1Mobile', opp.Vendor_1_Mobile__c);
        ctx.put('vendor1Phone', opp.Vendor_1_Phone__c);
        ctx.put('vendor2Id', opp.Vendor_2__c);
        ctx.put('vendor2Name', opp.Vendor_2__r != null ? opp.Vendor_2__r.Name : '');
        ctx.put('houseBuilderName', opp.House_Builder__r != null ? opp.House_Builder__r.Name : '');

        return ctx;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAddressBook(Id opportunityId) {
        List<Map<String, String>> contacts = new List<Map<String, String>>();

        Opportunity opp = [
            SELECT Id,
                   Vendor_1__c, Vendor_1__r.Name, Vendor_1_Email__c,
                   Vendor_2__c, Vendor_2__r.Name, Vendor_2_Email__c,
                   Agent_1__c, Agent_1__r.Name, Agent_1_Email__c,
                   Agent_2__c, Agent_2__r.Name, Agent_2_Email__c,
                   Agent_3__c, Agent_3__r.Name, Agent_3_Email__c,
                   House_Builder__c, House_Builder__r.Name, House_Builder__r.Email__c
            FROM Opportunity
            WHERE Id = :opportunityId
            LIMIT 1
        ];

        // Vendor 1
        if (opp.Vendor_1__c != null && String.isNotBlank(opp.Vendor_1_Email__c)) {
            contacts.add(buildContact('Vendor 1', opp.Vendor_1__r.Name, opp.Vendor_1_Email__c, 'vendor'));
        }

        // Vendor 2
        if (opp.Vendor_2__c != null && String.isNotBlank(opp.Vendor_2_Email__c)) {
            contacts.add(buildContact('Vendor 2', opp.Vendor_2__r.Name, opp.Vendor_2_Email__c, 'vendor'));
        }

        // Agent accounts — add account-level email + related contacts
        Set<Id> accountIds = new Set<Id>();
        Map<Id, String> agentLabels = new Map<Id, String>();

        if (opp.Agent_1__c != null) {
            accountIds.add(opp.Agent_1__c);
            agentLabels.put(opp.Agent_1__c, 'Agent 1');
            if (String.isNotBlank(opp.Agent_1_Email__c)) {
                contacts.add(buildContact('Agent 1', opp.Agent_1__r.Name, opp.Agent_1_Email__c, 'agent'));
            }
        }
        if (opp.Agent_2__c != null) {
            accountIds.add(opp.Agent_2__c);
            agentLabels.put(opp.Agent_2__c, 'Agent 2');
            if (String.isNotBlank(opp.Agent_2_Email__c)) {
                contacts.add(buildContact('Agent 2', opp.Agent_2__r.Name, opp.Agent_2_Email__c, 'agent'));
            }
        }
        if (opp.Agent_3__c != null) {
            accountIds.add(opp.Agent_3__c);
            agentLabels.put(opp.Agent_3__c, 'Agent 3');
            if (String.isNotBlank(opp.Agent_3_Email__c)) {
                contacts.add(buildContact('Agent 3', opp.Agent_3__r.Name, opp.Agent_3_Email__c, 'agent'));
            }
        }

        // House Builder account
        if (opp.House_Builder__c != null) {
            accountIds.add(opp.House_Builder__c);
            agentLabels.put(opp.House_Builder__c, 'Housebuilder');
            if (opp.House_Builder__r != null && String.isNotBlank(opp.House_Builder__r.Email__c)) {
                contacts.add(buildContact('Housebuilder', opp.House_Builder__r.Name, opp.House_Builder__r.Email__c, 'housebuilder'));
            }
        }

        // Query related contacts for all agent + housebuilder accounts
        if (!accountIds.isEmpty()) {
            List<Contact> relatedContacts = [
                SELECT Id, Name, Email, AccountId, Account.Name, Title
                FROM Contact
                WHERE AccountId IN :accountIds
                AND Email != null
                ORDER BY Name
                LIMIT 50
            ];

            Set<String> addedEmails = new Set<String>();
            for (Map<String, String> c : contacts) {
                addedEmails.add(c.get('email').toLowerCase());
            }

            for (Contact con : relatedContacts) {
                if (addedEmails.contains(con.Email.toLowerCase())) continue;
                addedEmails.add(con.Email.toLowerCase());

                String label = agentLabels.containsKey(con.AccountId) ? agentLabels.get(con.AccountId) : 'Contact';
                String category = label == 'Housebuilder' ? 'housebuilder' : 'agent';
                String displayName = con.Name + (String.isNotBlank(con.Title) ? ' (' + con.Title + ')' : '');
                contacts.add(buildContact(label, displayName, con.Email, category));
            }
        }

        return contacts;
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getBoxFilesForOpportunity(Id opportunityId) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('folderExists', false);
        result.put('files', new List<Map<String, Object>>());
        result.put('subfolders', new List<String>());

        try {
            Opportunity opp = [SELECT Id, Property_Address__c, Box_Folder_Id__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // Use cached Box folder ID (same as Box Browser)
            String rootFolderId = opp.Box_Folder_Id__c;
            if (String.isBlank(rootFolderId)) {
                // Fallback: try to find by property address (for opps that haven't been backfilled)
                if (String.isNotBlank(opp.Property_Address__c)) {
                    Map<String, Object> fallback = BoxBrowserController.getBoxFolder(opp.Property_Address__c);
                    return fallback;
                }
                result.put('error', 'No Box folder linked to this application. Create one from the Box File Storage section first.');
                return result;
            }

            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) {
                result.put('error', 'Not connected to Box.');
                return result;
            }

            // Get root folder name
            HttpRequest infoReq = new HttpRequest();
            infoReq.setEndpoint('https://api.box.com/2.0/folders/' + rootFolderId + '?fields=name,id');
            infoReq.setMethod('GET');
            infoReq.setHeader('Authorization', 'Bearer ' + accessToken);
            HttpResponse infoResp = new Http().send(infoReq);
            if (infoResp.getStatusCode() == 200) {
                Map<String, Object> folderInfo = (Map<String, Object>) JSON.deserializeUntyped(infoResp.getBody());
                result.put('folderName', folderInfo.get('name'));
            }

            List<Map<String, Object>> allFiles = new List<Map<String, Object>>();
            List<String> subfolderNames = new List<String>();

            // List root folder items
            List<Map<String, Object>> rootEntries = listBoxFolderItems(rootFolderId, accessToken);
            Map<String, String> subfolderIds = new Map<String, String>();
            for (Map<String, Object> entry : rootEntries) {
                String entryType = (String) entry.get('type');
                if (entryType == 'folder') {
                    String name = (String) entry.get('name');
                    subfolderNames.add(name);
                    subfolderIds.put(name, (String) entry.get('id'));
                } else if (entryType == 'file') {
                    allFiles.add(buildBoxFileMap(entry, 'Root'));
                }
            }

            // List each subfolder's items
            for (String sfName : subfolderNames) {
                String sfId = subfolderIds.get(sfName);
                if (sfId == null) continue;
                List<Map<String, Object>> subEntries = listBoxFolderItems(sfId, accessToken);
                for (Map<String, Object> entry : subEntries) {
                    if ((String) entry.get('type') == 'file') {
                        allFiles.add(buildBoxFileMap(entry, sfName));
                    }
                }
            }

            result.put('folderExists', true);
            result.put('folderId', rootFolderId);
            result.put('files', allFiles);
            result.put('subfolders', subfolderNames);
        } catch (Exception e) {
            result.put('error', e.getMessage());
        }
        return result;
    }

    private static List<Map<String, Object>> listBoxFolderItems(String folderId, String accessToken) {
        List<Map<String, Object>> items = new List<Map<String, Object>>();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.box.com/2.0/folders/' + folderId + '/items?fields=name,id,type,size,modified_at&limit=1000');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);

        HttpResponse resp = new Http().send(req);
        if (resp.getStatusCode() == 200) {
            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
            List<Object> entries = (List<Object>) body.get('entries');
            if (entries != null) {
                for (Object entry : entries) {
                    items.add((Map<String, Object>) entry);
                }
            }
        }
        return items;
    }

    private static Map<String, Object> buildBoxFileMap(Map<String, Object> entry, String subfolderLabel) {
        Map<String, Object> fileMap = new Map<String, Object>();
        fileMap.put('id', entry.get('id'));
        fileMap.put('name', entry.get('name'));
        fileMap.put('size', entry.get('size'));
        fileMap.put('modified', entry.get('modified_at'));
        fileMap.put('subfolder', subfolderLabel);
        return fileMap;
    }

    @AuraEnabled
    public static Map<String, String> sendEmailWithBoxAttachments(
        Id opportunityId, String toAddress, String subject, String body,
        String ccAddress, String bccAddress, Id templateId,
        List<Id> contentDocumentIds, List<String> boxFileIds
    ) {
        Map<String, String> result = new Map<String, String>();

        try {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new List<String>{ toAddress });

            if (String.isNotBlank(ccAddress)) {
                List<String> ccList = new List<String>();
                for (String addr : ccAddress.split(',')) {
                    String trimmed = addr.trim();
                    if (String.isNotBlank(trimmed)) ccList.add(trimmed);
                }
                if (!ccList.isEmpty()) email.setCcAddresses(ccList);
            }
            if (String.isNotBlank(bccAddress)) {
                List<String> bccList = new List<String>();
                for (String addr : bccAddress.split(',')) {
                    String trimmed = addr.trim();
                    if (String.isNotBlank(trimmed)) bccList.add(trimmed);
                }
                if (!bccList.isEmpty()) email.setBccAddresses(bccList);
            }

            email.setSubject(subject);
            email.setHtmlBody(body);
            email.setWhatId(opportunityId);
            email.setSaveAsActivity(true);

            List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();

            // Track Box file blobs + names so we can save them as ContentDocuments after send
            List<Blob> boxBlobs = new List<Blob>();
            List<String> boxNames = new List<String>();

            // 1. CALLOUTS FIRST — Download Box files
            List<String> boxErrors = new List<String>();
            if (boxFileIds != null && !boxFileIds.isEmpty()) {
                String accessToken = BoxOAuthController.refreshAccessToken();
                if (accessToken == null) {
                    result.put('status', 'error');
                    result.put('message', 'Not connected to Box.');
                    return result;
                }

                for (String boxFileId : boxFileIds) {
                    try {
                        Map<String, Object> fileInfo = getBoxFileInfo(boxFileId, accessToken);
                        Blob fileBlob = downloadBoxFile(boxFileId, accessToken);
                        if (fileBlob != null && fileInfo != null) {
                            String fname = (String) fileInfo.get('name');
                            Messaging.EmailFileAttachment att = new Messaging.EmailFileAttachment();
                            att.setFileName(fname);
                            att.setBody(fileBlob);
                            attachments.add(att);
                            boxBlobs.add(fileBlob);
                            boxNames.add(fname);
                        } else {
                            boxErrors.add('Could not fetch Box file ' + boxFileId);
                        }
                    } catch (Exception e) {
                        boxErrors.add('Box file ' + boxFileId + ': ' + e.getMessage());
                    }
                }
            }

            if (!boxErrors.isEmpty() && attachments.isEmpty() && boxFileIds != null && !boxFileIds.isEmpty()) {
                result.put('status', 'error');
                result.put('message', 'Failed to download Box files: ' + String.join(boxErrors, '; '));
                return result;
            }

            // 2. Query uploaded files (SOQL, no DML)
            if (contentDocumentIds != null && !contentDocumentIds.isEmpty()) {
                List<ContentVersion> versions = [
                    SELECT Id, Title, FileExtension, VersionData
                    FROM ContentVersion
                    WHERE ContentDocumentId IN :contentDocumentIds AND IsLatest = true
                ];
                for (ContentVersion cv : versions) {
                    Messaging.EmailFileAttachment att = new Messaging.EmailFileAttachment();
                    att.setFileName(cv.Title + '.' + cv.FileExtension);
                    att.setBody(cv.VersionData);
                    attachments.add(att);
                }
            }

            if (!attachments.isEmpty()) email.setFileAttachments(attachments);

            // 3. Send email
            Messaging.SendEmailResult[] results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });

            if (!results[0].isSuccess()) {
                result.put('status', 'error');
                result.put('message', results[0].getErrors()[0].getMessage());
                return result;
            }

            // 4. Link attachments to the newly-created EmailMessage record
            try {
                // Find the EmailMessage created by setSaveAsActivity
                List<EmailMessage> ems = [
                    SELECT Id FROM EmailMessage
                    WHERE RelatedToId = :opportunityId AND Incoming = false
                    ORDER BY CreatedDate DESC LIMIT 1
                ];
                if (!ems.isEmpty()) {
                    Id emailMessageId = ems[0].Id;
                    List<Id> docIdsToLink = new List<Id>();

                    // Link uploaded files directly (they're already ContentDocuments)
                    if (contentDocumentIds != null) docIdsToLink.addAll(contentDocumentIds);

                    // Save Box files as new ContentVersions (creates ContentDocuments)
                    if (!boxBlobs.isEmpty()) {
                        List<ContentVersion> toInsert = new List<ContentVersion>();
                        for (Integer i = 0; i < boxBlobs.size(); i++) {
                            ContentVersion cv = new ContentVersion();
                            cv.Title = boxNames[i];
                            cv.PathOnClient = boxNames[i];
                            cv.VersionData = boxBlobs[i];
                            toInsert.add(cv);
                        }
                        insert toInsert;
                        // Get the ContentDocumentIds from the inserted versions
                        Set<Id> cvIds = new Set<Id>();
                        for (ContentVersion cv : toInsert) cvIds.add(cv.Id);
                        List<ContentVersion> savedVersions = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id IN :cvIds];
                        for (ContentVersion cv : savedVersions) docIdsToLink.add(cv.ContentDocumentId);
                    }

                    // Link all ContentDocuments to the EmailMessage
                    if (!docIdsToLink.isEmpty()) {
                        List<ContentDocumentLink> links = new List<ContentDocumentLink>();
                        for (Id docId : docIdsToLink) {
                            ContentDocumentLink link = new ContentDocumentLink();
                            link.ContentDocumentId = docId;
                            link.LinkedEntityId = emailMessageId;
                            link.ShareType = 'V';
                            link.Visibility = 'AllUsers';
                            links.add(link);
                        }
                        insert links;
                    }
                }
            } catch (Exception linkErr) {
                // Email was sent successfully; just log the link error
                System.debug('Failed to link attachments to EmailMessage: ' + linkErr.getMessage());
            }

            result.put('status', 'success');
            result.put('message', 'Email sent successfully');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> getBoxFileInfo(String fileId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.box.com/2.0/files/' + fileId + '?fields=name,size');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        HttpResponse resp = new Http().send(req);
        if (resp.getStatusCode() == 200) {
            return (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
        }
        return null;
    }

    private static Blob downloadBoxFile(String fileId, String accessToken) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.box.com/2.0/files/' + fileId + '/content');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setTimeout(60000);
        HttpResponse resp = new Http().send(req);
        Integer status = resp.getStatusCode();

        // Direct content
        if (status == 200) {
            return resp.getBodyAsBlob();
        }

        // Box returns 302 redirect to CDN (dl.boxcloud.com) with signed download URL
        if (status == 301 || status == 302 || status == 303 || status == 307) {
            String downloadUrl = resp.getHeader('Location');
            if (String.isBlank(downloadUrl)) downloadUrl = resp.getHeader('location');
            if (String.isBlank(downloadUrl)) {
                throw new CalloutException('Box returned ' + status + ' but no Location header');
            }

            HttpRequest downloadReq = new HttpRequest();
            downloadReq.setEndpoint(downloadUrl);
            downloadReq.setMethod('GET');
            downloadReq.setTimeout(60000);
            HttpResponse downloadResp = new Http().send(downloadReq);
            if (downloadResp.getStatusCode() == 200) {
                return downloadResp.getBodyAsBlob();
            }
            String host = downloadUrl.indexOf('?') > 0 ? downloadUrl.substring(0, downloadUrl.indexOf('?')) : downloadUrl;
            throw new CalloutException('Box CDN download failed: HTTP ' + downloadResp.getStatusCode() + ' from ' + host);
        }

        String bodyPreview = resp.getBody();
        if (bodyPreview != null && bodyPreview.length() > 200) bodyPreview = bodyPreview.substring(0, 200);
        throw new CalloutException('Box download failed: HTTP ' + status + ' - ' + bodyPreview);
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isAdminUser() {
        String profileName = [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1].Profile.Name;
        return profileName == 'System Administrator' || profileName == 'Super Admin';
    }

    private static Map<String, String> buildContact(String role, String name, String email, String category) {
        Map<String, String> c = new Map<String, String>();
        c.put('role', role);
        c.put('name', name != null ? name : '');
        c.put('email', email);
        c.put('category', category);
        return c;
    }

    // ── Helpers ──

    private static String getRecipientName(String toAddress) {
        if (String.isBlank(toAddress)) return 'Unknown';
        // Try to find a matching Contact
        String addr = toAddress.split(',')[0].trim();
        List<Contact> contacts = [SELECT Name FROM Contact WHERE Email = :addr LIMIT 1];
        if (!contacts.isEmpty()) return contacts[0].Name;
        return addr;
    }

    private static String getEmailStatus(EmailMessage em) {
        if (em.Incoming) return 'Received';
        // Status: 0=New, 1=Read, 2=Replied, 3=Sent, 4=Forwarded, 5=Draft
        switch on em.Status {
            when '0' { return 'Sent'; }
            when '1' { return 'Read'; }
            when '2' { return 'Replied'; }
            when '3' { return 'Sent'; }
            when '4' { return 'Forwarded'; }
            when '5' { return 'Draft'; }
            when else { return 'Sent'; }
        }
    }

    private static String truncateText(String text, Integer maxLen) {
        if (String.isBlank(text)) return '';
        return text.length() > maxLen ? text.substring(0, maxLen) + '...' : text;
    }

    private static String formatDuration(Integer seconds) {
        if (seconds == null || seconds == 0) return null;
        Integer mins = seconds / 60;
        Integer secs = Math.mod(seconds, 60);
        return mins + 'm ' + secs + 's';
    }
}
