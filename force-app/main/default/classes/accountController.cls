public without sharing class accountController {
    
    @AuraEnabled(cacheable=true)
    public static Account getData(string recId){
        system.debug(recId);
        return[select id, name, Email__c, phone, Agent_1_Logo__c, Logo_URL__c from account where id =: recId limit 1];
    }

    @AuraEnabled(cacheable=true)
    public static String getAccountFileUrl(Id accountId) {
        Account acc = [SELECT Id,  Logo_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
        string url = acc.Logo_URL__c;
        return url;
        //	return 'https://nhsolutions--training.sandbox.file.force.com/sfc/dist/version/renditionDownload?rendition=ORIGINAL_Jpeg&versionId=068KG000000MOI6&operationContext=DELIVERY&contentId=05TKG000000BjL6&page=0&d=/a/KG000000CfeD/gFQt0b_5Pn5HApk4ly5bkWYGUosqrPKwsnquBWuqbhI&oid=00D7a0000005DDN&dpt=null&viewId=';
    }


    @AuraEnabled(cacheable=true)
    public static Opportunity getOppData(string recsId, string acId){
        system.debug(recsId);
         system.debug(acId);
        Opportunity op = [select id,Agent_1__c, Agent_2__c, Agent_3__c, Applicant__c, Application_Reference_Number__c,
        Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c,
                          Applicant__r.Name, Applicant__r.Email, Property__r.Name, Name, Applicant__r.Phone,Agent_1_Valuation_Requested_Date_Time__c,
                          Agent_2_Valuation_Requested_Date_Time__c,Agent_3_Valuation_Requested_Date_Time__c
                          from Opportunity where Id =:recsId AND (Agent_1__c =:acId OR Agent_2__c  =:acId OR Agent_3__c  =:acId) limit 1];
       
        return op;
    }
    
       @AuraEnabled(cacheable=true)
    public static Boolean isHouseBuilderRecordType(Id accountId) {
        system.debug('accountId-'+ accountId);
        String houseBuilderRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('House Builder').getRecordTypeId();
        Account acc = [SELECT RecordTypeId FROM Account WHERE Id =:accountId LIMIT 1];
        boolean flag = (acc.RecordTypeId == houseBuilderRecordTypeId);
        system.debug('flag-'+ flag);
        return flag;
    }
 

    @AuraEnabled
    public static map <string, string> createForm(Valuation_Assessment__c jsonDatalist){
         system.debug('dataList : '+jsonDatalist);
        map<string, string> resMap = new map<string, string>();
         try{
      
        insert jsonDatalist;
             resMap.put('success', jsonDatalist.Id);
        return resMap;
         }catch (Exception e) {
            System.debug('Error in lightning picklist values : '+e.getMessage()+' at line no :'+e.getLineNumber());
            // return null;
            resMap.put('fail', e.getMessage());
             return resMap;
        }
    }
    
    
}