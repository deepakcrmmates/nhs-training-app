@isTest
public class propertyControllerTest {

    @testSetup
    static void setupTestData() {
        // Create a test NHS Property
        NHS_Property__c property = new NHS_Property__c(
            Name = 'Test Property',
            Current_Efficiency__c = 50,
            Potential_Efficiency__c = 75
        );
        insert property;

        // Create a ContentVersion (representing the file)
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File', 
            PathOnClient = 'testFile.pdf', 
            VersionData = Blob.valueOf('Test content for file')
        );
        insert contentVersion;

        // Fetch the ContentDocumentId from ContentVersion
        ContentVersion insertedContentVersion = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id LIMIT 1];

        // Create a ContentDocumentLink to link the file to the property
        ContentDocumentLink contentDocumentLink = new ContentDocumentLink(
            LinkedEntityId = property.Id,
            ContentDocumentId = insertedContentVersion.ContentDocumentId,
            ShareType = 'I'  // 'I' for Inferred Permission
        );
        insert contentDocumentLink;
    }

    @isTest
    static void testFetchStreetDatas() {
        // Fetch the NHS_Property__c Id for the test property
        NHS_Property__c testProperty = [SELECT Id FROM NHS_Property__c LIMIT 1];
        
        // Call the method
        Test.startTest();
        NHS_Property__c result = propertyController.fetchStreetDatas(testProperty.Id);
        Test.stopTest();
   }

    @isTest
    static void testGetFiles() {
        // Fetch the NHS_Property__c Id for the test property
        NHS_Property__c testProperty = [SELECT Id FROM NHS_Property__c LIMIT 1];

        // Call the method
        Test.startTest();
        List<ContentDocumentLink> files = propertyController.getFiles(testProperty.Id);
        Test.stopTest();
 }
     @isTest
    static void testSetPrimaryImage() {
        // Get the test data
        NHS_Property__c testProperty = [SELECT Id FROM NHS_Property__c LIMIT 1];
        ContentVersion cv = [SELECT ContentDocumentId FROM ContentVersion LIMIT 1];

        // Call the method
        Test.startTest();
        propertyController.setPrimaryImage(testProperty.Id, cv.ContentDocumentId);
        Test.stopTest();

        // Assert the result
        NHS_Property__c updatedProperty = [SELECT Primary_Image__c FROM NHS_Property__c WHERE Id = :testProperty.Id];
        System.assertEquals(cv.ContentDocumentId, updatedProperty.Primary_Image__c, 'Primary Image should be set correctly');
    }
}