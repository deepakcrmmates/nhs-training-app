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

        for (EmailMessage em : emails) {
            Map<String, Object> comm = new Map<String, Object>();
            comm.put('Id', em.Id);
            comm.put('Channel__c', 'Email');
            comm.put('Direction__c', em.Incoming ? 'Inbound' : 'Outbound');
            comm.put('Contact_Name__c', em.Incoming ? em.FromName : getRecipientName(em.ToAddress));
            comm.put('Subject__c', em.Subject);
            comm.put('Preview__c', truncateText(em.TextBody, 150));
            comm.put('DateTime__c', em.MessageDate);
            comm.put('Status__c', getEmailStatus(em));
            comm.put('Is_Unread__c', em.Incoming && em.Status == '0'); // New/unread
            comm.put('HasAttachment', em.HasAttachment);
            comm.put('FromAddress', em.FromAddress);
            comm.put('ToAddress', em.ToAddress);
            results.add(comm);
        }

        // Query Twilio SMS messages linked to this opportunity
        List<Twilio_SMS__c> smsMessages = [
            SELECT Id, Body__c, Mobile__c, From_Number__c, Direction__c, Status__c,
                   Date_Time__c, Contact__r.Name
            FROM Twilio_SMS__c
            WHERE Opportunity__c = :opportunityId
            ORDER BY Date_Time__c DESC
            LIMIT 100
        ];

        for (Twilio_SMS__c sms : smsMessages) {
            Map<String, Object> comm = new Map<String, Object>();
            Boolean isInbound = sms.Direction__c == 'Inbound';
            comm.put('Id', sms.Id);
            comm.put('Channel__c', 'SMS');
            comm.put('Direction__c', sms.Direction__c);
            comm.put('Contact_Name__c', sms.Contact__r != null ? sms.Contact__r.Name : 'Unknown');
            comm.put('Subject__c', 'SMS');
            comm.put('Preview__c', truncateText(sms.Body__c, 150));
            comm.put('DateTime__c', sms.Date_Time__c);
            comm.put('Status__c', sms.Status__c != null ? sms.Status__c : 'Queued');
            comm.put('Is_Unread__c', false);
            comm.put('ToAddress', sms.Mobile__c);
            comm.put('FromAddress', sms.From_Number__c);
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

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getEmailTemplates() {
        List<Map<String, String>> templates = new List<Map<String, String>>();

        // Query templates from the NHS Email Templates folder
        List<Folder> folders = [SELECT Id FROM Folder WHERE Name = 'NHS Email Templates' LIMIT 1];
        if (folders.isEmpty()) return templates;

        List<EmailTemplate> tpls = [
            SELECT Id, Name, Subject, Description, DeveloperName, LastModifiedDate
            FROM EmailTemplate
            WHERE FolderId = :folders[0].Id
            AND IsActive = true
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
            // Read Twilio config from Custom Setting
            Twilio_Config__c config = Twilio_Config__c.getInstance();
            if (config == null || String.isBlank(config.Account_SID__c) || String.isBlank(config.Auth_Token__c)) {
                result.put('status', 'error');
                result.put('message', 'Twilio is not configured. Go to Setup > Custom Settings > Twilio Config to enter your credentials.');
                return result;
            }

            // Get vendor contact for this opportunity
            Opportunity opp = [SELECT Id, Vendor_1__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // Call Twilio REST API
            String endpoint = 'https://api.twilio.com/2010-04-01/Accounts/' + config.Account_SID__c + '/Messages.json';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            Blob authBlob = Blob.valueOf(config.Account_SID__c + ':' + config.Auth_Token__c);
            req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(authBlob));

            String payload = 'To=' + EncodingUtil.urlEncode(toNumber, 'UTF-8')
                + '&Body=' + EncodingUtil.urlEncode(body, 'UTF-8');

            // Use From Number directly (more reliable for international SMS)
            if (String.isNotBlank(config.From_Number__c)) {
                payload += '&From=' + EncodingUtil.urlEncode(config.From_Number__c, 'UTF-8');
            } else if (String.isNotBlank(config.Messaging_Service_SID__c)) {
                payload += '&MessagingServiceSid=' + EncodingUtil.urlEncode(config.Messaging_Service_SID__c, 'UTF-8');
            }
            req.setBody(payload);

            Http http = new Http();
            HttpResponse resp = http.send(req);

            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());

            // Create SMS record for tracking
            Twilio_SMS__c sms = new Twilio_SMS__c();
            sms.Opportunity__c = opportunityId;
            sms.Contact__c = opp.Vendor_1__c;
            sms.Mobile__c = toNumber;
            sms.Body__c = body;
            sms.From_Number__c = config.From_Number__c;
            sms.Direction__c = 'Outbound';
            sms.Date_Time__c = Datetime.now();

            if (resp.getStatusCode() == 201 || resp.getStatusCode() == 200) {
                sms.Status__c = 'Sent';
                sms.Message_SID__c = (String) responseBody.get('sid');
                result.put('status', 'success');
                result.put('message', 'SMS sent successfully');
            } else {
                sms.Status__c = 'Failed';
                String errMsg = (String) responseBody.get('message');
                sms.Error_Message__c = errMsg;
                result.put('status', 'error');
                result.put('message', errMsg != null ? errMsg : 'SMS sending failed (HTTP ' + resp.getStatusCode() + ')');
            }

            insert sms;
            result.put('messageId', sms.Id);
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
                   Vendor_1__c, Vendor_1__r.Name, Vendor_1_Email__c, Vendor_1_Mobile__c,
                   Vendor_2__c, Vendor_2__r.Name
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
        ctx.put('vendor2Id', opp.Vendor_2__c);
        ctx.put('vendor2Name', opp.Vendor_2__r != null ? opp.Vendor_2__r.Name : '');

        return ctx;
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
