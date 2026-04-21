// Backfill: re-parent vendor Contacts currently linked to House Builder Accounts
// to new Household Accounts (one per Opportunity, named after Vendor 1's surname).

Id houseBuilderRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();
Id householdRT    = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Household').getRecordTypeId();

List<Opportunity> opps = [
    SELECT Id, Name, Vendor_1__c, Vendor_2__c,
           Vendor_1__r.LastName, Vendor_1__r.AccountId, Vendor_1__r.Account.RecordTypeId
    FROM Opportunity
    WHERE Vendor_1__c != null
    AND Vendor_1__r.Account.RecordTypeId = :houseBuilderRT
];
System.debug('>> Opportunities to fix: ' + opps.size());

if (opps.isEmpty()) {
    System.debug('>> Nothing to do. All vendor contacts are already correctly parented.');
    return;
}

// Create one Household per Opportunity
List<Account> newHouseholds = new List<Account>();
Map<Id, Integer> oppToHouseholdIdx = new Map<Id, Integer>();
Integer idx = 0;
for (Opportunity o : opps) {
    String ln = (o.Vendor_1__r != null && String.isNotBlank(o.Vendor_1__r.LastName))
                  ? o.Vendor_1__r.LastName : 'Vendor';
    newHouseholds.add(new Account(
        Name = ln + ' Household',
        RecordTypeId = householdRT
    ));
    oppToHouseholdIdx.put(o.Id, idx++);
}
insert newHouseholds;
System.debug('>> Households created: ' + newHouseholds.size());

// Re-parent Vendor 1 + Vendor 2 to the new Household
Map<Id, Id> contactToHousehold = new Map<Id, Id>();
for (Opportunity o : opps) {
    Id householdId = newHouseholds[oppToHouseholdIdx.get(o.Id)].Id;
    if (o.Vendor_1__c != null) contactToHousehold.put(o.Vendor_1__c, householdId);
    if (o.Vendor_2__c != null) contactToHousehold.put(o.Vendor_2__c, householdId);
}

List<Contact> toUpdate = new List<Contact>();
for (Id cId : contactToHousehold.keySet()) {
    toUpdate.add(new Contact(Id = cId, AccountId = contactToHousehold.get(cId)));
}
update toUpdate;
System.debug('>> Vendor Contacts re-parented: ' + toUpdate.size());
