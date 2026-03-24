@isTest
public class ViewingsOffersControllerTest {

    @testSetup
    static void setupData() {
        // Create Account (Agent)
        Account agent1 = new Account(Name = 'Test Agent 1');
        Account agent2 = new Account(Name = 'Test Agent 2');
        insert agent1;
        insert agent2;

        // Create Contact (Viewer)
        Contact viewer1 = new Contact(LastName = 'Test Viewer 1');
        Contact viewer2 = new Contact(LastName = 'Test Viewer 2');
        insert viewer1;
        insert viewer2;

        // Create Availability Report
        Availability_Report__c availabilityReport = new Availability_Report__c(X1st_Reduction_Price__c = 980);
        insert availabilityReport;

        // Create initial Viewings Offer records
        Viewings_Offer__c viewOffer1 = new Viewings_Offer__c(
            Agent__c = agent1.Id,
            Viewer_Name__c = viewer1.Id,
            Availability_Report__c = availabilityReport.Id,
            Date_of_Viewing__c = Date.today().addDays(-1),
            Feedback_Chased__c = Date.today().addDays(-1), 
            Feedback__c = 'Negative feedback',
             Buying_Position__c = 'INV',
            Offer__c = 300000,
            New_Offer__c = 45000,
            Notes_Updates__c ='Test'
           
        );
        insert viewOffer1;
        
        Viewings_Offer__c viewOffer2 = new Viewings_Offer__c(
            Agent__c = agent2.Id,
            Viewer_Name__c = viewer2.Id,
            Availability_Report__c = availabilityReport.Id,
            Date_of_Viewing__c = Date.today().addDays(-1),
            Feedback__c = 'Negative feedback',
            Offer__c = 300000,
            New_Offer__c = 45000,
            Notes_Updates__c ='Test',
            Buying_Position__c = 'INV'
        );
        insert viewOffer2;
    }

    @isTest
    static void testGetInitialData() {
        // Get availability report ID from test data
        Availability_Report__c availabilityReport = [SELECT Id FROM Availability_Report__c LIMIT 1];

        // Start test
        Test.startTest();
        List<Viewings_Offer__c> viewingsOffers = ViewingsOffersController.getInitialData(availabilityReport.Id);
        Test.stopTest();

        // Debug the results
        System.debug('Viewings Offers: ' + viewingsOffers);
    }

    @isTest
    static void testGeAvailabilityData() {
        // Get availability report ID from test data
        Availability_Report__c availabilityReport = [SELECT Id FROM Availability_Report__c LIMIT 1];

        // Start test
        Test.startTest();
        Availability_Report__c avReport = ViewingsOffersController.geAvailabilityData(availabilityReport.Id);
        Test.stopTest();

        // Debug the results
        System.debug('Availability Report: ' + avReport);
    }

    @isTest
    static void testSaveRecords() {
        // Create test data in JSON format, including all fields (Buying_Position__c, Feedback__c, Offer__c, New_Offer__c, Notes_Updates__c)
        String jsonData = '[{'+
            '"Id": "' + [SELECT Id FROM Viewings_Offer__c LIMIT 1].Id + '",'+
            '"Agent__c": "' + [SELECT Id FROM Account LIMIT 1].Id + '",'+
            '"Viewer_Name__c": "' + [SELECT Id FROM Contact LIMIT 1].Id + '",'+
            '"Date_of_Viewing__c": "' + Date.today().addDays(1) + '",'+
             '"Feedback_Chased__c": "' + Date.today().addDays(1) + '",'+
            '"Feedback__c": "Excellent",'+
            '"Offer__c": "'+ [SELECT Id, Offer__c FROM Viewings_Offer__c LIMIT 1].Offer__c + '",'+
            '"New_Offer__c": "'+ [SELECT Id, Offer__c,New_Offer__c FROM Viewings_Offer__c LIMIT 1].New_Offer__c + '",'+
            '"Buying_Position__c": "'+ [SELECT Id, Offer__c,New_Offer__c, Buying_Position__c FROM Viewings_Offer__c LIMIT 1].Buying_Position__c + '",'+
            '"Notes_Updates__c": "'+ [SELECT Id, Offer__c,New_Offer__c, Notes_Updates__c FROM Viewings_Offer__c LIMIT 1].Notes_Updates__c + '",'+
            '"Availability_Report__c": "' + [SELECT Id FROM Availability_Report__c LIMIT 1].Id + '"'+
        '}]';

        // Start test
        Test.startTest();
        ViewingsOffersController.saveRecords(jsonData);
        Test.stopTest();

  }
}