public with sharing class KanbanController {

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunities() {
        return [
            SELECT Id, Name, StageName, Amount, CreatedDate
            FROM Opportunity
            WHERE IsClosed = false
            ORDER BY CreatedDate DESC
            LIMIT 200
        ];
    }
}