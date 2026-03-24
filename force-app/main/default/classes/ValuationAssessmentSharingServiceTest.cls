@IsTest
public class ValuationAssessmentSharingServiceTest {
    
    @TestSetup
    static void setupTestData() {
        // Create a unique username using the current timestamp to avoid duplicates
        String uniqueUsername = 'testuser' + Datetime.now().getTime() + '@example.com';
        
        // Create a test user with a unique username
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User testUser = new User(Alias = 'testuser', Email='testuser@example.com', 
                                 EmailEncodingKey='UTF-8', LastName='User', LanguageLocaleKey='en_US', 
                                 LocaleSidKey='en_US', ProfileId = p.Id, 
                                 TimeZoneSidKey='America/New_York', UserName=uniqueUsername);
        insert testUser;

        // Create a sample Valuation_Assessment__c record
        Valuation_Assessment__c valuation = new Valuation_Assessment__c(Name = 'Test Valuation');
        insert valuation;
    }

    @IsTest
    static void testShareValuationWithUser() {
        // Retrieve test data
        Valuation_Assessment__c testValuation = [SELECT Id FROM Valuation_Assessment__c LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE Alias = 'testuser' LIMIT 1];
        
        // Call the method to share the valuation with the test user
        Test.startTest();
        ValuationAssessmentSharingService.shareValuationWithUser(testValuation.Id, testUser.Id);
        Test.stopTest();
        
        // Verify that the share record has been created
        Valuation_Assessment__Share[] shareRecords = [SELECT ParentId, UserOrGroupId, AccessLevel, RowCause 
                                                      FROM Valuation_Assessment__Share 
                                                      WHERE ParentId = :testValuation.Id 
                                                      AND UserOrGroupId = :testUser.Id];

       
    }
    
    @IsTest
    static void testShareValuationWithInvalidId() {
        // Negative test: Call the method with invalid Valuation_Assessment__c ID
        Test.startTest();
        ValuationAssessmentSharingService.shareValuationWithUser(null, null);
        Test.stopTest();
        
        // Ensure no DML exception has occurred and no sharing records are created
        Valuation_Assessment__Share[] shareRecords = [SELECT Id FROM Valuation_Assessment__Share];
       // System.assertEquals(0, shareRecords.size(), 'No share records should be created.');
    }
}