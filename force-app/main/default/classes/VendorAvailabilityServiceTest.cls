@isTest
public class VendorAvailabilityServiceTest {
  
    @testSetup
    static void setupTestData() {
        Account account = new Account(Name = 'Test Account');
        insert account;
        // Create RecordType for Estate_Agents
        RecordType estateAgentsRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Account' AND DeveloperName = 'Estate_Agents' LIMIT 1];
              RecordType oppRecordType = [SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' AND DeveloperName = 'Part_Exchange_Applications' LIMIT 1];

        
        Opportunity opp = new Opportunity(
            Application_Name__c = 'Test Opportunity',
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = System.today().addMonths(1),
            RecordTypeId = oppRecordType.Id// Adjust fields as needed
        );
        insert opp;
        // Create test Application (currentId)
        Id applicationId = opp.id;
         // Create test Vendor (Contact)
        Contact applicant = new Contact(FirstName = 'John', LastName = 'Doe');
        insert applicant;

        // Update the opportunity with the applicant (vendor) reference
        opp.Applicant__c = applicant.Id;
        update opp;
        // Create test Vendor (Contacts)
        Contact vendor1 = new Contact(FirstName = 'Vendor', LastName = 'One');
        Contact vendor2 = new Contact(FirstName = 'Vendor', LastName = 'Two');
        Contact vendor3 = new Contact(FirstName = 'Vendor', LastName = 'Three');
        insert new List<Contact>{vendor1, vendor2, vendor3};
        
        // Create test Agents (Accounts with Estate_Agents record type)
        Account agent1 = new Account(Name = 'Agent One', RecordTypeId = estateAgentsRecordType.Id);
        Account agent2 = new Account(Name = 'Agent Two', RecordTypeId = estateAgentsRecordType.Id);
        Account agent3 = new Account(Name = 'Agent Three', RecordTypeId = estateAgentsRecordType.Id);
        insert new List<Account>{agent1, agent2, agent3};
        
        // Create available Vendor_Availability__c records
        List<Vendor_Availability__c> availabilityRecords = new List<Vendor_Availability__c>{
            new Vendor_Availability__c(
                Date__c = System.today(),
                Vendor__c = vendor1.Id,
                Availability__c = 'Available',
                AM__c = true,
                PM__c = false,
                Application__c = applicationId,
                Agent__c = agent1.Id
            ),
            new Vendor_Availability__c(
                Date__c = System.today(),
                Vendor__c = vendor2.Id,
                Availability__c = 'Available',
                AM__c = false,
                PM__c = true,
                Application__c = applicationId,
                Agent__c = agent2.Id
            ),
            new Vendor_Availability__c(
                Date__c = System.today(),
                Vendor__c = vendor3.Id,
                Availability__c = 'Available',
                AM__c = true,
                PM__c = true,
                Application__c = applicationId,
                Agent__c = agent3.Id
            ),
                 new Vendor_Availability__c(
                Application__c = opp.Id,
                Vendor__c = vendor3.Id,
                Date__c = System.today(),
                Availability__c = 'Unavailable',
                AM__c = false,
                PM__c = false
            ),
            new Vendor_Availability__c(
                Application__c = opp.Id,
                Vendor__c = vendor3.Id,
                Date__c = System.today().addDays(1),
                Availability__c = 'Available',
                AM__c = true,
                PM__c = false
            )
                
        };
        insert availabilityRecords;
        
        // Create test Event records
        List<Event> events = new List<Event>{
            new Event(
                StartDateTime = DateTime.now(),
                EndDateTime = DateTime.now().addHours(2),
                Agent__c = agent1.Id,
                WhatId = applicationId,
                WhoId = vendor1.Id
            ),
            new Event(
                StartDateTime = DateTime.now().addDays(1),
                EndDateTime = DateTime.now().addDays(1).addHours(2),
                Agent__c = agent2.Id,
                WhatId = applicationId,
                WhoId = vendor2.Id
            ),
            new Event(
                StartDateTime = DateTime.now().addDays(2),
                EndDateTime = DateTime.now().addDays(2).addHours(2),
                Agent__c = agent3.Id,
                WhatId = applicationId,
                WhoId = vendor3.Id
            ),
                 new Event(
            StartDateTime = DateTime.now().addDays(1),
            EndDateTime = DateTime.now().addDays(1).addHours(1),
            WhoId = vendor3.Id,
            WhatId = applicationId,
            Agent__c = agent3.Id,
            Subject = 'Appointment',
            IsBooked__c = true
        ),
                new Event(
                StartDateTime = DateTime.now().addDays(1),
                EndDateTime = DateTime.now().addDays(1).addHours(1),
                WhoId = vendor3.Id,
                WhatId = applicationId,
                Agent__c = agent3.Id,
                Subject = 'Appointment ',
                IsBooked__c = false
            ),
            new Event(
                StartDateTime = DateTime.now().addDays(2),
                EndDateTime = DateTime.now().addDays(2).addHours(1),
                 WhoId = vendor3.Id,
                WhatId = applicationId,
                Agent__c = agent3.Id,
                Subject = 'Appointment',
                IsBooked__c = false
            )
      
        };
        insert events;
    }

    @isTest
    public static void testGetExistingVendorAvailability() {
        // Fetch the applicationId used in setup
        Id applicationId = [SELECT Application__c FROM Vendor_Availability__c LIMIT 1].Application__c;
        
        // Test the method
        Test.startTest();
        Map<String, Object> result = VendorAvailabilityService.getExistingVendorAvailability(applicationId);
        Test.stopTest();
        
        // Output data for debugging/logging
        List<Vendor_Availability__c> availabilityRecords = (List<Vendor_Availability__c>)result.get('availabilityRecords');
        for (Vendor_Availability__c availability : availabilityRecords) {
            System.debug('Available Vendor: ' + availability.Vendor__r.FirstName + ' ' + availability.Vendor__r.LastName);
            System.debug('Date: ' + availability.Date__c);
            System.debug('AM: ' + availability.AM__c + ' PM: ' + availability.PM__c);
        }
    }
    @isTest
    static void testGetOrganizationTimezone() {
        // Run the method to get the organization's timezone
        Test.startTest();
        String timeZoneSidKey = VendorAvailabilityService.getOrganizationTimezone();
        Test.stopTest();
        
        // Log the timezone for verification (since you don't want to use assert)
        System.debug('Organization TimeZoneSidKey: ' + timeZoneSidKey);
    }
	
      @isTest
    static void testGetVendorAvailability() {
        // Fetch the opportunity (application) used in setup
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
        
        // Call the method under test
        Test.startTest();
        Map<String, Object> result = VendorAvailabilityService.getVendorAvailability(opp.Id);
        Test.stopTest();
        
        // Output data for debugging/logging since you don't want to use assert statements
        System.debug('Application Name: ' + result.get('applicationName'));
        List<Vendor_Availability__c> availabilityRecords = (List<Vendor_Availability__c>) result.get('availabilityRecords');
        for (Vendor_Availability__c availability : availabilityRecords) {
            System.debug('Available Vendor: ' + availability.Vendor__r.FirstName + ' ' + availability.Vendor__r.LastName);
            System.debug('Date: ' + availability.Date__c);
            System.debug('AM: ' + availability.AM__c + ' PM: ' + availability.PM__c);
        }
        
        List<Account> agentOptions = (List<Account>) result.get('agentOptions');
        for (Account agent : agentOptions) {
            System.debug('Agent Option: ' + agent.Name);
        }
        
        List<Event> existingEvents = (List<Event>) result.get('existingEvents');
        for (Event event : existingEvents) {
            System.debug('Event ID: ' + event.Id + ', Start: ' + event.StartDateTime + ', End: ' + event.EndDateTime);
        }
    }
     @isTest
    static void testProcessVendorAvailability_InsertAndUpdate() {
        // Fetch the test Opportunity
        Opportunity opp = [SELECT Id, Applicant__c FROM Opportunity LIMIT 1];

        // Prepare the data to be passed into the processVendorAvailability method
        List<Map<String, Object>> dataList = new List<Map<String, Object>>();

        // Adding a new Available record for a date not in existing records
        Map<String, Object> newAvailableData = new Map<String, Object>{
            'Date__c' => String.valueOf(System.today().addDays(2)), // New date
            'Availability__c' => 'Available',
            'AM__c' => true,
            'PM__c' => true,
            'Notes__c' => 'New availability record'
        };
        dataList.add(newAvailableData);

        // Update an existing record from Unavailable to Available
        Map<String, Object> updateData = new Map<String, Object>{
            'Date__c' => String.valueOf(System.today()), // Existing date
            'Availability__c' => 'Available', // Update availability
            'AM__c' => true,
            'PM__c' => false,
            'Notes__c' => 'Updated to available'
        };
        dataList.add(updateData);

        // Call the method under test
        Test.startTest();
        String result = VendorAvailabilityService.processVendorAvailability(dataList, opp.Id);
        Test.stopTest();

        // Log the result for review
        System.debug('Result: ' + result);

        // Verify that records were inserted and updated correctly
        List<Vendor_Availability__c> availabilities = [
            SELECT Id, Date__c, Availability__c, AM__c, PM__c, Notes__c
            FROM Vendor_Availability__c 
            WHERE Application__c = :opp.Id
        ];
        System.debug('Vendor Availabilities: ' + availabilities);

        // We don't use asserts, so we're logging the results for review.
    }

    @isTest
    static void testProcessVendorAvailability_ExceptionHandling() {
        // Passing invalid data to simulate exception
        List<Map<String, Object>> invalidDataList = new List<Map<String, Object>>();

        // Invalid date format to trigger exception
        Map<String, Object> invalidData = new Map<String, Object>{
            'Date__c' => 'InvalidDate',
            'Availability__c' => 'Available',
            'AM__c' => true,
            'PM__c' => false,
            'Notes__c' => 'This should cause an exception'
        };
        invalidDataList.add(invalidData);

        // Fetch the test Opportunity
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

        // Call the method under test
        Test.startTest();
        String result = VendorAvailabilityService.processVendorAvailability(invalidDataList, opp.Id);
        Test.stopTest();

        // Log the result for review
        System.debug('Result (Exception Case): ' + result);
    }
     @IsTest
    static void testCreateEvents() {
        // Retrieve test data
        Opportunity opp = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];
        Contact vendor = [SELECT Id FROM Contact WHERE LastName = 'One' LIMIT 1];
        Account agent1 = [SELECT Id FROM Account WHERE Name = 'Agent One' LIMIT 1];
        Account agent2 = [SELECT Id FROM Account WHERE Name = 'Agent Two' LIMIT 1];

        // Prepare event data for the method call
        List<Map<String, Object>> eventData = new List<Map<String, Object>>();
        Map<String, Object> newEventData = new Map<String, Object>{
           'agentId' => agent1 != null ? agent1.Id : '',
            'currentId' => opp!= null ? opp.Id :'',
            'vendorId' =>vendor != null ? vendor.Id : '',
            'startDateTime' => DateTime.now().addDays(2).formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
            'endDateTime' => DateTime.now().addDays(2).addHours(1).formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')
        };
        eventData.add(newEventData);
        
        // Call the method and validate result
        Test.startTest();
        String resultMessage = VendorAvailabilityService.createEvents(eventData);
        Test.stopTest();
   }
    @isTest
    static void testIsSlotBooked_BookedSlot() {
        // Fetch the test opportunity
        Opportunity testOpportunity = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];
system.debug(testOpportunity);
        // Define a start time that overlaps with the booked event
        Datetime startDateTime = DateTime.now().addDays(1);
        
        // Call the method
        Boolean isBooked = VendorAvailabilityService.isSlotBooked(startDateTime, 'AM', testOpportunity.Id);
  }

    @isTest
    static void testIsSlotBooked_UnbookedSlot() {
        // Fetch the test opportunity
        Opportunity testOpportunity = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];

        // Define a start time that does not overlap with any booked event
        Datetime startDateTime = DateTime.now().addDays(2); // Future date with no booked events
        
        // Call the method
        Boolean isBooked = VendorAvailabilityService.isSlotBooked(startDateTime, '', testOpportunity.Id);
}

    @isTest
    static void testIsSlotBooked_InvalidInputs() {
        try {
           VendorAvailabilityService.isSlotBooked(null, null, null);
        } catch (AuraHandledException e) {
        }
    }
       @isTest
    static void testIsEventCreated_BookedEvent() {
        // Fetch the test data
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Agent three' LIMIT 1];
        Contact testVendor = [SELECT Id FROM Contact WHERE LastName = 'Three' LIMIT 1];
        Opportunity testOpportunity = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];

        // Call the method
        Boolean eventExists = VendorAvailabilityService.isEventCreated(testAccount.Id, testOpportunity.Id, testVendor.Id);

        // Verify that the event exists
       // System.assertEquals(true, eventExists, 'The event should be marked as created.');
    }

    @isTest
    static void testIsEventCreated_NoBookedEvent() {
        // Fetch the test data
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Agent three' LIMIT 1];
        Contact testVendor = [SELECT Id FROM Contact WHERE LastName = 'Three' LIMIT 1];
        Opportunity testOpportunity = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];

        // Create an event that is not booked
        Event unbookedEvent = new Event(
            StartDateTime = DateTime.now().addDays(2),
            EndDateTime = DateTime.now().addDays(2).addHours(1),
            WhoId = testVendor.Id,
            WhatId = testOpportunity.Id,
            Agent__c = testAccount.Id,
            Subject = 'Appointment',
            IsBooked__c = false
        );
        insert unbookedEvent;

        // Call the method
        Boolean eventExists = VendorAvailabilityService.isEventCreated(testAccount.Id, testOpportunity.Id, testVendor.Id);
  }

    @isTest
    static void testIsEventCreated_NoEvents() {
        // Create new account and vendor without events
        Account testAccount = new Account(Name = 'New Estate Agent', RecordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Estate_Agents' LIMIT 1].Id);
        insert testAccount;

        Contact testVendor = new Contact(LastName = 'New Vendor', FirstName = 'Vendor Firstname', AccountId = testAccount.Id);
        insert testVendor;

        Opportunity testOpportunity = new Opportunity(Application_Name__c ='New Opportunity', Name = 'New Opportunity', StageName = 'Prospecting', CloseDate = Date.today(), Applicant__c = testVendor.Id, Agent_1__c = testAccount.Id);
        insert testOpportunity;

        // Call the method
        Boolean eventExists = VendorAvailabilityService.isEventCreated(testAccount.Id, testOpportunity.Id, testVendor.Id);

   }
     @isTest
    static void testUpdateEvents_Success() {
        // Fetch the test event
        Event testEvent = [SELECT Id, Subject FROM Event WHERE Subject = 'Appointment' LIMIT 1];

        // Update the event's subject
        testEvent.Subject = 'Appointment';

        // Prepare a list of events to update
        List<Event> eventsToUpdate = new List<Event> { testEvent };

        // Call the updateEvents method
        VendorAvailabilityService.updateEvents(eventsToUpdate);

    }

    @isTest
    static void testUpdateEvents_Failure() {
        // Prepare an invalid event ID
        List<Event> eventsToUpdate = new List<Event> {
            new Event(Subject = 'Appointment')
        };

        // Attempt to call the updateEvents method and verify that it throws an exception
        Test.startTest();
        try {
            VendorAvailabilityService.updateEvents(eventsToUpdate);
            // If no exception is thrown, fail the test
           // System.assert(false, 'An exception should have been thrown for invalid event ID.');
        } catch (AuraHandledException e) {
            //System.assertEquals('INVALID_CROSS_REFERENCE_KEY', e.getMessage(), 'The exception message should indicate an invalid reference.');
        }
        Test.stopTest();
    }
     @isTest
    static void testGetEvents() {
        // Fetch the test opportunity
        Opportunity testOpportunity = [SELECT Id FROM Opportunity WHERE Name = 'Test Opportunity' LIMIT 1];

        // Call the getEvents method
        List<Event> events = VendorAvailabilityService.getEvents(testOpportunity.Id);
  }

    @isTest
    static void testGetEvents_NoEvents() {
        // Create another opportunity with no events
        Opportunity emptyOpportunity = new Opportunity(Application_Name__c ='New Opportunity', Name = 'Empty Opportunity', StageName = 'Prospecting', CloseDate = Date.today());
        insert emptyOpportunity;

        // Call the getEvents method for the empty opportunity
        List<Event> events = VendorAvailabilityService.getEvents(emptyOpportunity.Id);

    }
}