@isTest
public class PropertyDataServiceTest {

    @isTest
    static void testGetPropertyDataSuccess() {
        // Create a mock HTTP response for success
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setHeader('Content-Type', 'application/json');
        mockResponse.setBody('{"propertyData":"Test Property Data"}');
        mockResponse.setStatusCode(200);

        // Set up mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyDataHttpMock(mockResponse));

        // Call the method
        Test.startTest();
        String result = PropertyDataService.getPropertyData('EX5 7BF');
        Test.stopTest();

        // Assert the result contains property data
        System.assert(result.contains('Test Property Data'), 'The result should contain the mock property data');
    }

    @isTest
    static void testGetPropertyDataFailure() {
        // Create a mock HTTP response for failure
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(500); // Internal Server Error

        // Set up mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new PropertyDataHttpMock(mockResponse));

        // Call the method expecting an exception
        Test.startTest();
        try {
            PropertyDataService.getPropertyData('EX5 7BF');
            System.assert(false, 'An exception should have been thrown');
        } catch (PropertyDataService.CustomException e) {
            System.assertEquals('Failed to fetch property data', e.getMessage(), 'Exception message should match');
        }
        Test.stopTest();
    }

    // Mock class for HTTP callout
    public class PropertyDataHttpMock implements HttpCalloutMock {
        private HttpResponse mockResponse;

        public PropertyDataHttpMock(HttpResponse response) {
            this.mockResponse = response;
        }

        public HttpResponse respond(HttpRequest req) {
            return mockResponse;
        }
    }
}