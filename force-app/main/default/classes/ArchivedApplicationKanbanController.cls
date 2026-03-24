/**
* @File Name : ArchivedApplicationKanbanController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : March 21, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | March 21, 2025 |   | Initial Version
**/

public class ArchivedApplicationKanbanController {
    @AuraEnabled(cacheable=true)
     public static Map<String, Object> getOpportunities(Integer limitSize, Integer offsetValue) {
       // List<Map<String, Object>> finalMapList = new List<Map<String, Object>>();
        Map<String, Object> opportunityMap = new Map<String, Object>();

        // Fetching opportunities
        List<Opportunity> finalList = [
            SELECT Id, Name, Sales_Advisor__c, StageName ,House_Builder__c,  House_Builder__r.Name, Archived_Approval_Status__c, Applicant__r.Name, Applicant__c
            FROM Opportunity 
            WHERE Archived__c = true  ORDER BY CreatedDate DESC 
            LIMIT :limitSize OFFSET :offsetValue
        ];

        Integer totalCount = [SELECT COUNT() FROM Opportunity];

        opportunityMap.put('opportunities', finalList);
        opportunityMap.put('totalCount', totalCount);


        return opportunityMap;
    }

}