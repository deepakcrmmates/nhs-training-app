public with sharing class NhsApplicationKanbanController {

    private static final Set<String> APPLICATION_SUBSTAGES = new Set<String>{
        'To be contacted',
        '1st Contact',
        '2nd Contact',
        '3rd Contact',
        'Sale Cancelled'
    };

    // cacheable=TRUE — required for @wire in LWC.
    // refreshApex() bypasses this cache after DML so both requirements are satisfied.
    @AuraEnabled(cacheable=true)
    public static List<KanbanColumnWrapper> getApplicationKanbanData(
        String searchTerm,
        String assigneeFilter,
        Boolean showArchived
    ) {
        String query =
            'SELECT Id, Name, StageName, NHS_Process__c, Archived__c, Pinned__c, SortOrder__c, ' +
            'House_Builder__c, House_Builder__r.Name, House_Builder__r.BillingCity, ' +
            'Plot__c, Application_Reference_Number__c, CloseDate, CreatedDate, ' +
            'Amount, Owner.Name, Sales_Advisor__c, NHS_Sales_Advisor__c, ' +
            'Development__c ' +
            'FROM Opportunity ' +
            'WHERE NHS_Process__c = \'Application\' ';

        if (showArchived == null || !showArchived) {
            query += ' AND Archived__c = false ';
        }

        if (String.isNotBlank(searchTerm)) {
            String safe = '%' + String.escapeSingleQuotes(searchTerm) + '%';
            query += ' AND (Name LIKE \'' + safe + '\'' +
                     ' OR Application_Reference_Number__c LIKE \'' + safe + '\') ';
        }

        if (String.isNotBlank(assigneeFilter)) {
            query += ' AND Owner.Name = \'' + String.escapeSingleQuotes(assigneeFilter) + '\' ';
        }

        query += ' ORDER BY Pinned__c DESC, SortOrder__c ASC NULLS LAST, CreatedDate DESC LIMIT 200';

        List<Opportunity> opps = Database.query(query);

        // Group records by StageName
        Map<String, List<CardWrapper>> stageMap = new Map<String, List<CardWrapper>>();
        for (Opportunity opp : opps) {
            if (!APPLICATION_SUBSTAGES.contains(opp.StageName)) continue;
            if (!stageMap.containsKey(opp.StageName)) {
                stageMap.put(opp.StageName, new List<CardWrapper>());
            }
            stageMap.get(opp.StageName).add(new CardWrapper(opp));
        }

        // Order columns by picklist sequence — same as AllApplicationKanban
        Schema.SObjectField stageField = Opportunity.SObjectType.getDescribe()
            .fields.getMap().get('StageName');
        List<Schema.PicklistEntry> entries = stageField.getDescribe().getPicklistValues();

        List<KanbanColumnWrapper> columns = new List<KanbanColumnWrapper>();
        for (Schema.PicklistEntry e : entries) {
            String stageName = e.getValue();
            if (!APPLICATION_SUBSTAGES.contains(stageName)) continue;
            List<CardWrapper> cards = stageMap.containsKey(stageName)
                ? stageMap.get(stageName)
                : new List<CardWrapper>();
            columns.add(new KanbanColumnWrapper(stageName, cards));
        }

        return columns;
    }

    // DML methods — cacheable=false is correct here (they modify data)
    @AuraEnabled
    public static String updateOpportunityStage(Id opportunityId, String newStageName) {
        if (opportunityId == null || String.isBlank(newStageName)) {
            throw new AuraHandledException('Opportunity ID and stage name are required.');
        }
        try {
            update new Opportunity(Id = opportunityId, StageName = newStageName);
            return 'OK';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update stage: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static String archiveOpportunity(Id opportunityId, Boolean archived) {
        if (opportunityId == null) {
            throw new AuraHandledException('Opportunity ID is required.');
        }
        try {
            update new Opportunity(Id = opportunityId, Archived__c = archived);
            return 'OK';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update record: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static String togglePin(Id opportunityId) {
        if (opportunityId == null) {
            throw new AuraHandledException('Opportunity ID is required.');
        }
        
        Opportunity opp = [SELECT Id, Pinned__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        Boolean newState = !opp.Pinned__c;
        
        if (newState) {
            // Check count of pinned apps (only for Application process)
            Integer pinnedCount = [SELECT count() 
                                   FROM Opportunity 
                                   WHERE Pinned__c = true 
                                   AND NHS_Process__c = 'Application' 
                                   AND Archived__c = false];
            if (pinnedCount >= 3) {
                throw new AuraHandledException('You can only pin up to 3 applications.');
            }
        }
        
        try {
            update new Opportunity(Id = opportunityId, Pinned__c = newState);
            return newState ? 'PINNED' : 'UNPINNED';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update pin status: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static String updateCardOrder(List<Id> opportunityIds) {
        if (opportunityIds == null || opportunityIds.isEmpty()) {
            return 'OK';
        }
        List<Opportunity> toUpdate = new List<Opportunity>();
        for (Integer i = 0; i < opportunityIds.size(); i++) {
            toUpdate.add(new Opportunity(Id = opportunityIds[i], SortOrder__c = i));
        }
        try {
            update toUpdate;
            return 'OK';
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update order: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getAssigneeList() {
        List<String> names = new List<String>();
        for (AggregateResult ar : [
            SELECT Owner.Name ownerName
            FROM Opportunity
            WHERE NHS_Process__c = 'Application' AND Archived__c = false
            GROUP BY Owner.Name
            ORDER BY Owner.Name
        ]) {
            names.add((String) ar.get('ownerName'));
        }
        return names;
    }

    public class KanbanColumnWrapper {
        @AuraEnabled public String            stageName   { get; set; }
        @AuraEnabled public Integer           cardCount   { get; set; }
        @AuraEnabled public Decimal           totalAmount { get; set; }
        @AuraEnabled public List<CardWrapper> cards       { get; set; }

        public KanbanColumnWrapper(String stage, List<CardWrapper> cards) {
            this.stageName   = stage;
            this.cards       = cards;
            this.cardCount   = cards.size();
            Decimal total    = 0;
            for (CardWrapper c : cards) {
                if (c.amount != null) total += c.amount;
            }
            this.totalAmount = total;
        }
    }

    public class CardWrapper {
        @AuraEnabled public String   id           { get; set; }
        @AuraEnabled public String   name         { get; set; }
        @AuraEnabled public String   stageName    { get; set; }
        @AuraEnabled public String   houseBuilder { get; set; }
        @AuraEnabled public String   city         { get; set; }
        @AuraEnabled public String   plot         { get; set; }
        @AuraEnabled public String   appRefNumber { get; set; }
        @AuraEnabled public String   ownerName    { get; set; }
        @AuraEnabled public String   salesAdvisor { get; set; }
        @AuraEnabled public Decimal  amount       { get; set; }
        @AuraEnabled public Date     closeDate    { get; set; }
        @AuraEnabled public DateTime createdDate  { get; set; }
        @AuraEnabled public Boolean  archived     { get; set; }
        @AuraEnabled public Boolean  pinned       { get; set; }
        @AuraEnabled public Decimal  sortOrder    { get; set; }
        @AuraEnabled public String   development  { get; set; }

        public CardWrapper(Opportunity opp) {
            this.id           = opp.Id;
            this.name         = opp.Name;
            this.stageName    = opp.StageName;
            this.houseBuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
            this.city         = opp.House_Builder__r != null ? opp.House_Builder__r.BillingCity : null;
            this.plot         = opp.Plot__c;
            this.appRefNumber = opp.Application_Reference_Number__c;
            this.ownerName    = opp.Owner.Name;
            this.salesAdvisor = opp.Sales_Advisor__c;
            this.amount       = opp.Amount;
            this.closeDate    = opp.CloseDate;
            this.createdDate  = opp.CreatedDate;
            this.archived     = opp.Archived__c;
            this.pinned       = opp.Pinned__c;
            this.sortOrder    = opp.SortOrder__c;
            this.development  = opp.Development__c;
        }
    }
}