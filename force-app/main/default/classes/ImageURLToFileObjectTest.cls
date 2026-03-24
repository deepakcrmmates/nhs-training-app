@isTest
public class ImageURLToFileObjectTest {

    // Mock class to simulate HTTP callout
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HTTPResponse res = new HTTPResponse();
            res.setStatusCode(200);
            res.setBody('Mock image data'); // Simulate the image blob data
            return res;
        }
    }
    
    @testSetup
    static void setup() {
        // Create a parent record to associate ContentVersion with
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;
    }

    @isTest
    static void testStoreImagesWithoutExistingDocuments() {
        // Get the ID of the test account
        Account testAccount = [SELECT Id FROM Account LIMIT 1];

        // Prepare a list of image URLs (mock URLs for the test)
        List<String> imageUrls = new List<String>{
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg'
        };

        // Set the mock response for HTTP callouts
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Call the method to store images
        Test.startTest();
        ImageURLToFileObject.storeImages(imageUrls, testAccount.Id);
        Test.stopTest();
    }

    @isTest
    static void testStoreImagesWithExistingDocuments() {
        // Get the ID of the test account
        Account testAccount = [SELECT Id FROM Account LIMIT 1];

        // Create a ContentVersion to simulate existing documents
        ContentVersion existingContentVersion = new ContentVersion();
        existingContentVersion.Title = 'Existing Image';
        existingContentVersion.PathOnClient = 'existing_image.jpg';
        existingContentVersion.VersionData = Blob.valueOf('test image data');
        existingContentVersion.FirstPublishLocationId = testAccount.Id;
        insert existingContentVersion;

        // Prepare a list of image URLs (mock URLs for the test)
        List<String> imageUrls = new List<String>{
            'https://example.com/image3.jpg',
            'https://example.com/image4.jpg'
        };

        // Set the mock response for HTTP callouts
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        // Call the method to store images
        Test.startTest();
        ImageURLToFileObject.storeImages(imageUrls, testAccount.Id);
        Test.stopTest();
    }
}