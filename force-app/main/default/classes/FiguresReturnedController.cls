public with sharing class FiguresReturnedController {

    @AuraEnabled
    public static List<AppWrapper> getFiguresReturnedApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, House_Builder__r.Name, Owner.Name, Vendor_1__r.Name, ' +
            'Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Initial_Asking_Price__c, ' +
            'Agent_1_Target_Sale__c, Agent_1_Bottom_Line__c, ' +
            'Agent_2__r.Name, Agent_2_Appointment__c, Agent_2_Initial_Asking_Price__c, ' +
            'Agent_2_Target_Sale__c, Agent_2_Bottom_Line__c, ' +
            'Agent_3__r.Name, Agent_3_Appointment__c, Agent_3_Initial_Asking_Price__c, ' +
            'Agent_3_Target_Sale__c, Agent_3_Bottom_Line__c, ' +
            'Current_Asking_Price__c, Target_Sale__c, Forced_Sale__c ' +
            'FROM Opportunity ' +
            'WHERE Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        List<AppWrapper> results = new List<AppWrapper>();

        for (Opportunity opp : Database.query(query)) {
            // All 3 agents: Initial, Target, Bottom must be > 0
            if (opp.Agent_1_Initial_Asking_Price__c == null || opp.Agent_1_Initial_Asking_Price__c <= 0) continue;
            if (opp.Agent_1_Target_Sale__c == null || opp.Agent_1_Target_Sale__c <= 0) continue;
            if (opp.Agent_1_Bottom_Line__c == null || opp.Agent_1_Bottom_Line__c <= 0) continue;

            if (opp.Agent_2_Initial_Asking_Price__c == null || opp.Agent_2_Initial_Asking_Price__c <= 0) continue;
            if (opp.Agent_2_Target_Sale__c == null || opp.Agent_2_Target_Sale__c <= 0) continue;
            if (opp.Agent_2_Bottom_Line__c == null || opp.Agent_2_Bottom_Line__c <= 0) continue;

            if (opp.Agent_3_Initial_Asking_Price__c == null || opp.Agent_3_Initial_Asking_Price__c <= 0) continue;
            if (opp.Agent_3_Target_Sale__c == null || opp.Agent_3_Target_Sale__c <= 0) continue;
            if (opp.Agent_3_Bottom_Line__c == null || opp.Agent_3_Bottom_Line__c <= 0) continue;

            // NHS Recommended: Market, Target, Forced must be > 0
            if (opp.Current_Asking_Price__c == null || opp.Current_Asking_Price__c <= 0) continue;
            if (opp.Target_Sale__c == null || opp.Target_Sale__c <= 0) continue;
            if (opp.Forced_Sale__c == null || opp.Forced_Sale__c <= 0) continue;

            AppWrapper w = new AppWrapper();
            w.id = opp.Id;
            w.name = opp.Name;
            w.development = opp.Development__c;
            w.plot = opp.Plot__c;
            w.vendorName = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;

            w.agent1Name = opp.Agent_1__r != null ? opp.Agent_1__r.Name : null;
            w.agent1Initial = opp.Agent_1_Initial_Asking_Price__c;
            w.agent1Target = opp.Agent_1_Target_Sale__c;
            w.agent1Bottom = opp.Agent_1_Bottom_Line__c;
            w.agent1Date = opp.Agent_1_Appointment__c;

            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Initial = opp.Agent_2_Initial_Asking_Price__c;
            w.agent2Target = opp.Agent_2_Target_Sale__c;
            w.agent2Bottom = opp.Agent_2_Bottom_Line__c;
            w.agent2Date = opp.Agent_2_Appointment__c;

            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Initial = opp.Agent_3_Initial_Asking_Price__c;
            w.agent3Target = opp.Agent_3_Target_Sale__c;
            w.agent3Bottom = opp.Agent_3_Bottom_Line__c;
            w.agent3Date = opp.Agent_3_Appointment__c;

            w.nhsMarket = opp.Current_Asking_Price__c;
            w.nhsTarget = opp.Target_Sale__c;
            w.nhsForced = opp.Forced_Sale__c;

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

        @AuraEnabled public String agent1Name { get; set; }
        @AuraEnabled public Decimal agent1Initial { get; set; }
        @AuraEnabled public Decimal agent1Target { get; set; }
        @AuraEnabled public Decimal agent1Bottom { get; set; }
        @AuraEnabled public DateTime agent1Date { get; set; }

        @AuraEnabled public String agent2Name { get; set; }
        @AuraEnabled public Decimal agent2Initial { get; set; }
        @AuraEnabled public Decimal agent2Target { get; set; }
        @AuraEnabled public Decimal agent2Bottom { get; set; }
        @AuraEnabled public DateTime agent2Date { get; set; }

        @AuraEnabled public String agent3Name { get; set; }
        @AuraEnabled public Decimal agent3Initial { get; set; }
        @AuraEnabled public Decimal agent3Target { get; set; }
        @AuraEnabled public Decimal agent3Bottom { get; set; }
        @AuraEnabled public DateTime agent3Date { get; set; }

        @AuraEnabled public Decimal nhsMarket { get; set; }
        @AuraEnabled public Decimal nhsTarget { get; set; }
        @AuraEnabled public Decimal nhsForced { get; set; }
    }
}
