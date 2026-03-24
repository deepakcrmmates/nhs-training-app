@isTest
public class FrontFacingAgentControllerTest {
    
    @isTest
    static void testSaveRecords(){
         // Create the Lender Account
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        // Create the Solicitor Account
        Account solicitorAccount = new Account(Name = 'Test Solicitor Account');
        insert solicitorAccount;


          Map<String, Object> lender = new Map<String,Object>{
            'accountName' => 'Test Lender',
            'Email' => 'lender@test.com',
            'Phone' => '1234567890',
            'Street' => '123 Lender St',
            'City' => 'Lender City',
            'Country' => 'Lender Country',
            'Province' => 'Lender State',
            'PostalCode' => '67890'
        };

        // Financial Advisor Contact
        Map<String, Object> advisor = new Map<String,Object>{
            'FirstName' => 'Advisor_First',
            'LastName' => 'Advisor_Last',
            'Email' => 'advisor@test.com',
            'Phone' => '0987654321'
        };

        // Solicitor Company Details
        Map<String, Object> solicitorCompany = new Map<String,Object>{
            'Name' => 'Test Solicitor Co', // ✅ Correct key
            'Phone' => '5551234567',
            'Email' => 'solicitorco@test.com',
            'BillingStreet' => '456 Solicitor St',
            'BillingCity' => 'Solicitor City',
            'BillingCountry' => 'Solicitor Country',
            'BillingState' => 'Solicitor State',
            'BillingPostalCode' => '54321'
        };

        // Solicitor Person Contact
        Map<String, Object> solicitorPerson = new Map<String,Object>{
            'FirstName' => 'Solicitor_First',
            'LastName' => 'Solicitor_Last',
            'Phone' => '5557654321',
            'Email' => 'solicitor@test.com'
        };

        Test.startTest();
        Map<String, String> result = frontFacingAgentController.saveRecords(
            lender, 
            advisor, 
            solicitorCompany, 
            solicitorPerson, 
            true // mortgageRequired = true
        );
        Test.stopTest();
     }
     @isTest
    static void testSaveRecordsWithoutMortgage() {
        // Solicitor Company Details
        Map<String, Object> solicitorCompany = new Map<String,Object>{
            'Name' => 'Test Solicitor Co',
            'Phone' => '5551234567',
            'Email' => 'solicitorco@test.com',
            'BillingStreet' => '456 Solicitor St',
            'BillingCity' => 'Solicitor City',
            'BillingCountry' => 'Solicitor Country',
            'BillingState' => 'Solicitor State',
            'BillingPostalCode' => '54321'
        };

        // Solicitor Person Contact
        Map<String, Object> solicitorPerson = new Map<String,Object>{
            'FirstName' => 'Solicitor_First',
            'LastName' => 'Solicitor_Last',
            'Phone' => '5557654321',
            'Email' => 'solicitor@test.com'
        };

        Test.startTest();
        Map<String, String> result = frontFacingAgentController.saveRecords(
            new Map<String, Object>(), // Empty lender
            new Map<String, Object>(), // Empty advisor
            solicitorCompany, 
            solicitorPerson, 
            false // mortgageRequired = false
        );
        Test.stopTest();
    }

}