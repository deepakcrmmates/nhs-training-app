@isTest
public class OfferKanbanControllerTest {
    
    @testSetup
    static void testSetupData(){
        
        //create a agent (account)
        Account agent = new Account();
        agent.Name = 'Test agent';
        insert agent;
        
        //create a house builder
         Account houseBuilder = new Account();
         houseBuilder.Name = 'Test House Builder';
         insert houseBuilder;
        
        //create a applicant 
        Contact applicant = new Contact();
        applicant.FirstName = 'test applicant';
        applicant.LastName = 'TestLastName';
        insert applicant;
        
        //create a new application (oppotutnity)
        Opportunity application = new Opportunity();
        application.Name = 'Test Application Name';
        application.Application_Name__c = 'test application';
        application.House_Builder__c = houseBuilder.Id;
        application.Applicant__c = applicant.Id;
        application.StageName = 'New Application';
        application.CloseDate = Date.today();
        insert application;
        
        
        // Create Offer Record
        Offer__c offer = new Offer__c();
        offer.Offer_Submitted_By__c  = 'Agent';
        offer.Offer_Amount__c = 10000;
        offer.Date_of_Application_Received__c = Date.today();
        offer.Disallow__c = false;
        offer.Archived__c = false;
        offer.Offer_Status__c = 'New Offers';
        offer.Offer_Active__c = 'Yes';
        offer.Agent__c = agent.Id;
        offer.Application__c = application.Id;
        insert offer;
        
    }
    
    @isTest
    static void testTheGetOfferKanbanData(){
        
         Test.startTest();
        List<OfferKanbanController.KanbanColumn> result = OfferKanbanController.getOfferKanbanData();
        Test.stopTest();
         
    }
    
    @isTest
    static void testUpdateOfferStage(){
        
         Offer__c insertedOffer = [SELECT Id, Offer_Status__c FROM Offer__c LIMIT 1];
        String offerId = insertedOffer.Id;
        String newStage = 'Accepted';
        String status = insertedOffer.Offer_Status__c;
        String notes = 'Test notes';
        
        Test.startTest();
        try {
        OfferKanbanController.updateOfferStage(offerId, newStage, status, notes);
    } catch (Exception e) {
        System.debug('Exception caught: ' + e.getMessage());
    }
        Test.stopTest();
        
        
    }

}