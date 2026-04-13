public with sharing class HomeDashboardController {

    @AuraEnabled
    public static Map<String, Object> getDashboardData() {
        Map<String, Object> result = new Map<String, Object>();

        try {
            // User info
            User u = [SELECT FirstName, LastName, SmallPhotoUrl FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            result.put('firstName', u.FirstName);
            result.put('lastName', u.LastName);
            result.put('photoUrl', u.SmallPhotoUrl);

            // ── KPI Cards ──

            // Active applications (not Archived/Sale Cancelled)
            Integer activeApps = [SELECT COUNT() FROM Opportunity WHERE StageName NOT IN ('Archive', 'Sale Cancelled')];
            result.put('activeApplications', activeApps);

            // New this month
            Date monthStart = Date.today().toStartOfMonth();
            Integer newThisMonth = [SELECT COUNT() FROM Opportunity WHERE CreatedDate >= :monthStart];
            result.put('newThisMonth', newThisMonth);

            // New this week
            Date weekStart = Date.today().toStartOfWeek();
            Integer newThisWeek = [SELECT COUNT() FROM Opportunity WHERE CreatedDate >= :weekStart];
            result.put('newThisWeek', newThisWeek);

            // Upcoming appointments (Events in next 7 days)
            Datetime now = Datetime.now();
            Datetime weekEnd = now.addDays(7);
            Integer upcomingAppts = [SELECT COUNT() FROM Event WHERE StartDateTime >= :now AND StartDateTime <= :weekEnd];
            result.put('upcomingAppointments', upcomingAppts);

            // Total properties
            Integer totalProperties = [SELECT COUNT() FROM NHS_Property__c];
            result.put('totalProperties', totalProperties);

            // Total agents
            Id agentRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Estate_Agents').getRecordTypeId();
            Integer totalAgents = [SELECT COUNT() FROM Account WHERE RecordTypeId = :agentRT];
            result.put('totalAgents', totalAgents);

            // ── Pipeline by NHS Process ──
            List<Map<String, Object>> pipeline = new List<Map<String, Object>>();
            for (AggregateResult ar : [
                SELECT NHS_Process__c proc, COUNT(Id) cnt
                FROM Opportunity
                WHERE NHS_Process__c != null AND StageName NOT IN ('Archive', 'Sale Cancelled')
                GROUP BY NHS_Process__c
                ORDER BY COUNT(Id) DESC
            ]) {
                pipeline.add(new Map<String, Object>{
                    'stage' => (String) ar.get('proc'),
                    'count' => (Integer) ar.get('cnt')
                });
            }
            result.put('pipeline', pipeline);

            // ── Recent Applications (last 10) ──
            List<Map<String, Object>> recent = new List<Map<String, Object>>();
            for (Opportunity opp : [
                SELECT Id, Name, StageName, NHS_Process__c, CreatedDate,
                       Property_Address__c, Vendor_1__r.Name, House_Builder__r.Name
                FROM Opportunity
                ORDER BY CreatedDate DESC
                LIMIT 10
            ]) {
                recent.add(new Map<String, Object>{
                    'id' => opp.Id,
                    'name' => opp.Name,
                    'stage' => opp.StageName,
                    'process' => opp.NHS_Process__c,
                    'createdDate' => opp.CreatedDate,
                    'address' => opp.Property_Address__c,
                    'vendor' => opp.Vendor_1__r != null ? opp.Vendor_1__r.Name : '',
                    'houseBuilder' => opp.House_Builder__r != null ? opp.House_Builder__r.Name : ''
                });
            }
            result.put('recentApplications', recent);

            // ── Upcoming Appointments (next 7 days, max 5) ──
            List<Map<String, Object>> appts = new List<Map<String, Object>>();
            for (Event evt : [
                SELECT Id, Subject, StartDateTime, EndDateTime, Location,
                       What.Name, Who.Name
                FROM Event
                WHERE StartDateTime >= :now AND StartDateTime <= :weekEnd
                ORDER BY StartDateTime ASC
                LIMIT 5
            ]) {
                appts.add(new Map<String, Object>{
                    'id' => evt.Id,
                    'subject' => evt.Subject,
                    'startTime' => evt.StartDateTime,
                    'endTime' => evt.EndDateTime,
                    'location' => evt.Location,
                    'relatedTo' => evt.What != null ? evt.What.Name : '',
                    'contact' => evt.Who != null ? evt.Who.Name : ''
                });
            }
            result.put('upcomingEvents', appts);

            result.put('status', 'success');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }
}
