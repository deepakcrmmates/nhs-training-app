/**
* @File Name : EventController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : August 31, 2024
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | August 31, 2024 |   | Initial Version
**/

public with sharing class EventController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getOpportunities(string nhsProcess, String searchTerm) {
        // Fetch the list of opportunities with related Event and Vendor_Availability__c counts
       List<Opportunity> opportunities;
system.debug('nhsProcess---'+ nhsProcess);
system.debug('searchTerm---'+ searchTerm);
if (String.isBlank(nhsProcess) && String.isBlank(searchTerm)) {
    // Case 1: No NHS Process and no Search Term
    opportunities = [
        SELECT Id, Name, CreatedDate, NHS_Process__c,
               Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c,
               Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
               (SELECT Id, IsBooked__c, WhatId FROM Events WHERE IsBooked__c = TRUE),
               (SELECT Id FROM Vendor_Availabilities__r)
        FROM Opportunity
        WHERE StageName NOT IN ('Sale Cancelled', 'Archive') AND Archived__c = false AND Blacklisted__c = false
        LIMIT 200
    ];
} else if (String.isBlank(searchTerm)) {
    // Case 2: NHS Process provided but no Search Term
    opportunities = [
        SELECT Id, Name, CreatedDate, NHS_Process__c,
               Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c,
               Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
               (SELECT Id, IsBooked__c, WhatId FROM Events WHERE IsBooked__c = TRUE),
               (SELECT Id FROM Vendor_Availabilities__r)
        FROM Opportunity
        WHERE NHS_Process__c = :nhsProcess
        AND StageName NOT IN ('Sale Cancelled', 'Archive') AND Archived__c = false AND Blacklisted__c = false
        LIMIT 200
    ];
} else if (String.isBlank(nhsProcess)) {
    // Case 3: Search Term provided but no NHS Process
    opportunities = [
        SELECT Id, Name, CreatedDate, NHS_Process__c,
               Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c,
               Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
               (SELECT Id, IsBooked__c, WhatId FROM Events WHERE IsBooked__c = TRUE),
               (SELECT Id FROM Vendor_Availabilities__r)
        FROM Opportunity
        WHERE Name LIKE :('%' + searchTerm + '%')
        AND StageName NOT IN ('Sale Cancelled', 'Archive')  AND Archived__c = false AND Blacklisted__c = false
        LIMIT 200
    ];
} else {
    // Case 4: Both NHS Process and Search Term provided
    opportunities = [
        SELECT Id, Name, CreatedDate, NHS_Process__c,
               Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c,
               Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
               (SELECT Id, IsBooked__c, WhatId FROM Events WHERE IsBooked__c = TRUE),
               (SELECT Id FROM Vendor_Availabilities__r)
        FROM Opportunity
        WHERE NHS_Process__c = :nhsProcess
        AND Name LIKE :('%' + searchTerm + '%')
        AND StageName NOT IN ('Sale Cancelled', 'Archive')
        AND Archived__c = false AND Blacklisted__c = FALSE
        LIMIT 200
    ];
}

        
        // Prepare the list to hold the result
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
        
        // Loop through opportunities and build the map
        for (Opportunity opp : opportunities) {
            integer chasingCount = 0;
            integer returnCount = 0;
            DateTime currentDateTime = System.now();
            Map<String, Object> oppMap = new Map<String, Object>();
            oppMap.put('Id', opp.Id);
            oppMap.put('Name', opp.Name);
            
            // Count related Event records
            Integer eventCount = opp.Events.size();
            
            
            // Count related Vendor_Availability__c records
            Integer vendorAvailabilityCount = opp.Vendor_Availabilities__r.size();
            oppMap.put('TotalVendorAvailability', vendorAvailabilityCount);
            
            
            if(opp.Agent_1_Appointment__c < currentDateTime ){
                chasingCount += 1;
                
                
            }
            if(opp.Agent_2_Appointment__c < currentDateTime ){
                chasingCount += 1;
            }
            if(opp.Agent_3_Appointment__c < currentDateTime ){
                chasingCount += 1;
            }
            if(opp.Agent_1_Valuation_Recieved__c == true){
                returnCount += 1;
            } if(opp.Agent_2_Valuation_Recieved__c == true){
                returnCount += 1;
            }  if(opp.Agent_3_Valuation_Recieved__c == true){
                returnCount += 1;
            }
           // eventCount = eventCount - chasingCount;
            
           // chasingCount = chasingCount - returnCount;
    system.debug('eventCount --> '+ eventCount);
             system.debug('chasingCount --> '+ chasingCount);
             system.debug('returnCount --> '+ returnCount);
            
           oppMap.put('TotalEvents', (chasingCount > 0 ? eventCount - chasingCount: 0));
            oppMap.put('TotalChasing', chasingCount >0 ? chasingCount - returnCount : chasingCount);
            oppMap.put('TotalReturnCount', returnCount);
            finalList.add(oppMap);
            
            system.debug('oppMap --> '+ oppMap);
        }
        
        
        
        // Add a final map for the total count of opportunities
        Map<String, Object> countMap = new Map<String, Object>();
        countMap.put('TotalCount', opportunities.size());
        finalList.add(countMap);
        
        return finalList;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getOpportunities1() {
        // Fetch the list of opportunities with related Events and Vendor_Availability__c counts
        List<Opportunity> opportunities = [
            SELECT Id, Name, Agent_1__c, Agent_2__c, Agent_3__c, createdDate, StageName,
            Agent_1_Valuation_Recieved__c, Agent_2_Valuation_Recieved__c, Agent_3_Valuation_Recieved__c,
            (SELECT Id, Agent__c, IsBooked__c, WhatId FROM Events WHERE IsBooked__c = TRUE),                      // Related Events
            (SELECT Id FROM Vendor_Availabilities__r)      // Related Vendor Availability
            FROM Opportunity WHERE (StageName != 'Sale Cancelled' OR StageName != 'Archive')  AND Archived__c = false AND Blacklisted__c = FALSE limit 200
        ];
        
        // Prepare the list to hold the result
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
        
        // Loop through opportunities and build the map
        for (Opportunity opp : opportunities) {
            Map<String, Object> oppMap = new Map<String, Object>();
            oppMap.put('Id', opp.Id);
            oppMap.put('Name', opp.Name);
            
            Integer totalEvents = 0;
            Integer eventsWithValuationTrue = 0;
            Integer eventsWithValuationFalse = 0;
            
            // Loop through each event
            for (Event event : opp.Events) {
                Boolean agentMatched = false;
                Boolean valuationReceived = false;
                
                // Check if the Event's Agent__c matches any of the Opportunity agents
                if (event.Agent__c == opp.Agent_1__c) {
                    agentMatched = true;
                    valuationReceived = opp.Agent_1_Valuation_Recieved__c;
                } else if (event.Agent__c == opp.Agent_2__c) {
                    agentMatched = true;
                    valuationReceived = opp.Agent_2_Valuation_Recieved__c;
                } else if (event.Agent__c == opp.Agent_3__c) {
                    agentMatched = true;
                    valuationReceived = opp.Agent_3_Valuation_Recieved__c;
                }
                
                if (agentMatched) {
                    totalEvents++;
                    
                    // If the valuation is true for the matched agent, increment the true count
                    if (valuationReceived) {
                        eventsWithValuationTrue++;
                    } else {
                        // Otherwise, increment the false count
                        eventsWithValuationFalse++;
                    }
                }
            }
            
            // Add the event counts to the map
            oppMap.put('TotalEvents', totalEvents);
            oppMap.put('TotalEventsWithAnyValuationTrue', (totalEvents - eventsWithValuationTrue));
            oppMap.put('EventsWithValuationFalse', eventsWithValuationFalse);
            
            // Count related Vendor_Availability__c records
            Integer vendorAvailabilityCount = opp.Vendor_Availabilities__r.size();
            oppMap.put('TotalVendorAvailability', vendorAvailabilityCount);
            
            finalList.add(oppMap);
        }
        
        // Add a final map for the total count of opportunities
        Map<String, Object> countMap = new Map<String, Object>();
        countMap.put('TotalCount', opportunities.size());
        finalList.add(countMap);
        
        return finalList;
    }
    
    
    
    @AuraEnabled(cacheable=true)
    public static List<Event> getEvents(String appId, string stage) {
        system.debug('stage'+ stage);
        List<Event> events = new List<Event>();
        if (String.isNotBlank(appId)) {
            // Query events filtered by appId Application__r.Agent_1_Valuation_Recieved__c, Application__r.Agent_2_Valuation_Recieved__c, Application__r.Agent_3_Valuation_Recieved__c
            
            for(Event evt : [
                SELECT Id, Subject, StartDateTime, Agent__c, Agent__r.Name, WhatId, What.Name, WhoId, Who.Name,
                Application__r.Agent_1__c, Application__r.Agent_2__c, Application__r.Agent_3__c,
                IsBooked__c, Application__c, Application__r.Name, Application__r.Applicant__c,Application__r.StageName,
                Application__r.Agent_1_Valuation_Recieved__c, Application__r.Agent_2_Valuation_Recieved__c, Application__r.Agent_3_Valuation_Recieved__c,
                Application__r.Applicant__r.Name, Application__r.House_Builder__c, Application__r.House_Builder__r.Name
                FROM Event
                WHERE Application__c = :appId AND IsBooked__c = TRUE   AND Application__r.Archived__c = false AND Application__r.Blacklisted__c = FALSE AND (Application__r.StageName != 'Sale Cancelled' OR Application__r.StageName != 'Archive')
            ] ){
                DateTime currentDateTime = System.now();
                system.debug(' event -- - '+ evt );
                if(evt.StartDateTime < currentDateTime
                   && stage == 'Chasing' && ((evt.Application__r.Agent_1_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_1__c)  || 
                                             (evt.Application__r.Agent_2_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_2__c) ||
                                             (evt.Application__r.Agent_3_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_3__c))){
                                                 events.add(evt); //for fig to chased
                                                 system.debug(' currentDateTime '+ currentDateTime );
                                                 system.debug('evt.StartDateTime '+ evt.StartDateTime  );
                                                 
                                             }
                IF(  
                    ((evt.Application__r.Agent_1_Valuation_Recieved__c == true && evt.Agent__c == evt.Application__r.Agent_1__c)  || 
                     (evt.Application__r.Agent_2_Valuation_Recieved__c == true && evt.Agent__c == evt.Application__r.Agent_2__c) ||
                     (evt.Application__r.Agent_3_Valuation_Recieved__c == true && evt.Agent__c == evt.Application__r.Agent_3__c) )
                    && stage == 'Figure Return'){
                        events.add(evt); 
                        
                    }
                else{
                    if(evt.StartDateTime >= currentDateTime && stage == 'Agents Booked' 
                       && ((evt.Application__r.Agent_1_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_1__c)  || 
                           (evt.Application__r.Agent_2_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_2__c) ||
                           (evt.Application__r.Agent_3_Valuation_Recieved__c == false && evt.Agent__c == evt.Application__r.Agent_3__c) )){
                               events.add(evt);
                           }
                    
                }
            }
            
            
        } else {
            // Query all booked events
            events = [
                SELECT Id, Subject, StartDateTime, Agent__c, Agent__r.Name, WhatId, What.Name, WhoId, Who.Name,
                IsBooked__c, Application__c, Application__r.Name, Application__r.Applicant__c,
                Application__r.Applicant__r.Name, Application__r.House_Builder__c, Application__r.House_Builder__r.Name
                FROM Event
                WHERE IsBooked__c = TRUE
            ];
        }
        return events; // Return the list variable
    }
    
  @AuraEnabled(cacheable=true)
public static List<Vendor_Availability__c> getAvailabilities(Date startDate, Date endDate, String appId) {
    System.debug('Start Date: ' + startDate);
    System.debug('End Date: ' + endDate);
    System.debug('Application ID: ' + appId);
    
    try {
        Integer limitSize = 200;

        // Base query with bind variables placeholder
        String baseQuery = 'SELECT Id, Date__c, Vendor__c, Vendor__r.LastName, Vendor__r.FirstName, ' +
            'Availability__c, AM__c, PM__c, Notes__c, ' +
            'Agent__c, Agent__r.Name, Slots__c, Booked__c, Application__c, Application__r.Name ' +
            'FROM Vendor_Availability__c WHERE Availability__c = \'Available\' ';

        // Filters list
        List<String> filters = new List<String>();
        Map<String, Object> bindVars = new Map<String, Object>();

      
        if (String.isNotBlank(appId)) {
            filters.add('Application__c = :appId');
            bindVars.put('appId', appId);
        }

        if (!filters.isEmpty()) {
            baseQuery += ' AND ' + String.join(filters, ' AND ');
        }

        baseQuery += ' ORDER BY Date__c ASC LIMIT :limitSize';

        // Debugging
        System.debug('Final SOQL Query: ' + baseQuery);

        // Prepare query using dynamic binding
        // Inline `Database.query` doesn’t support binding map directly,
        // so declare variables before querying
        return (List<Vendor_Availability__c>) Database.query(baseQuery);

    } catch (AuraHandledException e) {
        throw new AuraHandledException('Error: ' + e.getMessage() + ' (Line: ' + e.getLineNumber() + ')');
    } catch (Exception e) {
        System.debug('Error in getAvailabilities: ' + e.getMessage() + ' (Line: ' + e.getLineNumber() + ')');
        throw new AuraHandledException('An unexpected error occurred at line ' + e.getLineNumber() + ': ' + e.getMessage());
    }
}

    
}