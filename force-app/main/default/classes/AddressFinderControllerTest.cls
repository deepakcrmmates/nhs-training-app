@isTest
public class AddressFinderControllerTest {

    @isTest
    static void testMethodName() {
        // Simulate an HTTP response for the external API call
        Test.startTest();
        HttpResponse response = new HttpResponse();
        response.setStatus('OK');
        response.setStatusCode(200);
        response.setBody('{"addresses": [{"postcode": "EX1 1ST", "street": "Test Street"}]}');

        HttpCalloutMock mock = new MockHttpResponseGenerator(response);
        Test.setMock(HttpCalloutMock.class, mock);

        // Invoke the method
        String query = 'test query';
        String result = AddressFinderController.methodName(query);

      Test.stopTest();
    }

    @isTest
    static void testGetFieldSet() {
        Test.startTest();
        // Call the method to retrieve the field set
        String objName = 'NHS_Property__c';  // Make sure this object exists
        String[] fieldsetname = new String[]{'PropertyDetails'};  // Use an actual field set name that exists in your org

        Map<String, String> fieldSets = AddressFinderController.getFieldSet(objName, fieldsetname);

          Test.stopTest();
    }

    // Mock class for simulating HTTP responses
    public class MockHttpResponseGenerator implements HttpCalloutMock {
        private HttpResponse response;
        
        public MockHttpResponseGenerator(HttpResponse response) {
            this.response = response;
        }
        
        public HTTPResponse respond(HTTPRequest req) {
            return response;
        }
    }
}