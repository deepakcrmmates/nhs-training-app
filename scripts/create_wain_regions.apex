// Create three Wain Homes regional Housebuilder accounts + flag them for timeline valuations.
// Also tick the existing "Wain Homes" placeholder. Safe to re-run — upserts by name.

Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();

List<Account> targets = new List<Account>{
    new Account(
        Name = 'Wain Homes - North West',
        RecordTypeId = hbRT,
        Phone = '01925 885 400',
        BillingStreet = 'Kelburn Court, Daten Park, Birchwood',
        BillingCity = 'Warrington',
        BillingPostalCode = 'WA3 6UT',
        BillingCountry = 'United Kingdom',
        Use_Timeline_Valuations__c = true
    ),
    new Account(
        Name = 'Wain Homes - Severn Valley',
        RecordTypeId = hbRT,
        Phone = '0117 3744 300',
        BillingStreet = 'Building 2, Great Park Court, Bradley Stoke',
        BillingCity = 'Bristol',
        BillingPostalCode = 'BS32 4PY',
        BillingCountry = 'United Kingdom',
        Use_Timeline_Valuations__c = true
    ),
    new Account(
        Name = 'Wain Homes - South West',
        RecordTypeId = hbRT,
        Phone = '01392 448 900',
        BillingStreet = 'Unit 2, Exeter International Office Park, Clyst Honiton',
        BillingCity = 'Exeter',
        BillingPostalCode = 'EX5 2HL',
        BillingCountry = 'United Kingdom',
        Use_Timeline_Valuations__c = true
    )
};

// Upsert by Name — find existing first
Map<String, Account> existing = new Map<String, Account>();
for (Account a : [
    SELECT Id, Name FROM Account
    WHERE Name IN ('Wain Homes - North West','Wain Homes - Severn Valley','Wain Homes - South West')
]) existing.put(a.Name, a);

List<Account> toInsert = new List<Account>();
List<Account> toUpdate = new List<Account>();
for (Account t : targets) {
    if (existing.containsKey(t.Name)) {
        t.Id = existing.get(t.Name).Id;
        toUpdate.add(t);
    } else {
        toInsert.add(t);
    }
}
if (!toInsert.isEmpty()) insert toInsert;
if (!toUpdate.isEmpty()) update toUpdate;

// Flag the existing "Wain Homes" placeholder
try {
    Account wh = [SELECT Id, Use_Timeline_Valuations__c FROM Account WHERE Name = 'Wain Homes' LIMIT 1];
    if (wh.Use_Timeline_Valuations__c != true) {
        wh.Use_Timeline_Valuations__c = true;
        update wh;
        System.debug('>> Flagged existing Wain Homes placeholder');
    }
} catch (Exception e) {
    System.debug('>> No placeholder Wain Homes found (or already gone)');
}

System.debug('>> Regional offices inserted: ' + toInsert.size() + ', updated: ' + toUpdate.size());
