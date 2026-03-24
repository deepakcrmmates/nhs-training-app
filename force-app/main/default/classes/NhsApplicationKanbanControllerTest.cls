@isTest
public class NhsApplicationKanbanControllerTest {
    
    @testSetup
    static void setupTestData() {
        // Create House Builder (Account)
        Account houseBuilder = new Account(
            Name = 'Test HouseBuilder',
            BillingCity = 'London'
        );
        insert houseBuilder;

        // Create Opportunities
        List<Opportunity> opps = new List<Opportunity>();
        
        // 1. Valid Application Opp
        opps.add(new Opportunity(
            Name = 'Test Opp 1',
            Application_Name__c = 'Test App 1',
            StageName = 'To be contacted',
            NHS_Process__c = 'Application',
            CloseDate = Date.today().addDays(30),
            House_Builder__c = houseBuilder.Id,
            Amount = 100000
        ));

        // 2. Another Valid Application Opp in a different stage
        opps.add(new Opportunity(
            Name = 'Test Opp 2',
            Application_Name__c = 'Test App 2',
            StageName = '1st Contact',
            NHS_Process__c = 'Application',
            CloseDate = Date.today().addDays(30),
            House_Builder__c = houseBuilder.Id,
            Amount = 200000
        ));

        // 3. Archived Opp
        opps.add(new Opportunity(
            Name = 'Archived Opp',
            Application_Name__c = 'Test App 3',
            StageName = 'To be contacted',
            NHS_Process__c = 'Application',
            CloseDate = Date.today().addDays(30),
            Archived__c = true
        ));

        // 4. Non-Application Opp (should be filtered out)
        opps.add(new Opportunity(
            Name = 'Non-App Opp',
            Application_Name__c = 'Test App 4',
            StageName = 'To be contacted',
            NHS_Process__c = 'Vendor Availability',
            CloseDate = Date.today().addDays(30)
        ));

        insert opps;
    }

    @isTest
    static void testGetApplicationKanbanData() {
        Test.startTest();
        // Test basic fetch
        List<NhsApplicationKanbanController.KanbanColumnWrapper> results = 
            NhsApplicationKanbanController.getApplicationKanbanData(null, null, false);
        
        System.assertNotEquals(0, results.size(), 'Should return kanban columns');
        
        // Test search (searching by Application_Name__c which should now be in the Name field)
        List<NhsApplicationKanbanController.KanbanColumnWrapper> searchResults = 
            NhsApplicationKanbanController.getApplicationKanbanData('Test App 1', null, false);
        
        // Find which column has the card
        Boolean found = false;
        for(NhsApplicationKanbanController.KanbanColumnWrapper col : searchResults) {
            if(col.cards.size() > 0) {
                found = true;
                break;
            }
        }
        System.assertEquals(true, found, 'Search should return 1 record in one of the columns');

        // Test showArchived
        List<NhsApplicationKanbanController.KanbanColumnWrapper> archivedResults = 
            NhsApplicationKanbanController.getApplicationKanbanData(null, null, true);
        Integer totalCards = 0;
        for(NhsApplicationKanbanController.KanbanColumnWrapper col : archivedResults) {
            totalCards += col.cards.size();
        }
        System.assertEquals(3, totalCards, 'Should return 3 application cards (including archived)');
        
        Test.stopTest();
    }

    @isTest
    static void testUpdateOpportunityStage() {
        // Query by Application_Name__c since Name might be overwritten
        Opportunity opp = [SELECT Id FROM Opportunity WHERE Application_Name__c = 'Test App 1' LIMIT 1];
        
        Test.startTest();
        String result = NhsApplicationKanbanController.updateOpportunityStage(opp.Id, '2nd Contact');
        Test.stopTest();
        
        System.assertEquals('OK', result);
        Opportunity updatedOpp = [SELECT StageName FROM Opportunity WHERE Id = :opp.Id];
        System.assertEquals('2nd Contact', updatedOpp.StageName);
    }

    @isTest
    static void testArchiveOpportunity() {
        Opportunity opp = [SELECT Id FROM Opportunity WHERE Application_Name__c = 'Test App 1' LIMIT 1];
        
        Test.startTest();
        String result = NhsApplicationKanbanController.archiveOpportunity(opp.Id, true);
        Test.stopTest();
        
        System.assertEquals('OK', result);
        Opportunity updatedOpp = [SELECT Archived__c FROM Opportunity WHERE Id = :opp.Id];
        System.assertEquals(true, updatedOpp.Archived__c);
    }

    @isTest
    static void testTogglePin() {
        Opportunity opp = [SELECT Id FROM Opportunity WHERE Application_Name__c = 'Test App 1' LIMIT 1];
        
        Test.startTest();
        String res1 = NhsApplicationKanbanController.togglePin(opp.Id);
        System.assertEquals('PINNED', res1);
        String res2 = NhsApplicationKanbanController.togglePin(opp.Id);
        System.assertEquals('UNPINNED', res2);
        Test.stopTest();
    }

    @isTest
    static void testTogglePinLimit() {
        // Pinned 3 apps
        List<Opportunity> opps = [SELECT Id FROM Opportunity WHERE Application_Name__c LIKE 'Test App%'];
        // Note: we have Test App 1, 2, 3 (archived), 4 (non-app)
        // Actually setup created Test App 1, 2, 3 (archived), 4 (Vendor Avail)
        
        // Let's create one more to test limit
        insert new Opportunity(
            Name = 'Limit Test',
            Application_Name__c = 'Limit Test',
            StageName = 'To be contacted',
            NHS_Process__c = 'Application',
            CloseDate = Date.today().addDays(30)
        );

        NhsApplicationKanbanController.togglePin(opps[0].Id);
        NhsApplicationKanbanController.togglePin(opps[1].Id);
        
        // Now pin the 3rd one
        Opportunity limitOpp = [SELECT Id FROM Opportunity WHERE Application_Name__c = 'Limit Test' LIMIT 1];
        NhsApplicationKanbanController.togglePin(limitOpp.Id);
        
        // Try to pin the 4th one (which is currently unpinned)
        // Wait, setup only has 2 active app ones. 
        // 1. Test App 1 (active)
        // 2. Test App 2 (active)
        // 3. Limit Test (active)
        // All 3 pinned now. 
        
        // Create 4th active app
        Opportunity fourth = new Opportunity(
            Name = 'Fourth',
            Application_Name__c = 'Fourth',
            StageName = 'To be contacted',
            NHS_Process__c = 'Application',
            CloseDate = Date.today().addDays(30)
        );
        insert fourth;

        Test.startTest();
        Boolean exceptionThrown = false;
        try {
            NhsApplicationKanbanController.togglePin(fourth.Id);
        } catch (Exception e) {
            exceptionThrown = true;
            System.debug('Exception message: ' + e.getMessage());
        }
        System.assert(exceptionThrown, 'Should have thrown exception for limit');
        Test.stopTest();
    }

    @isTest
    static void testGetAssigneeList() {
        Test.startTest();
        List<String> assignees = NhsApplicationKanbanController.getAssigneeList();
        Test.stopTest();
        
        System.assertNotEquals(0, assignees.size(), 'Should return at least one assignee');
    }
}
