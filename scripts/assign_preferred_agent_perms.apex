// Assign NHS_Preferred_Agent_Access to every active System Administrator user.
// Safe to re-run — skips anyone who already has it.

PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NHS_Preferred_Agent_Access' LIMIT 1];

Set<Id> adminIds = new Set<Id>();
for (User u : [
    SELECT Id FROM User
    WHERE IsActive = true AND Profile.Name = 'System Administrator'
]) {
    adminIds.add(u.Id);
}

Set<Id> alreadyAssigned = new Set<Id>();
for (PermissionSetAssignment psa : [
    SELECT AssigneeId FROM PermissionSetAssignment
    WHERE PermissionSetId = :ps.Id AND AssigneeId IN :adminIds
]) {
    alreadyAssigned.add(psa.AssigneeId);
}

List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();
for (Id uId : adminIds) {
    if (!alreadyAssigned.contains(uId)) {
        toInsert.add(new PermissionSetAssignment(AssigneeId = uId, PermissionSetId = ps.Id));
    }
}
if (!toInsert.isEmpty()) insert toInsert;

System.debug('>> Admin users total: ' + adminIds.size());
System.debug('>> Already assigned: ' + alreadyAssigned.size());
System.debug('>> Newly assigned:  ' + toInsert.size());
