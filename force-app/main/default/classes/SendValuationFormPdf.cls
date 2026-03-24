public without sharing class SendValuationFormPdf {
  /*  
    @InvocableMethod(label='Valuation form pdf' description='Gets knowledge article results')
    public static void getOrderID(list<string>soIdList){
       List< Valuation_Assessment__c >val =  [select Id,Application__r.Agent_1_Valuation_Requested_Date_Time__c,Application__r.Agent_2_Valuation_Requested_Date_Time__c, 
                                        Application__r.Agent_3_Valuation_Requested_Date_Time__c, name,Application__r.Application_Reference_Number__c, Years_Left__c,
                                        Ground_Rent__c, Property_Type__c,  Type_of_Construction__c, Age_of_Property__c,  Number_of_Bedrooms__c, Reception_Living__c,
                                        List_of_Any_other_Additional_Rooms__c,  Agent_Email__c 
                                        from Valuation_Assessment__c
                                        where id in: soIdList limit 1];
        
        if(val.size()>0){
            
            string formReqDate ='';
            
            if(val[0].Application__r.Agent_1_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_1_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');
            }
            if(val[0].Application__r.Agent_2_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_2_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');        }
            if(val[0].Application__r.Agent_3_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_3_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');        
            }
            
            
            PageReference invoicePage;
            list<blob> bloblist = new list<blob>();
            list<Messaging.EmailFileAttachment> attachlist = new list<Messaging.EmailFileAttachment>();
            Messaging.SingleEmailMessage semail = new Messaging.SingleEmailMessage();
            Messaging.EmailFileAttachment attach = new Messaging.EmailFileAttachment();
            string mail;
            mail = val[0].Agent_Email__c;
            Blob pdfBlob;
            invoicePage = new PageReference('/apex/ValuatonFormPDF?id='+val[0].Id);
            if(Test.isRunningTest()){
                pdfBlob = blob.valueOf('Unit.Test');
            }else{
                pdfBlob = invoicePage.getContentAsPDF();
            }
            string name = 'Application Valuation Number'+'|'+val[0].Application__r.Application_Reference_Number__c+'|'+formReqDate;
            attach.setFileName(name+'.pdf');
            attach.setBody(pdfBlob);
            semail.setSubject('Valuation Reports details');
            
            semail.setPlainTextBody('Please find the attached Valuation Reports details');
            
            attachlist.add(attach);
            string sendEmailreturn =  SendValuationFormPdf.sendEmails(attachlist, semail, mail);
        }
    }
   */
    @AuraEnabled
    public static void getOrderIDs(string soIdList){
        system.debug('soIdList'+soIdList);
        Id valId = Id.valueOf(soIdList);
        system.debug('valId'+valId);
       List< Valuation_Assessment__c > val =  [select Id,Application__r.Agent_1_Valuation_Requested_Date_Time__c,Application__r.Agent_2_Valuation_Requested_Date_Time__c, 
                                        Application__r.Agent_3_Valuation_Requested_Date_Time__c, name,Application__r.Application_Reference_Number__c, Years_Left__c,
                                        Ground_Rent__c, Property_Type__c,  Type_of_Construction__c, Age_of_Property__c,  Number_of_Bedrooms__c, Reception_Living__c,
                                        List_of_Any_other_Additional_Rooms__c,  Agent_Email__c 
                                        from Valuation_Assessment__c
                                        where id =: valId limit 1];
        
        if(val.size()>0){
            
            string formReqDate ='';
            
            if(val[0].Application__r.Agent_1_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_1_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');
            }
            if(val[0].Application__r.Agent_2_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_2_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');        }
            if(val[0].Application__r.Agent_3_Valuation_Requested_Date_Time__c != null){
                string dts = string.ValueOf(val[0].Application__r.Agent_3_Valuation_Requested_Date_Time__c);
                DateTime dt = DateTime.valueOf(dts);
                formReqDate = dt.format('yyyyMMddhhmmss');        
            }
            
            
            PageReference invoicePage;
            list<blob> bloblist = new list<blob>();
            list<Messaging.EmailFileAttachment> attachlist = new list<Messaging.EmailFileAttachment>();
            Messaging.SingleEmailMessage semail = new Messaging.SingleEmailMessage();
            Messaging.EmailFileAttachment attach = new Messaging.EmailFileAttachment();
            string mail;
            mail = val[0].Agent_Email__c;
            Blob pdfBlob;
            invoicePage = new PageReference('/apex/ValuatonFormPDF?id='+val[0].Id);
            if(Test.isRunningTest()){
                pdfBlob = blob.valueOf('Unit.Test');
            }else{
                pdfBlob = invoicePage.getContentAsPDF();
            }
            string name = 'Application Valuation Number'+'|'+val[0].Application__r.Application_Reference_Number__c+'|'+formReqDate;
            attach.setFileName(name+'.pdf');
            attach.setBody(pdfBlob);
            semail.setSubject('Valuation Reports details');
            
            semail.setPlainTextBody('Please find the attached Valuation Reports details');
            
            attachlist.add(attach);
            string sendEmailreturn =  SendValuationFormPdf.sendEmails(attachlist, semail, mail);
        }  
    }
    
    public static string sendEmails(list<Messaging.EmailFileAttachment> attachlist, Messaging.SingleEmailMessage semail,string mail){
        system.debug(attachlist.size()+'-----------------------'+ semail);
        string res = '';
        try{
            
            
            OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address =: 'akash@crmmates.com'];
            if ( owea.size() > 0 ) {
                semail.setOrgWideEmailAddressId(owea.get(0).Id);
                String[]  sendTo  = new String[]{mail};
                    
                    semail.setToAddresses(sendTo);
                
                semail.setFileAttachments(attachlist);
                Messaging.sendEmail(new Messaging.SingleEmailMessage[]{semail});
            }
            res='Success';
        }catch(exception  e){
            res= e.getMessage();
            system.debug('Error Message '+e.getMessage() + ' Line Number ' +e.getLineNumber());
        }
        return res;
        
    }
}