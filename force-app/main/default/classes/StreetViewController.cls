public with sharing class StreetViewController {
    @AuraEnabled(cacheable=false)
    public static String getPanoId(String lat, String lng) {
        String url = 'https://maps.googleapis.com/maps/api/streetview/metadata?location=' 
                     + lat + ',' + lng;

        HttpRequest req = new HttpRequest();
        req.setEndpoint(url);
        req.setMethod('GET');

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> json = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            if (json.containsKey('pano_id')) {
                return (String) json.get('pano_id');
            }
        }
        return null;
    }
}