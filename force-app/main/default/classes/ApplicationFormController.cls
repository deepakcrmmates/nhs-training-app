public class ApplicationFormController {

    @AuraEnabled
    public static Map<String, String> saveApplication(Map<String, Object> jsonData, String recordtype) {
        System.debug('jsonData' + ' ----' + JSON.serialize(jsonData));
        Map<String, String> returnMap = new Map<String, String>();
        List<String> ConIdlist = new List<String>();
        String recType = 'Part Exchange - Applications';
        String ids = '';

        Savepoint sp;
        
        try {
            // Set savepoint to rollback changes if needed
            sp = Database.setSavepoint();
            
            New_Home_Solution__mdt config = New_Home_Solution__mdt.getInstance('NHS');
            Account ac = [SELECT Id FROM Account WHERE Name = :config.Name__c AND Phone = :config.Phone__c LIMIT 1];
            
            NHS_Property__c prop = new NHS_Property__c();
            Contact vendor1 = new Contact();
            Contact vendor2 = new Contact();
            
            // Determine record type
            if (String.valueOf(recordtype) == 'New Home') {
                recType = 'New Home Sales';
            } else if (String.valueOf(recordtype) == 'Part Exchange') {
                recType = 'Part Exchange - Applications';
            } else if (String.valueOf(recordtype) == 'Assisted Sale') {
                recType = 'Assisted Sales';
            }
            
            Id partExchange = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get(recType).getRecordTypeId();
            Id houseBuilder = Schema.SObjectType.Account.getRecordTypeInfosByName().get('House Builder').getRecordTypeId();
            
            // Insert vendor1
            vendor1.FirstName = String.valueOf(jsonData.get('firstname'));
            vendor1.LastName = String.valueOf(jsonData.get('lastname'));
            vendor1.Email = String.valueOf(jsonData.get('email'));
            vendor1.MobilePhone = String.valueOf(jsonData.get('mobilePhone'));
            insert vendor1;
            
            if (vendor1 != null) {
                Account houseBuilderAccount = new Account();
                houseBuilderAccount.Name = vendor1.LastName + ' Household';
                houseBuilderAccount.Phone = vendor1.MobilePhone;
                houseBuilderAccount.Email__c = vendor1.Email;
                houseBuilderAccount.RecordTypeId = houseBuilder;
                insert houseBuilderAccount;
                
                if (houseBuilderAccount != null) {
                    vendor1.AccountId = houseBuilderAccount.Id;
                    update vendor1;
                }
            }

            if (String.valueOf(jsonData.get('lastname1')) != null && String.valueOf(jsonData.get('lastname1')) != '') {
                vendor2.FirstName = String.valueOf(jsonData.get('firstname1'));
                vendor2.LastName = String.valueOf(jsonData.get('lastname1'));
                vendor2.Email = String.valueOf(jsonData.get('email1'));
                vendor2.MobilePhone = String.valueOf(jsonData.get('mobilePhone1'));
                
                if (vendor2.LastName != null) {
                    insert vendor2;
                    ConIdlist.add(vendor2.Id);
                }
            }
            
            ConIdlist.add(vendor1.Id);
            
            // Populate and insert property record
            prop.Address__Street__s = String.valueOf(jsonData.get('street'));
            prop.Address__City__s = String.valueOf(jsonData.get('city'));
            prop.Address__PostalCode__s = String.valueOf(jsonData.get('pcode'));
            prop.Name = prop.Address__Street__s + ' ' + prop.Address__City__s + ' ' + prop.Address__PostalCode__s;
            
            insert prop;
            ids = prop.Id;

            // Populate opportunity
            Opportunity opp = new Opportunity();
            if (prop.Name != '') {
                opp.Name = prop.Name;
                opp.Application_Name__c = opp.Name;
                opp.Property__c = ids;
            }
            
            if (String.valueOf(jsonData.get('expectation')) != '') {
                opp.Client_Expectations__c = Integer.valueOf(jsonData.get('expectation'));
            }
            if (String.valueOf(jsonData.get('type')) != '') {
                opp.Type_of_House__c = String.valueOf(jsonData.get('type'));
            }
            if (String.valueOf(jsonData.get('scheme')) != '') {
                opp.Scheme__c = String.valueOf(jsonData.get('scheme'));
            }
            if (String.valueOf(jsonData.get('startDate')) != '') {
                opp.ETA_Comp_Start__c = String.valueOf(jsonData.get('startDate'));
            }
            if (String.valueOf(jsonData.get('endDate')) != '') {
                opp.ETA_Comp_End__c = String.valueOf(jsonData.get('endDate'));
            }
            if (String.valueOf(jsonData.get('notes')) != '') {
                opp.Notes__c = String.valueOf(jsonData.get('notes'));
            }
            opp.Vendor_1__c = vendor1.Id;
            opp.Vendor_2__c = vendor2.Id != null ? vendor2.Id : null;
            if (ac != null) {
                opp.Agent_1__c = ac.Id;
            }
            if (String.valueOf(jsonData.get('houseBuilder')) != '') {
                opp.House_Builder__c = String.valueOf(jsonData.get('houseBuilder'));
            }
            if (String.valueOf(jsonData.get('development')) != '') {
                opp.Development__c = String.valueOf(jsonData.get('development'));
            }
            if (String.valueOf(jsonData.get('plot')) != '') {
                opp.Plot__c = String.valueOf(jsonData.get('plot'));
            }
            if (String.valueOf(jsonData.get('applicationRecDate')) != '') {
                opp.Date_of_Application_Received__c = Date.valueOf(String.valueOf(jsonData.get('applicationRecDate')));
            }
            opp.RecordTypeId = partExchange;
              if(string.valueOf(jsonData.get('salesAdvisor')) !=''){
                opp.NHS_Sales_Advisor__c = string.valueOf(jsonData.get('salesAdvisor'));
            }
            opp.CloseDate = System.today();
            opp.StageName = 'To be contacted';
            opp.AccountId = vendor1.AccountId;
            opp.NHS_Process__c = 'Application';

            insert opp;

            if (opp.Id != null) {
                returnMap.put('y', opp.Id);
            }

            return returnMap;

        } catch (Exception e) {
            Database.rollback(sp);
            returnMap.put('n', 'Error');
            System.debug('ERROR=====' + e.getMessage() + '  ' + e.getLineNumber());
            return returnMap;
        }
    }
}