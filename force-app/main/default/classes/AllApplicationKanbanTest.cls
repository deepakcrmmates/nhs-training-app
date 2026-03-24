@isTest
public class AllApplicationKanbanTest {
    @testSetup
    static void testSetupData(){
        //create the user
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser@example.com.' + System.currentTimeMillis(),
            ProfileId = p.Id,
            Alias = 'tuser',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
            insert testUser;
            
            
           //create the Account (House Builder);
        Account houseBuilder = new Account();
        houseBuilder.Name = 'Test HouseBuilder';
        houseBuilder.BillingCity = 'Test City';
        insert houseBuilder;
        
        
        //create the application
        Opportunity application = new Opportunity();
        application.Name = 'Test app application';
        application.StageName = 'New Application';
        application.Application_Name__c = 'Test application';
        application.House_Builder__c = houseBuilder.Id;
        application.NHS_Sales_Advisor__c ='Gina Brookes';
        application.Plot__c = 'Test Plot';
        application.Development__c = 'Test Development';
       // application.Application_Reference_Number__c = ''
        application.CloseDate = Date.today();
        application.OwnerId = testUser.Id;
        insert application;
    }
    
    @isTest
    static void testGetOpportunityStage(){
       Opportunity opp = [SELECT Id, Name, StageName, NHS_Process__c, House_Builder__r.Name, Sales_Advisor__c,
                           Owner.Name, NHS_Sales_Advisor__c, Application_Reference_Number__c, 
                           Plot__c, House_Builder__r.BillingCity, CreatedDate 
                           FROM Opportunity LIMIT 1];
        Test.startTest();
      //  new AllApplicationKanban.OpportunityWrapper(opp[0]);
      string name = 'Test app application';
      string stage = 'New Application';
        List<AllApplicationKanban.OpportunityStageWrapper> oppStages = AllApplicationKanban.getOpportunityStages(name, stage, false);
        AllApplicationKanban.OpportunityWrapper wrapper = new AllApplicationKanban.OpportunityWrapper(opp);
        AllApplicationKanban.fetchOpportunitiesByStage(stage, 20);
        Test.stopTest();
    }
      
}