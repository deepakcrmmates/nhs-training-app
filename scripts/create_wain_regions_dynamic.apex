// Dynamic-SOQL variant — bypasses the compiler schema cache which is still stale.
Id hbRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('House_Builder').getRecordTypeId();

List<Map<String, Object>> rows = new List<Map<String, Object>>{
    new Map<String, Object>{
        'Name' => 'Wain Homes - North West',
        'Phone' => '01925 885 400',
        'BillingStreet' => 'Kelburn Court, Daten Park, Birchwood',
        'BillingCity' => 'Warrington',
        'BillingPostalCode' => 'WA3 6UT',
        'BillingCountry' => 'United Kingdom'
    },
    new Map<String, Object>{
        'Name' => 'Wain Homes - Severn Valley',
        'Phone' => '0117 3744 300',
        'BillingStreet' => 'Building 2, Great Park Court, Bradley Stoke',
        'BillingCity' => 'Bristol',
        'BillingPostalCode' => 'BS32 4PY',
        'BillingCountry' => 'United Kingdom'
    },
    new Map<String, Object>{
        'Name' => 'Wain Homes - South West',
        'Phone' => '01392 448 900',
        'BillingStreet' => 'Unit 2, Exeter International Office Park, Clyst Honiton',
        'BillingCity' => 'Exeter',
        'BillingPostalCode' => 'EX5 2HL',
        'BillingCountry' => 'United Kingdom'
    }
};

// Lookup existing
Set<String> names = new Set<String>{'Wain Homes - North West','Wain Homes - Severn Valley','Wain Homes - South West','Wain Homes'};
Map<String, Id> existing = new Map<String, Id>();
for (SObject o : Database.query('SELECT Id, Name FROM Account WHERE Name IN :names')) {
    existing.put((String) o.get('Name'), (Id) o.get('Id'));
}

List<SObject> toInsert = new List<SObject>();
List<SObject> toUpdate = new List<SObject>();
for (Map<String, Object> r : rows) {
    SObject a = Schema.getGlobalDescribe().get('Account').newSObject();
    for (String k : r.keySet()) a.put(k, r.get(k));
    a.put('RecordTypeId', hbRT);
    a.put('Use_Timeline_Valuations__c', true);
    if (existing.containsKey((String) r.get('Name'))) {
        a.put('Id', existing.get((String) r.get('Name')));
        toUpdate.add(a);
    } else {
        toInsert.add(a);
    }
}
if (!toInsert.isEmpty()) insert toInsert;
if (!toUpdate.isEmpty()) update toUpdate;

// Flag existing Wain Homes placeholder too
if (existing.containsKey('Wain Homes')) {
    SObject wh = Schema.getGlobalDescribe().get('Account').newSObject();
    wh.put('Id', existing.get('Wain Homes'));
    wh.put('Use_Timeline_Valuations__c', true);
    update wh;
    System.debug('>> Flagged Wain Homes placeholder');
}

System.debug('>> Inserted: ' + toInsert.size() + ' | Updated: ' + toUpdate.size());
