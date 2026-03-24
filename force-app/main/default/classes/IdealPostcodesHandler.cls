public with sharing class IdealPostcodesHandler {
    private static final String API_KEY = 'ak_lvk9pji2IKkDT00S7UXmYEBZCqtsc';
    private static final String BASE_URL = 'https://api.ideal-postcodes.co.uk/v1/';

    @AuraEnabled(cacheable=true)
    public static String getAddress(String postcode) {
        String endpoint = BASE_URL + 'postcodes/' + EncodingUtil.urlEncode(postcode, 'UTF-8');
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('GET');
        request.setHeader('Authorization', 'IDEALPOSTCODES api_key="' + API_KEY + '"');

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