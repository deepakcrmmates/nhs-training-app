@RestResource(urlMapping='/OpportunityService/*')
global with sharing class OpportunityService {

    @HttpPost
    global static String createOpportunity(String accountId, String name, Decimal amount, Date closeDate, String stageName, String description) {
        Opportunity opp = new Opportunity(
            AccountId = accountId,
            Name = name,
            Amount = amount,
            CloseDate = closeDate,
            StageName = stageName,
            Description = description
        );

        try {
            insert opp;
            return opp.Id;
        } catch(Exception e) {
            // Throwing meaningful error message
            RestContext.response.statusCode = 500;
            return 'Error creating Opportunity: ' + e.getMessage();
        }
    }

    // To accept JSON payload instead of individual parameters,
    // you can also write this:
    /*
    @HttpPost
    global static String createOpportunityFromJson() {
        RestRequest req = RestContext.request;
        String jsonString = req.requestBody.toString();
        Opportunity opp = (Opportunity) JSON.deserialize(jsonString, Opportunity.class);

        try {
            insert opp;
            return opp.Id;
        } catch(Exception e) {
            RestContext.response.statusCode = 500;
            return 'Error creating Opportunity: ' + e.getMessage();
        }
    }
    */
}