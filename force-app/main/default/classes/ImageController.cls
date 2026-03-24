/**
* @File Name : ImageController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : October 12, 2024
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | October 12, 2024 |   | Initial Version
**/
public with sharing class ImageController {
    
    // Fetch both existing and uploaded images
    @AuraEnabled(cacheable=true)
   public static List<ContentDocumentLink> getAllImages(Id recordId) {
        // Query to fetch images linked to the specified property record
        return [SELECT Id, ContentDocument.LatestPublishedVersionId, ContentDocument.Title 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :recordId];
    }

 @AuraEnabled(cacheable=true)
    public static NHS_Property__c getPropertyRecord(Id recordId) {
        return [SELECT Id, Primary_Image__c FROM NHS_Property__c WHERE Id = :recordId LIMIT 1];
    }


    // Set the primary image
    @AuraEnabled
    public static void setPrimaryImage(string propertyId, string primaryImageId) {
        system.debug(propertyId + '-------'+ primaryImageId);
        // Check if the Property record exists
        NHS_Property__c property = [SELECT Id, Primary_Image__c FROM NHS_Property__c WHERE Id = :propertyId LIMIT 1];

        // Update the Primary_Image__c field with the new primary image ID
        property.Primary_Image__c = primaryImageId;
        
        // Update the Property record in the database
        update property;
    }
}