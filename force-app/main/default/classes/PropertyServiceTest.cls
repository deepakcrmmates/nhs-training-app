@isTest
public class PropertyServiceTest {

    @isTest
    static void testGetPropertyReportSuccess() {
        // Create a mock HTTP response for a successful call
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(200);
        mockResponse.setHeader('Content-Type', 'application/json');
        mockResponse.setBody('{"propertyReport": "Test Property Data"}');

        // Set up mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyServiceHttpMock(mockResponse));

        // Call the method
        Test.startTest();
        HttpResponse result = PropertyService.getPropertyReport('EX5 7BF', '10');
        Test.stopTest();

        // Assert that the response is as expected
        System.assertEquals(200, result.getStatusCode(), 'The status code should be 200');
        System.assert(result.getBody().contains('Test Property Data'), 'The response should contain mock property report data');
    }

    @isTest
    static void testGetPropertyReportFailure() {
        // Create a mock HTTP response for a failure scenario
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(400); // Bad Request

        // Set up mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyServiceHttpMock(mockResponse));

        // Call the method
        Test.startTest();
        HttpResponse result = PropertyService.getPropertyReport('InvalidPostcode', '999');
        Test.stopTest();

        // Assert that the response code is 400
        System.assertEquals(400, result.getStatusCode(), 'The status code should be 400 for a bad request');
    }

    // Mock class for HTTP callout
    public class PropertyServiceHttpMock implements HttpCalloutMock {
        private HttpResponse mockResponse;

        public PropertyServiceHttpMock(HttpResponse response) {
            this.mockResponse = response;
        }

        public HttpResponse respond(HttpRequest req) {
            return mockResponse;
        }
    }
}