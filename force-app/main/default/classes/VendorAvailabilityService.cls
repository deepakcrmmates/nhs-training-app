public class VendorAvailabilityService {
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getExistingVendorAvailability(Id currentId) {
        // Map to hold the results
        Map<String, Object> resultMap = new Map<String, Object>();
        
        // Query to get the available Vendor_Availability__c records
        List<Vendor_Availability__c> availabilityRecords = [
            SELECT Id, Date__c, Vendor__c, Vendor__r.LastName, Vendor__r.FirstName, Availability__c, AM__c, PM__c, Notes__c, 
            Agent__c, Agent__r.Name, Slots__c, Booked__c, Application__c
            FROM Vendor_Availability__c 
            WHERE Application__c = :currentId 
            AND Availability__c = 'Available'
        ];
        
        // Query to get the related Event records for the given Application (currentId)
        List<Event> relatedEvents = [
            SELECT Id, StartDateTime, EndDateTime, Agent__c, WhoId, WhatId
            FROM Event
            WHERE WhatId = :currentId
            AND WhoId IN (SELECT Vendor__c FROM Vendor_Availability__c WHERE Application__c = :currentId)
            AND StartDateTime >= :System.today()
        ];
        
        // Process availability records to exclude those with events booked for all three agents on the same date
        List<Vendor_Availability__c> filteredAvailabilityRecords = new List<Vendor_Availability__c>();
        
        for (Vendor_Availability__c availability : availabilityRecords) {
            Date availabilityDate = availability.Date__c;
            Set<Id> agentsWithEvents = new Set<Id>();
            
            for (Event eventRecord : relatedEvents) {
                // Check if the event matches the availability date and vendor
                if (eventRecord.StartDateTime.date() == availabilityDate && eventRecord.WhoId == availability.Vendor__c) {
                    agentsWithEvents.add(eventRecord.Agent__c);
                }
            }
            
            // If not all three agents have events booked, include this availability record
            if (agentsWithEvents.size() < 3) {
                filteredAvailabilityRecords.add(availability);
            }
        }
        
        resultMap.put('availabilityRecords', filteredAvailabilityRecords);
        return resultMap;
    }
    
    
    /* 
@AuraEnabled(cacheable=true)
public static Map<String, Object> getExistingVendorAvailability(Id currentId) {
// Map to hold the results
Map<String, Object> resultMap = new Map<String, Object>();

// Query to get the available Vendor_Availability__c records
List<Vendor_Availability__c> availabilityRecords = [
SELECT Id, Date__c,Vendor__c,Vendor__r.LastName, Vendor__r.FirstName, Availability__c, AM__c, PM__c, Notes__c, 
Agent__c, Agent__r.Name, Slots__c, Booked__c, Application__c
FROM Vendor_Availability__c 
WHERE Application__c = :currentId 
AND Availability__c = 'Available'
];

resultMap.put('availabilityRecords', availabilityRecords);
return resultMap;
}
*/
    
    @AuraEnabled(cacheable=true)
    public static String getOrganizationTimezone() {
        Organization org = [SELECT TimeZoneSidKey FROM Organization LIMIT 1];
        return org.TimeZoneSidKey;
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getVendorAvailability(Id currentId) {
        // Map to hold the results
        Map<String, Object> resultMap = new Map<String, Object>();
        
        // Query to get the available Vendor_Availability__c records
        List<Vendor_Availability__c> availabilityRecords = [
            SELECT Id, Date__c, Vendor__c, Vendor__r.LastName, Vendor__r.FirstName, Availability__c, AM__c, PM__c, Notes__c, 
            Agent__c, Agent__r.Name, Slots__c, Booked__c, Application__c
            FROM Vendor_Availability__c 
            WHERE Application__c = :currentId 
            AND Availability__c = 'Available'
            AND Date__c >= TODAY 
        ];
        
        resultMap.put('availabilityRecords', availabilityRecords);
        
        // Query to get the Application and Vendor details from the Opportunity object
        List<Opportunity> applications = [
            SELECT Name, 
            Account.Name, // Assuming Account is the Vendor
            Agent_1__c, Agent_1__r.Name, 
            Agent_2__c, Agent_2__r.Name, 
            Agent_3__c, Agent_3__r.Name 
            FROM Opportunity 
            WHERE Id = :currentId 
            LIMIT 1
        ];
        
        if (!applications.isEmpty()) {
            Opportunity application = applications[0];
            
            // Add application name and vendor name to the result map
            resultMap.put('applicationName', application.Name);
            
            // Prepare the list of agents
            List<Account> agentOptions = new List<Account>();
            if (application.Agent_1__c != null) {
                agentOptions.add(new Account(Id = application.Agent_1__c, Name = application.Agent_1__r.Name));
            }
            if (application.Agent_2__c != null) {
                agentOptions.add(new Account(Id = application.Agent_2__c, Name = application.Agent_2__r.Name));
            }
            if (application.Agent_3__c != null) {
                agentOptions.add(new Account(Id = application.Agent_3__c, Name = application.Agent_3__r.Name));
            }
            resultMap.put('agentOptions', agentOptions);
        }
        
        // Query to get existing events related to this application (assuming you have an Event object or custom object)
        List<Event> existingEvents = [
            select id, WhoId, WhatId, Agent__c, StartDateTime, EndDateTime, IsBooked__c
            FROM Event
            WHERE WhatId = :currentId
        ];
        
        // Create a new List<sObject> to store the events
        List<sObject> eventSObjects = new List<sObject>();
        
        // Iterate through the existingEvents and cast each Event__c as an sObject
        for (Event event : existingEvents) {
            eventSObjects.add(event);
        }
        
        // Put the list of sObjects in the resultMap
        resultMap.put('existingEvents', eventSObjects);
        
        return resultMap;
    }
    
    @AuraEnabled
    public static String processVendorAvailability(List<Map<String, Object>> dataList, String currentId) {
        System.debug('dataList - ' + dataList);
        System.debug('currentId - ' + currentId);
        
        List<Vendor_Availability__c> recordsToInsert = new List<Vendor_Availability__c>();
        List<Vendor_Availability__c> recordsToUpdate = new List<Vendor_Availability__c>();
        String result;
        String currentObject = checkObject(currentId);
        Opportunity op = new Opportunity();
        
        try {
            if (currentObject == 'Opportunity') {
                op = [SELECT Id, Name, Property__r.Name, Applicant__c, Applicant__r.LastName, Applicant__r.FirstName 
                      FROM Opportunity WHERE Id = :currentId];
            }
            
            // Query existing Vendor Availability records for the current Opportunity or other object
            Map<String, Vendor_Availability__c> existingRecordsMap = new Map<String, Vendor_Availability__c>();
            List<Vendor_Availability__c> existingRecords = [
                SELECT Id, Date__c, Vendor__c, Application__c, Availability__c, AM__c, PM__c
                FROM Vendor_Availability__c 
                WHERE Application__c = :op.Id
                AND Vendor__c = :op.Applicant__c
            ];
            
            // Store existing records in a map keyed by date for easy lookup
            for (Vendor_Availability__c existingRecord : existingRecords) {
                existingRecordsMap.put(existingRecord.Date__c.format(), existingRecord);
            }
            
            // Iterate through the received data
            for (Map<String, Object> data : dataList) {
                String dates = (String) data.get('Date__c');
                Date availabilityDate = Date.valueOf(dates);
                
                Vendor_Availability__c record;
                
                // Check if an existing record exists for the same date
                if (existingRecordsMap.containsKey(availabilityDate.format())) {
                    record = existingRecordsMap.get(availabilityDate.format());
                    
                    // Check if the state has changed from Unavailable to Available
                    if (record.Availability__c == 'Unavailable' && 
                        (String) data.get('Availability__c') == 'Available') {
                            record.Availability__c = 'Available';
                            record.AM__c = (Boolean) data.get('AM__c');
                            record.PM__c = (Boolean) data.get('PM__c');
                            record.Notes__c = (String) data.get('Notes__c');
                            recordsToUpdate.add(record);
                        }else{
                            if((String) data.get('Id') != '' && (String) data.get('Id') != null){
                                //    record.Id = (String) data.get('Id');
                                if(record.Id == (String) data.get('Id') && record.Availability__c == 'Available' && 
                                   (String) data.get('Availability__c') == 'Unavailable')
                                    record.Availability__c = 'Unavailable';
                                record.AM__c = (Boolean) data.get('AM__c');
                                record.PM__c = (Boolean) data.get('PM__c');
                                record.Notes__c = (String) data.get('Notes__c');
                                recordsToUpdate.add(record);
                            }
                        } 
                    // If the state is still Unavailable, do nothing
                    // Optionally, you can add logic here if you want to handle records with "Unavailable" differently
                } else {
                    // Create new records only if they are marked as Available
                    if ((String) data.get('Availability__c') == 'Available' && 
                        ((Boolean) data.get('AM__c') || (Boolean) data.get('PM__c'))) {
                            record = new Vendor_Availability__c();
                            if (currentObject == 'Opportunity') {
                                record.Application__c = op.Id;
                                record.Vendor__c = op.Applicant__c;
                            }
                            record.Date__c = availabilityDate;
                            record.Name = op.Name + ' - ' + dates;
                            record.Availability__c = (String) data.get('Availability__c');
                            record.AM__c = (Boolean) data.get('AM__c');
                            record.PM__c = (Boolean) data.get('PM__c');
                            record.Notes__c = (String) data.get('Notes__c');
                            recordsToInsert.add(record);
                        }
                }
            }
            
            // Insert new records
            if (!recordsToInsert.isEmpty()) {
                try {
                    insert recordsToInsert;
                } catch (DmlException e) {
                    result = 'Error inserting records: ' + e.getMessage();
                    return result;
                }
            }
            
            // Update records with state changes
            if (!recordsToUpdate.isEmpty()) {
                try {
                    update recordsToUpdate;
                } catch (DmlException e) {
                    result = 'Error updating records: ' + e.getMessage();
                    return result;
                }
            }
            
            result = 'Success';
            
        } catch (Exception e) {
            // Handle general exceptions
            result = 'Error processing data: ' + e.getMessage();
        }
        
        return result;
    }
    
    
    private static String checkObject(String recordId) {
        if (recordId.startsWith('006')) {
            return 'Opportunity';
        } else if (recordId.startsWith('003')) {
            return 'Contact';
        } else {
            return 'Unknown Object';
        }
    }
    
    
    @AuraEnabled
    public static String createEvents(List<Map<String, Object>> eventData) {
        System.debug('eventData: ' + JSON.serialize(eventData));
        
        List<Event> eventsToUpsert = new List<Event>();
        String resultMessage = 'Events created or updated successfully';
        
        // Prepare a set of composite keys and individual sets for bulk querying
        Set<String> eventKeys = new Set<String>();
        Set<Id> agentIds = new Set<Id>();
        Set<Id> currentIds = new Set<Id>();
        Set<Id> vendorIds = new Set<Id>();
        
        for (Map<String, Object> data : eventData) {
            Id agentId = (Id) data.get('agentId');
            Id currentId = (Id) data.get('currentId');
            Id vendorId = (Id) data.get('vendorId');
            
            if (agentId != null && currentId != null && vendorId != null) {
                String compositeKey = agentId + '-' + currentId + '-' + vendorId;
                eventKeys.add(compositeKey);
                agentIds.add(agentId);
                currentIds.add(currentId);
                vendorIds.add(vendorId);
            }
        }
        
        // Retrieve existing events in bulk based on the separate ID sets
        Map<String, Event> existingEventsMap = new Map<String, Event>();
        for (Event evt : [SELECT Id, StartDateTime, EndDateTime, Agent__c, WhatId, WhoId 
                          FROM Event 
                          WHERE Agent__c IN :agentIds
                          AND WhatId IN :currentIds
                          AND WhoId IN :vendorIds]) {
                              String key = evt.Agent__c + '-' + evt.WhatId + '-' + evt.WhoId;
                              existingEventsMap.put(key, evt);
                          }
        
        try {
            for (Map<String, Object> data : eventData) {
                Id agentId = (Id) data.get('agentId');
                Id currentId = (Id) data.get('currentId');
                Id vendorId = (Id) data.get('vendorId');
                String startDateTimeStr = (String) data.get('startDateTime');
                String endDateTimeStr = (String) data.get('endDateTime');
                
                if (agentId == null || currentId == null || vendorId == null || 
                    startDateTimeStr == null || endDateTimeStr == null) {
                        System.debug('Missing required field(s) for event creation.');
                        continue;
                    }
                
                DateTime startDateTime, endDateTime;
                try {
                    startDateTime = DateTime.valueOfGmt(startDateTimeStr.replace('T', ' ').replace('Z', ''));
                    endDateTime = DateTime.valueOfGmt(endDateTimeStr.replace('T', ' ').replace('Z', ''));
                } catch (Exception e) {
                    System.debug('DateTime conversion failed for StartDateTime: ' + startDateTimeStr +
                                 ', EndDateTime: ' + endDateTimeStr + '. Error: ' + e.getMessage());
                    resultMessage = 'Error converting date/time values: ' + e.getMessage();
                    return resultMessage;
                }
                
                // Generate the composite key and check if an event exists
                String compositeKey = agentId + '-' + currentId + '-' + vendorId;
                string agentName = [select id, name from account where id =: agentId].Name;
                string vendorName = [select id, name from contact where id =: vendorId].Name;
                string property = [select id, name, Property_Address__c from opportunity where id =: currentId].Property_Address__c;
                Event evt = existingEventsMap.containsKey(compositeKey) 
                    ? existingEventsMap.get(compositeKey) 
                    : new Event(Agent__c = agentId, WhatId = currentId, WhoId = vendorId);
                
                // Update or set event fields
                evt.StartDateTime = startDateTime;
                evt.EndDateTime = endDateTime;
                evt.Subject = 'Valuation appointment with'+' '+agentName ;
                evt.IsBooked__c = true;
                evt.Agent__c = agentId;
                evt.WhatId = currentId;
                evt.WhoId = vendorId;
                evt.Location = property != null ? property : 'NA';
                evt.Type = 'Meeting';
                evt.Application__c = currentId;
                
                eventsToUpsert.add(evt);
            }
            
            if (!eventsToUpsert.isEmpty()) {
                upsert eventsToUpsert;
            } else {
                resultMessage = 'No data available to insert or update.';
            }
        } catch (Exception e) {
            resultMessage = 'Error creating or updating events: ' + e.getMessage();
            System.debug(resultMessage);
        }
        
        return resultMessage;
    }
    
    @AuraEnabled(cacheable=true)
    public static Boolean isSlotBooked(Datetime startDateTime, String slot, Id currentId) {
        System.debug('Start DateTime: ' + startDateTime);
        System.debug('Slot: ' + slot);
        System.debug('Current Opportunity Id: ' + currentId);
        boolean flag = false;
        if (startDateTime == null || currentId == null) {
            throw new AuraHandledException('Invalid input: startDateTime, slot, or currentId is missing.');
        }
        
        List<Event> existingEvents = new List<Event>();
        
        try {
            // Assuming 1-hour slots, calculate the end datetime
            Datetime endDateTime = startDateTime.addHours(1);
            
            // Query for existing events within the same timeframe
            for(Event evt : [
                SELECT Id, Subject, Agent__c, WhoId, WhatId, StartDateTime, EndDateTime, IsBooked__c 
                FROM Event
                WHERE WhatId = :currentId
                AND StartDateTime >= :startDateTime
                AND EndDateTime <= :endDateTime
                AND IsBooked__c = true // Assuming you want to check if the slot is booked
            ] ){
                existingEvents.add(evt);
            }
            
            
        } catch (Exception ex) {
            System.debug('Error in isSlotBooked: ' + ex.getMessage());
            throw new AuraHandledException('Unable to check slot availability due to an internal error.');
        }
        if(existingEvents.size()>0){
            flag = true;
        }
        // Return true if there are any booked events for the selected slot
        return flag;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Boolean isEventCreated(String agentId, String currentId, String vendorId) {
        Date today = Date.today();
        Datetime startOfToday = Datetime.newInstance(today, Time.newInstance(0, 0, 0, 0));
        Datetime startOfTomorrow = Datetime.newInstance(today.addDays(1), Time.newInstance(0, 0, 0, 0));
        
        List<Event> events = [
            SELECT Id, Subject, Agent__c, WhoId, WhatId, StartDateTime, EndDateTime, IsBooked__c
            FROM Event
            WHERE Agent__c = :agentId
            AND WhatId = :currentId
            AND WhoId = :vendorId
            AND IsBooked__c = true
            LIMIT 1
        ];
        
        
        // Filter to ensure StartDateTime and EndDateTime are within today or future dates
        if (events.size() >= 1) {
            return true;
        } else{
            return false;
        }
        
        
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Event> getEvents(String currentId) {
        return [
            SELECT Id, Subject, Agent__c, Agent__r.Name, WhoId, WhatId, StartDateTime, EndDate, EndDateTime, Description, IsBooked__c 
            FROM Event
            WHERE WhatId = :currentId Limit 200
        ];
    }
    
    @AuraEnabled
    public static void updateEvents(List<Event> events) {
        try {
            update events;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

         @AuraEnabled(cacheable=true)
    public static List<Vendor_Availability__c> getAvailabilityDataForOpportunity(Id opportunityId) {
        if (String.isBlank(opportunityId)) {
            throw new AuraHandledException('Opportunity ID cannot be null');
        }

        return [
            SELECT Date__c, AM__c, PM__c 
            FROM Vendor_Availability__c 
            WHERE Application__c = :opportunityId
        ];
    }
    
}