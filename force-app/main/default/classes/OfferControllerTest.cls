@isTest
public class OfferControllerTest {
    
    @testSetup
    static void testSetupData(){
        
        // Fetch the Record Type ID dynamically
    Id estateAgentRecordTypeId = [SELECT Id FROM RecordType WHERE Name = 'Estate Agents' AND SObjectType = 'Account' LIMIT 1].Id;
    
        
        //create a agent 1(account)
        Account agent1 = new Account();
        agent1.Name = 'testagent1';
        agent1.Phone = '2345678911';
        agent1.Email__c = 'Test234@gmail.com';
        agent1.BillingStreet = 'teststreet1';
        agent1.BillingCity = 'testCity1';
        agent1.BillingState = 'teststate1';
        agent1.BillingPostalCode = '4237189';
        agent1.BillingCountry = 'Testcountry1';
        agent1.RecordTypeId = estateAgentRecordTypeId;
        insert agent1;
          //create a agent 2(account)
        Account agent2 = new Account();
        agent2.Name = 'testagent2';
        agent2.Phone = '2345678922';
        agent2.Email__c = 'Test224@gmail.com';
        agent2.BillingStreet = 'teststreet2';
        agent2.BillingCity = 'testCity2';
        agent2.BillingState = 'teststate2';
        agent2.BillingPostalCode = '4237189';
        agent2.BillingCountry = 'Testcountry2';
        agent2.RecordTypeId = estateAgentRecordTypeId;
        insert agent2;
        
          //create a agent 3(account)
        Account agent3 = new Account();
        agent3.Name = 'testagent3';
        agent3.Phone = '2345678933';
        agent3.Email__c = 'Test333@gmail.com';
        agent3.BillingStreet = 'teststreet3';
        agent3.BillingCity = 'testCity3';
        agent3.BillingState = 'teststate3';
        agent3.BillingPostalCode = '4237189';
        agent3.BillingCountry = 'Testcountry3';
        agent3.RecordTypeId = estateAgentRecordTypeId;
        insert agent3;
        
        
         // Create Contact (Applicant)
        Contact applicant = new Contact();
        applicant.FirstName = 'Test FirstName';
        applicant.LastName = 'TestLastName';
        applicant.Email = 'system@abc.com';
        applicant.MobilePhone = '8656790861';
        applicant.Phone = '4875473783';
        applicant.MailingStreet = 'teststreet';
        applicant.MailingCity = 'Testcity';
        applicant.MailingState = 'Teststate';
        applicant.MailingPostalCode = '183990393';
        insert applicant;
            
                    
        //create application (opportunity)
        Opportunity application = new Opportunity();
        application.Name = 'Test application';
        application.Application_Name__c = 'Test Appplication name';
        application.StageName = 'New Application';
        application.CloseDate = Date.today();
        application.Agent_1__c = agent1.Id;
        application.Agent_2__c = agent2.Id;
        application.Agent_3__c = agent3.Id;
      //  application.Property_Address__c = 'Test address';
        insert application;
        
        //create offer 
        Offer__c offer = new Offer__c();
        offer.Application__c = application.Id;
        offer.Offer_Amount__c = 12000;
        offer.Deposit_Amount_if_any__c = 1000;
        offer.Buying_Position__c = 'Full Cash Buyer';
        insert offer;
               
       }
    @isTest
    static void testDisplayApplicationData(){
          Opportunity opp = [Select Id, Name, StageName From Opportunity Limit 1];
        Account accountId = [Select Id, Name From Account Limit 1];
        Contact con = [Select Id, Name From Contact Limit 1];
        // Fetch the test Offer__c record
        Offer__c testOffer = [SELECT Id FROM Offer__c LIMIT 1];
        //create a search term contacts
        Contact testContact1 = new Contact(FirstName = 'John',LastName = 'Doe',Email = 'johndoe@example.com');
        insert testContact1;
        //for account data create lender
         Map<String, Object> accountData = new Map<String, Object>{
            'FirstName' => 'John',
            'LastName' => 'Doe',
            'Phone' => '1234567890',
            'Email__c' => 'john.doe@example.com',
            'BillingStreet' => '123 Main St',
            'BillingCity' => 'TestCity',
            'BillingState' => 'TestState',
            'BillingPostalCode' => '12345',
            'BillingCountry' => 'TestCountry'
        };
            
         //test data for the create account 
           Map<String, Object> accountData2 = new Map<String, Object>{
            'Name' => 'Test Solicitor',
            'Phone' => '9876543210',
            'Email__c' => 'test@solicitor.com',
            'BillingStreet' => '123 Main St',
            'BillingCity' => 'TestCity',
            'BillingState' => 'TestState',
            'BillingPostalCode' => '12345',
            'BillingCountry' => 'TestCountry'
        };
            
           
             // Create a Contact object
        Contact con2 = new Contact(
            FirstName = 'John',
            LastName = 'Doe',
            Email = 'john.doe@example.com',
            Phone = '1234567890'
        );
        
        //string offer json 
         String offerJson = '{"Property": "'+opp.Id+'",'
                        
                         + '"AgentName": "'+accountId.Id+'",'
                         + '"yes": true,'
                         + '"OfferAmount": "500000.00",'
                         + '"PurchaserId": "'+con.Id+'",'
                         + '"MortgageRequired": true,'
                         + '"PurchasersBuyingPosition": "First-Time Buyer",'
                         + '"NameOfLender": "'+accountId.Id+'",'
                         + '"FinancialAdvisor": "'+con.Id+'",'
                         + '"Deposit": "50000.00",'
                         + '"PurchasorSolicitorsname": "'+accountId.Id+'",'
                         + '"ExchangeDeadline": "2025-02-15",'
                         + '"BuyerawareofEstimatedCompletionDate": "2025-06-01",'
                         + '"DecisioninPrinciple": true,'
                         + '"IdVerified": true,'
                         + '"ProofofFunding": true,'
                         + '"AMLCheck": true,'
                         + '"Date offer received" : "2025-01-24T16:52:05.889Z",'
                         + '"AnySpecialConditions": "None"}';
        System.debug(offerJson);


          // Prepare valid file data (base64-encoded dummy content)
        String fileContentBase64 = EncodingUtil.base64Encode(Blob.valueOf('Sample File Content'));
        String formDataJson = '{"offerId": "' + testOffer.Id + '", "testFile.pdf": "' + fileContentBase64 + '"}';

        
        Test.startTest();
        // Assuming OfferController has a method called `getOfferDetails()`
        // display application data
         List<Map<String, Object>> result = OfferController.displayApplicationData(opp.Id);
         //search accounts
         OfferController.searchAccounts(accountId.Id);
        //searchcontacts
         OfferController.searchContact(con.Id);
        //picklistdata method
         List<Map<String,Object>> ofPick =  OfferController.picklistData();
         //search contacts 
         List<Contact> results = OfferController.searchpurchaserSolicitor('John');
        //for account create lender
        Map<String, String> resultAccount = OfferController.createLender(accountData);
        //for the create account 
         Map<String, String> resultdata = OfferController.createAccount(accountData2);
        //result contact
        Map<String, String> resultContact = OfferController.createContact(con2);
        //rewsult offer json
        Map<String, String> resultjson = OfferController.createOffer((String)offerJson);
        String resultjsonupload = OfferController.uploadFiles(formDataJson);
        
        Test.stopTest();
        

   }
    @isTest
    static void testUploadFiles_NullFormData() {
        Test.startTest();
        String result = OfferController.uploadFiles(null);
        Test.stopTest();

        System.assert(result.contains('Form data JSON is null or empty.'), 'Should return null JSON error');
    }
    
    @isTest
    static void testUploadFiles_EmptyOfferId() {
        String fileContentBase64 = EncodingUtil.base64Encode(Blob.valueOf('Sample File Content'));
        String formDataJson = '{"offerId": "", "testFile.pdf": "' + fileContentBase64 + '"}';

        Test.startTest();
        String result = OfferController.uploadFiles(formDataJson);
        Test.stopTest();

        System.assert(result.contains('Offer ID is missing'), 'Should return missing Offer ID error');
    }
     @isTest
    static void testUploadFiles_EmptyFileContent() {
        Offer__c testOffer = [SELECT Id FROM Offer__c LIMIT 1];
        String formDataJson = '{"offerId": "' + testOffer.Id + '", "testFile.pdf": ""}';

        Test.startTest();
        String result = OfferController.uploadFiles(formDataJson);
        Test.stopTest();

        System.assert(result.contains('File content is null or empty'), 'Should return empty file content error');
    }
    
     @isTest
    static void testCreateOffer_MissingFields() {
        // JSON with missing required fields
        String offerJson = '{"AgentName": "John Doe"}';

        Test.startTest();
        Map<String, String> result = OfferController.createOffer(offerJson);
        Test.stopTest();

        // Assertions for failure
        System.assertEquals('No', result.get('Status'), 'Offer creation should fail');
        System.assert(result.containsKey('ErrorMessage'), 'Error message should be returned');
    }

    @isTest
    static void testCreateOffer_InvalidDataType() {
        // JSON with invalid data type (OfferAmount as boolean instead of number)
        String offerJson = '{"Property": "a1B2C3D4E5",'
                         + '"OfferAmount": true}';

        Test.startTest();
        Map<String, String> result = OfferController.createOffer(offerJson);
        Test.stopTest();

        // Assertions for failure
        System.assertEquals('No', result.get('Status'), 'Offer creation should fail');
        System.assert(result.containsKey('ErrorMessage'), 'Error message should be returned');
    }

    @isTest
    static void testCreateOffer_ExceptionHandling() {
        Test.startTest();
        Map<String, String> result = OfferController.createOffer(null);
        Test.stopTest();

        // Assertions for failure
        System.assertEquals('No', result.get('Status'), 'Offer creation should fail');
        System.assert(result.containsKey('ErrorMessage'), 'Error message should be returned');
    }
    
   
   
}