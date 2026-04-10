public class customLookupController {
     @AuraEnabled
    public static sObject fetchDefaultRecord(string recordId , string sObjectApiName) {
        string sRecId = recordId;    
        string sQuery = 'Select Id,Name From ' + sObjectApiName + ' Where Id = : sRecId LIMIT 1';
        for (sObject obj: database.query(sQuery)) {
            return obj;
        }
        return null;
    }

    @AuraEnabled
     public static List<ResultWrapper> fetchRecords(SearchWrapper inputWrapper) {
         try {
             if(inputWrapper != null){
                 String fieldsToQuery = 'SELECT Id, ';
                 if(string.isNotBlank(inputWrapper.fieldApiName)){
                     fieldsToQuery = fieldsToQuery + inputWrapper.fieldApiName;
                 }
                 if(string.isNotBlank(inputWrapper.otherFieldApiName)){ fieldsToQuery = fieldsToQuery + ', ' + inputWrapper.otherFieldApiName;
                 }
                 String query = fieldsToQuery + ' FROM '+ inputWrapper.objectApiName;
                 String filterCriteria = inputWrapper.fieldApiName + ' LIKE ' + '\'' + String.escapeSingleQuotes(inputWrapper.searchString.trim()) + '%\' LIMIT 10';
                 if(String.isNotBlank(inputWrapper.selectedRecordId)) {query += ' WHERE Id = \''+ inputWrapper.selectedRecordId + '\'';
                 }else if(String.isNotBlank(inputWrapper.parentFieldApiName) && String.isNotBlank(inputWrapper.parentRecordId)){ query += ' WHERE '+ inputWrapper.parentFieldApiName+ ' = \''+ inputWrapper.parentRecordId + '\'';query += ' AND ' + filterCriteria;} 
                 else {
                     query += ' WHERE '+ filterCriteria;
                 }
                 List<ResultWrapper> returnWrapperList = new List<ResultWrapper>();
                 for(SObject s : Database.query(query)) {
                     ResultWrapper wrap = new ResultWrapper(); wrap.mainField = (String)s.get(inputWrapper.fieldApiName);wrap.subField = (String)s.get(inputWrapper.otherFieldApiName);
                     wrap.id = (String)s.get('id');returnWrapperList.add(wrap);
                 }
                 return returnWrapperList;
             }
             return null;
         } catch (Exception err) {
             throw new AuraHandledException(err.getMessage());
         }
     }
 
     @AuraEnabled
     public static Map<String, String> getAccountDetails(String accountId) {
         Map<String, String> result = new Map<String, String>();
         if (String.isNotBlank(accountId)) {
             List<Account> accounts = [SELECT Phone, Email__c FROM Account WHERE Id = :accountId LIMIT 1];
             if (!accounts.isEmpty()) {
                 result.put('phone', accounts[0].Phone);
                 result.put('email', accounts[0].Email__c);
             }
         }
         return result;
     }

     @AuraEnabled
     public static void saveDesktopValuation(Id oppId, Boolean agent1DV, Boolean agent2DV, Boolean agent3DV) {
         Opportunity opp = new Opportunity(Id = oppId);
         opp.Agent_1_Desktop_Valuation__c = agent1DV;
         opp.Agent_2_Desktop_Valuation__c = agent2DV;
         opp.Agent_3_Desktop_Valuation__c = agent3DV;
         update opp;
     }

     @AuraEnabled
     public static void updateVendorContact(Id contactId, String mobile, String phone, String email) {
         if (contactId == null) return;
         Contact c = new Contact(Id = contactId);
         c.MobilePhone = mobile;
         c.Phone = phone;
         c.Email = email;
         update c;
     }

     @AuraEnabled
     public static Map<String, String> createQuickAgent(String accountName, String email, String contactFirstName, String contactLastName, String mobile, String phone) {
         Map<String, String> result = new Map<String, String>();
         try {
             // Create Account with Estate Agents record type
             Id estateAgentRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Estate_Agents').getRecordTypeId();
             Account acc = new Account();
             acc.Name = accountName;
             acc.RecordTypeId = estateAgentRT;
             if (String.isNotBlank(email)) acc.Email__c = email;
             if (String.isNotBlank(phone)) acc.Phone = phone;
             insert acc;

             // Create Contact linked to the Account
             Contact con = new Contact();
             con.AccountId = acc.Id;
             con.FirstName = contactFirstName;
             con.LastName = contactLastName;
             if (String.isNotBlank(email)) con.Email = email;
             if (String.isNotBlank(mobile)) con.MobilePhone = mobile;
             if (String.isNotBlank(phone)) con.Phone = phone;
             insert con;

             result.put('status', 'success');
             result.put('accountId', acc.Id);
             result.put('accountName', acc.Name);
             result.put('contactId', con.Id);
         } catch (Exception e) {
             result.put('status', 'error');
             result.put('message', e.getMessage());
         }
         return result;
     }

     public class ResultWrapper{
         @AuraEnabled public String mainField{get;set;}
         @AuraEnabled public String subField{get;set;}
         @AuraEnabled public String id{get;set;}
     }
 
     public class SearchWrapper {
         @AuraEnabled public String objectApiName{get;set;}
         @AuraEnabled public String fieldApiName{get;set;}
         @AuraEnabled public String otherFieldApiName{get;set;}
         @AuraEnabled public String searchString{get;set;}
         @AuraEnabled public String selectedRecordId{get;set;}
         @AuraEnabled public String parentRecordId{get;set;}
         @AuraEnabled public String parentFieldApiName{get;set;}
     }
 }