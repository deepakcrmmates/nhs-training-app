public with sharing class FiguresToChaseController {

    @AuraEnabled
    public static List<AppWrapper> getFiguresToChaseApplications(String searchTerm) {
        // Query applications at Agents Booked or Figures to chased stage
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, StageName, House_Builder__r.Name, Owner.Name, ' +
            'Vendor_1__r.Name, Date_of_Application_Received__c, ' +
            'Agent_1__c, Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Initial_Asking_Price__c, Agent_1_Desktop_Valuation__c, ' +
            'Agent_2__c, Agent_2__r.Name, Agent_2_Appointment__c, Agent_2_Initial_Asking_Price__c, Agent_2_Desktop_Valuation__c, ' +
            'Agent_3__c, Agent_3__r.Name, Agent_3_Appointment__c, Agent_3_Initial_Asking_Price__c, Agent_3_Desktop_Valuation__c ' +
            'FROM Opportunity ' +
            'WHERE (NHS_Process__c = \'Agents Booked\' OR NHS_Process__c = \'Figures to chased\') ' +
            'AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Development__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        DateTime now = DateTime.now();
        List<AppWrapper> results = new List<AppWrapper>();

        for (Opportunity opp : Database.query(query)) {
            // Desktop valuation counts as "visited" — no date/time check needed
            Boolean a1Desktop = opp.Agent_1_Desktop_Valuation__c == true;
            Boolean a2Desktop = opp.Agent_2_Desktop_Valuation__c == true;
            Boolean a3Desktop = opp.Agent_3_Desktop_Valuation__c == true;

            Boolean a1Visited = a1Desktop || (opp.Agent_1_Appointment__c != null && opp.Agent_1_Appointment__c < now);
            Boolean a2Visited = a2Desktop || (opp.Agent_2_Appointment__c != null && opp.Agent_2_Appointment__c < now);
            Boolean a3Visited = a3Desktop || (opp.Agent_3_Appointment__c != null && opp.Agent_3_Appointment__c < now);

            Boolean a1FigMissing = a1Visited && opp.Agent_1_Initial_Asking_Price__c == null;
            Boolean a2FigMissing = a2Visited && opp.Agent_2_Initial_Asking_Price__c == null;
            Boolean a3FigMissing = a3Visited && opp.Agent_3_Initial_Asking_Price__c == null;

            // Only include if at least one agent has visited and their figure is missing
            if (!a1FigMissing && !a2FigMissing && !a3FigMissing) continue;

            AppWrapper w = new AppWrapper();
            w.id = opp.Id;
            w.name = opp.Name;
            w.development = opp.Development__c;
            w.plot = opp.Plot__c;
            w.vendorName = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;
            w.process = opp.NHS_Process__c;

            w.agent1Name = opp.Agent_1__r != null ? opp.Agent_1__r.Name : null;
            w.agent1Date = opp.Agent_1_Appointment__c;
            w.agent1Visited = a1Visited;
            w.agent1FigMissing = a1FigMissing;
            w.agent1Figure = opp.Agent_1_Initial_Asking_Price__c;
            w.agent1Desktop = a1Desktop;

            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Date = opp.Agent_2_Appointment__c;
            w.agent2Visited = a2Visited;
            w.agent2FigMissing = a2FigMissing;
            w.agent2Figure = opp.Agent_2_Initial_Asking_Price__c;
            w.agent2Desktop = a2Desktop;

            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Date = opp.Agent_3_Appointment__c;
            w.agent3Visited = a3Visited;
            w.agent3FigMissing = a3FigMissing;
            w.agent3Figure = opp.Agent_3_Initial_Asking_Price__c;
            w.agent3Desktop = a3Desktop;

            // Count how many figures are pending
            Integer pending = 0;
            if (a1FigMissing) pending++;
            if (a2FigMissing) pending++;
            if (a3FigMissing) pending++;
            w.pendingCount = pending;

            Boolean allVisited = a1Visited && a2Visited && a3Visited;
            w.allVisited = allVisited;

            results.add(w);
        }
        return results;
    }

    public class AppWrapper {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String development { get; set; }
        @AuraEnabled public String plot { get; set; }
        @AuraEnabled public String vendorName { get; set; }
        @AuraEnabled public String process { get; set; }

        @AuraEnabled public String agent1Name { get; set; }
        @AuraEnabled public DateTime agent1Date { get; set; }
        @AuraEnabled public Boolean agent1Visited { get; set; }
        @AuraEnabled public Boolean agent1FigMissing { get; set; }
        @AuraEnabled public Decimal agent1Figure { get; set; }
        @AuraEnabled public Boolean agent1Desktop { get; set; }

        @AuraEnabled public String agent2Name { get; set; }
        @AuraEnabled public DateTime agent2Date { get; set; }
        @AuraEnabled public Boolean agent2Visited { get; set; }
        @AuraEnabled public Boolean agent2FigMissing { get; set; }
        @AuraEnabled public Decimal agent2Figure { get; set; }
        @AuraEnabled public Boolean agent2Desktop { get; set; }

        @AuraEnabled public String agent3Name { get; set; }
        @AuraEnabled public DateTime agent3Date { get; set; }
        @AuraEnabled public Boolean agent3Visited { get; set; }
        @AuraEnabled public Boolean agent3FigMissing { get; set; }
        @AuraEnabled public Decimal agent3Figure { get; set; }
        @AuraEnabled public Boolean agent3Desktop { get; set; }

        @AuraEnabled public Integer pendingCount { get; set; }
        @AuraEnabled public Boolean allVisited { get; set; }
    }
}
