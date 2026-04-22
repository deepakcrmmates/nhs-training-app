// Assign NHS_Wain_Timeline_Access to all active System Administrators, then create Wain regions.
PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NHS_Wain_Timeline_Access' LIMIT 1];
Set<Id> adminIds = new Set<Id>();
for (User u : [SELECT Id FROM User WHERE IsActive = true AND Profile.Name = 'System Administrator']) adminIds.add(u.Id);
Set<Id> already = new Set<Id>();
for (PermissionSetAssignment psa : [
    SELECT AssigneeId FROM PermissionSetAssignment
    WHERE PermissionSetId = :ps.Id AND AssigneeId IN :adminIds
]) already.add(psa.AssigneeId);
List<PermissionSetAssignment> toAssign = new List<PermissionSetAssignment>();
for (Id uId : adminIds) {
    if (!already.contains(uId)) toAssign.add(new PermissionSetAssignment(AssigneeId = uId, PermissionSetId = ps.Id));
}
if (!toAssign.isEmpty()) insert toAssign;
System.debug('>> Admins: ' + adminIds.size() + ' | Newly assigned: ' + toAssign.size());
