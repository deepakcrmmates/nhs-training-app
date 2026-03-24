public without Sharing class SendPDFonCreationHandler {
    @future(callout=true)
    public static void sendEmailsWithPDF(List<Id> recordIds) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (Valuation_Assessment__c val : [
            SELECT Id, Valuation_Requested_Date_Time__c, Agent_Email__c, 
            Application__r.Application_Reference_Number__c 
            FROM Valuation_Assessment__c 
            WHERE Id IN :recordIds
        ]) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            
            // Set recipient email (fallback if null)
            String recipientEmail = val.Agent_Email__c != null ? val.Agent_Email__c : 'akash@crmmates.com';
            email.setToAddresses(new List<String>{recipientEmail});
            email.setSubject('Valuation Assessment Report');
            email.setPlainTextBody('Please find attached the Valuation Report.');
            
            // Generate PDF attachment asynchronously
            PageReference pdfPage = Page.ValuatonFormPDF;
            pdfPage.getParameters().put('id', val.Id);
            Blob pdfBlob;
             if(Test.isRunningTest()){
                pdfBlob = blob.valueOf('Unit.Test');
             }Else{
             pdfBlob = pdfPage.getContent(); // Works in async context
             }
            // Format the date safely
           String formReqDate = '';
if (val.Valuation_Requested_Date_Time__c != null) {
    try {
        DateTime dt = DateTime.parse(val.Valuation_Requested_Date_Time__c);
        formReqDate = dt.format('yyyyMMddHHmmss'); // Corrected to use HH for 24-hour format
    } catch (Exception e) {
        System.debug('Error parsing date: ' + e.getMessage());
    }
}

            
            // Correct string concatenation for file name
            String name = 'Application Valuation Number';
            if (val.Application__r != null && val.Application__r.Application_Reference_Number__c != null) {
                name += '|' + val.Application__r.Application_Reference_Number__c;
            }
            if (!String.isEmpty(formReqDate)) {
                name += '|' + formReqDate;
            }
            name += '.pdf'; // Ensure filename has an extension
            
            // Create email attachment
            Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
            attachment.setFilename(name);
            attachment.setBody(pdfBlob);
            
            email.setFileAttachments(new List<Messaging.EmailFileAttachment>{attachment});
            emails.add(email);
        }
        
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}