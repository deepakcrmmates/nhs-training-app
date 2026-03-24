@isTest
public class AvailabilityControllerTest {

    @testSetup
    static void setup() {
        // Create a mock Property (Custom Object)
        NHS_Property__c property = new NHS_Property__c();
        property.Name = 'Test Property';
        insert property;
        
        // Create a mock Opportunity related to the Property
        Opportunity opp = new Opportunity(
            Application_Name__c = 'Test Opportunity', 
            Name = 'Test Opportunity', 
            Property__c = property.Id, 
            StageName = 'Prospecting', 
            CloseDate = Date.today().addDays(30)
        );
        insert opp;

        // Create an Availability Report linked to the Opportunity
        Availability_Report__c availabilityReport = new Availability_Report__c(
            Application__c = opp.Id
        );
        insert availabilityReport;

        // Re-query the Availability Report to get the related fields (Opportunity -> Property)
        availabilityReport = [
            SELECT Id, Application__r.Property__c 
            FROM Availability_Report__c 
            WHERE Id = :availabilityReport.Id 
            LIMIT 1
        ];
        
        // Create mock Viewings Offers
        List<Viewings_Offer__c> viewOffers = new List<Viewings_Offer__c>();
        for (Integer i = 0; i < 20; i++) {
            viewOffers.add(new Viewings_Offer__c(
                Application__c = opp.Id,
                Availability_Report__c = availabilityReport.Id
            ));
        }
        insert viewOffers;

        // Create mock Weekly Updates
        List<Weekly_Updates__c> weeklyUpdates = new List<Weekly_Updates__c>();
        for (Integer i = 0; i < 10; i++) {
            weeklyUpdates.add(new Weekly_Updates__c(
                Application__c = opp.Id,
                Instructions_to_Market__c = availabilityReport.Id
            ));
        }
        insert weeklyUpdates;
        
        // Step 1: Create a ContentVersion (representing the file)
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File', 
            PathOnClient = 'testFile.pdf', 
            VersionData = Blob.valueOf('Test content for file')
        );
        insert contentVersion;

        // Fetch the ContentDocumentId from ContentVersion
        ContentVersion contentVer = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id LIMIT 1];

        // Step 2: Create a ContentDocumentLink to link the file to the Property__c field on Opportunity
        ContentDocumentLink contentDocumentLink = new ContentDocumentLink(
            LinkedEntityId = availabilityReport.Application__r.Property__c,  // Linking to the Property
            ContentDocumentId = contentVer.ContentDocumentId,
            ShareType = 'I'  // 'I' for Inferred Permission
        );
        insert contentDocumentLink;
    }

    @isTest
    static void testAvailabilityControllerWithoutFiles() {
        // Step 1: Set the current page to simulate Visualforce page context
        PageReference pageRef = Page.availabilityReport;  // Assume this is the VF page name
        Test.setCurrentPage(pageRef);

        // Step 2: Set the page parameter for the Availability Report ID
        String availabilityReportId = [SELECT Id FROM Availability_Report__c LIMIT 1].Id;
        ApexPages.currentPage().getParameters().put('Id', availabilityReportId);

        // Step 3: Instantiate the controller
        Availability_Report__c availabilityReport = [SELECT Id FROM Availability_Report__c LIMIT 1];
        ApexPages.StandardController stdController = new ApexPages.StandardController(availabilityReport);
        AvailabilityController controller = new AvailabilityController(stdController);

        // Step 4: Call the getChunkedUpdates method and assert the results
        List<List<Weekly_Updates__c>> chunkedUpdates = controller.getChunkedUpdates();
      
        // Step 5: Call the getChunkedOffers method and assert the results
        List<List<Viewings_Offer__c>> chunkedOffers = controller.getChunkedOffers();
       
        // Step 6: Call the getTotalOfferChunks method and assert the results
        Integer totalChunks = controller.getTotalOfferChunks();
  }
}