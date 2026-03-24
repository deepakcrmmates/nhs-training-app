@isTest
public class customLookupControllerTest {

    @testSetup
    static void setupTestData() {
        // Create sample Account records for testing
        Account acc1 = new Account(Name = 'Test Account 1');
        Account acc2 = new Account(Name = 'Test Account 2');
        insert new List<Account> { acc1, acc2 };

        // Create sample Contact records for testing
        Contact contact1 = new Contact(FirstName = 'John', LastName = 'Doe', AccountId = acc1.Id);
        Contact contact2 = new Contact(FirstName = 'Jane', LastName = 'Smith', AccountId = acc2.Id);
        insert new List<Contact> { contact1, contact2 };
    }

    @isTest
    static void testFetchDefaultRecord() {
        // Fetch the first account from the test data
        Account acc = [SELECT Id, Name FROM Account LIMIT 1];

        // Call the fetchDefaultRecord method
        sObject result = customLookupController.fetchDefaultRecord(acc.Id, 'Account');
        
       
    }

    @isTest
    static void testFetchRecordsWithSearchString() {
        // Create an instance of SearchWrapper
        customLookupController.SearchWrapper wrapper = new customLookupController.SearchWrapper();
        wrapper.objectApiName = 'Account';
        wrapper.fieldApiName = 'Name';
        wrapper.searchString = 'Test';

       
    }

    @isTest
    static void testFetchRecordsWithSelectedRecordId() {
        // Fetch the first account from the test data
        Account acc = [SELECT Id, Name FROM Account LIMIT 1];

        // Create an instance of SearchWrapper
        customLookupController.SearchWrapper wrapper = new customLookupController.SearchWrapper();
        wrapper.objectApiName = 'Account';
        wrapper.fieldApiName = 'Name';
        wrapper.selectedRecordId = acc.Id;

       
    }

    @isTest
    static void testFetchRecordsWithParentRecord() {
        // Fetch the first account and contact from the test data
        Account acc = [SELECT Id, Name FROM Account LIMIT 1];
        Contact con = [SELECT Id, FirstName, LastName, AccountId FROM Contact WHERE AccountId = :acc.Id LIMIT 1];

        // Create an instance of SearchWrapper for Contact object
        customLookupController.SearchWrapper wrapper = new customLookupController.SearchWrapper();
        wrapper.objectApiName = 'Contact';
        wrapper.fieldApiName = 'LastName';
        wrapper.parentFieldApiName = 'AccountId';
        wrapper.parentRecordId = acc.Id;

        
      
    }

    @isTest
    static void testFetchRecordsWithExceptionHandling() {
        // Create an instance of SearchWrapper with incorrect object name
        customLookupController.SearchWrapper wrapper = new customLookupController.SearchWrapper();
        wrapper.objectApiName = 'InvalidObject';
        wrapper.fieldApiName = 'Name';
        wrapper.searchString = 'Test';

        // Exception handling test
        try {
            customLookupController.fetchRecords(wrapper);
         
        } catch (AuraHandledException e) {
          
        }
    }
}