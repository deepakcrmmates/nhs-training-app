// Mark recently-completed Project Plan tasks as Done.
Datetime now = Datetime.now();
Set<Id> doneIds = new Set<Id>{
    'a0pKG000000GaGlYAK', // Vendors independent (Households)
    'a0pKG000000GaGgYAK', // Go to Application button on success screen
    'a0pKG000000GaGbYAK', // Manually enter address at Create Application
    'a0pKG000000Ga33YAC', // Refresh button testing
    'a0pKG000000Ga35YAC', // Latest notes on top
    'a0pKG000000Ga37YAC', // Assign Estate Agent list + map
    'a0pKG000000Ga38YAC', // Per-agent Valuation Report upload
    'a0pKG000000Ga3AYAS', // Final Checks template via NHS Config
    'a0pKG000000Ga3BYAS'  // Housebuilder new record page + Lightning layout
};
List<NHS_Project_Plan_Task__c> toUpdate = new List<NHS_Project_Plan_Task__c>();
for (Id tId : doneIds) {
    toUpdate.add(new NHS_Project_Plan_Task__c(
        Id = tId,
        Status__c = 'Done',
        Completed_Date__c = now
    ));
}
update toUpdate;
System.debug('>> Marked Done: ' + toUpdate.size() + ' task(s).');

// Annotate blocked items (leave status but add a reason in Notes__c so the board shows the blocker).
List<NHS_Project_Plan_Task__c> blocked = new List<NHS_Project_Plan_Task__c>{
    new NHS_Project_Plan_Task__c(
        Id = 'a0pKG000000Ga30YAC', // 3CX integration
        Notes__c = 'BLOCKED 2026-04-21 — awaiting Gradwell ticket update for Salesforce integration approval + API key details.'
    ),
    new NHS_Project_Plan_Task__c(
        Id = 'a0pKG000000Ga32YAC', // Twilio SMS audit
        Notes__c = 'BLOCKED 2026-04-21 — card / billing issue + compliance review outstanding. Scheduler stopped in the meantime.'
    )
};
update blocked;
System.debug('>> Annotated blocked: ' + blocked.size() + ' task(s).');
