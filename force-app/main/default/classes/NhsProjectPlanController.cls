public with sharing class NhsProjectPlanController {

    @AuraEnabled(cacheable=true)
    public static List<NHS_Project_Plan__c> getProjectPlans() {
        return [
            SELECT Id, Name, Title__c, Description__c, Status__c, Start_Date__c, Target_End_Date__c,
                   (SELECT Id FROM Tasks__r)
            FROM NHS_Project_Plan__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getTasks(Id projectPlanId, Boolean includeClosed) {
        List<Map<String, Object>> results = new List<Map<String, Object>>();

        String q = 'SELECT Id, Name, Title__c, Description__c, Priority__c, Status__c, Category__c, ' +
                   'Assigned_To__c, Assigned_To__r.Name, Due_Date__c, Completed_Date__c, Notes__c, Sort_Order__c, ' +
                   'CreatedDate, LastModifiedDate ' +
                   'FROM NHS_Project_Plan_Task__c WHERE Project_Plan__c = :projectPlanId ';

        if (includeClosed != true) {
            q += 'AND Status__c != \'Done\' AND Status__c != \'Cancelled\' ';
        } else {
            q += 'AND (Status__c = \'Done\' OR Status__c = \'Cancelled\') ';
        }
        q += 'ORDER BY Sort_Order__c ASC NULLS LAST, CreatedDate DESC';

        List<NHS_Project_Plan_Task__c> tasks = Database.query(q);

        for (NHS_Project_Plan_Task__c t : tasks) {
            Map<String, Object> m = new Map<String, Object>();
            m.put('Id', t.Id);
            m.put('Name', t.Name);
            m.put('Title__c', t.Title__c);
            m.put('Description__c', t.Description__c);
            m.put('Priority__c', t.Priority__c);
            m.put('Status__c', t.Status__c);
            m.put('Category__c', t.Category__c);
            m.put('Assigned_To__c', t.Assigned_To__c);
            m.put('AssignedToName', t.Assigned_To__c != null ? t.Assigned_To__r.Name : null);
            m.put('Due_Date__c', t.Due_Date__c);
            m.put('Completed_Date__c', t.Completed_Date__c);
            m.put('Notes__c', t.Notes__c);
            m.put('Sort_Order__c', t.Sort_Order__c);
            m.put('CreatedDate', t.CreatedDate);
            m.put('LastModifiedDate', t.LastModifiedDate);
            results.add(m);
        }
        return results;
    }

    @AuraEnabled
    public static Id saveTask(Id taskId, Id projectPlanId, String title, String description,
                               String priority, String status, String category,
                               Id assignedToId, Date dueDate, String notes) {
        NHS_Project_Plan_Task__c t;
        if (taskId != null) {
            t = new NHS_Project_Plan_Task__c(Id = taskId);
        } else {
            t = new NHS_Project_Plan_Task__c();
            t.Project_Plan__c = projectPlanId;
        }
        t.Title__c = title;
        t.Description__c = description;
        t.Priority__c = priority;
        t.Status__c = status;
        t.Category__c = category;
        t.Assigned_To__c = assignedToId;
        t.Due_Date__c = dueDate;
        t.Notes__c = notes;

        // Auto-stamp Completed_Date when moving to Done or Cancelled
        if (status == 'Done' || status == 'Cancelled') {
            if (taskId != null) {
                NHS_Project_Plan_Task__c existing = [SELECT Completed_Date__c FROM NHS_Project_Plan_Task__c WHERE Id = :taskId LIMIT 1];
                if (existing.Completed_Date__c == null) t.Completed_Date__c = Datetime.now();
            } else {
                t.Completed_Date__c = Datetime.now();
            }
        } else {
            t.Completed_Date__c = null;
        }

        upsert t;
        return t.Id;
    }

    @AuraEnabled
    public static void updateTaskPriority(Id taskId, String newPriority) {
        update new NHS_Project_Plan_Task__c(Id = taskId, Priority__c = newPriority);
    }

    @AuraEnabled
    public static void updateTaskStatus(Id taskId, String newStatus) {
        NHS_Project_Plan_Task__c t = new NHS_Project_Plan_Task__c(Id = taskId, Status__c = newStatus);
        if (newStatus == 'Done' || newStatus == 'Cancelled') {
            t.Completed_Date__c = Datetime.now();
        } else {
            t.Completed_Date__c = null;
        }
        update t;
    }

    @AuraEnabled
    public static void deleteTask(Id taskId) {
        delete new NHS_Project_Plan_Task__c(Id = taskId);
    }

    @AuraEnabled
    public static Id saveProjectPlan(Id planId, String title, String description, String status, Date startDate, Date targetEndDate) {
        NHS_Project_Plan__c p;
        if (planId != null) {
            p = new NHS_Project_Plan__c(Id = planId);
        } else {
            p = new NHS_Project_Plan__c();
        }
        p.Title__c = title;
        p.Description__c = description;
        p.Status__c = status;
        p.Start_Date__c = startDate;
        p.Target_End_Date__c = targetEndDate;
        upsert p;
        return p.Id;
    }
}
