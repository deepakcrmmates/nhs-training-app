@isTest
public class TinyURLShortenerQueueableTest {

    @testSetup
    static void setupTestData() {
        // Create any necessary test data here (if needed)
    }

    @isTest
    static void testTinyURLShortenerQueueable_Success() {
        // Mock the HTTP callout for a successful URL shortening
        Test.setMock(HttpCalloutMock.class, new TinyURLShortenerMock(true));

        // Queueable instance with test data
        TinyURLShortenerQueueable queueable = new TinyURLShortenerQueueable('https://www.example.com', 'test@example.com');

        // Execute the queueable job
        Test.startTest();
        System.enqueueJob(queueable);
        Test.stopTest();

    }

    @isTest
    static void testTinyURLShortenerQueueable_ErrorResponse() {
        // Mock the HTTP callout for a failure response from TinyURL
        Test.setMock(HttpCalloutMock.class, new TinyURLShortenerMock(false));

        // Queueable instance with test data
        TinyURLShortenerQueueable queueable = new TinyURLShortenerQueueable('https://www.example.com', 'test@example.com');

        // Execute the queueable job
        Test.startTest();
        System.enqueueJob(queueable);
        Test.stopTest();
 }

    // Mock class for simulating HTTP responses
    private class TinyURLShortenerMock implements HttpCalloutMock {
        private Boolean success;

        public TinyURLShortenerMock(Boolean success) {
            this.success = success;
        }

        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            if (success) {
                res.setStatusCode(200);
                res.setBody('http://tinyurl.com/shortened-url');
            } else {
                res.setStatusCode(500);
                res.setBody('Error occurred');
            }
            return res;
        }
    }
}