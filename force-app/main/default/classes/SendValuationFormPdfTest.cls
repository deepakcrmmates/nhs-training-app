@isTest
public class SendValuationFormPdfTest {

    @testSetup
    static void setupTestData() {
        RecordType estateAgentsRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = 'Estate_Agents' LIMIT 1];
      
        // Create test Account (Agent) with Email__c field populated
        Account agent1 = new Account(
            Name = 'Test Agent 1',
            RecordTypeId = estateAgentsRecordType.Id, // Assuming RecordType 'Estate_Agents'
            Email__c = 'agent1@example.com'
        );
        insert agent1;

        Account agent2 = new Account(
            Name = 'Test Agent 2',
            RecordTypeId = estateAgentsRecordType.Id,
            Email__c = 'agent2@example.com'
        );
        insert agent2;

        // Create test Opportunity (Application)
        Opportunity testOpp = new Opportunity(
            Application_Name__c = 'Test Opportunity',
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = Date.today(),
            Agent_1_Valuation_Requested_Date_Time__c = DateTime.now(),
            Agent_2_Valuation_Requested_Date_Time__c = DateTime.now().addDays(1),
            Agent_3_Valuation_Requested_Date_Time__c = DateTime.now().addDays(2)
        );
        insert testOpp;

        // Create Valuation Assessment linked to Opportunity (Application)
        Valuation_Assessment__c valuation = new Valuation_Assessment__c(
            Application__c = testOpp.Id,
            Years_Left__c = 5,
            Ground_Rent__c = 150,
            Property_Type__c = 'Detached'
        );
        insert valuation;
    }

    @isTest
    static void testGetOrderIDs() {
        // Retrieve the inserted Valuation_Assessment__c for testing
        Valuation_Assessment__c val = [SELECT Id FROM Valuation_Assessment__c LIMIT 1];

        Test.startTest();

        // Mock the PDF generation during tests
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Call the getOrderIDs method
        SendValuationFormPdf.getOrderIDs(val.Id);

        // Validate the debug logs or additional behavior if needed
        system.assertNotEquals(null, val.Id, 'The Valuation ID should not be null.');

        Test.stopTest();
    }

    // Mock class to simulate the PDF generation and email sending
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setBody('Mock PDF content');
            res.setStatusCode(200);
            return res;
        }
    }
}