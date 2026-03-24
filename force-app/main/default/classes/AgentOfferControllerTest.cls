@isTest
public class AgentOfferControllerTest {
   @testSetup
   public static void testSetup(){
        // Create House Builder (Account)
        Account houseBuilder = new Account(Name ='Test House Builder');
        houseBuilder.Email__c = 'Test234@gmail.com';
        houseBuilder.Phone = '8772628293';
        houseBuilder.BillingStreet = 'teststreet';
        houseBuilder.BillingCity = 'testCity';
        houseBuilder.BillingState = 'teststate';
        houseBuilder.BillingPostalCode = '4237189';
        houseBuilder.BillingCountry = 'Testcountry';
        insert houseBuilder;
       
        // Create Contact (Applicant)
        Contact applicant = new Contact();
        applicant.FirstName = 'Test FirstName';
        applicant.LastName = 'TestLastName';
        applicant.AccountId = houseBuilder.Id;
       // applicant.Solicitors__c = houseBuilder.Id; // Linking to Account as Solicitor
        applicant.Email = 'system@abc.com';
        applicant.MobilePhone = '8656790861';
        applicant.MailingStreet = 'teststreet';
        applicant.MailingCity = 'Testcity';
        applicant.MailingState = 'Teststate';
        applicant.MailingPostalCode = '183990393';
        insert applicant;
       
        // Create Property
        NHS_Property__c property = new NHS_Property__c();
        property.Name = 'Test Property';
        property.Expiry_Date__c = Date.today().addYears(1);
        insert property;
       
        // Create Application (Opportunity)
        Opportunity application = new Opportunity();
        application.Name = 'Test Application Name';
        application.Application_Name__c = 'test application';
        application.StageName = 'New Application';
        application.CloseDate = Date.today();
        application.NHS_Sales_Advisor__c = 'Gina Brookes';
        application.Scheme__c = 'New Home';
        application.Development__c = 'Test Develop';
        application.Plot__c = 'Test Plot';
        application.House_Builder__c = houseBuilder.Id;
        application.Property__c = property.Id;
        application.Applicant__c = applicant.Id;
        insert application;
      
        // Create Offer Record
        Offer__c offer = new Offer__c();
        offer.Application__c = application.Id;
        offer.Offer_Amount__c = 12000;
        offer.Deposit_Amount_if_any__c = 1000;
        offer.Buying_Position__c = 'Full Cash Buyer';
        offer.Offer_Acceptance_Status__c = 'Accepted';
        offer.Verification_ID__c = true;
        offer.Decision_in_Principle__c = true;
        offer.Proof_of_Funding__c = true;
        offer.Any_Special_Conditions__c = 'No Condition';
        offer.Purchasers_Full_Name__c = applicant.Id;
        offer.Purchasers_Solicitors_Name__c = houseBuilder.Id;
        insert offer;

   }  
    
    
   
     @isTest
    public static void testFetchOffer(){
        Test.startTest();
          // Retrieve an existing Offer__c record inserted in testSetup
          Offer__c insertedOffer = [SELECT Id FROM Offer__c LIMIT 1];
        
        AgentOfferController controller = new AgentOfferController();
        controller.recordId = insertedOffer.Id;
        controller.fetchOfferData();
        controller.getApplicantAddress();
        controller.getPurchaserAddress();
        controller.getSolicitorAddress();
        controller.getVendorSolicitorAddress();
        Test.stopTest();
        
    }
   
 



}