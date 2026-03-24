@IsTest
public class TestAllApplicationKanban {

    @TestSetup
    static void setupTestData() {
        // Create test user (owner of opportunities)
        User testUser = [SELECT Id FROM User WHERE IsActive = true LIMIT 1];

        // Create test Accounts for House Builders
        Account houseBuilder1 = new Account(Name = 'House Builder 1', BillingCity = 'New York');
        Account houseBuilder2 = new Account(Name = 'House Builder 2', BillingCity = 'Los Angeles');
        insert new List<Account> {houseBuilder1, houseBuilder2};

        // Create test Opportunities
        Opportunity opp1 = new Opportunity(
            Application_Name__c ='Opportunity 1',
            Name = 'Opportunity 1',
            StageName = 'Qualification',
            House_Builder__c = houseBuilder1.Id,
            Amount = 50000,
            Plot__c = 'Plot A',
            Development__c = 'Development 1',
            CloseDate = Date.today().addDays(30),
            OwnerId = testUser.Id
        );
        
        Opportunity opp2 = new Opportunity(
                 Application_Name__c ='Opportunity 2',
            Name = 'Opportunity 2',
            StageName = 'Proposal',
            House_Builder__c = houseBuilder2.Id,
            Amount = 75000,
            Plot__c = 'Plot B',
            Development__c = 'Development 2',
            CloseDate = Date.today().addDays(45),
            OwnerId = testUser.Id
        );

        Opportunity opp3 = new Opportunity(
                 Application_Name__c ='Opportunity 3',
            Name = 'Opportunity 3',
            StageName = 'Qualification',
            House_Builder__c = houseBuilder2.Id,
            Amount = 100000,
            Plot__c = 'Plot C',
            Development__c = 'Development 3',
            CloseDate = Date.today().addDays(60),
            OwnerId = testUser.Id
        );

        insert new List<Opportunity> {opp1, opp2, opp3};
    }

    @IsTest
    static void testGetOpportunityStages() {
        // Start test execution
        Test.startTest();
        List<AllApplicationKanban.OpportunityStageWrapper> opportunityStages = AllApplicationKanban.getOpportunityStages();
        Test.stopTest();
        
      
    }
}