@isTest
public class UploadLogoFromApplicationTest {
    
    @testSetup
    static void setupData() {
        // Create Account records
        Account houseBuilder = new Account(Name = 'House Builder', House_Builder_Logo__c = null);
        insert houseBuilder;
        
        Account agent1 = new Account(Name = 'Agent 1', Agent_1_Logo__c = null);
        insert agent1;
        
        // Create Opportunity record
        Opportunity opp = new Opportunity(Name = 'Test Opportunity', Application_Name__c = 'Test Opportunity',
                                          CloseDate = Date.today().addDays(10), 
                                          StageName = 'Prospecting',
                                          House_Builder__c = houseBuilder.Id,
                                          Agent_1__c = agent1.Id);
        insert opp;
        
        // Create ContentDocument and ContentDocumentLink
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testfile.jpg',
            VersionData = Blob.valueOf('Test Data'),
            IsMajorVersion = true
        );
        insert contentVersion;
        
        ContentDocumentLink docLink = new ContentDocumentLink(
            LinkedEntityId = opp.Id,
            ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id].ContentDocumentId
        );
        insert docLink;
    }

    @isTest
    static void testUploadLogoFromApplicationHouseBuilder() {
        // Fetch the Opportunity created in test setup
        Opportunity opp = [SELECT Id,Agent_1_Logo__c,House_Builder_Logo__c FROM Opportunity LIMIT 1];
        
        // Create request data
        List<UploadLogoFromApplication.OppAndAccountDetailsRequest> requestList = new List<UploadLogoFromApplication.OppAndAccountDetailsRequest>();
        UploadLogoFromApplication.OppAndAccountDetailsRequest request = new UploadLogoFromApplication.OppAndAccountDetailsRequest();
        request.oppId = opp.Id;
        request.selectedEntity = 'House Builder';
        requestList.add(request);
        
        // Call the method
        Test.startTest();
        UploadLogoFromApplication.CreateOpportunityLineItems(requestList);
        Test.stopTest();
      
        

    }
    
    @isTest
    static void testUploadLogoFromApplicationAgent1() {
        // Fetch the Opportunity created in test setup
        Opportunity opp = [SELECT Id,Agent_1_Logo__c,House_Builder_Logo__c FROM Opportunity LIMIT 1];
        
        // Create request data
        List<UploadLogoFromApplication.OppAndAccountDetailsRequest> requestList = new List<UploadLogoFromApplication.OppAndAccountDetailsRequest>();
        UploadLogoFromApplication.OppAndAccountDetailsRequest request = new UploadLogoFromApplication.OppAndAccountDetailsRequest();
        request.oppId = opp.Id;
        request.selectedEntity = 'Agent1';
        requestList.add(request);
        
        // Call the method
        Test.startTest();
        UploadLogoFromApplication.CreateOpportunityLineItems(requestList);
        Test.stopTest();
     
        
    }
     @isTest
    static void testUploadLogoFromApplicationAgent2() {
        // Fetch the Opportunity created in test setup
        Opportunity opp = [SELECT Id,Agent_1_Logo__c,House_Builder_Logo__c FROM Opportunity LIMIT 1];
        
        // Create request data
        List<UploadLogoFromApplication.OppAndAccountDetailsRequest> requestList = new List<UploadLogoFromApplication.OppAndAccountDetailsRequest>();
        UploadLogoFromApplication.OppAndAccountDetailsRequest request = new UploadLogoFromApplication.OppAndAccountDetailsRequest();
        request.oppId = opp.Id;
        request.selectedEntity = 'Agent2';
        requestList.add(request);
        
        // Call the method
        Test.startTest();
        UploadLogoFromApplication.CreateOpportunityLineItems(requestList);
        Test.stopTest();
     
        
    }
      @isTest
    static void testUploadLogoFromApplicationAgent3() {
        // Fetch the Opportunity created in test setup
        Opportunity opp = [SELECT Id,Agent_1_Logo__c,House_Builder_Logo__c FROM Opportunity LIMIT 1];
        
        // Create request data
        List<UploadLogoFromApplication.OppAndAccountDetailsRequest> requestList = new List<UploadLogoFromApplication.OppAndAccountDetailsRequest>();
        UploadLogoFromApplication.OppAndAccountDetailsRequest request = new UploadLogoFromApplication.OppAndAccountDetailsRequest();
        request.oppId = opp.Id;
        request.selectedEntity = 'Agent3';
        requestList.add(request);
        
        // Call the method
        Test.startTest();
        UploadLogoFromApplication.CreateOpportunityLineItems(requestList);
        List<sObject> results = LookupController.findRecords('Test', 'Account');
        Test.stopTest();
     
        
    }
}