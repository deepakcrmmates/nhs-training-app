@IsTest
public class EventControllerTest {

   @testSetup
    static void testSetupMethod(){
        // Get RecordType Id for 'Estate Agents' on Account
        RecordType estateAgentRT = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND Name = 'Estate Agents' LIMIT 1];

        // Create test Agent Accounts with 'Estate Agents' record type
        Account agent1 = new Account(Name = 'Agent One', RecordTypeId = estateAgentRT.Id);
        Account agent2 = new Account(Name = 'Agent Two', RecordTypeId = estateAgentRT.Id);
        Account agent3 = new Account(Name = 'Agent Three', RecordTypeId = estateAgentRT.Id);
        insert new List<Account>{agent1, agent2, agent3};
        
        
        Opportunity opp = new Opportunity();
        opp.Name = 'Test name';
        opp.Application_Name__c = 'Test Application Name';
        opp.Agent_1_Appointment__c = Date.today().addDays(4);
        opp.Agent_2_Appointment__c = Date.today().addDays(5);
        opp.Agent_3_Appointment__c = Date.today().addDays(6);
        opp.Agent_1_Valuation_Recieved__c = true;
        opp.Agent_2_Valuation_Recieved__c = true;
        opp.Agent_3_Valuation_Recieved__c = true;
        opp.NHS_Process__c = 'Application';
        opp.StageName = 'New Application';
        opp.CloseDate = Date.today().addDays(7);
        opp.Agent_1__c = agent1.Id;
        opp.Agent_2__c = agent2.Id;
        opp.Agent_3__c = agent3.Id;
        insert opp;
        
        Event e = new Event();
        e.Subject = 'Test Subject';
        e.StartDateTime = Date.today().addDays(2);
        e.EndDateTime = Date.today().addDays(5);
        e.IsBooked__c = true;
        e.WhatId = opp.Id;
        e.Agent__c = agent1.Id;
        e.Application__c = opp.id;
        insert e;
        
        Vendor_Availability__c vc = new Vendor_Availability__c ();
        vc.Name = 'Test Vendor';
        vc.Application__c = opp.Id;
        insert vc;
      }
    
    @isTest
    static void testgetOpp(){
        
          Test.startTest();

        // Case 1: both null
        List<Map<String, Object>> result1 = EventController.getOpportunities(null, null);
        System.assert(result1.size() > 0, 'Should return opportunities including the final total count map');

        // Case 2: NHS process only
        List<Map<String, Object>> result2 = EventController.getOpportunities('Application', null);
        System.assert(result2.size() > 0, 'Should return filtered list by NHS Process');

        // Case 3: search term only
        List<Map<String, Object>> result3 = EventController.getOpportunities(null, 'Test');
        System.assert(result3.size() > 0, 'Should return filtered list by search term');

        // Case 4: both parameters
        List<Map<String, Object>> result4 = EventController.getOpportunities('Application', 'Test');
        System.assert(result4.size() > 0, 'Should return filtered list by both criteria');

        Test.stopTest();
        
    }
    
    @isTest
    static void testgetOpportunities1(){
         Test.startTest();
        List<Map<String, Object>> results = EventController.getOpportunities1();
        Test.stopTest();
    }
    @isTest
    static void testGetEvent(){
        Test.startTest();
        Opportunity opp = [Select Id, Agent_1__c, Agent_2__c, Agent_3__c,
                Name, Applicant__c,StageName,
                Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
                Applicant__r.Name, House_Builder__c, House_Builder__r.Name From Opportunity Limit 1];
        List<Event> evt = EventController.getEvents(opp.Id, 'Chasing');
        Test.stopTest();
   }
    @isTest
    static void testGetEventsAgentsBooked() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
        List<Event> bookedEvents = EventController.getEvents(opp.Id, 'Agents Booked');
       // System.assert(!bookedEvents.isEmpty(), 'Should return upcoming booked events');
    }
     @isTest
    static void testGetAvailabilitiesWithAppId() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
        Date startDate = Date.today();
        Date endDate = Date.today().addDays(5);
        Test.startTest();
        List<Vendor_Availability__c> availabilities = EventController.getAvailabilities(startDate, endDate, opp.Id);
        Test.stopTest();
       // System.assertEquals(1, availabilities.size(), 'Should return vendor availability for given application');
    }

    @isTest
    static void testGetAvailabilitiesWithoutAppId() {
        Date startDate = Date.today();
        Date endDate = Date.today().addDays(5);
        Test.startTest();
        List<Vendor_Availability__c> availabilities = EventController.getAvailabilities(startDate, endDate, null);
        Test.stopTest();
      //  System.assertEquals(1, availabilities.size(), 'Should return all vendor availabilities');
    }
     @isTest
    static void testGetAvailabilitiesInvalidDate() {
        try {
            EventController.getAvailabilities(null, null, null);
        
        } catch (AuraHandledException e) {
           System.debug('✅ Caught expected AuraHandledException: ' + e.getMessage()); 
        }
    }
    
}