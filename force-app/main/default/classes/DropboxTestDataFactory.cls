@isTest
public class DropboxTestDataFactory {

    public class TestData {
        public Id accountId;
        public Id contentDocumentId;
        public Blob fileBlob;
    }

    public static TestData createTestData(String recordTypeDevName) {
        TestData data = new TestData();

        // Get RecordType Id
        RecordType rt = [
            SELECT Id 
            FROM RecordType 
            WHERE SObjectType = 'Account' 
            AND DeveloperName = :recordTypeDevName 
            LIMIT 1
        ];

        // Create Account with RecordType
        Account acc = new Account(
            Name = 'Test House Builder',
            Email__c = 'house@test.com',
            RecordTypeId = rt.Id
        );
        insert acc;
        data.accountId = acc.Id;

        // Create ContentVersion
        ContentVersion cv = new ContentVersion(
            Title = 'TestFile.pdf',
            VersionData = Blob.valueOf('Test File Data'),
            PathOnClient = 'TestFile.pdf',
            IsMajorVersion = true
        );
        insert cv;

        // Get ContentDocumentId from inserted ContentVersion
        data.contentDocumentId = [
            SELECT ContentDocumentId 
            FROM ContentVersion 
            WHERE Id = :cv.Id
        ].ContentDocumentId;

        data.fileBlob = cv.VersionData;

        return data;
    }
}