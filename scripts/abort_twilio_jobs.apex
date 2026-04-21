// Twilio is not in use — abort all Twilio-related scheduled jobs to stop the
// "Notify Message Sync Failure" email flood and prevent future archive runs.

for (CronTrigger ct : [
    SELECT Id, CronJobDetail.Name
    FROM CronTrigger
    WHERE CronJobDetail.Name LIKE '%Twilio%'
       OR CronJobDetail.Name LIKE '%Notify Message Sync Failure%'
]) {
    System.debug('>> Aborting: ' + ct.CronJobDetail.Name + ' (' + ct.Id + ')');
    System.abortJob(ct.Id);
}

// Confirm none remain
Integer remaining = [
    SELECT COUNT()
    FROM CronTrigger
    WHERE CronJobDetail.Name LIKE '%Twilio%'
       OR CronJobDetail.Name LIKE '%Notify Message Sync Failure%'
];
System.debug('>> Remaining Twilio jobs: ' + remaining);
