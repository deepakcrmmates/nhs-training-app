Id planId = [SELECT Id FROM NHS_Project_Plan__c LIMIT 1].Id;
Datetime now = Datetime.now();
List<NHS_Project_Plan_Task__c> adhoc = new List<NHS_Project_Plan_Task__c>();

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Medium', Category__c = 'Feature',
    Title__c = 'Preview icon on Property Address (opens property record in new tab)',
    Description__c = 'Eye-icon Preview button on the right of PROPERTY ADDRESS. NavigationMixin.GenerateUrl + window.open opens the linked NHS_Property__c in a new browser tab.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'UX Improvement',
    Title__c = 'UK currency formatting on Valuation Figures inputs',
    Description__c = 'All 12 currency inputs (Agent 1/2/3 x Initial/Target/Bottom + NHS Market/Target/Forced) render with en-GB comma separators. Handler strips commas, pound, spaces before saving.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Medium', Category__c = 'UX Improvement',
    Title__c = 'Property Description auto-derivation in Quick Summary',
    Description__c = 'When Opportunity.Property_Description__c is blank, the description (eg "Apartment 2 Bed") is derived from the linked NHS_Property__c type checkboxes + bedrooms. Self-healing for older records.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Medium', Category__c = 'Feature',
    Title__c = 'Vendors list — Account column (Household link)',
    Description__c = 'Added Account column on the Vendors tab showing each vendor Contact Household Account as a clickable link. Only shown on Contact-based lists.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'Feature',
    Title__c = 'Housebuilder Detail — Edit modal with phone validation',
    Description__c = 'Sage Edit button in hero header opens modal editing Name/Email/Phone/Website/Address. Phone restricted to digits, +, (, ), -, space — keypress block + paste scrubber + save-time regex.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Critical', Category__c = 'Bug Fix',
    Title__c = 'Fix: Create Application infinite-loop crash',
    Description__c = 'houseBuilderApplication.getAccountFileUrl threw QueryException on null accountId — LWC @wire re-fired in a loop. Made Apex null-safe and added guarded getter so wire is skipped until Housebuilder picked.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'Bug Fix',
    Title__c = 'Fix: Generate PDF button on Application page',
    Description__c = 'HTML called handleGeneratePdf (lowercase df) but JS defined handleGeneratePDF — click did nothing. Also added missing loader modal markup so spinner + status actually appear.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'Feature',
    Title__c = 'Valuation Ready smart eligibility rules',
    Description__c = 'ValuationsReadyController: if Agent 1 = New Home Solutions, only Agents 2 and 3 need all 3 figures. Otherwise all 3 agents need all 3 figures. Unassigned Agent 1 never qualifies.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'UX Improvement',
    Title__c = 'Project Plan Kanban — drag/drop animation + optimistic update',
    Description__c = 'Card ghost rotation while dragging, target column highlights, instant landing pop (0.45s cubic-bezier). Server sync fire-and-forget with silent revert on failure.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Critical', Category__c = 'Bug Fix',
    Title__c = 'Fix: Project Plan Kanban not auto-loading after save / drop',
    Description__c = 'getTasks was cacheable=true, so imperative calls after save/drop returned stale data. Removed annotation — reloads now pull live data.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'High', Category__c = 'Feature',
    Title__c = 'Final Checks — blocker panel when checks or valuations missing',
    Description__c = 'Email composer hidden until all 7 checks ticked AND all 12 valuation figures populated. Red blocker panel lists exactly what is missing per agent and for NHS Recommendation.'
));

adhoc.add(new NHS_Project_Plan_Task__c(
    Project_Plan__c = planId, Status__c = 'Done', Completed_Date__c = now,
    Priority__c = 'Medium', Category__c = 'Admin',
    Title__c = 'Stopped Twilio sync scheduler (unused)',
    Description__c = 'Aborted Notify Message Sync Failure + Monthly Archive scheduled jobs. Eliminated the hourly sync-failed email flood. Package left installed for future reactivation.'
));

insert adhoc;
System.debug('>> Inserted ad-hoc Done tasks: ' + adhoc.size());
