@isTest
public class OpportunityStageUpdaterBatchTest {
    @isTest
    public static void testTheMethod(){
        //creat a updated list 
        List<Opportunity> oppListToUpdated = new List<Opportunity>();
        for(Integer i=0; i<200; i++){
            Opportunity newOpp = new Opportunity();
            newOpp.Name = 'test opportunity';
            newOpp.CloseDate = Date.today().addDays(3);
            newOpp.Application_Name__c = 'test application';
            newOpp.StageName = 'New Appplication';
            newOpp.NHS_Process__c = 'Agents Booked';
            newOpp.Agent_1_Appointment__c = Date.today();
            newOpp.Agent_2_Appointment__c = Date.today().addDays(1);
            newOpp.Agent_3_Appointment__c = Date.today().addDays(2);
            oppListToUpdated.add(newOpp);
        }
        insert oppListToUpdated;
                
        
        Test.startTest();
        OpportunityStageUpdaterBatch osb = new OpportunityStageUpdaterBatch();
        Database.executeBatch(osb);
        OpportunityStageUpdaterSchedule osbs = new OpportunityStageUpdaterSchedule();
        System.schedule('Test Schedule' ,'0 5 * * * ?',osbs);
        Test.stopTest();
    }
}