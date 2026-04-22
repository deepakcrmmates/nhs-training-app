// Tick Use_Timeline_Valuations__c on Wain Homes' Housebuilder account.
Account a = [SELECT Id, Name, Use_Timeline_Valuations__c FROM Account WHERE Id = '001KG000008vlx2YAA' LIMIT 1];
a.Use_Timeline_Valuations__c = true;
update a;
System.debug('>> Wain Homes flagged for timeline valuations: ' + a.Name + ' = ' + a.Use_Timeline_Valuations__c);
