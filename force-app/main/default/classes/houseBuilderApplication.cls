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

    // Normalise a string coming from an LWC that is meant to represent a Salesforce Id.
    // Returns null for blanks, single spaces, and other non-Id-shaped values so we don't get
    // "Invalid id:" exceptions when the form hasn't selected a value for a lookup field.
    private static Id cleanId(String s) {
        if (String.isBlank(s)) return null;
        String trimmed = s.trim();
        if (trimmed.length() != 15 && trimmed.length() != 18) return null;
        try { return Id.valueOf(trimmed); } catch (Exception e) { return null; }
    }
    @AuraEnabled(cacheable=true)
    public static Account getAccountFileUrl(Id accountId) {
        if (accountId == null) return null;
        List<Account> accs = [SELECT Id, Logo_URL__c, House_Builder_Application_Pdf_URL__c, Agent_Valuation_Pdf_URL__c FROM Account WHERE Id = :accountId LIMIT 1];
        return accs.isEmpty() ? null : accs[0];
    }

    @AuraEnabled
    public static Map<String, String> saveData(Map<String, Object> formData, String recordType) {
        System.debug('Received Data: ' + JSON.serialize(formData));
        Map<String, String> returnMap = new Map<String, String>();
        Savepoint sp;
        try {
            sp = Database.setSavepoint();
            
            // 1. Create Vendors
            Map<String, String> vendorResults = createVendors((Map<String, Object>)formData.get('Vendor'));
            if (vendorResults.containsKey('n')) return vendorResults;
            returnMap.putAll(vendorResults);
            
            // 2. Create Property
            Map<String, String> propertyResults = createProperty((Map<String, Object>)formData.get('Property'));
            if (propertyResults.containsKey('n')) return propertyResults;
            returnMap.putAll(propertyResults);
            
            // 3. Create Agents
            Map<String, String> agentResults = createAgents((Map<String, Object>)formData.get('Agent'));
            if (agentResults.containsKey('n')) return agentResults;
            returnMap.putAll(agentResults);
            
            // 4. Create Application (Opportunity)
            Map<String, String> appResults = createApplication(
                (Map<String, Object>)formData.get('Application'), 
                recordType, 
                vendorResults.get('vendor1Id'), 
                vendorResults.get('vendor2Id'), 
                propertyResults.get('propertyId'), 
                agentResults.get('agentId'),
                agentResults.get('agent3Id')
            );
            if (appResults.containsKey('n')) return appResults;
            returnMap.putAll(appResults);
            
            return returnMap;
        } catch (Exception e) {
            Database.rollback(sp);
            returnMap.put('n', 'Exception: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            return returnMap;
        }
    }

    @AuraEnabled
    public static Map<String, String> createVendors(Map<String, Object> vendorData) {
        Map<String, String> res = new Map<String, String>();
        try {
            Id vendorRT = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Vendors').getRecordTypeId();
            Id householdRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Household').getRecordTypeId();

            // Create Household Account from Vendor 1's surname — vendors live under their own household, not the Housebuilder
            String v1LastName = (String) vendorData.get('lastname');
            String householdName = (String.isNotBlank(v1LastName) ? v1LastName : 'Vendor') + ' Household';
            Account household = new Account(
                Name = householdName,
                RecordTypeId = householdRT
            );
            insert household;
            res.put('householdId', household.Id);
            res.put('householdName', household.Name);

            Contact v1 = new Contact(
                FirstName = (String)vendorData.get('firstname'),
                LastName = v1LastName,
                Email = (String)vendorData.get('email'),
                MobilePhone = (String)vendorData.get('mobilePhone'),
                RecordTypeId = vendorRT,
                AccountId = household.Id
            );
            insert v1;
            res.put('vendor1Id', v1.Id);
            res.put('vaendor1name', v1.FirstName + ' ' + v1.LastName);

            if (vendorData.get('lastname1') != null && String.isNotBlank((String)vendorData.get('lastname1'))) {
                Contact v2 = new Contact(
                    FirstName = (String)vendorData.get('firstname1'),
                    LastName = (String)vendorData.get('lastname1'),
                    Email = (String)vendorData.get('email1'),
                    MobilePhone = (String)vendorData.get('mobilePhone1'),
                    RecordTypeId = vendorRT,
                    AccountId = household.Id
                );
                insert v2;
                res.put('vendor2Id', v2.Id);
                res.put('vaendor2name', v2.FirstName + ' ' + v2.LastName);
            }
            return res;
        } catch (Exception e) {
            res.put('n', 'Error creating vendors: ' + e.getMessage());
            return res;
        }
    }

    @AuraEnabled
    public static Map<String, String> createProperty(Map<String, Object> propertyData) {
        Map<String, String> res = new Map<String, String>();
        try {
            NHS_Property__c prop = new NHS_Property__c();
            prop.Address__Street__s = (String)propertyData.get('street');
            prop.Address__City__s = (String)propertyData.get('city');
            prop.Address__PostalCode__s = (String)propertyData.get('pcode');
            prop.Name = prop.Address__Street__s + ' ' + prop.Address__City__s + ' ' + prop.Address__PostalCode__s;
            
            if (propertyData.containsKey('Detached')) prop.Detached__c = Boolean.valueOf(propertyData.get('Detached'));
            if (propertyData.containsKey('SemiDetached')) prop.Semi_Detached__c = Boolean.valueOf(propertyData.get('SemiDetached'));
            if (propertyData.containsKey('EndTerrace')) prop.End_Terrace__c = Boolean.valueOf(propertyData.get('EndTerrace'));
            if (propertyData.containsKey('MidTerrace')) prop.Mid_Terrace__c = Boolean.valueOf(propertyData.get('MidTerrace'));
            if (propertyData.containsKey('Apartment')) prop.Apartment__c = Boolean.valueOf(propertyData.get('Apartment'));
            if (propertyData.containsKey('Maisonette')) prop.Maisonette__c = Boolean.valueOf(propertyData.get('Maisonette'));
            if (propertyData.containsKey('Studio')) prop.Maisonette_Studio__c = Boolean.valueOf(propertyData.get('Studio'));
            if (propertyData.containsKey('Bungalow')) prop.Bungalow__c = Boolean.valueOf(propertyData.get('Bungalow'));
            
            if (propertyData.get('NumberofBedrooms') != null && String.isNotBlank(String.valueOf(propertyData.get('NumberofBedrooms')))) {
                prop.Number_Of_Bedrooms__c = Decimal.valueOf(String.valueOf(propertyData.get('NumberofBedrooms')));
            }
            if (propertyData.containsKey('FrontGarden')) prop.Front_Garden__c = Boolean.valueOf(propertyData.get('FrontGarden'));
            if (propertyData.containsKey('BackGarden')) prop.Back_Garden__c = Boolean.valueOf(propertyData.get('BackGarden'));
            if (propertyData.containsKey('NoGarden')) prop.No_Garden__c = Boolean.valueOf(propertyData.get('NoGarden'));
            if (propertyData.containsKey('Parking')) prop.Parking__c = Boolean.valueOf(propertyData.get('Parking'));
            if (propertyData.containsKey('Garage')) prop.Garage__c = Boolean.valueOf(propertyData.get('Garage'));
            if (propertyData.containsKey('Extension')) prop.Extension__c = Boolean.valueOf(propertyData.get('Extension'));
            if (propertyData.containsKey('AnyExtensionssolarpanels')) prop.AnyExtensions_LoftConverstion_SolarPanel__c = Boolean.valueOf(propertyData.get('AnyExtensionssolarpanels'));
            if (propertyData.containsKey('Conservatory')) prop.Conservatory__c = Boolean.valueOf(propertyData.get('Conservatory'));
            if (propertyData.get('AgeofProperty') != null) prop.Age_of_Property__c = String.valueOf(propertyData.get('AgeofProperty'));
            if (propertyData.containsKey('Freehold')) prop.Freehold__c = Boolean.valueOf(propertyData.get('Freehold'));
            if (propertyData.containsKey('LeaseHold')) prop.Lease_Hold__c = Boolean.valueOf(propertyData.get('LeaseHold'));
            if (propertyData.get('YearsleftofLease') != null) prop.Years_left_of_Lease__c = String.valueOf(propertyData.get('YearsleftofLease'));
            
            if (propertyData.get('ServiceChargePCM') != null && String.isNotBlank(String.valueOf(propertyData.get('ServiceChargePCM')))) {
                prop.Service_Charge__c = Decimal.valueOf(String.valueOf(propertyData.get('ServiceChargePCM')));
            }
            if (propertyData.get('GroundRentPA') != null && String.isNotBlank(String.valueOf(propertyData.get('GroundRentPA')))) {
                prop.Ground_Rent__c = Decimal.valueOf(String.valueOf(propertyData.get('GroundRentPA')));
            }
            
            if (propertyData.containsKey('PrincipleResidence')) prop.Principle_Residence__c = Boolean.valueOf(propertyData.get('PrincipleResidence'));
            if (propertyData.containsKey('SecondHomeHolidayLet')) prop.Second_Home_Holiday_Let__c = Boolean.valueOf(propertyData.get('SecondHomeHolidayLet'));
            if (propertyData.get('TypeofHeating') != null) prop.Type_of_Heating__c = String.valueOf(propertyData.get('TypeofHeating'));
            if (propertyData.containsKey('BuildingRegsPlanningPermission')) prop.Building_Regs_Planning_Permission__c = Boolean.valueOf(propertyData.get('BuildingRegsPlanningPermission'));
            if (propertyData.containsKey('Other')) prop.Other__c = Boolean.valueOf(propertyData.get('Other'));
            if (propertyData.containsKey('Other_Note')) prop.Other_Note__c = (String)propertyData.get('Other_Note');

            insert prop;
            res.put('propertyId', prop.Id);
            res.put('propname', prop.Name);
            return res;
        } catch (Exception e) {
            res.put('n', 'Error creating property: ' + e.getMessage());
            return res;
        }
    }

    @AuraEnabled
    public static Map<String, String> createAgents(Map<String, Object> agentData) {
        Map<String, String> res = new Map<String, String>();
        try {
            Id agentRectype = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Estate Agents').getRecordTypeId();
            
            if (agentData.containsKey('agentName') && String.isNotBlank((String)agentData.get('agentName'))) {
                Account agent = new Account(
                    Name = (String)agentData.get('agentName'),
                    Phone = (String)agentData.get('agentPhone'),
                    Email__c = (String)agentData.get('agentEmail'),
                    BillingStreet = (String)agentData.get('street'),
                    BillingCity = (String)agentData.get('city'),
                    BillingState = (String)agentData.get('province'),
                    BillingCountry = (String)agentData.get('country'),
                    RecordTypeId = agentRectype
                );
                insert agent;
                res.put('agentId', agent.Id);
                res.put('agentname', agent.Name);
            }

            if (agentData.containsKey('agent3Name') && String.isNotBlank((String)agentData.get('agent3Name'))) {
                Account agent3 = new Account(
                    Name = (String)agentData.get('agent3Name'),
                    Phone = (String)agentData.get('agent3Phone'),
                    Email__c = (String)agentData.get('agent3Email'),
                    RecordTypeId = agentRectype
                );
                insert agent3;
                res.put('agent3Id', agent3.Id);
                res.put('agent3name', agent3.Name);
            }
            return res;
        } catch (Exception e) {
            res.put('n', 'Error creating agents: ' + e.getMessage());
            return res;
        }
    }

    @AuraEnabled
    public static Map<String, String> createApplication(Map<String, Object> appData, String recordType, String vendor1Id, String vendor2Id, String propertyId, String agentId, String agent3Id) {
        Map<String, String> res = new Map<String, String>();
        try {
            Id partExchange = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Part Exchange - Applications').getRecordTypeId();
            New_Home_Solution__mdt config = New_Home_Solution__mdt.getInstance('NHS');
            List<Account> accounts = [SELECT Id FROM Account WHERE Name = :config.Name__c AND Phone = :config.Phone__c LIMIT 1];
            Account ac = accounts.isEmpty() ? null : accounts[0];

            Opportunity opp = new Opportunity();
            opp.Property__c = propertyId;
            NHS_Property__c prop = [SELECT Name, Number_Of_Bedrooms__c, Detached__c, Semi_Detached__c, End_Terrace__c, Mid_Terrace__c, Apartment__c, Maisonette__c, Maisonette_Studio__c, Bungalow__c, Other__c FROM NHS_Property__c WHERE Id = :propertyId];
            opp.Name = prop.Name;
            opp.Application_Name__c = opp.Name;

            // Build Property Description from property type checkboxes + bedrooms
            List<String> types = new List<String>();
            if (prop.Detached__c) types.add('Detached');
            if (prop.Semi_Detached__c) types.add('Semi-Detached');
            if (prop.End_Terrace__c) types.add('End Terrace');
            if (prop.Mid_Terrace__c) types.add('Mid Terrace');
            if (prop.Apartment__c) types.add('Apartment');
            if (prop.Maisonette__c) types.add('Maisonette');
            if (prop.Maisonette_Studio__c) types.add('Studio');
            if (prop.Bungalow__c) types.add('Bungalow');
            if (prop.Other__c) types.add('Other');
            String propDesc = String.join(types, ' / ');
            if (prop.Number_Of_Bedrooms__c != null) {
                propDesc += (String.isNotBlank(propDesc) ? ' ' : '') + String.valueOf(prop.Number_Of_Bedrooms__c.intValue()) + ' Bed';
            }
            opp.Property_Description__c = propDesc;
            
            opp.Vendor_1__c = cleanId(vendor1Id);
            opp.Vendor_2__c = cleanId(vendor2Id);
            opp.Agent_1__c = ac != null ? ac.Id : null;
            opp.Agent_2__c = cleanId(agentId);
            opp.Agent_3__c = cleanId(agent3Id);

            if (appData.get('expectation') != null && String.isNotBlank(String.valueOf(appData.get('expectation')))) {
                opp.Client_Expectations__c = Integer.valueOf(String.valueOf(appData.get('expectation')));
            }
            opp.Scheme__c = appData.get('scheme') != null ? (String)appData.get('scheme') : 'Part Exchange';
            opp.ETA_Comp_Start__c = (String)appData.get('startDate');
            opp.ETA_Comp_End__c = (String)appData.get('endDate');
            opp.Notes__c = (String)appData.get('notes');
            opp.House_Builder__c = cleanId((String) appData.get('housebuilderId'));
            opp.Development__c = (String)appData.get('development');
            opp.Plot__c = (String)appData.get('plot');
            
            if (appData.get('dateOfApplicationReceived') != null && String.isNotBlank((String)appData.get('dateOfApplicationReceived'))) {
                opp.Date_of_Application_Received__c = Date.valueOf((String)appData.get('dateOfApplicationReceived'));
                opp.Date_of_Enquiry__c = Date.valueOf((String)appData.get('dateOfApplicationReceived'));
            }

            opp.Sales_Advisor__c = cleanId((String) appData.get('salesAdvisor'));
            opp.CloseDate = System.today();
            opp.StageName = 'To be contacted';
            opp.NHS_Process__c = 'Application';
            opp.Region__c = (String)appData.get('Region');

            if (appData.get('PurchasePrice') != null && String.isNotBlank(String.valueOf(appData.get('PurchasePrice')))) {
                opp.Purchase_Price__c = Decimal.valueOf(String.valueOf(appData.get('PurchasePrice')));
            }
            opp.Is_your_house_on_the_market_NEW__c = (String)appData.get('marketstatusYes');
            opp.Time_on_the_market__c = (String)appData.get('Timeonthemarket');
            opp.Has_your_house_been_valued_by_an_agent__c = (String)appData.get('Has_your_house_been_valued_by_an_agent');
            
            opp.Terms_and_Condition__c = appData.get('terms') != null ? Boolean.valueOf(appData.get('terms')) : true;
            opp.Mon_AM__c = appData.get('monAM') != null ? Boolean.valueOf(appData.get('monAM')) : false;
            opp.Mon_PM__c = appData.get('monPM') != null ? Boolean.valueOf(appData.get('monPM')) : false;
            opp.Tue_AM__c = appData.get('tueAM') != null ? Boolean.valueOf(appData.get('tueAM')) : false;
            opp.Tue_PM__c = appData.get('tuePM') != null ? Boolean.valueOf(appData.get('tuePM')) : false;
            opp.Wed_AM__c = appData.get('wedAM') != null ? Boolean.valueOf(appData.get('wedAM')) : false;
            opp.Wed_PM__c = appData.get('wedPM') != null ? Boolean.valueOf(appData.get('wedPM')) : false;
            opp.Thu_AM__c = appData.get('thuAM') != null ? Boolean.valueOf(appData.get('thuAM')) : false;
            opp.Thu_PM__c = appData.get('thuPM') != null ? Boolean.valueOf(appData.get('thuPM')) : false;
            opp.Fri_AM__c = appData.get('friAM') != null ? Boolean.valueOf(appData.get('friAM')) : false;
            opp.Fri_PM__c = appData.get('friPM') != null ? Boolean.valueOf(appData.get('friPM')) : false;
            opp.Sat_AM__c = appData.get('satAM') != null ? Boolean.valueOf(appData.get('satAM')) : false;
            opp.Sat_PM__c = appData.get('satPM') != null ? Boolean.valueOf(appData.get('satPM')) : false;
            opp.Sun_AM__c = appData.get('sunAM') != null ? Boolean.valueOf(appData.get('sunAM')) : false;
            opp.Sun_PM__c = appData.get('sunPM') != null ? Boolean.valueOf(appData.get('sunPM')) : false;

            if (appData.get('ClientsEstimatedValuation') != null && String.isNotBlank(String.valueOf(appData.get('ClientsEstimatedValuation')))) {
                opp.Client_Estimated_Valuation__c = Decimal.valueOf(String.valueOf(appData.get('ClientsEstimatedValuation')));
            }
            if (appData.get('OutstandingMortgage') != null && String.isNotBlank(String.valueOf(appData.get('OutstandingMortgage')))) {
                opp.Outstanding_Mortgage__c = Decimal.valueOf(String.valueOf(appData.get('OutstandingMortgage')));
            }
            opp.Qualified_By_House_Builders_FA__c = (String)appData.get('OutstandingMortgageQualified');
            
            if (appData.get('Previousaskingprice') != null && String.isNotBlank(String.valueOf(appData.get('Previousaskingprice')))) {
                opp.Agent_1_Initial_Asking_Price__c = Decimal.valueOf(String.valueOf(appData.get('Previousaskingprice')));
            }
            if (appData.get('CurrentAskingPrice') != null && String.isNotBlank(String.valueOf(appData.get('CurrentAskingPrice')))) {
                opp.Current_Asking_Price__c = Decimal.valueOf(String.valueOf(appData.get('CurrentAskingPrice')));
            }
            if (appData.get('NumberofViewings') != null && String.isNotBlank(String.valueOf(appData.get('NumberofViewings')))) {
                opp.Number_Of_Viewings__c = Integer.valueOf(String.valueOf(appData.get('NumberofViewings')));
            }
            if (appData.get('Anypreviousoffers') != null && String.isNotBlank(String.valueOf(appData.get('Anypreviousoffers')))) {
                opp.Any_previous_offers__c = Decimal.valueOf(String.valueOf(appData.get('Anypreviousoffers')));
            }

            opp.RecordTypeId = partExchange;
            insert opp;

            res.put('oppname', opp.Name);
            res.put('y', opp.Id);
            return res;
        } catch (Exception e) {
            res.put('n', 'Error creating application: ' + e.getMessage());
            return res;
        }
    }
}