@IsTest
public class OpportunityControllerTest {

    @TestSetup
    static void setupTestData() {
        // Create a test Account for Housebuilder
        Account houseBuilder = new Account(Name = 'Test Housebuilder', BillingCity = 'Test City');
        insert houseBuilder;
        
        // Create a test Contact for Vendor
        Contact vendor1 = new Contact(FirstName = 'Vendor', LastName = 'One');
        insert vendor1;

        Contact vendor2 = new Contact(FirstName = 'Vendor', LastName = 'Two');
        insert vendor2;

        // Create a test Property (custom object)
        NHS_Property__c property = new NHS_Property__c(Name = 'Test Property');
        insert property;
        
        // Create an Opportunity RecordType
        Id recordTypeId = [SELECT Id FROM RecordType 
                          WHERE SObjectType = 'Opportunity' 
                          AND IsActive = true 
                          LIMIT 1].Id;
        
              // Create test Opportunities with different stages
        List<Opportunity> opportunities = new List<Opportunity>();
        List<String> stages = new List<String>{'New Application', 'Applications', 'Valuation In Progress'};
            
        // Create a test Opportunity
        for(Integer i = 0; i < stages.size(); i++) {
            opportunities.add(new Opportunity(
                Name = 'Test Opp ' + i,
                Application_Name__c = 'Test Application ' + i,
                RecordTypeId = recordTypeId,
                House_Builder__c = houseBuilder.Id,
                Property__c = property.Id,
                Vendor_1__c = vendor1.Id,
                Vendor_2__c = vendor2.Id,
                StageName = stages[i],
                CloseDate = Date.today().addDays(30),
                Plot__c = 'Plot ' + i
               
            ));
        }
        insert opportunities;
        
    }

   @IsTest
    static void testCreateOpportunityRecord() {
        // Prepare data for creating an Opportunity
        Map<String, Object> oppFields = new Map<String, Object>{
            //'Scheme__c' => 'New Scheme',
            'Name' => 'Test Application',
                'Application_Name__c'=>'Test Application',
             'StageName' => 'New Application',      
             'CloseDate' => Date.today().addMonths(1),
            'ETA_Comp_Date_Start_Range__c' => Date.today(),
            'ETA_Comp_Date_End_Range__c' => Date.today().addDays(10),
            'Property__c' => [SELECT Id FROM NHS_Property__c LIMIT 1].Id,
            'Date_of_Application_Received__c' => Date.today(),
            'Vendor_1__c' => [SELECT Id FROM Contact LIMIT 1].Id,
            'Vendor_2__c' => [SELECT Id FROM Contact LIMIT 1 OFFSET 1].Id
           
        };

        // Call the method
        Test.startTest();
        OpportunityController.createOpportunityRecord(oppFields);
        Test.stopTest();


    }

    @IsTest
    static void testShowOpportunityData() {
        // Get the RecordType Id for Opportunity
        Id recordTypeId = [SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' LIMIT 1].Id;

        // Call the method
        Test.startTest();
        Map<String, Object> opportunityData = OpportunityController.showOpportunityData(recordTypeId);
        Test.stopTest();

        // Add log for checking the results
        System.debug('Opportunity Data: ' + opportunityData);
    }
    
    
  
    @IsTest
    static void testUpdateOpportunityStage() {
        // Query an existing Opportunity
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

        // Call the method to update the StageName
        Test.startTest();
        String result = OpportunityController.updateOpportunityStage(opp.Id, 'Closed Won');
        Test.stopTest();

        // Add log for checking the results
        System.debug('Updated Opportunity: ' + result);
    }
     @IsTest
    static void testGetRecordTypes() {
        // Call the method
        Test.startTest();
        List<RecordType> recordTypes = OpportunityController.getRecordTypes();
        Test.stopTest();

        // Log to verify Record Types were returned
        System.debug('Record Types: ' + recordTypes);
    }
    @IsTest
    static void testGetOpportunityStages() {
    // Get the RecordType DeveloperName for Opportunity
    String recordTypeDevName = [SELECT DeveloperName FROM RecordType WHERE SObjectType = 'Opportunity' LIMIT 1].DeveloperName;

    // Call the method to test
    Test.startTest();
    List<OpportunityController.OpportunityStageWrapper> stageWrappers = OpportunityController.getOpportunityStages(recordTypeDevName);
    Test.stopTest();

    // Debug for verification
    System.debug('Stage Wrappers: ' + stageWrappers);

    // Optional assertion
    System.assert(stageWrappers.size() > 0, 'There should be at least one stage with opportunities');
    System.assert(stageWrappers[0].opportunities.size() > 0, 'There should be opportunities under the stage');
}


}