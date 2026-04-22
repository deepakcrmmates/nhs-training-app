public with sharing class FinalChecksController {

    @AuraEnabled
    public static List<AppWrapper> getFinalChecksApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'House_Builder__r.Name, House_Builder__r.Vendor_Discussion_Approved__c, House_Builder__r.Use_Timeline_Valuations__c, Owner.Name, Vendor_1__r.Name, ' +
            'Application_Reference_Number__c, Date_of_Application_Received__c, ' +
            'FC_Agent_1_Report__c, FC_Agent_2_Report__c, FC_Agent_3_Report__c, ' +
            'FC_NHS_Pre_Will_Report__c, FC_Will_Report__c, ' +
            'FC_Photos_Validated__c, FC_Address_Validated__c ' +
            'FROM Opportunity ' +
            'WHERE NHS_Process__c = \'Final Checks\' AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        List<AppWrapper> results = new List<AppWrapper>();
        for (Opportunity opp : Database.query(query)) {
            results.add(new AppWrapper(opp));
        }
        return results;
    }

    @AuraEnabled
    public static List<Map<String, String>> getVendorDiscussionsApplications(String searchTerm) {
        String query =
            'SELECT Id, Name, Property_Address__c, Development__c, Plot__c, ' +
            'House_Builder__r.Name, Owner.Name, Vendor_1__r.Name, ' +
            'Vendor_1_Email__c, Vendor_1_Mobile__c, VD_Priority__c, ' +
            'Application_Reference_Number__c, Date_of_Application_Received__c ' +
            'FROM Opportunity ' +
            'WHERE NHS_Process__c = \'Vendor Discussions\' AND Archived__c = false ';

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Property_Address__c LIKE \'' + safe + '\'' +
                     ' OR Vendor_1__r.Name LIKE \'' + safe + '\'' +
                     ' OR House_Builder__r.Name LIKE \'' + safe + '\') ';
        }

        query += ' ORDER BY Date_of_Application_Received__c DESC LIMIT 100';

        List<Map<String, String>> results = new List<Map<String, String>>();
        for (Opportunity opp : Database.query(query)) {
            Map<String, String> row = new Map<String, String>();
            row.put('id', opp.Id);
            row.put('name', opp.Name);
            row.put('address', opp.Property_Address__c != null ? opp.Property_Address__c : '');
            row.put('development', opp.Development__c != null ? opp.Development__c : '');
            row.put('plot', opp.Plot__c != null ? opp.Plot__c : '');
            row.put('houseBuilder', opp.House_Builder__r != null ? opp.House_Builder__r.Name : '');
            row.put('ownerName', opp.Owner.Name);
            row.put('vendorName', opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : '');
            row.put('vendorEmail', opp.Vendor_1_Email__c != null ? opp.Vendor_1_Email__c : '');
            row.put('vendorMobile', opp.Vendor_1_Mobile__c != null ? opp.Vendor_1_Mobile__c : '');
            row.put('refNumber', opp.Application_Reference_Number__c != null ? opp.Application_Reference_Number__c : '');
            row.put('priority', opp.VD_Priority__c != null ? opp.VD_Priority__c : '');
            results.add(row);
        }
        return results;
    }

    @AuraEnabled
    public static String updateVDPriority(Id opportunityId, String priority) {
        try {
            update new Opportunity(Id = opportunityId, VD_Priority__c = priority);
            return 'OK';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update priority: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Map<String, Boolean> getFinalChecks(Id opportunityId) {
        Opportunity opp = [
            SELECT FC_Agent_1_Report__c, FC_Agent_2_Report__c, FC_Agent_3_Report__c,
                   FC_NHS_Pre_Will_Report__c, FC_Will_Report__c,
                   FC_Photos_Validated__c, FC_Address_Validated__c
            FROM Opportunity WHERE Id = :opportunityId LIMIT 1
        ];
        return new Map<String, Boolean>{
            'agent1Report'     => opp.FC_Agent_1_Report__c,
            'agent2Report'     => opp.FC_Agent_2_Report__c,
            'agent3Report'     => opp.FC_Agent_3_Report__c,
            'nhsPreWillReport' => opp.FC_NHS_Pre_Will_Report__c,
            'willReport'       => opp.FC_Will_Report__c,
            'photosValidated'  => opp.FC_Photos_Validated__c,
            'addressValidated' => opp.FC_Address_Validated__c
        };
    }

    @AuraEnabled
    public static Map<String, Object> getFinalChecksPageData(Id opportunityId) {
        Opportunity opp = [
            SELECT Name, Property_Address__c, Development__c, Plot__c,
                   House_Builder__c, House_Builder__r.Name, House_Builder__r.Email__c,
                   House_Builder__r.Vendor_Discussion_Approved__c,
                   House_Builder__r.Use_Timeline_Valuations__c,
                   Vendor_1__r.Name,
                   Vendor_1_Email__c, Vendor_1_Mobile__c,
                   Agent_1__r.Name, Agent_1_Initial_Asking_Price__c,
                   Agent_1_Target_Sale__c, Agent_1_Bottom_Line__c,
                   Agent_1_Open_Market__c, Agent_1_6_8_Week__c, Agent_1_4_6_Week__c, Agent_1_2_4_Week__c,
                   Agent_2__r.Name, Agent_2_Initial_Asking_Price__c,
                   Agent_2_Target_Sale__c, Agent_2_Bottom_Line__c,
                   Agent_2_Open_Market__c, Agent_2_6_8_Week__c, Agent_2_4_6_Week__c, Agent_2_2_4_Week__c,
                   Agent_3__r.Name, Agent_3_Initial_Asking_Price__c,
                   Agent_3_Target_Sale__c, Agent_3_Bottom_Line__c,
                   Agent_3_Open_Market__c, Agent_3_6_8_Week__c, Agent_3_4_6_Week__c, Agent_3_2_4_Week__c,
                   Current_Asking_Price__c, Target_Sale__c, Forced_Sale__c,
                   NHS_Rec_Open_Market__c, NHS_Rec_6_8_Week__c, NHS_Rec_4_6_Week__c, NHS_Rec_2_4_Week__c,
                   FC_Agent_1_Report__c, FC_Agent_2_Report__c, FC_Agent_3_Report__c,
                   FC_NHS_Pre_Will_Report__c, FC_Will_Report__c,
                   FC_Photos_Validated__c, FC_Address_Validated__c,
                   Vendor_1__c
            FROM Opportunity WHERE Id = :opportunityId LIMIT 1
        ];

        Map<String, Object> data = new Map<String, Object>();
        data.put('name', opp.Name);
        data.put('address', opp.Property_Address__c);
        data.put('development', opp.Development__c);
        data.put('plot', opp.Plot__c);
        data.put('builderName', opp.House_Builder__r != null ? opp.House_Builder__r.Name : '');
        data.put('builderId', opp.House_Builder__c);
        data.put('builderApproved', opp.House_Builder__r != null ? opp.House_Builder__r.Vendor_Discussion_Approved__c : false);
        data.put('vendorName', opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : '');
        data.put('vendorEmail', opp.Vendor_1_Email__c != null ? opp.Vendor_1_Email__c : '');
        data.put('vendorMobile', opp.Vendor_1_Mobile__c != null ? opp.Vendor_1_Mobile__c : '');
        data.put('vendorContactId', opp.Vendor_1__c);

        // House Builder contacts with email
        List<Map<String, String>> builderContacts = new List<Map<String, String>>();
        if (opp.House_Builder__c != null) {
            for (Contact c : [
                SELECT Id, Name, Email FROM Contact
                WHERE AccountId = :opp.House_Builder__c AND Email != null
                ORDER BY Name LIMIT 50
            ]) {
                builderContacts.add(new Map<String, String>{
                    'id' => c.Id,
                    'name' => c.Name,
                    'email' => c.Email
                });
            }
        }
        data.put('builderContacts', builderContacts);

        // Timeline flag
        data.put('useTimelineValuations', opp.House_Builder__r != null && opp.House_Builder__r.Use_Timeline_Valuations__c == true);

        // Agent 1
        data.put('agent1Name', opp.Agent_1__r != null ? opp.Agent_1__r.Name : '');
        data.put('agent1Initial', opp.Agent_1_Initial_Asking_Price__c);
        data.put('agent1Target', opp.Agent_1_Target_Sale__c);
        data.put('agent1Bottom', opp.Agent_1_Bottom_Line__c);
        data.put('a1OpenMarket', opp.Agent_1_Open_Market__c);
        data.put('a1_6_8_Week', opp.Agent_1_6_8_Week__c);
        data.put('a1_4_6_Week', opp.Agent_1_4_6_Week__c);
        data.put('a1_2_4_Week', opp.Agent_1_2_4_Week__c);
        // Agent 2
        data.put('agent2Name', opp.Agent_2__r != null ? opp.Agent_2__r.Name : '');
        data.put('agent2Initial', opp.Agent_2_Initial_Asking_Price__c);
        data.put('agent2Target', opp.Agent_2_Target_Sale__c);
        data.put('agent2Bottom', opp.Agent_2_Bottom_Line__c);
        data.put('a2OpenMarket', opp.Agent_2_Open_Market__c);
        data.put('a2_6_8_Week', opp.Agent_2_6_8_Week__c);
        data.put('a2_4_6_Week', opp.Agent_2_4_6_Week__c);
        data.put('a2_2_4_Week', opp.Agent_2_2_4_Week__c);
        // Agent 3
        data.put('agent3Name', opp.Agent_3__r != null ? opp.Agent_3__r.Name : '');
        data.put('agent3Initial', opp.Agent_3_Initial_Asking_Price__c);
        data.put('agent3Target', opp.Agent_3_Target_Sale__c);
        data.put('agent3Bottom', opp.Agent_3_Bottom_Line__c);
        data.put('a3OpenMarket', opp.Agent_3_Open_Market__c);
        data.put('a3_6_8_Week', opp.Agent_3_6_8_Week__c);
        data.put('a3_4_6_Week', opp.Agent_3_4_6_Week__c);
        data.put('a3_2_4_Week', opp.Agent_3_2_4_Week__c);

        // NHS
        data.put('nhsMarket', opp.Current_Asking_Price__c);
        data.put('nhsTarget', opp.Target_Sale__c);
        data.put('nhsForced', opp.Forced_Sale__c);
        data.put('nhsRecOpenMarket', opp.NHS_Rec_Open_Market__c);
        data.put('nhsRec_6_8_Week', opp.NHS_Rec_6_8_Week__c);
        data.put('nhsRec_4_6_Week', opp.NHS_Rec_4_6_Week__c);
        data.put('nhsRec_2_4_Week', opp.NHS_Rec_2_4_Week__c);

        // Checks
        data.put('agent1Report', opp.FC_Agent_1_Report__c);
        data.put('agent2Report', opp.FC_Agent_2_Report__c);
        data.put('agent3Report', opp.FC_Agent_3_Report__c);
        data.put('nhsPreWillReport', opp.FC_NHS_Pre_Will_Report__c);
        data.put('willReport', opp.FC_Will_Report__c);
        data.put('photosValidated', opp.FC_Photos_Validated__c);
        data.put('addressValidated', opp.FC_Address_Validated__c);

        // Configured default email template for Final Checks — picks Timeline variant when the housebuilder is on the timeline model
        Boolean timelineModel = opp.House_Builder__r != null && opp.House_Builder__r.Use_Timeline_Valuations__c == true;
        String defaultTemplateId = '';
        for (NHS_API_Config__c cfg : [
            SELECT Final_Checks_Email_Template_Id__c, Final_Checks_Email_Template_Timeline_Id__c
            FROM NHS_API_Config__c LIMIT 1
        ]) {
            defaultTemplateId = timelineModel
                ? cfg.Final_Checks_Email_Template_Timeline_Id__c
                : cfg.Final_Checks_Email_Template_Id__c;
            // Fallback: if the timeline-specific template isn't configured, fall back to the standard one so the page still functions
            if (timelineModel && String.isBlank(defaultTemplateId)) {
                defaultTemplateId = cfg.Final_Checks_Email_Template_Id__c;
            }
        }
        data.put('defaultTemplateId', defaultTemplateId);

        return data;
    }

    @AuraEnabled
    public static String saveFinalChecks(Id opportunityId, Map<String, Boolean> checks) {
        if (opportunityId == null) {
            throw new AuraHandledException('Opportunity ID is required.');
        }
        try {
            Opportunity opp = new Opportunity(Id = opportunityId);
            if (checks.containsKey('agent1Report'))     opp.FC_Agent_1_Report__c      = checks.get('agent1Report');
            if (checks.containsKey('agent2Report'))     opp.FC_Agent_2_Report__c      = checks.get('agent2Report');
            if (checks.containsKey('agent3Report'))     opp.FC_Agent_3_Report__c      = checks.get('agent3Report');
            if (checks.containsKey('nhsPreWillReport')) opp.FC_NHS_Pre_Will_Report__c = checks.get('nhsPreWillReport');
            if (checks.containsKey('willReport'))       opp.FC_Will_Report__c         = checks.get('willReport');
            if (checks.containsKey('photosValidated'))  opp.FC_Photos_Validated__c    = checks.get('photosValidated');
            if (checks.containsKey('addressValidated')) opp.FC_Address_Validated__c   = checks.get('addressValidated');
            update opp;
            return 'OK';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to save: ' + e.getMessage());
        }
    }

    public class AppWrapper {
        @AuraEnabled public String  id              { get; set; }
        @AuraEnabled public String  name            { get; set; }
        @AuraEnabled public String  address         { get; set; }
        @AuraEnabled public String  development     { get; set; }
        @AuraEnabled public String  plot            { get; set; }
        @AuraEnabled public String  houseBuilder    { get; set; }
        @AuraEnabled public String  ownerName       { get; set; }
        @AuraEnabled public String  vendorName      { get; set; }
        @AuraEnabled public String  refNumber       { get; set; }
        @AuraEnabled public Boolean agent1Report    { get; set; }
        @AuraEnabled public Boolean agent2Report    { get; set; }
        @AuraEnabled public Boolean agent3Report    { get; set; }
        @AuraEnabled public Boolean nhsPreWillReport { get; set; }
        @AuraEnabled public Boolean willReport      { get; set; }
        @AuraEnabled public Boolean photosValidated { get; set; }
        @AuraEnabled public Boolean addressValidated { get; set; }
        @AuraEnabled public Integer checkedCount    { get; set; }
        @AuraEnabled public Boolean builderApproved { get; set; }
        @AuraEnabled public Boolean useTimeline     { get; set; }

        public AppWrapper(Opportunity opp) {
            this.id              = opp.Id;
            this.name            = opp.Name;
            this.address         = opp.Property_Address__c;
            this.development     = opp.Development__c;
            this.plot            = opp.Plot__c;
            this.houseBuilder    = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
            this.builderApproved = opp.House_Builder__r != null ? opp.House_Builder__r.Vendor_Discussion_Approved__c : false;
            this.useTimeline     = opp.House_Builder__r != null && opp.House_Builder__r.Use_Timeline_Valuations__c == true;
            this.ownerName       = opp.Owner.Name;
            this.vendorName      = opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : null;
            this.refNumber       = opp.Application_Reference_Number__c;
            this.agent1Report    = opp.FC_Agent_1_Report__c;
            this.agent2Report    = opp.FC_Agent_2_Report__c;
            this.agent3Report    = opp.FC_Agent_3_Report__c;
            this.nhsPreWillReport = opp.FC_NHS_Pre_Will_Report__c;
            this.willReport      = opp.FC_Will_Report__c;
            this.photosValidated = opp.FC_Photos_Validated__c;
            this.addressValidated = opp.FC_Address_Validated__c;

            Integer count = 0;
            if (this.agent1Report)     count++;
            if (this.agent2Report)     count++;
            if (this.agent3Report)     count++;
            if (this.nhsPreWillReport) count++;
            if (this.willReport)       count++;
            if (this.photosValidated)  count++;
            if (this.addressValidated) count++;
            this.checkedCount = count;
        }
    }
}
