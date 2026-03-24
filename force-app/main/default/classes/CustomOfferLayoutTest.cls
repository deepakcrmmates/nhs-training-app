@isTest
public class CustomOfferLayoutTest {
    
    @testSetup
    public static void testSetupData(){
        
        // Fetch the Record Type Id for "Solicitors"
        RecordType solicitorRT = [SELECT Id FROM RecordType WHERE DeveloperName = 'Solicitors' AND SObjectType = 'Account' LIMIT 1];
        
        //create a account that is solicitors
        Account solicitors = new Account();
        solicitors.Name = 'Test Solicitors';
        solicitors.Phone = '5677891727';
        solicitors.RecordTypeId = solicitorRT.Id;
        solicitors.Email__c = 'Test234@gmail.com';
        solicitors.BillingStreet = 'teststreet';
        solicitors.BillingCity = 'testCity';
        solicitors.BillingState = 'teststate';
        solicitors.BillingPostalCode = '4237189';
        solicitors.BillingCountry = 'Testcountry';
        insert solicitors;
        
        //create a Agent (account);
        Account agent  = new Account();
        agent.Name = 'Test Agent';
        agent.Phone = '2345678911';
        insert agent;
        
        //create the lender (account);
        Account lender = new Account();
        lender.Name = 'Test Lender';
        insert lender;
        
        //create the housebuilder (Account);
         Account houseBuilder = new Account();
         houseBuilder.Name = 'Test House Builder';
         insert houseBuilder;
        
        //create the purchasers solicitors name
        Account psn = new Account();
        psn.Name = 'Test PSN';
        psn.Email__c = 'Test120@gmail.com';
        psn.Phone = '9742928193';
        psn.BillingStreet = 'teststreet';
        psn.BillingCity = 'testCity';
        psn.BillingState = 'teststate';
        psn.BillingPostalCode = '4237189';
        psn.BillingCountry = 'Testcountry';
        
        //create an applicant that is contact 
        Contact applicant = new Contact();
        applicant.FirstName = 'test applicant';
        applicant.LastName = 'TestLastName';
        applicant.Email = 'system@abc.com';
        applicant.MobilePhone = '8656790861';
        applicant.MailingStreet = 'teststreet';
        applicant.MailingCity = 'Testcity';
        applicant.MailingState = 'Teststate';
        applicant.MailingPostalCode = '183990393';
        applicant.Solicitors__c = solicitors.Id;
        insert applicant;
        
        //create an financial advisor details
        Contact FAD = new Contact();
        FAD.FirstName = 'Test Financial Advisor';
        FAD.LastName = 'Test LastName';
        insert FAD;
        
        //create the purchaser full name (contact)
        Contact pfn = new Contact();
        pfn.FirstName = 'test Purchaser full name';
        pfn.LastName = 'TestLastName';
        pfn.Email = 'system01@abc.com';
        pfn.MobilePhone = '2456091561';
        pfn.MailingStreet = 'teststreet';
        pfn.MailingCity = 'Testcity';
        pfn.MailingState = 'Teststate';
        pfn.MailingPostalCode = '183990393';
        
        //create a property
        NHS_Property__c property = new NHS_Property__c();
        property.Name = 'Test Property';
        property.Expiry_Date__c = Date.today().addYears(1);
        insert property;
        
        //create the opportunity(application)
        Opportunity application = new Opportunity();
        application.Name = 'Test Application';
        application.NHS_Sales_Advisor__c = 'Gina Brookes';
        application.Application_Name__c = 'test application';
        application.Applicant__c = applicant.Id;
        application.House_Builder__c = houseBuilder.Id;
        application.Scheme__c = 'New Home';
        application.Development__c = 'Test Develop';
        application.Plot__c = 'Test Plot';
        application.Property__c = property.Id;
        application.ETA_Comp_Start__c = 'Test ETA Comp';
        application.StageName = 'New Application';
        application.CloseDate = Date.today();
        insert application;
        
        // create a offer record 
        Offer__c offer = new Offer__c ();
        offer.Application__c = application.Id;
        offer.Decision_in_Principle__c = true;
        offer.Verification_ID__c = true;
        offer.Proof_of_Funding__c = true;
        offer.Offer_Amount__c = 32000;
        offer.Date_of_Application_Received__c = Date.today();
        offer.Offer_Acceptance_Status__c = 'Accepted';
        offer.Agent__c = agent.Id;
        offer.Financial_Advisors_Details__c = FAD.Id;
        offer.Name_of_Lender__c = lender.Id;
        offer.Deposit_Amount_if_any__c = 1000;
        offer.Buying_Position__c = 'Full Cash Buyer';
        offer.Purchasers_Solicitors_Name__c = psn.Id;
        offer.Any_Special_Conditions__c = 'There is no condition';
        offer.Purchasers_Full_Name__c = pfn.Id;
        insert offer;
              
    }
    
   //test the get offer method
   @isTest
    static void testGetOffer(){
         // Retrieve an existing Offer__c record inserted in testSetup
           Test.startTest();
          Offer__c insertedOffer = [SELECT Id FROM Offer__c LIMIT 1];
          String offerId = insertedOffer.Id;
         // Call the static method correctly
         customOfferLayout.OfferWrapper result = customOfferLayout.getOfferData(offerId);
         Test.stopTest();
          
    }

}