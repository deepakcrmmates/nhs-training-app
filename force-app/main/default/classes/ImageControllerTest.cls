@isTest
public class ImageControllerTest {
    @testSetup
    static void testSetupData(){
        // Create a test NHS_Property__c record
        NHS_Property__c property = new NHS_Property__c(
            Name = 'Test Property',
            Address__Street__s = '123 Test St'
        );
        insert property;
     
        // Create a ContentVersion (this auto-creates a ContentDocument)
        ContentVersion cv = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'TestFile.jpg',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert cv;

        // Get the ContentDocumentId
        cv = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id];

        // Link the ContentDocument to the NHS_Property__c record
        ContentDocumentLink cdl = new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = property.Id, // Link to your NHS_Property__c
            ShareType = 'V'
        );
        insert cdl;
    
    }
    @isTest
    static void testAllMethod(){
         // Get the NHS_Property__c record ID
        NHS_Property__c property = [SELECT Id FROM NHS_Property__c LIMIT 1];
        ContentVersion cv = [SELECT ContentDocumentId FROM ContentVersion LIMIT 1];
        Test.startTest();
          List<ContentDocumentLink> results = ImageController.getAllImages(property.Id);
         ImageController.getPropertyRecord(property.Id);
        ImageController.setPrimaryImage(property.Id, cv.ContentDocumentId);
        Test.stopTest();
    }
}