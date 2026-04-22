public with sharing class ValuationsReadyController {

    @AuraEnabled
    public static List<AppWrapper> getValuationsReadyApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, House_Builder__r.Name, House_Builder__r.Use_Timeline_Valuations__c, ' +
            'Owner.Name, Vendor_1__r.Name, ' +
            'Agent_1__c, Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Initial_Asking_Price__c, ' +
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
            'WHERE (NHS_Process__c = \'Figures returned\' OR NHS_Process__c = \'Valuations Ready\') ' +
            'AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        DateTime now = DateTime.now();
        List<AppWrapper> results = new List<AppWrapper>();

        for (Opportunity opp : Database.query(query)) {
            // Unassigned Agent 1 => not ready
            if (opp.Agent_1__c == null) continue;

            // Agent 1 = "New Home Solutions" means NHS handles that slot internally —
            // Agent 1 figures are not required. Otherwise all 3 agents need all their figures.
            String a1Name = opp.Agent_1__r != null && opp.Agent_1__r.Name != null
                              ? opp.Agent_1__r.Name.trim().toLowerCase() : '';
            Boolean a1IsNhs = a1Name == 'new home solutions';

            // Which valuation model does this housebuilder use?
            Boolean timelineModel = opp.House_Builder__r != null
                                 && opp.House_Builder__r.Use_Timeline_Valuations__c == true;

            Boolean a2AllFigures;
            Boolean a3AllFigures;
            if (timelineModel) {
                a2AllFigures = opp.Agent_2_Open_Market__c != null
                            && opp.Agent_2_6_8_Week__c != null
                            && opp.Agent_2_4_6_Week__c != null
                            && opp.Agent_2_2_4_Week__c != null;
                a3AllFigures = opp.Agent_3_Open_Market__c != null
                            && opp.Agent_3_6_8_Week__c != null
                            && opp.Agent_3_4_6_Week__c != null
                            && opp.Agent_3_2_4_Week__c != null;
            } else {
                a2AllFigures = opp.Agent_2_Initial_Asking_Price__c != null
                            && opp.Agent_2_Target_Sale__c != null
                            && opp.Agent_2_Bottom_Line__c != null;
                a3AllFigures = opp.Agent_3_Initial_Asking_Price__c != null
                            && opp.Agent_3_Target_Sale__c != null
                            && opp.Agent_3_Bottom_Line__c != null;
            }

            if (!a2AllFigures || !a3AllFigures) continue;

            if (!a1IsNhs) {
                Boolean a1AllFigures;
                if (timelineModel) {
                    a1AllFigures = opp.Agent_1_Open_Market__c != null
                                && opp.Agent_1_6_8_Week__c != null
                                && opp.Agent_1_4_6_Week__c != null
                                && opp.Agent_1_2_4_Week__c != null;
                } else {
                    a1AllFigures = opp.Agent_1_Initial_Asking_Price__c != null
                                && opp.Agent_1_Target_Sale__c != null
                                && opp.Agent_1_Bottom_Line__c != null;
                }
                if (!a1AllFigures) continue;
            }

            // NHS valuation outstanding check — branches on model
            Boolean nhsComplete;
            Boolean nhsMarketSet;
            Boolean nhsTargetSet;
            Boolean nhsForcedSet;
            if (timelineModel) {
                nhsComplete = opp.NHS_Rec_Open_Market__c != null && opp.NHS_Rec_Open_Market__c > 0
                           && opp.NHS_Rec_6_8_Week__c != null   && opp.NHS_Rec_6_8_Week__c > 0
                           && opp.NHS_Rec_4_6_Week__c != null   && opp.NHS_Rec_4_6_Week__c > 0
                           && opp.NHS_Rec_2_4_Week__c != null   && opp.NHS_Rec_2_4_Week__c > 0;
                nhsMarketSet = opp.NHS_Rec_Open_Market__c != null && opp.NHS_Rec_Open_Market__c > 0;
                nhsTargetSet = opp.NHS_Rec_6_8_Week__c != null   && opp.NHS_Rec_6_8_Week__c > 0;
                nhsForcedSet = opp.NHS_Rec_2_4_Week__c != null   && opp.NHS_Rec_2_4_Week__c > 0;
            } else {
                nhsMarketSet = opp.Current_Asking_Price__c != null && opp.Current_Asking_Price__c > 0;
                nhsTargetSet = opp.Target_Sale__c != null && opp.Target_Sale__c > 0;
                nhsForcedSet = opp.Forced_Sale__c != null && opp.Forced_Sale__c > 0;
                nhsComplete = nhsMarketSet && nhsTargetSet && nhsForcedSet;
            }
            if (nhsComplete) continue; // All done, skip

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

            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Initial = opp.Agent_2_Initial_Asking_Price__c;
            w.agent2Target = opp.Agent_2_Target_Sale__c;
            w.agent2Bottom = opp.Agent_2_Bottom_Line__c;

            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Initial = opp.Agent_3_Initial_Asking_Price__c;
            w.agent3Target = opp.Agent_3_Target_Sale__c;
            w.agent3Bottom = opp.Agent_3_Bottom_Line__c;

            w.nhsMarket = opp.Current_Asking_Price__c;
            w.nhsTarget = opp.Target_Sale__c;
            w.nhsForced = opp.Forced_Sale__c;
            w.nhsMarketSet = nhsMarketSet;
            w.nhsTargetSet = nhsTargetSet;
            w.nhsForcedSet = nhsForcedSet;
            w.useTimeline = timelineModel;

            // Build per-agent "missing" lists for hover tooltips — branches on valuation model
            if (timelineModel) {
                w.agent1MissingList = buildTimelineMissing(opp.Agent_1_Open_Market__c, opp.Agent_1_6_8_Week__c, opp.Agent_1_4_6_Week__c, opp.Agent_1_2_4_Week__c);
                w.agent2MissingList = buildTimelineMissing(opp.Agent_2_Open_Market__c, opp.Agent_2_6_8_Week__c, opp.Agent_2_4_6_Week__c, opp.Agent_2_2_4_Week__c);
                w.agent3MissingList = buildTimelineMissing(opp.Agent_3_Open_Market__c, opp.Agent_3_6_8_Week__c, opp.Agent_3_4_6_Week__c, opp.Agent_3_2_4_Week__c);
                w.nhsMissingList = buildTimelineMissing(opp.NHS_Rec_Open_Market__c, opp.NHS_Rec_6_8_Week__c, opp.NHS_Rec_4_6_Week__c, opp.NHS_Rec_2_4_Week__c);
            } else {
                w.agent1MissingList = buildStandardMissing(opp.Agent_1_Initial_Asking_Price__c, opp.Agent_1_Target_Sale__c, opp.Agent_1_Bottom_Line__c);
                w.agent2MissingList = buildStandardMissing(opp.Agent_2_Initial_Asking_Price__c, opp.Agent_2_Target_Sale__c, opp.Agent_2_Bottom_Line__c);
                w.agent3MissingList = buildStandardMissing(opp.Agent_3_Initial_Asking_Price__c, opp.Agent_3_Target_Sale__c, opp.Agent_3_Bottom_Line__c);
                List<String> nhsParts = new List<String>();
                if (!nhsMarketSet) nhsParts.add('Market');
                if (!nhsTargetSet) nhsParts.add('Target');
                if (!nhsForcedSet) nhsParts.add('Forced');
                w.nhsMissingList = String.join(nhsParts, ', ');
            }

            Integer pending = 0;
            if (!nhsMarketSet) pending++;
            if (!nhsTargetSet) pending++;
            if (!nhsForcedSet) pending++;
            w.nhsPending = pending;

            results.add(w);
        }
        return results;
    }

    private static String buildTimelineMissing(Decimal openMarket, Decimal w68, Decimal w46, Decimal w24) {
        List<String> parts = new List<String>();
        if (openMarket == null || openMarket == 0) parts.add('Open Market');
        if (w68 == null || w68 == 0)               parts.add('6–8 Week');
        if (w46 == null || w46 == 0)               parts.add('4–6 Week');
        if (w24 == null || w24 == 0)               parts.add('2–4 Week');
        return String.join(parts, ', ');
    }

    private static String buildStandardMissing(Decimal initial, Decimal target, Decimal bottom) {
        List<String> parts = new List<String>();
        if (initial == null) parts.add('Initial Asking');
        if (target == null)  parts.add('Target Sale');
        if (bottom == null)  parts.add('Bottom Price');
        return String.join(parts, ', ');
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

        @AuraEnabled public String agent2Name { get; set; }
        @AuraEnabled public Decimal agent2Initial { get; set; }
        @AuraEnabled public Decimal agent2Target { get; set; }
        @AuraEnabled public Decimal agent2Bottom { get; set; }

        @AuraEnabled public String agent3Name { get; set; }
        @AuraEnabled public Decimal agent3Initial { get; set; }
        @AuraEnabled public Decimal agent3Target { get; set; }
        @AuraEnabled public Decimal agent3Bottom { get; set; }

        @AuraEnabled public Decimal nhsMarket { get; set; }
        @AuraEnabled public Decimal nhsTarget { get; set; }
        @AuraEnabled public Decimal nhsForced { get; set; }
        @AuraEnabled public Boolean nhsMarketSet { get; set; }
        @AuraEnabled public Boolean nhsTargetSet { get; set; }
        @AuraEnabled public Boolean nhsForcedSet { get; set; }
        @AuraEnabled public Integer nhsPending { get; set; }
        @AuraEnabled public Boolean useTimeline { get; set; }

        @AuraEnabled public String agent1MissingList { get; set; }
        @AuraEnabled public String agent2MissingList { get; set; }
        @AuraEnabled public String agent3MissingList { get; set; }
        @AuraEnabled public String nhsMissingList    { get; set; }
    }
}
