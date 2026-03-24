@isTest
private class DropboxFileServiceTest {

    public static Id testAccountId;
    public static Id testContentDocumentId;
    public static Blob testBlob;

    @testSetup
    static void setupTestData() {
        // Call reusable factory method
        DropboxTestDataFactory.TestData testData = DropboxTestDataFactory.createTestData('House_Builder');

        testAccountId = testData.accountId;
        testContentDocumentId = testData.contentDocumentId;
        testBlob = testData.fileBlob;

        System.debug('testAccountId after factory: ' + testAccountId);
        System.debug('testContentDocumentId after factory: ' + testContentDocumentId);
    }

    @isTest
    static void testUploadFileToDropboxSuccess() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock());

        Test.startTest();
        DropboxFileService.uploadFileToDropbox(
            testAccountId,
            testContentDocumentId,
            'TestFolder',
            null,
            testBlob
        );
        Test.stopTest();
    }

    @isTest
    static void testUploadFileToDropboxFailure() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(400, '{"error": "Invalid request"}'));

        Test.startTest();
        DropboxFileService.uploadFileToDropbox(
            testAccountId,
            testContentDocumentId,
            'TestFolder',
            null,
            testBlob
        );
        Test.stopTest();
    }

    @isTest
    static void testUploadFileToDropboxWithValidValues() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(200, '{"access_token": "mockAccessToken"}'));

        Test.startTest();
        DropboxFileService.uploadFileToDropbox(
            testAccountId,
            testContentDocumentId,
            'TestFolder',
            null,
            testBlob
        );
        Test.stopTest();
    }

    @isTest
    static void testUploadFileToDropboxWithNullAccountId() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(200, '{"access_token": "mockAccessToken"}'));

        Test.startTest();
        try {
            DropboxFileService.uploadFileToDropbox(
                null,
                testContentDocumentId,
                'TestFolder',
                null,
                testBlob
            );
            System.debug('Expected exception not thrown');
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetDropboxFileLinkSuccess() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(200, '{"url": "https://www.dropbox.com/s/test12345/TestFile.pdf?dl=0"}'));

        Test.startTest();
        DropboxFileService.getDropboxFileLink('/TestFile.pdf', 'mockAccessToken');
        Test.stopTest();
    }

    @isTest
    static void testGetDropboxFileLinkFailure() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(400, '{"error": "Invalid request"}'));

        Test.startTest();
        DropboxFileService.getDropboxFileLink('/InvalidFile.pdf', 'mockAccessToken');
        Test.stopTest();
    }

    @isTest
    static void testGetDropboxFileLinkEmptyResponse() {
        Test.setMock(HttpCalloutMock.class, new DropboxApiMock(200, '{"wrongKey": "value"}'));

        Test.startTest();
        DropboxFileService.getDropboxFileLink('/TestFile.pdf', 'mockAccessToken');
        Test.stopTest();
    }

    // Mock Class
    private class DropboxApiMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;

        public DropboxApiMock() {
            this.statusCode = 200;
            this.responseBody = '{"access_token": "mockAccessToken"}';
        }

        public DropboxApiMock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(statusCode);
            response.setBody(responseBody);
            return response;
        }
    }
}