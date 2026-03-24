@isTest
public class SendPDFonCreationHandlerTest {
      private static Valuation_Assessment__c createTestValuation(String agentEmail, String dateTimeStr, String appRefNumber) {
        // Create Agent Contact
        Contact agent = new Contact(
            FirstName = 'Test',
            LastName = 'Agent',
            Email = agentEmail
        );
        insert agent;

        // Create Opportunity with reference source field
        Opportunity app = new Opportunity(
            Name = 'Test Opp',
            
            StageName = 'Prospecting',
            CloseDate = Date.today()
            //Application_Reference_Number__c  = appRefNumber // Actual source field
        );
          app.Application_Name__c ='Test Application';
        insert app;

        // Create Valuation Assessment
        Valuation_Assessment__c val = new Valuation_Assessment__c(
         //   Agent__c = agent.Id,
            Application__c = app.Id
         //   Valuation_Requested_Date_Time__c = dateTimeStr
        );
        insert val;
        
        return val;
    }
    @isTest
    static void testSendEmailWithValidData() {
        // Create test data with all fields populated
        Valuation_Assessment__c val = createTestValuation(
            'agent@example.com', 
            '2023-10-01 14:30:00', 
            'APP-123'
        );

        Test.startTest();
        // Set mock PDF content by simulating the Visualforce page context
        PageReference pdfPage = Page.ValuatonFormPDF;
        pdfPage.getParameters().put('id', val.Id);
        Test.setCurrentPage(pdfPage);
        
        // Execute the future method
        SendPDFonCreationHandler.sendEmailsWithPDF(new List<Id>{val.Id});
        Test.setMock(HttpCalloutMock.class, new PDFGeneratorMock());
        Test.stopTest();
        
        // Verify email attempt was made
        System.assertEquals(1, Limits.getEmailInvocations(), 'Email should be sent');
    }
      @isTest
    static void testEmailFallbackWhenAgentEmailMissing() {
        // Create test data without Agent Email
        Valuation_Assessment__c val = createTestValuation(
            null, 
            '2023-10-02 09:15:00', 
            'APP-456'
        );

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new PDFGeneratorMock());
        SendPDFonCreationHandler.sendEmailsWithPDF(new List<Id>{val.Id});
        Test.stopTest();
         // Verify fallback email was used
        System.assertEquals(1, Limits.getEmailInvocations(), 'Fallback email should be sent');
    }
    
      // Mock class for PDF generation
    private class PDFGeneratorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/pdf');
            res.setBody('PDF_CONTENT');
            res.setStatusCode(200);
            return res;
        }
    }
    
   
}