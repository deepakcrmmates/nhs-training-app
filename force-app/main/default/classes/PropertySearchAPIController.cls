public with sharing class PropertySearchAPIController {
    @AuraEnabled(cacheable=true)
    public static String getProperties(String postcode) {
        HttpRequest req = new HttpRequest();
        List<NHS_API_Config__c> configs = [SELECT Street_Data_Endpoint__c FROM NHS_API_Config__c LIMIT 1];
        String baseUrl = !configs.isEmpty() && String.isNotBlank(configs[0].Street_Data_Endpoint__c) ? configs[0].Street_Data_Endpoint__c : 'https://api.data.street.co.uk/street-data-api/v2/';
        req.setEndpoint(baseUrl + 'properties/areas/postcodes?fields%5Bproperty%5D=energy_performance&results=5&page=5&postcode=' + postcode);
        req.setMethod('GET');
        req.setHeader('Accept', 'application/json');
        req.setHeader('X-Api-Key', '1To6HoiiNJ-UCSQzP6B3UmooOmoTL7B-8cCmqHXeP1g');

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new AuraHandledException('Error from API: ' + res.getStatusCode() + ' ' + res.getStatus());
        }
    }
}