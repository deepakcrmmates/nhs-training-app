public class propertyController {

     @AuraEnabled(cacheable=true)
    public static NHS_Property__c fetchStreetDatas(string recordId) {
         system.debug(recordId);
        NHS_Property__c obj =[select id, name, Current_Efficiency__c,Potential_Efficiency__c from NHS_Property__c where id =:recordId];
        system.debug(obj);
        return obj;
    }
    
     @AuraEnabled
    public static void setPrimaryImage(Id propertyId, Id imageId) {
        // Fetch the Property record
        NHS_Property__c property = [SELECT Id, Primary_Image__c FROM NHS_Property__c WHERE Id = :propertyId LIMIT 1];
        property.Primary_Image__c = imageId; // Set the Primary Image
        update property; // Save the record
    }

   @AuraEnabled(cacheable=true)
    public static List<ContentDocumentLink> getFiles(string recordId) {
	system.debug('recordId -----'+recordId);
          return [SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType, ContentDocument.LatestPublishedVersionId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId =: recordId];  
    }
}