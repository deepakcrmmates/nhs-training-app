@isTest
public class PropertyReportServiceTest {

  
    @isTest
    static void testFetchPropertyReportSuccess() {
        // Create a mock response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setHeader('Content-Type', 'application/json');
        mockResponse.setBody('{"result":"Property Report Data"}');
        mockResponse.setStatusCode(200);

        // Set mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyReportHttpMock(mockResponse));

        // Call the method
        Test.startTest();
        HttpResponse result = PropertyReportService.fetchPropertyReport('SW1A 1AA', '10');
        Test.stopTest();

      
    }

    @isTest
    static void testFetchPropertyReportFailure() {
        // Create a mock response for failure
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(400); // Bad request

        // Set mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyReportHttpMock(mockResponse));

        // Call the method
        Test.startTest();
        HttpResponse result = PropertyReportService.fetchPropertyReport('InvalidPostcode', '999');
        Test.stopTest();

    }

    // Mock class for the HTTP callout
    public class PropertyReportHttpMock implements HttpCalloutMock {
        private HttpResponse mockResponse;

        public PropertyReportHttpMock(HttpResponse response) {
            this.mockResponse = response;
        }

        public HttpResponse respond(HttpRequest req) {
            return mockResponse;
        }
    }
}