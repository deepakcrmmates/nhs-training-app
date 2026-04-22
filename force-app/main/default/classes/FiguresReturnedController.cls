public with sharing class FiguresReturnedController {

    @AuraEnabled
    public static List<AppWrapper> getFiguresReturnedApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, House_Builder__r.Name, House_Builder__r.Use_Timeline_Valuations__c, ' +
            'Owner.Name, Vendor_1__r.Name, ' +
            'Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Initial_Asking_Price__c, ' +
            'Agent_1_Target_Sale__c, Agent_1_Bottom_Line__c, ' +
            'Agent_1_Open_Market__c, Agent_1_6_8_Week__c, Agent_1_4_6_Week__c, Agent_1_2_4_Week__c, ' +
            'Agent_2__r.Name, Agent_2_Appointment__c, Agent_2_Initial_Asking_Price__c, ' +
            'Agent_2_Target_Sale__c, Agent_2_Bottom_Line__c, ' +
            'Agent_2_Open_Market__c, Agent_2_6_8_Week__c, Agent_2_4_6_Week__c, Agent_2_2_4_Week__c, ' +
            'Agent_3__r.Name, Agent_3_Appointment__c, Agent_3_Initial_Asking_Price__c, ' +
            'Agent_3_Target_Sale__c, Agent_3_Bottom_Line__c, ' +
            'Agent_3_Open_Market__c, Agent_3_6_8_Week__c, Agent_3_4_6_Week__c, Agent_3_2_4_Week__c, ' +
            'Current_Asking_Price__c, Target_Sale__c, Forced_Sale__c, ' +
            'NHS_Rec_Open_Market__c, NHS_Rec_6_8_Week__c, NHS_Rec_4_6_Week__c, NHS_Rec_2_4_Week__c ' +
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
            Boolean timelineModel = opp.House_Builder__r != null
                                 && opp.House_Builder__r.Use_Timeline_Valuations__c == true;

            if (timelineModel) {
                // Timeline: all 4 timeframes on each agent + 4 NHS_Rec timeframes must be > 0
                if (!isPositive(opp.Agent_1_Open_Market__c)) continue;
                if (!isPositive(opp.Agent_1_6_8_Week__c))   continue;
                if (!isPositive(opp.Agent_1_4_6_Week__c))   continue;
                if (!isPositive(opp.Agent_1_2_4_Week__c))   continue;

                if (!isPositive(opp.Agent_2_Open_Market__c)) continue;
                if (!isPositive(opp.Agent_2_6_8_Week__c))   continue;
                if (!isPositive(opp.Agent_2_4_6_Week__c))   continue;
                if (!isPositive(opp.Agent_2_2_4_Week__c))   continue;

                if (!isPositive(opp.Agent_3_Open_Market__c)) continue;
                if (!isPositive(opp.Agent_3_6_8_Week__c))   continue;
                if (!isPositive(opp.Agent_3_4_6_Week__c))   continue;
                if (!isPositive(opp.Agent_3_2_4_Week__c))   continue;

                if (!isPositive(opp.NHS_Rec_Open_Market__c)) continue;
                if (!isPositive(opp.NHS_Rec_6_8_Week__c))   continue;
                if (!isPositive(opp.NHS_Rec_4_6_Week__c))   continue;
                if (!isPositive(opp.NHS_Rec_2_4_Week__c))   continue;
            } else {
                // Standard: all 3 figures on each agent + 3 NHS figures must be > 0
                if (!isPositive(opp.Agent_1_Initial_Asking_Price__c)) continue;
                if (!isPositive(opp.Agent_1_Target_Sale__c))          continue;
                if (!isPositive(opp.Agent_1_Bottom_Line__c))          continue;

                if (!isPositive(opp.Agent_2_Initial_Asking_Price__c)) continue;
                if (!isPositive(opp.Agent_2_Target_Sale__c))          continue;
                if (!isPositive(opp.Agent_2_Bottom_Line__c))          continue;

                if (!isPositive(opp.Agent_3_Initial_Asking_Price__c)) continue;
                if (!isPositive(opp.Agent_3_Target_Sale__c))          continue;
                if (!isPositive(opp.Agent_3_Bottom_Line__c))          continue;

                if (!isPositive(opp.Current_Asking_Price__c))         continue;
                if (!isPositive(opp.Target_Sale__c))                  continue;
                if (!isPositive(opp.Forced_Sale__c))                  continue;
            }

            AppWrapper w = new AppWrapper();
            w.id = opp.Id;
            w.name = opp.Name;
            w.development = opp.Development__c;
            w.plot = opp.Plot__c;
            w.vendorName = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;
            w.useTimeline = timelineModel;

            // Agent names + appointments always populated (branching applies to figures only)
            w.agent1Name = opp.Agent_1__r != null ? opp.Agent_1__r.Name : null;
            w.agent1Date = opp.Agent_1_Appointment__c;
            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Date = opp.Agent_2_Appointment__c;
            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Date = opp.Agent_3_Appointment__c;

            // Standard figures (used when useTimeline == false)
            w.agent1Initial = opp.Agent_1_Initial_Asking_Price__c;
            w.agent1Target  = opp.Agent_1_Target_Sale__c;
            w.agent1Bottom  = opp.Agent_1_Bottom_Line__c;
            w.agent2Initial = opp.Agent_2_Initial_Asking_Price__c;
            w.agent2Target  = opp.Agent_2_Target_Sale__c;
            w.agent2Bottom  = opp.Agent_2_Bottom_Line__c;
            w.agent3Initial = opp.Agent_3_Initial_Asking_Price__c;
            w.agent3Target  = opp.Agent_3_Target_Sale__c;
            w.agent3Bottom  = opp.Agent_3_Bottom_Line__c;
            w.nhsMarket = opp.Current_Asking_Price__c;
            w.nhsTarget = opp.Target_Sale__c;
            w.nhsForced = opp.Forced_Sale__c;

            // Timeline figures (used when useTimeline == true)
            w.a1OpenMarket = opp.Agent_1_Open_Market__c;
            w.a1_6_8_Week  = opp.Agent_1_6_8_Week__c;
            w.a1_4_6_Week  = opp.Agent_1_4_6_Week__c;
            w.a1_2_4_Week  = opp.Agent_1_2_4_Week__c;
            w.a2OpenMarket = opp.Agent_2_Open_Market__c;
            w.a2_6_8_Week  = opp.Agent_2_6_8_Week__c;
            w.a2_4_6_Week  = opp.Agent_2_4_6_Week__c;
            w.a2_2_4_Week  = opp.Agent_2_2_4_Week__c;
            w.a3OpenMarket = opp.Agent_3_Open_Market__c;
            w.a3_6_8_Week  = opp.Agent_3_6_8_Week__c;
            w.a3_4_6_Week  = opp.Agent_3_4_6_Week__c;
            w.a3_2_4_Week  = opp.Agent_3_2_4_Week__c;
            w.nhsRecOpenMarket = opp.NHS_Rec_Open_Market__c;
            w.nhsRec_6_8_Week  = opp.NHS_Rec_6_8_Week__c;
            w.nhsRec_4_6_Week  = opp.NHS_Rec_4_6_Week__c;
            w.nhsRec_2_4_Week  = opp.NHS_Rec_2_4_Week__c;

            results.add(w);
        }
        return results;
    }

    private static Boolean isPositive(Decimal v) {
        return v != null && v > 0;
    }

    public class AppWrapper {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String development { get; set; }
        @AuraEnabled public String plot { get; set; }
        @AuraEnabled public String vendorName { get; set; }
        @AuraEnabled public Boolean useTimeline { get; set; }

        @AuraEnabled public String agent1Name { get; set; }
        @AuraEnabled public DateTime agent1Date { get; set; }
        @AuraEnabled public Decimal agent1Initial { get; set; }
        @AuraEnabled public Decimal agent1Target { get; set; }
        @AuraEnabled public Decimal agent1Bottom { get; set; }
        @AuraEnabled public Decimal a1OpenMarket { get; set; }
        @AuraEnabled public Decimal a1_6_8_Week { get; set; }
        @AuraEnabled public Decimal a1_4_6_Week { get; set; }
        @AuraEnabled public Decimal a1_2_4_Week { get; set; }

        @AuraEnabled public String agent2Name { get; set; }
        @AuraEnabled public DateTime agent2Date { get; set; }
        @AuraEnabled public Decimal agent2Initial { get; set; }
        @AuraEnabled public Decimal agent2Target { get; set; }
        @AuraEnabled public Decimal agent2Bottom { get; set; }
        @AuraEnabled public Decimal a2OpenMarket { get; set; }
        @AuraEnabled public Decimal a2_6_8_Week { get; set; }
        @AuraEnabled public Decimal a2_4_6_Week { get; set; }
        @AuraEnabled public Decimal a2_2_4_Week { get; set; }

        @AuraEnabled public String agent3Name { get; set; }
        @AuraEnabled public DateTime agent3Date { get; set; }
        @AuraEnabled public Decimal agent3Initial { get; set; }
        @AuraEnabled public Decimal agent3Target { get; set; }
        @AuraEnabled public Decimal agent3Bottom { get; set; }
        @AuraEnabled public Decimal a3OpenMarket { get; set; }
        @AuraEnabled public Decimal a3_6_8_Week { get; set; }
        @AuraEnabled public Decimal a3_4_6_Week { get; set; }
        @AuraEnabled public Decimal a3_2_4_Week { get; set; }

        @AuraEnabled public Decimal nhsMarket { get; set; }
        @AuraEnabled public Decimal nhsTarget { get; set; }
        @AuraEnabled public Decimal nhsForced { get; set; }
        @AuraEnabled public Decimal nhsRecOpenMarket { get; set; }
        @AuraEnabled public Decimal nhsRec_6_8_Week { get; set; }
        @AuraEnabled public Decimal nhsRec_4_6_Week { get; set; }
        @AuraEnabled public Decimal nhsRec_2_4_Week { get; set; }
    }
}
