/**
* @File Name : OfferKanbanController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : January 26, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | January 26, 2025 |   | Initial Version
**/

public with sharing class OfferKanbanController {
   
    @AuraEnabled(cacheable=true)
 public static List<KanbanColumn> getOfferKanbanData() {
    List<KanbanColumn> kanbanData = new List<KanbanColumn>();

    // 🔹 Dynamically retrieve picklist values for Offer_Status__c
    Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get('Offer__c').getDescribe().fields.getMap();
    List<Schema.PicklistEntry> values = fieldMap.get('Offer_Status__c').getDescribe().getPickListValues();
    
    Set<String> allStages = new Set<String>();
    for (Schema.PicklistEntry obj : values) {
        allStages.add(obj.getValue().remove('\'').escapeUnicode());
    }
    System.debug('✅ All Stages: ' + allStages);

    // 🔹 Query Offers__c and related Application data
    List<Offer__c> offerList = [
        SELECT 
            Id, 
            Name, 
            Offer_Submitted_By__c, 
            Offer_Amount__c, 
            Date_of_Application_Received__c,  Disallow__c, Archived__c, 
            Offer_Status__c, Offer_Active__c,
            Agent__c, 
            Agent__r.Name,
            Application__r.Id,
            Application__r.Name,
            Application__r.House_Builder__c,
            Application__r.House_Builder__r.Name,
            Application__r.Applicant__c,
            Application__r.Applicant__r.Name
        FROM Offer__c WHERE Disallow__c = FALSE AND Archived__c = FALSE AND Offer_Active__c = 'Yes'
    ];

    if (!offerList.isEmpty()) {
        // 🔹 Initialize map to group Offers by Stage
        Map<String, List<KanbanEvent>> stageToEventsMap = new Map<String, List<KanbanEvent>>();
        for (String stage : allStages) {
            stageToEventsMap.put(stage, new List<KanbanEvent>());
        }

        // 🔹 Process each Offer and create KanbanEvent
        for (Offer__c offer : offerList) {
            KanbanEvent event = new KanbanEvent();
            event.Id = offer.Id != null ? offer.Id : 'N/A';
            event.Subject = offer.Offer_Submitted_By__c != null ? offer.Offer_Submitted_By__c : 'N/A';
            event.stage = offer.Offer_Status__c != null ? offer.Offer_Status__c : 'N/A';
            event.offerAmount = offer.Offer_Amount__c != null ? '£ ' + offer.Offer_Amount__c : '£ N/A';

            // ✅ Null Checks for Related Objects
            if (offer.Application__r != null) {
                event.opportunityName = offer.Application__r.Name != null ? offer.Application__r.Name : 'N/A';
                event.applicationId = offer.Application__r.Id != null ? offer.Application__r.Id : 'N/A';

                if (offer.Application__r.House_Builder__r != null) {
                    event.housebuilder = offer.Application__r.House_Builder__r.Name != null ? offer.Application__r.House_Builder__r.Name : 'N/A';
                    event.housebuilderId = offer.Application__r.House_Builder__c != null ? offer.Application__r.House_Builder__c : 'N/A';
                }

                if (offer.Application__r.Applicant__r != null) {
                    event.vendorName = offer.Application__r.Applicant__r.Name != null ? offer.Application__r.Applicant__r.Name : 'N/A';
                    event.vendorId = offer.Application__r.Applicant__c != null ? offer.Application__r.Applicant__c : 'N/A';
                }
            }

            // ✅ Null Check for Agent__r
            event.agentName = (offer.Agent__r != null && offer.Agent__r.Name != null) ? offer.Agent__r.Name : '';
            if(offer.Agent__c != null){
                  event.agentId = (offer.Agent__c != null) ? offer.Agent__c : 'N/A';
            }
           
           event.Name = offer.Name;

            // ✅ Format Date_of_Application_Received__c
            event.formattedStartDateTime = offer.Date_of_Application_Received__c != null 
                ? offer.Date_of_Application_Received__c.format('dd MMM yyyy - hh:mm a') 
                : '';

            // ✅ Button Properties
            event.showAcceptButton = offer.Offer_Status__c == 'New Offers';
            event.buttonText = offer.Offer_Status__c == 'New Offers' ? 'Accept Offer' : '';
            event.buttonClass = offer.Offer_Status__c == 'New Offers' ? 'accept-offer-button' : '';

            // ✅ Draggable & Card Class
            event.isDraggable = offer.Offer_Status__c != 'New Offers';
            event.cardClass = 'kanban-card ' + (offer.Offer_Submitted_By__c == 'Agent' ? 'light-red' : 'light-green');

            // ✅ Add Event to Stage Map
            if (!stageToEventsMap.containsKey(event.stage)) {
                stageToEventsMap.put(event.stage, new List<KanbanEvent>());
            }
            stageToEventsMap.get(event.stage).add(event);
        }

        // 🔹 Create KanbanColumns for each Stage
        for (String stage : allStages) {
            System.debug('📌 Processing Stage: ' + stage);
            KanbanColumn column = new KanbanColumn();
            column.dateKey = stage != null ? stage.replace(' ', '_').toLowerCase() : 'N/A';
            column.label = stage != null ? stage : 'N/A';
            column.events = stageToEventsMap.get(stage) != null ? stageToEventsMap.get(stage) : new List<KanbanEvent>();
            kanbanData.add(column);
        }
    }

    System.debug('✅ Final Kanban Data: ' + kanbanData);
    return kanbanData;
}


@AuraEnabled
public static void updateOfferStage(String offerId, String newStage, string staus, String notes) {

    system.debug(offerId);
        system.debug(newStage);
    try {
        // Query the Offer__c record
        List<Offer__c> offers = [SELECT Id, Offer_Status__c FROM Offer__c WHERE Id = :offerId LIMIT 1];

        // Check if the query returned a record
        if (!offers.isEmpty()) {
            Offer__c offer = offers[0]; // Get the first (and only) record
            offer.Offer_Status__c = newStage != null? newStage: 'None'; // Update the stage
            if( staus != 'None'){
                if (staus == 'Disallow' ){
                    offer.Disallow__c = staus == 'Disallow'? true : FALSE;
                }
                 if(staus == 'Allow'){
                    offer.Allow__c = staus == 'Allow'? true : FALSE;
                 }
                 offer.Internal_Notes__c = notes != null? notes: '';
            
            }
           
            update offer; // Perform the update
        } else {
            // Handle the case where no record is found
            throw new AuraHandledException('No Offer record found with Id: ' + offerId);
        }
    } catch (Exception e) {
        // Handle any other exceptions
        throw new AuraHandledException('Error updating Offer stage: ' + e.getMessage());
    }
}


    
    // Wrapper class for Kanban Column
    public class KanbanColumn {
        @AuraEnabled public String dateKey;
        @AuraEnabled public String label;
        @AuraEnabled public List<KanbanEvent> events;
    }
    
    // Wrapper class for Kanban Event
    public class KanbanEvent {
        @AuraEnabled public String Id;
         @AuraEnabled public String Name;
        @AuraEnabled public String Subject;
        @AuraEnabled public String opportunityName;
        @AuraEnabled public String applicationId;
        @AuraEnabled public String housebuilder;
        @AuraEnabled public String housebuilderId;
        @AuraEnabled public String agentName;
        @AuraEnabled public String agentId;
        @AuraEnabled public String vendorName;
        @AuraEnabled public String vendorId;
        @AuraEnabled public String formattedStartDateTime;
        @AuraEnabled public String offerAmount;
        @AuraEnabled public String stage;
        @AuraEnabled public Boolean showAcceptButton;
        @AuraEnabled public String buttonClass;
        @AuraEnabled public String buttonText;
        @AuraEnabled public Boolean isDraggable;
        @AuraEnabled public String cardClass;
    }
}