public with sharing class VendorAvailabilityListController {

    @AuraEnabled
    public static List<AppWrapper> getVendorAvailabilityApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, StageName, House_Builder__r.Name, Owner.Name, ' +
            'Vendor_1__c, Vendor_1__r.Name, Vendor_1_Phone__c, Vendor_1_Email__c, ' +
            'Date_of_Application_Received__c ' +
            'FROM Opportunity ' +
            'WHERE NHS_Process__c = \'Vendor Availability\' ' +
            'AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        Set<Id> oppIds = new Set<Id>();
        List<AppWrapper> results = new List<AppWrapper>();

        for (Opportunity opp : Database.query(query)) {
            AppWrapper w = new AppWrapper();
            w.id = opp.Id;
            w.name = opp.Name;
            w.propertyAddress = opp.Property_Address__c;
            w.development = opp.Development__c;
            w.plot = opp.Plot__c;
            w.vendorName = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;
            w.vendorPhone = opp.Vendor_1_Phone__c;
            w.vendorEmail = opp.Vendor_1_Email__c;
            w.houseBuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
            w.ownerName = opp.Owner.Name;
            w.slotsCount = 0;
            w.nextAvailDate = null;
            results.add(w);
            oppIds.add(opp.Id);
        }

        // Get availability counts and next dates
        if (!oppIds.isEmpty()) {
            Map<Id, Integer> countMap = new Map<Id, Integer>();
            Map<Id, Date> nextDateMap = new Map<Id, Date>();

            for (Vendor_Availability__c va : [
                SELECT Application__c, Date__c
                FROM Vendor_Availability__c
                WHERE Application__c IN :oppIds
                AND Availability__c = 'Available'
                AND Date__c > TODAY
                ORDER BY Date__c ASC
            ]) {
                Id appId = va.Application__c;
                countMap.put(appId, (countMap.containsKey(appId) ? countMap.get(appId) : 0) + 1);
                if (!nextDateMap.containsKey(appId)) {
                    nextDateMap.put(appId, va.Date__c);
                }
            }

            for (AppWrapper w : results) {
                w.slotsCount = countMap.containsKey(w.id) ? countMap.get(w.id) : 0;
                w.nextAvailDate = nextDateMap.get(w.id);
            }
        }

        return results;
    }

    public class AppWrapper {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String propertyAddress { get; set; }
        @AuraEnabled public String development { get; set; }
        @AuraEnabled public String plot { get; set; }
        @AuraEnabled public String vendorName { get; set; }
        @AuraEnabled public String vendorPhone { get; set; }
        @AuraEnabled public String vendorEmail { get; set; }
        @AuraEnabled public String houseBuilder { get; set; }
        @AuraEnabled public String ownerName { get; set; }
        @AuraEnabled public Integer slotsCount { get; set; }
        @AuraEnabled public Date nextAvailDate { get; set; }
    }
}
