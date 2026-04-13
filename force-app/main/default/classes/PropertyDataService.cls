public with sharing class PropertyDataService {
    @AuraEnabled(cacheable=true)
    public static String getPropertyData(String postcode) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:UKPropertyDataAPI/' + 'propertytools.api.v1.Public/GetPropertyReport?postcode=' + EncodingUtil.urlEncode(postcode, 'UTF-8'));
        request.setMethod('POST');
        request.setHeader('x-rapidapi-host', 'uk-property-data.p.rapidapi.com');
        List<NHS_API_Config__c> configs = [SELECT RapidAPI_Key__c FROM NHS_API_Config__c LIMIT 1];
        String rapidKey = !configs.isEmpty() && String.isNotBlank(configs[0].RapidAPI_Key__c) ? configs[0].RapidAPI_Key__c : '8fac3ca672msha2a5956bf785417p141314jsn1c1a7dfadf46';
        request.setHeader('x-rapidapi-key', rapidKey);

         // Set the request body
        String requestBody = '{"postcode": "EX5 7BF"}';
        request.setBody(requestBody);
        
        HttpResponse response = http.send(request);
        if (response.getStatusCode() == 200) {
            return response.getBody();
        } else {
            throw new CustomException('Failed to fetch property data');
        }
    }
    
    public class CustomException extends Exception {}
}