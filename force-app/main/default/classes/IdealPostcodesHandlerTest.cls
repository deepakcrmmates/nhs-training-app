@isTest
public class IdealPostcodesHandlerTest {

    @isTest
    static void testGetAddressSuccess() {
        // Create a mock response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setHeader('Content-Type', 'application/json');
        mockResponse.setBody('{"result":"Test Address"}');
        mockResponse.setStatusCode(200);

        // Setup a mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new IdealPostcodesHttpMock(mockResponse));
        
        // Call the method
        Test.startTest();
        String result = IdealPostcodesHandler.getAddress('SW1A 1AA');
        Test.stopTest();

        // Assert the result
        System.assert(result.contains('Test Address'), 'The response should contain the mock address');
    }

    @isTest
    static void testGetAddressFailure() {
        // Create a mock response for failure
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(400); // Bad request

        // Setup a mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new IdealPostcodesHttpMock(mockResponse));

       
        Test.startTest();
        String result = IdealPostcodesHandler.getAddress('InvalidPostcode');
        Test.stopTest();
    }

    // Mock class for the HTTP callout
    public class IdealPostcodesHttpMock implements HttpCalloutMock {
        private HttpResponse response;

        public IdealPostcodesHttpMock(HttpResponse response) {
            this.response = response;
        }

        public HttpResponse respond(HttpRequest req) {
            return response;
        }
    }
}