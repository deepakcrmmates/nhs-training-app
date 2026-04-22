public with sharing class FiguresToChaseController {

    @AuraEnabled
    public static List<AppWrapper> getFiguresToChaseApplications(String searchTerm) {
        // Query applications at Agents Booked or Figures to chased stage
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'NHS_Process__c, StageName, House_Builder__r.Name, House_Builder__r.Use_Timeline_Valuations__c, Owner.Name, ' +
            'Vendor_1__r.Name, Date_of_Application_Received__c, ' +
            'Agent_1__c, Agent_1__r.Name, Agent_1_Appointment__c, Agent_1_Initial_Asking_Price__c, Agent_1_Desktop_Valuation__c, ' +
            'Agent_1_Open_Market__c, Agent_1_6_8_Week__c, Agent_1_4_6_Week__c, Agent_1_2_4_Week__c, ' +
            'Agent_2__c, Agent_2__r.Name, Agent_2_Appointment__c, Agent_2_Initial_Asking_Price__c, Agent_2_Desktop_Valuation__c, ' +
            'Agent_2_Open_Market__c, Agent_2_6_8_Week__c, Agent_2_4_6_Week__c, Agent_2_2_4_Week__c, ' +
            'Agent_3__c, Agent_3__r.Name, Agent_3_Appointment__c, Agent_3_Initial_Asking_Price__c, Agent_3_Desktop_Valuation__c, ' +
            'Agent_3_Open_Market__c, Agent_3_6_8_Week__c, Agent_3_4_6_Week__c, Agent_3_2_4_Week__c ' +
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

            // Which valuation model does this housebuilder use?
            Boolean timelineModel = opp.House_Builder__r != null
                                 && opp.House_Builder__r.Use_Timeline_Valuations__c == true;

            Boolean a1HasFigures;
            Boolean a2HasFigures;
            Boolean a3HasFigures;
            String a1Missing;
            String a2Missing;
            String a3Missing;
            if (timelineModel) {
                // Timeline: all 4 timeframes must be populated
                a1HasFigures = opp.Agent_1_Open_Market__c != null
                            && opp.Agent_1_6_8_Week__c != null
                            && opp.Agent_1_4_6_Week__c != null
                            && opp.Agent_1_2_4_Week__c != null;
                a2HasFigures = opp.Agent_2_Open_Market__c != null
                            && opp.Agent_2_6_8_Week__c != null
                            && opp.Agent_2_4_6_Week__c != null
                            && opp.Agent_2_2_4_Week__c != null;
                a3HasFigures = opp.Agent_3_Open_Market__c != null
                            && opp.Agent_3_6_8_Week__c != null
                            && opp.Agent_3_4_6_Week__c != null
                            && opp.Agent_3_2_4_Week__c != null;
                a1Missing = buildTimelineMissing(opp.Agent_1_Open_Market__c, opp.Agent_1_6_8_Week__c, opp.Agent_1_4_6_Week__c, opp.Agent_1_2_4_Week__c);
                a2Missing = buildTimelineMissing(opp.Agent_2_Open_Market__c, opp.Agent_2_6_8_Week__c, opp.Agent_2_4_6_Week__c, opp.Agent_2_2_4_Week__c);
                a3Missing = buildTimelineMissing(opp.Agent_3_Open_Market__c, opp.Agent_3_6_8_Week__c, opp.Agent_3_4_6_Week__c, opp.Agent_3_2_4_Week__c);
            } else {
                // Standard: just Initial_Asking_Price needs to be populated
                a1HasFigures = opp.Agent_1_Initial_Asking_Price__c != null;
                a2HasFigures = opp.Agent_2_Initial_Asking_Price__c != null;
                a3HasFigures = opp.Agent_3_Initial_Asking_Price__c != null;
                a1Missing = a1HasFigures ? '' : 'Initial Asking';
                a2Missing = a2HasFigures ? '' : 'Initial Asking';
                a3Missing = a3HasFigures ? '' : 'Initial Asking';
            }

            Boolean a1FigMissing = a1Visited && !a1HasFigures;
            Boolean a2FigMissing = a2Visited && !a2HasFigures;
            Boolean a3FigMissing = a3Visited && !a3HasFigures;

            // Always show records in "Figures to chased" stage
            // For "Agents Booked" stage, only show if at least one agent has visited with missing figure
            if (opp.NHS_Process__c == 'Agents Booked' && !a1FigMissing && !a2FigMissing && !a3FigMissing) continue;

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
            w.agent1MissingList = a1Missing;

            w.agent2Name = opp.Agent_2__r != null ? opp.Agent_2__r.Name : null;
            w.agent2Date = opp.Agent_2_Appointment__c;
            w.agent2Visited = a2Visited;
            w.agent2FigMissing = a2FigMissing;
            w.agent2Figure = opp.Agent_2_Initial_Asking_Price__c;
            w.agent2Desktop = a2Desktop;
            w.agent2MissingList = a2Missing;

            w.agent3Name = opp.Agent_3__r != null ? opp.Agent_3__r.Name : null;
            w.agent3Date = opp.Agent_3_Appointment__c;
            w.agent3Visited = a3Visited;
            w.agent3FigMissing = a3FigMissing;
            w.agent3Figure = opp.Agent_3_Initial_Asking_Price__c;
            w.agent3Desktop = a3Desktop;
            w.agent3MissingList = a3Missing;

            w.useTimeline = timelineModel;

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

    private static String buildTimelineMissing(Decimal openMarket, Decimal w68, Decimal w46, Decimal w24) {
        List<String> parts = new List<String>();
        if (openMarket == null) parts.add('Open Market');
        if (w68 == null)        parts.add('6–8 Week');
        if (w46 == null)        parts.add('4–6 Week');
        if (w24 == null)        parts.add('2–4 Week');
        return String.join(parts, ', ');
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

        @AuraEnabled public String agent1MissingList { get; set; }
        @AuraEnabled public String agent2MissingList { get; set; }
        @AuraEnabled public String agent3MissingList { get; set; }
        @AuraEnabled public Boolean useTimeline { get; set; }
    }
}
