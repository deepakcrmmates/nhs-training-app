public without sharing class ValuationAssessmentSharingService {
    public static void shareValuationWithUser(Id valuationId, Id userId) {
        // Create a new share object for Valuation_Assessment__c
        Valuation_Assessment__Share shareRecord = new Valuation_Assessment__Share();
        
        // Set the record ID that you want to share
        shareRecord.ParentId = valuationId;
        
        // Set the user or group ID to share with
        shareRecord.UserOrGroupId = '0057Z00000ENrpAQAT';
        
        // Set the access level (Read, Edit, or Full Access)
        shareRecord.AccessLevel = 'Read';
        
        // Set the row cause to "manual" which means it’s a manual share
        shareRecord.RowCause = Schema.Valuation_Assessment__Share.RowCause.Manual;
        
        // Insert the share record
        try {
            insert shareRecord;
            System.debug('Record shared successfully.');
        } catch (DmlException e) {
            System.debug('An error occurred: ' + e.getMessage());
        }
    }
}