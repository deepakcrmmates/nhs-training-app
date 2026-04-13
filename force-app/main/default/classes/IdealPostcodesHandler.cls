public with sharing class IdealPostcodesHandler {
    private static final String BASE_URL = 'https://api.ideal-postcodes.co.uk/v1/';

    private static String getApiKey() {
        List<NHS_API_Config__c> configs = [SELECT Ideal_Postcodes_Key__c FROM NHS_API_Config__c LIMIT 1];
        return !configs.isEmpty() && String.isNotBlank(configs[0].Ideal_Postcodes_Key__c) ? configs[0].Ideal_Postcodes_Key__c : 'ak_lvk9pji2IKkDT00S7UXmYEBZCqtsc';
    }

    @AuraEnabled(cacheable=true)
    public static String getAddress(String postcode) {
        String endpoint = BASE_URL + 'postcodes/' + EncodingUtil.urlEncode(postcode, 'UTF-8');
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('GET');
        request.setHeader('Authorization', 'IDEALPOSTCODES api_key="' + getApiKey() + '"');

        try {
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                return '{}';
            }
        } catch(Exception e) {
            return '{}';
        }
    }
}