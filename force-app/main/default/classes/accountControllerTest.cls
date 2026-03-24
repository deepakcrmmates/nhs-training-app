@isTest
public class accountControllerTest {

    @testSetup
    static void setup() {
        
        RecordType estateAgentsRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = 'Estate_Agents' LIMIT 1];
        
        RecordType houseBuilderRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = 'House_Builder' LIMIT 1];
      
        // Create a custom Property object
        NHS_Property__c testProperty = new NHS_Property__c(Name = 'Test Property');
        insert testProperty;

        // Create Contact for Applicant__c
        Contact testContact = new Contact(FirstName = 'Test', LastName = 'Applicant', Email = 'applicant@test.com');
        insert testContact;

        // Create Account (Agent)
        Account testAccount = new Account(Name = 'Test Agent', Email__c = 'agent@test.com',  RecordTypeId = estateAgentsRecordType.Id);
        insert testAccount;
        
        //create account (house builder)
        Account houseBuilderAccount = new Account(Name = 'Test House Builder', Email__c = 'house@test.com');

        // Create Opportunity (Linking Agent and Applicant)
        Opportunity testOpp = new Opportunity(
             Application_Name__c = 'Test Opportunity',
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(30),
            Agent_2__c = testAccount.Id, // Agent as Account
            Applicant__c = testContact.Id,  // Applicant is related to Contact
            Property__c = testProperty.Id,  // Property is related to a custom object
            Agent_1_Valuation_Requested_Date_Time__c = DateTime.now().addDays(-1)
        );
        insert testOpp;
    }

    @isTest
    static void testGetData() {
        // Query the account created in the setup
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        Account result = accountController.getData(testAccount.Id);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Account should not be null');
    }

    @isTest
    static void testGetOppData() {
        // Query the opportunity and account created in the setup
        Opportunity testOpp = [SELECT Id, Agent_2__c FROM Opportunity LIMIT 1];
        Account testAccount = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        Opportunity result = accountController.getOppData(testOpp.Id, testOpp.Agent_2__c);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Opportunity should not be null');
    }

    @isTest
    static void testCreateForm() {
        // Create a Valuation Assessment record for the form creation
        Valuation_Assessment__c valForm = new Valuation_Assessment__c(Name = 'Test Valuation');

        
        Test.startTest();
        accountController.createForm(valForm);
        Test.stopTest();

       //System.assert(result.containsKey('success'), 'The form creation should be successful');
    }
    
    @isTest
    static void testIsHouseBuilderRecordType(){
        
        Account testHouseAccount = [Select Id From Account Limit 1];
        Test.startTest();
        Boolean acc = accountController.isHouseBuilderRecordType(testHouseAccount.Id);
        Test.stopTest();
        
    }
    
     @isTest
    static void testGetAccountFileUrl() {
        // Step 1: Create test Account with Logo_URL__c
        Account acc = new Account(
            Name = 'Test Account',
            Logo_URL__c = 'https://example.com/logo.jpg'
        );
        insert acc;

        Test.startTest();
        // Step 2: Call the method with test Account Id
        String resultUrl = accountController.getAccountFileUrl(acc.Id);
        Test.stopTest();

        // Step 3: Assert
       // System.assertEquals('https://example.com/logo.jpg', resultUrl);
    }
}