public with sharing class NHS_FormSupport {
    /**
     * Returns the Account Record Type Id by DeveloperName (preferred) or Name (fallback).
     * Uses Schema Describe (no SOQL on RecordType), so it’s safe across orgs and profiles.
     */
    @AuraEnabled(cacheable=true)
    public static String getAccountRecordTypeId(String developerNameOrName) {
        Schema.DescribeSObjectResult d = Account.SObjectType.getDescribe();

        // Try DeveloperName map first
        Map<String, Schema.RecordTypeInfo> byDev = d.getRecordTypeInfosByDeveloperName();
        if (!String.isBlank(developerNameOrName) && byDev.containsKey(developerNameOrName)) {
            return byDev.get(developerNameOrName).getRecordTypeId();
        }

        // Fallback to Name map
        Map<String, Schema.RecordTypeInfo> byName = d.getRecordTypeInfosByName();
        if (!String.isBlank(developerNameOrName) && byName.containsKey(developerNameOrName)) {
            return byName.get(developerNameOrName).getRecordTypeId();
        }

        // Sensible defaults for your use case
        if (byDev.containsKey('House_Builder')) return byDev.get('House_Builder').getRecordTypeId();
        if (byName.containsKey('House Builder')) return byName.get('House Builder').getRecordTypeId();

        return null;
    }

    /**
     * Server-side Account search, filtered to a specific Account Record Type.
     * - developerNameOrName: e.g., 'House_Builder' (DeveloperName) or 'House Builder' (label)
     * - searchTerm: free text matched against Name, BillingCity, Phone
     * - limitSize: 1..50 (defaults to 10)
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccountsByRecordType(String developerNameOrName, String searchTerm, Integer limitSize) {
        String rtId = getAccountRecordTypeId(developerNameOrName);
        if (rtId == null) return new List<Account>();

        String term = '%' + (searchTerm == null ? '' : searchTerm.trim()) + '%';
        Integer lim = (limitSize == null || limitSize <= 0 || limitSize > 50) ? 10 : limitSize;

        return [
            SELECT Id, Name, BillingCity, Phone
            FROM Account
            WHERE RecordTypeId = :rtId
              AND (
                    Name LIKE :term
                 OR BillingCity LIKE :term
                 OR Phone LIKE :term
              )
            ORDER BY Name
            LIMIT :lim
        ];
    }

    /**
     * Fetches a small label set for an Account to display in the parent summary/lookup chip.
     */
    @AuraEnabled(cacheable=true)
    public static Account getAccountLabel(Id accountId) {
        if (accountId == null) return null;
        return [
            SELECT Id, Name, BillingCity, Phone
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];
    }
}