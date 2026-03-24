public class AllApplicationKanban {
	@AuraEnabled(cacheable=true)
 public static List<OpportunityStageWrapper> getOpportunityStages(String opportunityName, String stageName, boolean isArchived) {
    List<OpportunityStageWrapper> opportunityStages = new List<OpportunityStageWrapper>();
    Map<String, List<OpportunityWrapper>> stageMap = new Map<String, List<OpportunityWrapper>>();

    // Get all opportunities (without filtering by record type)
   // Build dynamic query with filters
    String query = 'SELECT Id, Name, StageName, House_Builder__r.Name, Amount, NHS_Sales_Advisor__c,Sales_Advisor__c, NHS_Process__c,Archived__c, ' +
                   'House_Builder__c, House_Builder__r.BillingCity, Plot__c, CreatedDate, ' +
                   'Development__c, Application_Reference_Number__c, CloseDate, Owner.Name ' +
                   'FROM Opportunity WHERE NHS_Process__c = \'Application\' ';

    if (isArchived != null) {
    query += ' AND Archived__c = ' + isArchived;
    }

    if (String.isNotBlank(opportunityName)) {
        query += ' AND Name LIKE \'%' + String.escapeSingleQuotes(opportunityName) + '%\'';
    }
    
    if (String.isNotBlank(stageName)) {
        query += ' AND StageName = \'' + String.escapeSingleQuotes(stageName) + '\'';
    }

    query += ' ORDER BY CreatedDate DESC LIMIT 20'; // Limit results for performance

system.debug('QUERY -:'+ query);
    // Fetch opportunities
    List<Opportunity> opportunities = Database.query(query);


    // Group opportunities by stage name
    for (Opportunity opp : opportunities) {
        if (!stageMap.containsKey(opp.StageName)) {
            stageMap.put(opp.StageName, new List<OpportunityWrapper>());
        }
        stageMap.get(opp.StageName).add(new OpportunityWrapper(opp));
    }

    // Get describe information for the Opportunity object
    Schema.DescribeSObjectResult describeResult = Opportunity.SObjectType.getDescribe();
    Schema.SObjectField stageField = describeResult.fields.getMap().get('StageName');
    List<Schema.PicklistEntry> stageEntries = stageField.getDescribe().getPicklistValues();

    // Create OpportunityStageWrapper instances only for the stages present in the fetched opportunities
    for (Schema.PicklistEntry entry : stageEntries) {
        String stage = entry.getValue();
        
        // Only include stages that have corresponding opportunities
        if (stageMap.containsKey(stage)) {
            opportunityStages.add(new OpportunityStageWrapper(stage, stageMap.get(stage)));
        }
    }

    return opportunityStages;
}
   @AuraEnabled(cacheable=false)
    public static List<Opportunity> fetchOpportunitiesByStage(String stageName, Integer offsetValue) {
        if (String.isBlank(stageName)) {
            throw new AuraHandledException('StageName is required.');
        }

        if (offsetValue == null || offsetValue < 0) {
            offsetValue = 0;
        }

        return [
            SELECT Id, Name, StageName, House_Builder__r.Name, Amount, NHS_Sales_Advisor__c,Sales_Advisor__c, NHS_Process__c,
                   House_Builder__c, House_Builder__r.BillingCity, Plot__c, CreatedDate, Archived__c, Blacklisted__c,
                   Development__c, Application_Reference_Number__c, CloseDate,
                   Owner.Name
            FROM Opportunity
            WHERE StageName = :stageName AND Archived__c = false AND Blacklisted__c = false
            ORDER BY CreatedDate DESC
            LIMIT 50
            OFFSET :offsetValue
        ];
    }
 // Inner class to hold stage name and list of opportunities
 public class OpportunityStageWrapper {
    @AuraEnabled
    public String stage { get; set; }
    @AuraEnabled
    public List<OpportunityWrapper> opportunities { get; set; }

    public OpportunityStageWrapper(String stage, List<OpportunityWrapper> opportunities) {
        this.stage = stage;
        this.opportunities = opportunities;
    }
}

 // Inner wrapper class to hold opportunity details
 public class OpportunityWrapper {
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String stageName { get; set; }
    @AuraEnabled
    public String nhsProcess { get; set; }
    @AuraEnabled
    public String Housebuilder { get; set; }
    @AuraEnabled
    public String ownerName { get; set; }
     @AuraEnabled
    public String salesAdvisorName { get; set; }
    @AuraEnabled
    public String Aprn { get; set; }
    @AuraEnabled
    public String Plot { get; set; }
    @AuraEnabled
    public String City { get; set; }
     @AuraEnabled
    public dateTime CreatedDate { get; set; }

    public OpportunityWrapper(Opportunity opp) {
        this.id = opp.Id;
        this.Name = opp.Name;
        this.stageName = opp.StageName;
        this.nhsProcess = opp.NHS_Process__c;
        this.Housebuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
        this.ownerName = opp.Owner.Name;
        this.salesAdvisorName = opp.Sales_Advisor__c != null ? opp.Sales_Advisor__c : null;
        this.Aprn = opp.Application_Reference_Number__c;
        this.Plot = opp.Plot__c;
        this.City = opp.House_Builder__r != null ? opp.House_Builder__r.BillingCity : null;
        this.CreatedDate = opp.CreatedDate;
    }
}

}