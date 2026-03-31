public with sharing class VendorNoteController {

    @AuraEnabled
    public static List<Vendor_Note__c> getNotes(Id opportunityId) {
        return [
            SELECT Id, Name, Notes__c, Vendor__c, Vendor__r.Name, Application__c,
                   CreatedDate, CreatedBy.Name
            FROM Vendor_Note__c
            WHERE Application__c = :opportunityId
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static Vendor_Note__c saveNote(String noteText, Id opportunityId) {
        try {
            Opportunity opp = [SELECT Id, Applicant__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            Vendor_Note__c note = new Vendor_Note__c();
            note.Application__c = opportunityId;
            note.Vendor__c = opp.Applicant__c;
            note.Notes__c = noteText;
            insert note;

            return [
                SELECT Id, Name, Notes__c, Vendor__c, Vendor__r.Name,
                       CreatedDate, CreatedBy.Name
                FROM Vendor_Note__c
                WHERE Id = :note.Id
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Failed to save note: ' + e.getMessage());
        }
    }
}
