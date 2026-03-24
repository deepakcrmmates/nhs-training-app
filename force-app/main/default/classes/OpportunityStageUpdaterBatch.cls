/**
* @File Name : OpportunityStageUpdaterBatch.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : December 25, 2024
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | December 25, 2024 |   | Initial Version
**/

global class OpportunityStageUpdaterBatch implements Database.Batchable<SObject>, Database.Stateful {

    // Specify the query to fetch opportunities for processing
    global Database.QueryLocator start(Database.BatchableContext BC) {
        String process = 'Agents Booked';
String query = 'SELECT Id, StageName, NHS_Process__c, Agent_1_Appointment__c, Agent_2_Appointment__c, Agent_3_Appointment__c '
             + 'FROM Opportunity WHERE NHS_Process__c = \'' + process + '\'';
System.debug('Query: ' + query);
return Database.getQueryLocator(query);


    }

    // Process each batch of records
    global void execute(Database.BatchableContext BC, List<Opportunity> scope) {
		
        for (Opportunity opp : scope) {

            DateTime currentDateTime = System.now();
            System.debug('Current DateTime: ' + currentDateTime);
            System.debug('Agent 1 Appointment DateTime: ' + opp.Agent_1_Appointment__c);
            System.debug('Agent 2 Appointment DateTime: ' + opp.Agent_2_Appointment__c);
            System.debug('Agent 3 Appointment DateTime: ' + opp.Agent_3_Appointment__c);

            if(opp.Agent_1_Appointment__c < currentDateTime  || opp.Agent_2_Appointment__c < currentDateTime || opp.Agent_3_Appointment__c < currentDateTime) {
                opp.NHS_Process__c = 'Figures to Chased'; // Update stage
            }
        }
        try {
            // Perform DML operation
            update scope;
        } catch (DmlException e) {
            // Log errors if DML fails
            System.debug('Error updating opportunities: ' + e.getMessage());
        }
    }

    // Final method executed after all batches are processed
    global void finish(Database.BatchableContext BC) {
        // Optionally send a completion email or log a message
        System.debug('Opportunity stage update batch process completed.');
    }
}