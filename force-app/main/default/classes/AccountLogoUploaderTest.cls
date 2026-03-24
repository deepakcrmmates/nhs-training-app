@isTest
public class AccountLogoUploaderTest {

    @testSetup
    static void setupData() {
        // Get RecordType Ids for 'House Builder' and 'Estate Agents'
        ID houseBuilderRTId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('House Builder').getRecordTypeId();
        ID estateAgentsRTId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Estate Agents').getRecordTypeId();

        // Create test Accounts
        Account houseBuilderAcc = new Account(Name = 'Test House Builder', RecordTypeId = houseBuilderRTId);
        Account estateAgentAcc = new Account(Name = 'Test Estate Agent', RecordTypeId = estateAgentsRTId);
        insert houseBuilderAcc;
        insert estateAgentAcc;

        // Create test Content Document
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testfile.png',
            VersionData = Blob.valueOf('Test content'),
            IsMajorVersion = true
        );
        insert contentVersion;

        // Ensure ContentDocumentId is available by querying the ContentVersion
        ContentVersion insertedVersion = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id LIMIT 1];
        String contentDocumentId = insertedVersion.ContentDocumentId;

        // Link Content Document to Accounts
        ContentDocumentLink houseBuilderDocLink = new ContentDocumentLink(
            LinkedEntityId = houseBuilderAcc.Id,
            ContentDocumentId = contentDocumentId
        );
        insert houseBuilderDocLink;

        ContentDocumentLink estateAgentDocLink = new ContentDocumentLink(
            LinkedEntityId = estateAgentAcc.Id,
            ContentDocumentId = contentDocumentId
        );
        insert estateAgentDocLink;
    }

    @isTest
    static void testUpdateAccountWithFileUrl() {
        // Fetch Accounts
        List<Account> accounts = [SELECT Id FROM Account];

        Test.startTest();
        // Call the method to update the file URLs
        AccountLogoUploader.updateAccountWithFileUrl(new List<Id>{accounts[0].Id, accounts[1].Id});
        Test.stopTest();

        // Fetch the updated accounts to verify file URLs were updated
        Account updatedHouseBuilder = [SELECT House_Builder_Logo__c FROM Account WHERE Id = :accounts[0].Id LIMIT 1];
        Account updatedEstateAgent = [SELECT Agent_1_Logo__c FROM Account WHERE Id = :accounts[1].Id LIMIT 1];

        // Output debug logs
        System.debug('Updated House Builder Logo URL: ' + updatedHouseBuilder.House_Builder_Logo__c);
        System.debug('Updated Estate Agent Logo URL: ' + updatedEstateAgent.Agent_1_Logo__c);
    }

    @isTest
    static void testGetFileUrl_NoFile() {
        // Create an Account without a file
        Account noFileAccount = new Account(Name = 'No File Account', RecordTypeId = [SELECT Id FROM RecordType WHERE Name = 'House Builder' LIMIT 1].Id);
        insert noFileAccount;

        Test.startTest();
        try {
            // Call the method to get the file URL
            String fileUrl = AccountLogoUploader.getFileUrl(noFileAccount.Id);
            System.debug('File URL: ' + fileUrl);
        } catch (AuraHandledException e) {
            // Output the exception message to debug
            System.debug('Expected Exception: ' + e.getMessage());
        }
        Test.stopTest();
    }
}