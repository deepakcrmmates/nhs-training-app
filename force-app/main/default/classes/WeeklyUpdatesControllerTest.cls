@IsTest
public class WeeklyUpdatesControllerTest {

    @TestSetup
    static void setupTestData() {
        RecordType estateAgentsRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = 'Estate_Agents' LIMIT 1];

        // Create test Accounts for agents
        List<Account> accountList = new List<Account>();
        for (Integer i = 1; i <= 3; i++) {
            Account agentAccount = new Account(
                Name = 'Agent_Account_' + i,
                RecordTypeId = estateAgentsRecordType.Id
            );
            accountList.add(agentAccount);
        }
        insert accountList;
		
        Availability_Report__c rec = new Availability_Report__c();
        rec.X1st_Reduction_Price__c = 67900;
        insert rec;
        
        
        // Create test Weekly_Updates__c records
        List<Weekly_Updates__c> weeklyUpdatesList = new List<Weekly_Updates__c>();
        for (Integer i = 0; i < 3; i++) {
            Weekly_Updates__c weeklyUpdate = new Weekly_Updates__c(
                Agent_1__c = accountList[i].Id,
                Agent_2__c = accountList[i].Id,
                Agent_3__c = accountList[i].Id,
                Agent_1_Notes__c = 'Test Notes 1 - ' + (i + 1),
                Agent_2_Notes__c = 'Test Notes 2 - ' + (i + 1),
                Agent_3_Notes__c = 'Test Notes 3 - ' + (i + 1),
                Instructions_to_Market__c = rec.Id
            );
            weeklyUpdatesList.add(weeklyUpdate);
        }
        insert weeklyUpdatesList;
    }

    @IsTest
    static void testGetInitialData() {
        // Fetch the first record created in setup
        Weekly_Updates__c sampleRecord = [SELECT Id, Instructions_to_Market__c FROM Weekly_Updates__c LIMIT 1];
        
        // Call the getInitialData method
        List<Weekly_Updates__c> result = WeeklyUpdatesController.getInitialData(sampleRecord.Instructions_to_Market__c);
        
        // Output debug log for result
        System.debug('Initial Data: ' + result);
    }

    @IsTest
    static void testSaveRecords() {
        // Fetch a sample account ID for testing
        Account agentAccount = [SELECT Id FROM Account LIMIT 1];

        // Create mock data in JSON format
        String jsonData = '[{"Id":"", "agent1":"' + agentAccount.Id + '", "agent2":"' + agentAccount.Id + '", "agent3":"' + agentAccount.Id + '", "notes1":"Updated Notes 1", "notes2":"Updated Notes 2", "notes3":"Updated Notes 3", "availabiltyId":"Test Instructions Updated"}]';
        
        // Call the saveRecords method
        String result = WeeklyUpdatesController.saveRecords(jsonData);
        
        // Output debug log for result
        System.debug('Save Records Result: ' + result);
    }

    @IsTest
    static void testUpdateRecords() {
        // Create a mock list of objects
        List<Object> mockData = new List<Object>();
        
        Map<String, Object> dataMap = new Map<String, Object>();
        dataMap.put('Id', 'TestId');
        mockData.add(dataMap);
        
        // Call the updateRecords method
        Boolean result = WeeklyUpdatesController.updateRecords(mockData);
        
        // Output debug log for result
        System.debug('Update Records Result: ' + result);
    }
}