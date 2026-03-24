public with sharing class LookupController {
    @AuraEnabled(cacheable=true)
    public static List<sObject> findRecords(String searchKey, String objectName) {
        String query = 'SELECT Id, Name FROM ' + objectName +
            ' WHERE Name LIKE \'%' + String.escapeSingleQuotes(searchKey) + '%\' LIMIT 10';
        return Database.query(query);
    }
}