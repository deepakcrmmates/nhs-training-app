global class OpportunityStageUpdaterSchedule implements Schedulable {
    global void execute(SchedulableContext SC) {
        OpportunityStageUpdaterBatch batch = new OpportunityStageUpdaterBatch();
        Database.executeBatch(batch, 200);
    }
}