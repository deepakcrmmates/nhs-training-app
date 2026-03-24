@isTest
public class ArchivedApplicationKanbanControllerTest {
    
    @testSetup
    static void setupTestData() {
        // Create test user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser' + DateTime.now().getTime() + '@example.com',
            ProfileId = p.Id,
            Alias = 'tuser',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;

        // Create Account (House Builder)
        Account houseBuilder = new Account(
            Name = 'Test HouseBuilder',
            BillingCity = 'Test City'
        );
        insert houseBuilder;

        // Create Archived Opportunities
        List<Opportunity> oppList = new List<Opportunity>();
        for (Integer i = 0; i < 3; i++) {
            oppList.add(new Opportunity(
                Name = 'Archived Opp ' + i,
                StageName = 'Closed Won',
                CloseDate = Date.today(),
                Application_Name__c = 'App Name ' + i,
                House_Builder__c = houseBuilder.Id,
                Archived__c = true,
                Archived_Approval_Status__c = 'Approved',
                OwnerId = testUser.Id
            ));
        }
        insert oppList;
    }

    @isTest
    static void testGetOpportunities_ValidData() {
        Test.startTest();
        ArchivedApplicationKanbanController.getOpportunities(5, 0);
        Test.stopTest();
    }

    @isTest
    static void testGetOpportunities_WithOffset() {
        Test.startTest();
        ArchivedApplicationKanbanController.getOpportunities(1, 1);
        Test.stopTest();
    }

    @isTest
    static void testGetOpportunities_NoRecords() {
        // Delete archived opportunities to simulate empty data
        delete [SELECT Id FROM Opportunity WHERE Archived__c = true];

        Test.startTest();
        ArchivedApplicationKanbanController.getOpportunities(10, 0);
        Test.stopTest();
    }
}