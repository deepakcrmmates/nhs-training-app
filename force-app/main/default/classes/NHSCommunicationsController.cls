public with sharing class NHSCommunicationsController {

    private static final String ORG_WIDE_EMAIL = 'systemtest@newhomesolutions.co.uk';

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
        Map<String, String> result = new Map<String, String>();

        try {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

            // Set Org-Wide Email Address if available
            List<OrgWideEmailAddress> owea = [
                SELECT Id FROM OrgWideEmailAddress
                WHERE Address = :ORG_WIDE_EMAIL
                LIMIT 1
            ];
            if (!owea.isEmpty()) {
                email.setOrgWideEmailAddressId(owea[0].Id);
            }

            email.setToAddresses(new List<String>{ toAddress });
            if (String.isNotBlank(ccAddress)) {
                email.setCcAddresses(new List<String>{ ccAddress });
            }
            email.setSubject(subject);
            email.setHtmlBody(body);
            email.setWhatId(opportunityId);
            email.setSaveAsActivity(true);

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
