/**
* @File Name : houseBuilderApplication.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : February 7, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | February 7, 2025 |   | Initial Version
**/

public without sharing class houseBuilderApplication {
    @AuraEnabled(cacheable=true)
    public static account getAccountFileUrl(Id accountId) {
        Account acc = [SELECT Id,  Logo_URL__c, House_Builder_Application_Pdf_URL__c, Agent_Valuation_Pdf_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
        return acc;
        //	return 'https://nhsolutions--training.sandbox.file.force.com/sfc/dist/version/renditionDownload?rendition=ORIGINAL_Jpeg&versionId=068KG000000MOI6&operationContext=DELIVERY&contentId=05TKG000000BjL6&page=0&d=/a/KG000000CfeD/gFQt0b_5Pn5HApk4ly5bkWYGUosqrPKwsnquBWuqbhI&oid=00D7a0000005DDN&dpt=null&viewId=';
    }
    @AuraEnabled
    public static Map<String, String> saveData(Map<String, Object> formData, String recordType) {
        System.debug('Received Data: ' + JSON.serialize(formData));
        Map<String, String> returnMap = new Map<String, String>();
        Savepoint sp;
        try {
            sp = Database.setSavepoint();
            System.debug('Record Type: ' + recordType);
            String recType = 'Part Exchange - Applications';
            
            if (String.valueOf(recordType) == 'New Home') {
                recType = 'New Home Sales';
            } else if (String.valueOf(recordType) == 'Part Exchange') {
                recType = 'Part Exchange - Applications';
            } else if (String.valueOf(recordType) == 'Assisted Sale') {
                recType = 'Assisted Sales';
            }
            
            Id partExchange = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Part Exchange - Applications').getRecordTypeId();
            Id agentRectype = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Estate Agents').getRecordTypeId();
            
            New_Home_Solution__mdt config = New_Home_Solution__mdt.getInstance('NHS');
            List<Account> accounts = [SELECT Id FROM Account WHERE Name = :config.Name__c AND Phone = :config.Phone__c LIMIT 1];
            Account ac = accounts.isEmpty() ? null : accounts[0];
            
            if (ac == null) {
                System.debug('No NHS Account found.');
                returnMap.put('n', 'No NHS Account found.');
                return returnMap;
            }
            
            System.debug('NHS Account ID: ' + ac.Id);
            
            NHS_Property__c prop = new NHS_Property__c();
            Contact vendor1 = new Contact();
            Contact vendor2 = new Contact();
            
            // Deserialize Property Data
            Object propertyObj = formData.get('Property');
            if (propertyObj instanceof String) {
                propertyObj = JSON.deserializeUntyped((String) propertyObj);
            }
            System.debug('propertyObj');
            if (propertyObj instanceof Map<object, object>) {
                Map<object, Object> propertyData = (Map<object, Object>) propertyObj;
                System.debug('Final Property Map: ' + propertyData);
                
                if (!propertyData.containsKey('street') || !propertyData.containsKey('city') || !propertyData.containsKey('pcode')) {
                    System.debug('Property Data is missing required fields.');
                    returnMap.put('n', 'Missing required fields in Property data.');
                    return returnMap;
                }
                
                prop.Address__Street__s = (String) propertyData.get('street');
                prop.Address__City__s = (String) propertyData.get('city');
                prop.Address__PostalCode__s = (String) propertyData.get('pcode');
                prop.Name = prop.Address__Street__s + ' ' + prop.Address__City__s + ' ' + prop.Address__PostalCode__s;
                
                if (propertyData.containsKey('Detached')) {
                    prop.Detached__c = boolean.valueOf(propertyData.get('Detached'));
                }
                if (propertyData.containsKey('SemiDetached')) {
                    prop.Semi_Detached__c = boolean.valueOf(propertyData.get('SemiDetached'));
                }
                if (propertyData.containsKey('EndTerrace') ) {
                    prop.End_Terrace__c = boolean.valueOf(propertyData.get('EndTerrace'));
                }
                if (propertyData.containsKey('MidTerrace') ) {
                    prop.Mid_Terrace__c = boolean.valueOf(propertyData.get('MidTerrace'));
                }
                if (propertyData.containsKey('Apartment') ) {
                    prop.Apartment__c = boolean.valueOf(propertyData.get('Apartment'));
                }
                if (propertyData.containsKey('Maisonette') ) {
                    prop.Maisonette__c = boolean.valueOf(propertyData.get('Maisonette'));
                }
                if (propertyData.containsKey('Studio') ) {
                    prop.Maisonette_Studio__c = boolean.valueOf(propertyData.get('Studio'));
                }
                if (propertyData.containsKey('Bungalow')) {
                    prop.Bungalow__c = boolean.valueOf(propertyData.get('Bungalow'));
                }
                
                if (propertyData.containsKey('NumberofBedrooms') && propertyData.get('NumberofBedrooms') != null) {
                    String groundRentStr = String.valueOf(propertyData.get('NumberofBedrooms')).trim();
                    if (!String.isEmpty(groundRentStr)) {
                        prop.Number_Of_Bedrooms__c = Decimal.valueOf(groundRentStr);
                    }
                }
                if (propertyData.containsKey('FrontGarden') ) {
                    prop.Front_Garden__c = boolean.valueOf(propertyData.get('FrontGarden'));
                }
                if (propertyData.containsKey('BackGarden') ) {
                    prop.Back_Garden__c = boolean.valueOf(propertyData.get('BackGarden'));
                }
                if (propertyData.containsKey('NoGarden')) {
                    prop.No_Garden__c = boolean.valueOf(propertyData.get('NoGarden'));
                }
                if (propertyData.containsKey('Parking') ) {
                    prop.Parking__c = boolean.valueOf(propertyData.get('Parking'));
                }
                if (propertyData.containsKey('Garage')) {
                    prop.Garage__c = boolean.valueOf(propertyData.get('Garage'));
                }
                if (propertyData.containsKey('Extension')) {
                    prop.Extension__c = boolean.valueOf(propertyData.get('Extension'));
                }
                if (propertyData.containsKey('AnyExtensionssolarpanels')) {
                    prop.AnyExtensions_LoftConverstion_SolarPanel__c = boolean.valueOf(propertyData.get('AnyExtensionssolarpanels'));
                }
                if (propertyData.containsKey('Conservatory')) {
                    prop.Conservatory__c = boolean.valueOf(propertyData.get('Conservatory'));
                }
                if (propertyData.containsKey('AgeofProperty') && String.isNotBlank(String.valueOf(propertyData.get('AgeofProperty')))) {
                    prop.Age_of_Property__c = String.valueOf(propertyData.get('AgeofProperty'));
                }
                if (propertyData.containsKey('Freehold') ) {
                    prop.Freehold__c = boolean.valueOf(propertyData.get('Freehold'));
                }
                if (propertyData.containsKey('LeaseHold')) {
                    prop.Lease_Hold__c = boolean.valueOf(propertyData.get('LeaseHold'));
                }
                if (propertyData.containsKey('YearsleftofLease') && String.isNotBlank(String.valueOf(propertyData.get('YearsleftofLease')))) {
                    prop.Years_left_of_Lease__c = String.valueOf(propertyData.get('YearsleftofLease'));
                }
                
                if (propertyData.containsKey('ServiceChargePCM') && propertyData.get('ServiceChargePCM') != null) {
                    String groundRentStr = String.valueOf(propertyData.get('ServiceChargePCM')).trim();
                    if (!String.isEmpty(groundRentStr)) {
                        prop.Service_Charge__c = Decimal.valueOf(groundRentStr);
                    }
                }
                
                if (propertyData.containsKey('GroundRentPA') && propertyData.get('GroundRentPA') != null) {
                    String groundRentStr = String.valueOf(propertyData.get('GroundRentPA')).trim();
                    if (!String.isEmpty(groundRentStr)) {
                        prop.Ground_Rent__c = Decimal.valueOf(groundRentStr);
                    }
                }
                
                if (propertyData.containsKey('PrincipleResidence') ) {
                    prop.Principle_Residence__c = boolean.valueOf(propertyData.get('PrincipleResidence'));
                }
                if (propertyData.containsKey('SecondHomeHolidayLet')) {
                    prop.Second_Home_Holiday_Let__c = boolean.valueOf(propertyData.get('SecondHomeHolidayLet'));
                }
                if (propertyData.containsKey('TypeofHeating') && String.isNotBlank(String.valueOf(propertyData.get('TypeofHeating')))) {
                    prop.Type_of_Heating__c = String.valueOf(propertyData.get('TypeofHeating'));
                }
                if (propertyData.containsKey('BuildingRegsPlanningPermission') ) {
                    prop.Building_Regs_Planning_Permission__c = boolean.valueOf(propertyData.get('BuildingRegsPlanningPermission'));
                }
                
                insert prop;
                System.debug('Inserted Property ID: ' + prop.Id);
                returnMap.put('propname', prop.Name);
            } else {
                System.debug('Property data is missing or invalid.');
                returnMap.put('n', 'Missing or invalid Property data.');
                return returnMap;
            }
            
            
            // Deserialize Vendor Data
            Object vendorObj = formData.get('Vendor');
            if (vendorObj instanceof String) {
                vendorObj = JSON.deserializeUntyped((String) vendorObj);
            }
            
            if (vendorObj instanceof Map<object, Object>) {
                Map<object, Object> vendorData = (Map<object, Object>) vendorObj;
                vendor1.FirstName = (String) vendorData.get('firstname');
                vendor1.LastName = (String) vendorData.get('lastname');
                vendor1.Email = (String) vendorData.get('email');
                vendor1.MobilePhone = (String) vendorData.get('mobilePhone');
                
                insert vendor1;
                 returnMap.put('vaendor1name', vendor1.FirstName +' '+  vendor1.LastName);
                System.debug('InsertedVendor1 ID: ' + vendor1.Id);
                
                if (vendorData.get('lastname1') != null && String.valueOf(vendorData.get('lastname1')) != '') {
                    vendor2.FirstName = (String) vendorData.get('firstname1');
                    vendor2.LastName = (String) vendorData.get('lastname1');
                    vendor2.Email = (String) vendorData.get('email1');
                    vendor2.MobilePhone = (String) vendorData.get('mobilePhone1');
                    
                    insert vendor2;
                    returnMap.put('vaendor2name', vendor2.FirstName +' '+  vendor2.LastName);
                    System.debug('Inserted Vendor2 ID: ' + vendor2.Id);
                }
            } else {
                System.debug('Vendor data is missing or invalid.');
                returnMap.put('n', 'Missing or invalid Vendor data.');
                return returnMap;
            }
            
            Account agent;
            Account agent3;
            // Deserialize Agent Data
            Object agentObj = formData.get('Agent');
            if (agentObj instanceof String) {
                agentObj = JSON.deserializeUntyped((String) agentObj);
            }
            if (agentObj instanceof Map<object, Object>) {
                Map<object, Object> agentData = (Map<object, Object>) agentObj;
                
                agent = new Account ();
                agent3 = new Account();
                if (agentData.containsKey('agentName') && String.isNotBlank(String.valueOf(agentData.get('agentName')))) {
                    agent.Name = string.valueOf(agentData.get('agentName'));
                }
                
                if (agentData.containsKey('agentPhone') && String.isNotBlank(String.valueOf(agentData.get('agentPhone')))) {
                    agent.phone   = string.valueOf(agentData.get('agentPhone'));
                }
                
                if (agentData.containsKey('agentEmail') && String.isNotBlank(String.valueOf(agentData.get('agentEmail')))) {
                    agent.Email__c  = string.valueOf(agentData.get('agentEmail'));
                }
                if (agentData.containsKey('street') && String.isNotBlank(String.valueOf(agentData.get('street')))) {
                    agent.billingstreet  = string.valueOf(agentData.get('street'));
                }
                if (agentData.containsKey('city') && String.isNotBlank(String.valueOf(agentData.get('city')))) {
                    agent.billingcity =  string.valueOf(agentData.get('city'));
                }
                if (agentData.containsKey('country') && String.isNotBlank(String.valueOf(agentData.get('country')))) {
                    agent.billingCountry  = string.valueOf(agentData.get('country'));
                }
                if (agentData.containsKey('province') && String.isNotBlank(String.valueOf(agentData.get('province')))) {
                    agent.billingState =  string.valueOf(agentData.get('province'));
                }

                if (agentData.containsKey('agent3Name') && String.isNotBlank(String.valueOf(agentData.get('agent3Name')))) {
                    agent3.Name = string.valueOf(agentData.get('agent3Name'));
                }
                
                if (agentData.containsKey('agent3Phone') && String.isNotBlank(String.valueOf(agentData.get('agent3Phone')))) {
                    agent3.phone   = string.valueOf(agentData.get('agent3Phone'));
                }
                
                if (agentData.containsKey('agent3Email') && String.isNotBlank(String.valueOf(agentData.get('agent3Email')))) {
                    agent3.Email__c  = string.valueOf(agentData.get('agent3Email'));
                }
                
                agent.RecordTypeId = agentRectype;
                agent3.RecordTypeId = agentRectype;

                if(  agent.Name != null){
                    insert  agent;
                    returnMap.put('agentname', agent.Name);
                }
                if(  agent3.Name != null){
                    insert  agent3;
                    returnMap.put('agent3name', agent3.Name);
                }
                
                
            }
            
            // Deserialize Application Data
            Object applicationObj = formData.get('Application');
            if (applicationObj instanceof String) {
                applicationObj = JSON.deserializeUntyped((String) applicationObj);
            }
            
            if (applicationObj instanceof Map<object, Object>) {
                Map<object, Object> applicationData = (Map<object, Object>) applicationObj;
                
                Opportunity opp = new Opportunity();
                opp.Name = prop.Name;
                opp.Application_Name__c = opp.Name;
                opp.Property__c = prop.Id;
                if(agent != null && agent.Id != null){
                     opp.Agent_2__c = agent.Id;
                }

                if(agent3 != null && agent3.Id != null){
                     opp.Agent_3__c = agent3.Id;
                }
               
                
                if (applicationData.containsKey('expectation') && String.isNotBlank(String.valueOf(applicationData.get('expectation')))) {
                    opp.Client_Expectations__c = Integer.valueOf(applicationData.get('expectation'));
                }
                
                if (applicationData.containsKey('scheme') && String.isNotBlank(String.valueOf(applicationData.get('scheme')))) {
                    opp.Scheme__c = String.valueOf(applicationData.get('scheme'));
                }else{
                    opp.Scheme__c = 'Part Exchange';
                }
                
                if (applicationData.containsKey('startDate') && String.isNotBlank(String.valueOf(applicationData.get('startDate')))) {
                    opp.ETA_Comp_Start__c = String.valueOf(applicationData.get('startDate'));
                }
                
                if (applicationData.containsKey('endDate') && String.isNotBlank(String.valueOf(applicationData.get('endDate')))) {
                    opp.ETA_Comp_End__c = String.valueOf(applicationData.get('endDate'));
                }
                
                if (applicationData.containsKey('notes') && String.isNotBlank(String.valueOf(applicationData.get('notes')))) {
                    opp.Notes__c = String.valueOf(applicationData.get('notes'));
                }
                
                opp.Vendor_1__c = vendor1 != null ? vendor1.Id : null;
                opp.Vendor_2__c = vendor2 != null ? vendor2.Id : null;
                opp.Agent_1__c = ac != null ? ac.Id : null;
                
                if (applicationData.containsKey('housebuilderId') && String.isNotBlank(String.valueOf(applicationData.get('housebuilderId')))) {
                    opp.House_Builder__c = String.valueOf(applicationData.get('housebuilderId'));
                }
                
                if (applicationData.containsKey('development') && String.isNotBlank(String.valueOf(applicationData.get('development')))) {
                    opp.Development__c = String.valueOf(applicationData.get('development'));
                }
                
                if (applicationData.containsKey('plot') && String.isNotBlank(String.valueOf(applicationData.get('plot')))) {
                    opp.Plot__c = String.valueOf(applicationData.get('plot'));
                }
                
                if (applicationData.containsKey('dateOfApplicationReceived') && String.isNotBlank(String.valueOf(applicationData.get('dateOfApplicationReceived')))) {
                    opp.Date_of_Application_Received__c = Date.valueOf(String.valueOf(applicationData.get('dateOfApplicationReceived')));
                }
                
                opp.RecordTypeId = partExchange;
                
                if (applicationData.containsKey('salesAdvisor') && String.isNotBlank(String.valueOf(applicationData.get('salesAdvisor')))) {
                    opp.Sales_Advisor__c = String.valueOf(applicationData.get('salesAdvisor'));
                }
                
                opp.CloseDate = System.today();
                opp.StageName = 'To be contacted';
                opp.AccountId = vendor1 != null ? vendor1.AccountId : null;
                opp.NHS_Process__c = 'Application';
                
                if (applicationData.containsKey('Region') && String.isNotBlank(String.valueOf(applicationData.get('Region')))) {
                    opp.Region__c = String.valueOf(applicationData.get('Region'));
                }
                
                if (applicationData.containsKey('PurchasePrice') && String.isNotBlank(String.valueOf(applicationData.get('PurchasePrice')))) {
                    opp.Purchase_Price__c = Decimal.valueOf(String.valueOf(applicationData.get('PurchasePrice')));
                }
                
                // if (applicationData.containsKey('AnticipatedCompletionDate') && String.isNotBlank(String.valueOf(applicationData.get('AnticipatedCompletionDate')))) {
                //     opp.Anticipated_Completion_Date__c = Date.valueOf(String.valueOf(applicationData.get('AnticipatedCompletionDate')));
                // }
                 if (applicationData.containsKey('marketstatusYes') && String.isNotBlank(String.valueOf(applicationData.get('marketstatusYes')))) {
                    opp.Is_your_house_on_the_market_NEW__c = string.valueOf(applicationData.get('marketstatusYes'));
                 }
                  if (applicationData.containsKey('Timeonthemarket') && String.isNotBlank(String.valueOf(applicationData.get('Timeonthemarket')))) {
                    opp.Time_on_the_market__c = string.valueOf(applicationData.get('Timeonthemarket'));
                 }
                  if (applicationData.containsKey('Has_your_house_been_valued_by_an_agent') && String.isNotBlank(String.valueOf(applicationData.get('Has_your_house_been_valued_by_an_agent')))) {
                    opp.Has_your_house_been_valued_by_an_agent__c = string.valueOf(applicationData.get('Has_your_house_been_valued_by_an_agent'));
                 }
               // opp.Has_your_house_been_valued_by_an_agent__c = boolean.valueOf(applicationData.get('Has_your_house_been_valued_by_an_agent')); 
                opp.Terms_and_Condition__c = boolean.valueOf(applicationData.get('terms')); 
                opp.Mon_AM__c = Boolean.valueOf(applicationData.get('monAM')); 
                opp.Mon_PM__c = Boolean.valueOf(applicationData.get('monPM')); 

                opp.Tue_AM__c = Boolean.valueOf(applicationData.get('tueAM')); 
                opp.Tue_PM__c = Boolean.valueOf(applicationData.get('tuePM')); 

                opp.Wed_AM__c = Boolean.valueOf(applicationData.get('wedAM')); 
                opp.Wed_PM__c = Boolean.valueOf(applicationData.get('wedPM')); 

                opp.Thu_AM__c = Boolean.valueOf(applicationData.get('thuAM')); 
                opp.Thu_PM__c = Boolean.valueOf(applicationData.get('thuPM')); 

                opp.Fri_AM__c = Boolean.valueOf(applicationData.get('friAM')); 
                opp.Fri_PM__c = Boolean.valueOf(applicationData.get('friPM')); 

                opp.Sat_AM__c = Boolean.valueOf(applicationData.get('satAM')); 
                opp.Sat_PM__c = Boolean.valueOf(applicationData.get('satPM')); 
                
                opp.Sun_AM__c = Boolean.valueOf(applicationData.get('sunAM')); 
                opp.Sun_PM__c = Boolean.valueOf(applicationData.get('sunPM')); 

                if (applicationData.containsKey('ClientsEstimatedValuation') && String.isNotBlank(String.valueOf(applicationData.get('ClientsEstimatedValuation')))) {
                    opp.Client_Estimated_Valuation__c = Decimal.valueOf(String.valueOf(applicationData.get('ClientsEstimatedValuation')));
                }
                
                if (applicationData.containsKey('OutstandingMortgage') && String.isNotBlank(String.valueOf(applicationData.get('OutstandingMortgage')))) {
                    opp.Outstanding_Mortgage__c = Decimal.valueOf(String.valueOf(applicationData.get('OutstandingMortgage')));
                }
                
                if (applicationData.containsKey('OutstandingMortgageQualified') && String.isNotBlank(String.valueOf(applicationData.get('OutstandingMortgageQualified')))) {
                    opp.Qualified_By_House_Builders_FA__c = String.valueOf(applicationData.get('OutstandingMortgageQualified'));
                }
                
                if (applicationData.containsKey('dateOfApplicationReceived') && String.isNotBlank(String.valueOf(applicationData.get('dateOfApplicationReceived')))) {
                    opp.Date_of_Enquiry__c = Date.valueOf(String.valueOf(applicationData.get('dateOfApplicationReceived')));
                }
                if (applicationData.containsKey('Previousaskingprice') && String.isNotBlank(String.valueOf(applicationData.get('Previousaskingprice')))) {
                    opp.Agent_1_Initial_Asking_Price__c =  decimal.valueOf(String.valueOf(applicationData.get('Previousaskingprice')));
                }
                if (applicationData.containsKey('CurrentAskingPrice') && String.isNotBlank(String.valueOf(applicationData.get('CurrentAskingPrice')))) {
                    opp.Current_Asking_Price__c =  decimal.valueOf(String.valueOf(applicationData.get('CurrentAskingPrice')));
                }
                if (applicationData.containsKey('NumberofViewings') && String.isNotBlank(String.valueOf(applicationData.get('NumberofViewings')))) {
                    opp.Number_Of_Viewings__c =  Integer.valueOf(String.valueOf(applicationData.get('NumberofViewings')));
                }
                if (applicationData.containsKey('Anypreviousoffers') && String.isNotBlank(String.valueOf(applicationData.get('Anypreviousoffers')))) {
                    opp.Any_previous_offers__c =  decimal.valueOf(String.valueOf(applicationData.get('Anypreviousoffers')));
                }
                
                insert opp;
                 returnMap.put('oppname', opp.Name);
                System.debug('Inserted Opportunity ID: ' + opp.Id);
                
                vendor1.AccountId = opp.House_Builder__c;
                update vendor1;
                
                returnMap.put('y', opp.Id);
            } else {
                System.debug('Application data is missing or invalid.');
                returnMap.put('n', 'Missing or invalid Application data.');
                return returnMap;
            }
        } catch (Exception e) {
            System.debug('ERROR: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            Database.rollback(sp);
            returnMap.put('n', 'Exception: ' + e.getMessage() + ' at line ' + e.getLineNumber());
        }
        
        System.debug('Final return data: ' + returnMap);
        return returnMap;
    }
    
}