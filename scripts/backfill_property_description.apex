// One-time backfill script: Populate Property_Description__c on existing Opportunities
// Run via Developer Console → Execute Anonymous or VS Code → SFDX: Execute Anonymous Apex

List<Opportunity> opps = [
    SELECT Id, Property_Description__c, Property__c,
           Property__r.Detached__c, Property__r.Semi_Detached__c,
           Property__r.End_Terrace__c, Property__r.Mid_Terrace__c,
           Property__r.Apartment__c, Property__r.Maisonette__c,
           Property__r.Maisonette_Studio__c, Property__r.Bungalow__c,
           Property__r.Other__c, Property__r.Number_Of_Bedrooms__c
    FROM Opportunity
    WHERE Property__c != null
];

List<Opportunity> toUpdate = new List<Opportunity>();

for (Opportunity opp : opps) {
    NHS_Property__c prop = opp.Property__r;
    if (prop == null) continue;

    List<String> types = new List<String>();
    if (prop.Detached__c) types.add('Detached');
    if (prop.Semi_Detached__c) types.add('Semi-Detached');
    if (prop.End_Terrace__c) types.add('End Terrace');
    if (prop.Mid_Terrace__c) types.add('Mid Terrace');
    if (prop.Apartment__c) types.add('Apartment');
    if (prop.Maisonette__c) types.add('Maisonette');
    if (prop.Maisonette_Studio__c) types.add('Studio');
    if (prop.Bungalow__c) types.add('Bungalow');
    if (prop.Other__c) types.add('Other');

    String propDesc = String.join(types, ' / ');
    if (prop.Number_Of_Bedrooms__c != null) {
        propDesc += (String.isNotBlank(propDesc) ? ' ' : '') + String.valueOf(prop.Number_Of_Bedrooms__c.intValue()) + ' Bed';
    }

    if (String.isNotBlank(propDesc) && propDesc != opp.Property_Description__c) {
        toUpdate.add(new Opportunity(Id = opp.Id, Property_Description__c = propDesc));
    }
}

if (!toUpdate.isEmpty()) {
    update toUpdate;
    System.debug('Updated ' + toUpdate.size() + ' Opportunities with Property Description');
} else {
    System.debug('No Opportunities needed updating');
}
