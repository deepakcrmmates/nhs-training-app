public with sharing class OpportunityController {
    @AuraEnabled
    public static void createOpportunityRecord(Map<String, Object> oppFields) {
        Opportunity newOpportunity = new Opportunity();
         newOpportunity.Name = (String)oppFields.get('Name');
        newOpportunity.Application_Name__c =(String)oppFields.get('Name');
        newOpportunity.StageName = (String)oppFields.get('StageName');
        newOpportunity.CloseDate = (Date)oppFields.get('CloseDate');
        newOpportunity.Scheme__c = (String)oppFields.get('Scheme__c');
        newOpportunity.ETA_Comp_Date_Start_Range__c = (Date)oppFields.get('ETA_Comp_Date_Start_Range__c');
        newOpportunity.ETA_Comp_Date_End_Range__c = (Date)oppFields.get('ETA_Comp_Date_End_Range__c');
        newOpportunity.Property__c = (Id)oppFields.get('Property__c');
        newOpportunity.Date_of_Application_Received__c = (Date)oppFields.get('Date_of_Application_Received__c');
        newOpportunity.Vendor_1__c = (Id)oppFields.get('Vendor_1__c');
        newOpportunity.Vendor_2__c = (Id)oppFields.get('Vendor_2__c');
        insert newOpportunity;
    }

    //  @AuraEnabled(cacheable=true)
    // public static List<Opportunity> getOpportunities() {
    //     // Query to fetch opportunities with additional fields
    //     return [SELECT Id, Name, StageName, Amount, Account.Name, CloseDate 
    //             FROM Opportunity  WHERE RecordType.Name ='Part Exchange - Applications'
    //             ORDER BY CloseDate DESC];
    // }

    
    // @AuraEnabled
    // public static void updateOpportunityStage(Id opportunityId, String newStage) {
    //     Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
    //     opp.StageName = newStage;
    //     update opp;
    // }


@AuraEnabled(cacheable=true)
    public static map<string, object> showOpportunityData(String recordTypeId){
        Map < string, object > finalResult = new Map < string, object > ();
        list<object> finalList = new list<object>();
         Map<String, List<Opportunity>> stageMap = new Map<String, List<Opportunity>>();
        for(Opportunity ops:[SELECT Id, Name, StageName, House_Builder__r.Name, Amount,
            House_Builder__c, House_Builder__r.BillingCity, Plot__c, Development__c, 
            Application_Reference_Number__c,CloseDate, owner.Name
            FROM Opportunity
            WHERE RecordTypeId = :recordTypeId
            ORDER BY StageName, CloseDate]){
            // finalList.add(new Map<String, Object>{
            //     'Id'=> ops.Id,
            //      'Name'=> ops.Name,
            //       'StageName'=> ops.StageName,
            //       'House_Builder__c'=>ops.House_Builder__c,
            //       'Application_Reference_Number__c'=>ops.Application_Reference_Number__c,
            //        'House_Builder__r.BillingCity'=> ops.House_Builder__r.BillingCity,
            //        'Plot__c'=> ops.Plot__c,
            //        'Development__c'=> ops.Development__c,
            //        'House_Builder__r.Name' => ops.House_Builder__r.Name,
            //        'ownerName' => ops.owner.Name
            // });

            if (!stageMap.containsKey(ops.StageName)) {
                stageMap.put(ops.StageName, new List<Opportunity>());
            }
            stageMap.get(ops.StageName).add(ops);
        
        }
        for (String stage : stageMap.keySet()) {
            finalList.add(new Map<String, Object>{'opportunities' => stageMap.get(stage)});
            finalList.add(new Map<String, Object>{'stage' => stage});
        }
        finalResult.put('opportunity', finalList);
        return finalResult; 
    }


      @AuraEnabled(cacheable=true)
    public static List<RecordType> getRecordTypes() {
        return [SELECT Id, Name FROM RecordType WHERE SObjectType = 'Opportunity'];
    }

    

     @AuraEnabled
    public static string updateOpportunityStage(Id opportunityId, String newStage) {
        Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        opp.StageName = newStage;
        update opp;
        return JSON.serialize(opp);
    }
    
    @AuraEnabled(cacheable=true)
public static List<OpportunityStageWrapper> getOpportunityStages(String recordTypeId) {
    List<OpportunityStageWrapper> opportunityStages = new List<OpportunityStageWrapper>();
    Map<String, List<OpportunityWrapper>> stageMap = new Map<String, List<OpportunityWrapper>>();
List<Opportunity> opportunities;
if(recordTypeId != null){


    // Get opportunities for the specified record type
     opportunities = [
        SELECT Id, Name, StageName, House_Builder__r.Name, Amount,
               House_Builder__c, House_Builder__r.BillingCity, Plot__c, 
               Development__c, Application_Reference_Number__c, CloseDate, 
               Owner.Name 
        FROM Opportunity
        WHERE RecordType.DeveloperName = :recordTypeId Limit 200
    ];
} else{
    opportunities = [
        SELECT Id, Name, StageName, House_Builder__r.Name, Amount,NHS_Sales_Advisor__c,
               House_Builder__c, House_Builder__r.BillingCity, Plot__c, 
               Development__c, Application_Reference_Number__c, CloseDate, 
               Owner.Name 
        FROM Opportunity Limit 200
    ];
}
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
    public String Housebuilder { get; set; }
    @AuraEnabled
    public String ownerName { get; set; }
    @AuraEnabled
    public String Aprn { get; set; }
    @AuraEnabled
    public String Plot { get; set; }
    @AuraEnabled
    public String City { get; set; }

    public OpportunityWrapper(Opportunity opp) {
        this.id = opp.Id;
        this.Name = opp.Name;
        this.stageName = opp.StageName;
        this.Housebuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : null;
        this.ownerName = opp.Owner.Name;
        this.Aprn = opp.Application_Reference_Number__c;
        this.Plot = opp.Plot__c;
        this.City = opp.House_Builder__r.BillingCity != null ? opp.House_Builder__r.BillingCity : null;
    }
}

  
}