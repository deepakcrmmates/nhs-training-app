public with sharing class AgentBookedListController {

    @AuraEnabled
    public static List<AppWrapper> getAgentBookedApplications(String searchTerm, String filterStatus) {
        String query =
            'SELECT Id, Name, StageName, NHS_Process__c, Development__c, Plot__c, ' +
            'Application_Reference_Number__c, Property_Address__c, ' +
            'House_Builder__r.Name, Owner.Name, Date_of_Application_Received__c, ' +
            'Vendor_1__r.Name, ' +
            'Agent_1__c, Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Phone__c, Agent_1_Email__c, ' +
            'Agent_2__c, Agent_2__r.Name, Agent_2_Appointment__c, Agent_2_Phone__c, Agent_2_Email__c, ' +
            'Agent_3__c, Agent_3__r.Name, Agent_3_Appointment__c, Agent_3_Phone__c, Agent_3_Email__c ' +
            'FROM Opportunity ' +
            'WHERE NHS_Process__c = \'Agents Booked\' ' +
            'AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Development__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        List<AppWrapper> results = new List<AppWrapper>();
        for (Opportunity opp : Database.query(query)) {
            AppWrapper w = new AppWrapper();
            w.id = opp.Id;
            w.name = opp.Name;
            w.propertyAddress = opp.Property_Address__c;
            w.development = opp.Development__c;
            w.plot = opp.Plot__c;
            w.stage = opp.StageName;
            w.process = opp.NHS_Process__c;
            w.houseBuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
            w.vendorName = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;
            w.ownerName = opp.Owner.Name;

            w.agent1Id = opp.Agent_1__c;
            w.agent1Name = opp.Agent_1__r != null ? opp.Agent_1__r.Name : null;
            w.agent1Date = opp.Agent_1_Appointment__c;

            w.agent2Id = opp.Agent_2__c;
            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Date = opp.Agent_2_Appointment__c;

            w.agent3Id = opp.Agent_3__c;
            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Date = opp.Agent_3_Appointment__c;

            // Booking status
            Integer booked = 0;
            if (opp.Agent_1__c != null && opp.Agent_1_Appointment__c != null) booked++;
            if (opp.Agent_2__c != null && opp.Agent_2_Appointment__c != null) booked++;
            if (opp.Agent_3__c != null && opp.Agent_3_Appointment__c != null) booked++;
            w.bookedCount = booked;
            w.bookingStatus = booked == 3 ? 'All Booked' : booked + '/3 Booked';

            results.add(w);
        }

        // Fetch next vendor availability for each application
        Set<Id> oppIds = new Set<Id>();
        for (AppWrapper w : results) oppIds.add(w.id);

        if (!oppIds.isEmpty()) {
            Map<Id, Date> nextAvailMap = new Map<Id, Date>();
            for (Vendor_Availability__c va : [
                SELECT Application__c, Date__c
                FROM Vendor_Availability__c
                WHERE Application__c IN :oppIds
                AND Availability__c = 'Available'
                AND Date__c >= TODAY
                ORDER BY Date__c ASC
            ]) {
                if (!nextAvailMap.containsKey(va.Application__c)) {
                    nextAvailMap.put(va.Application__c, va.Date__c);
                }
            }
            for (AppWrapper w : results) {
                w.nextAvailDate = nextAvailMap.get(w.id);
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
        @AuraEnabled public String stage { get; set; }
        @AuraEnabled public String process { get; set; }
        @AuraEnabled public String houseBuilder { get; set; }
        @AuraEnabled public String vendorName { get; set; }
        @AuraEnabled public String ownerName { get; set; }

        @AuraEnabled public String agent1Id { get; set; }
        @AuraEnabled public String agent1Name { get; set; }
        @AuraEnabled public DateTime agent1Date { get; set; }

        @AuraEnabled public String agent2Id { get; set; }
        @AuraEnabled public String agent2Name { get; set; }
        @AuraEnabled public DateTime agent2Date { get; set; }

        @AuraEnabled public String agent3Id { get; set; }
        @AuraEnabled public String agent3Name { get; set; }
        @AuraEnabled public DateTime agent3Date { get; set; }

        @AuraEnabled public Integer bookedCount { get; set; }
        @AuraEnabled public String bookingStatus { get; set; }
        @AuraEnabled public Date nextAvailDate { get; set; }
    }
}
