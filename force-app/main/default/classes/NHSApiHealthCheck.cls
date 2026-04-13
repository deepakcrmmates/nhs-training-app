public class NHSApiHealthCheck implements Schedulable, Database.AllowsCallouts {

    // Schedulable entry point
    public void execute(SchedulableContext ctx) {
        runAllChecks();
    }

    @AuraEnabled
    public static Map<String, Object> testApi(String apiName) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            switch on apiName {
                when 'Box' { result = testBox(); }
                when 'Google_Maps' { result = testGoogleMaps(); }
                when 'Ideal_Postcodes' { result = testIdealPostcodes(); }
                when 'RapidAPI__Property_Data_' { result = testRapidAPI(); }
                when 'Street_Data_API' { result = testStreetData(); }
                when 'TinyURL' { result = testTinyURL(); }
                when 'Twilio_SMS' { result = testTwilio(); }
                when else {
                    result.put('status', 'unknown');
                    result.put('message', 'No test available for ' + apiName);
                }
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @future(callout=true)
    public static void runAllChecks() {
        Map<String, String> statuses = new Map<String, String>();

        statuses.put('Box', getStatus(testBox()));
        statuses.put('Google Maps', getStatus(testGoogleMaps()));
        statuses.put('Ideal Postcodes', getStatus(testIdealPostcodes()));
        statuses.put('RapidAPI', getStatus(testRapidAPI()));
        statuses.put('Street Data', getStatus(testStreetData()));
        statuses.put('TinyURL', getStatus(testTinyURL()));
        statuses.put('Twilio', getStatus(testTwilio()));

        // Save as compact string: Box:ok,Google Maps:ok,...
        List<String> parts = new List<String>();
        for (String k : statuses.keySet()) {
            parts.add(k + ':' + statuses.get(k));
        }
        String statusStr = String.join(parts, ',');

        List<NHS_API_Config__c> configs = [SELECT Id, API_Status__c, Last_Health_Check__c FROM NHS_API_Config__c LIMIT 1];
        if (!configs.isEmpty()) {
            configs[0].API_Status__c = statusStr.left(255);
            configs[0].Last_Health_Check__c = Datetime.now();
            update configs[0];
        }
    }

    private static String getStatus(Map<String, Object> result) {
        return (String) result.get('status');
    }

    // ── Individual API Tests ──

    private static Map<String, Object> testBox() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<Box_Config__c> configs = [SELECT Access_Token__c, Token_Expiry__c FROM Box_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].Access_Token__c)) {
                result.put('status', 'error');
                result.put('message', 'Not configured');
                return result;
            }
            if (configs[0].Token_Expiry__c != null && configs[0].Token_Expiry__c > Datetime.now()) {
                result.put('status', 'ok');
                result.put('message', 'Connected (token valid)');
            } else {
                result.put('status', 'warning');
                result.put('message', 'Token expired — needs refresh');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testGoogleMaps() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<Google_Maps_Config__c> configs = [SELECT API_Key__c FROM Google_Maps_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].API_Key__c)) {
                result.put('status', 'error');
                result.put('message', 'API key not configured');
                return result;
            }
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://maps.googleapis.com/maps/api/geocode/json?address=London,UK&key=' + configs[0].API_Key__c);
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                if ((String) body.get('status') == 'OK') {
                    result.put('status', 'ok');
                    result.put('message', 'API responding');
                } else {
                    result.put('status', 'error');
                    result.put('message', 'API error: ' + body.get('status'));
                }
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testIdealPostcodes() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT Ideal_Postcodes_Key__c FROM NHS_API_Config__c LIMIT 1];
            String apiKey = !configs.isEmpty() && String.isNotBlank(configs[0].Ideal_Postcodes_Key__c) ? configs[0].Ideal_Postcodes_Key__c : '';
            if (String.isBlank(apiKey)) {
                result.put('status', 'error');
                result.put('message', 'API key not configured');
                return result;
            }
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.ideal-postcodes.co.uk/v1/keys/' + apiKey);
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() == 200) {
                result.put('status', 'ok');
                result.put('message', 'API key valid');
            } else {
                result.put('status', 'error');
                result.put('message', 'API key invalid (HTTP ' + resp.getStatusCode() + ')');
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testRapidAPI() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT RapidAPI_Key__c FROM NHS_API_Config__c LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].RapidAPI_Key__c)) {
                result.put('status', 'error');
                result.put('message', 'API key not configured');
                return result;
            }
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://uk-property-data.p.rapidapi.com/propertytools.api.v1.Public/GetPropertyReport');
            req.setMethod('POST');
            req.setHeader('x-rapidapi-host', 'uk-property-data.p.rapidapi.com');
            req.setHeader('x-rapidapi-key', configs[0].RapidAPI_Key__c);
            req.setHeader('Content-Type', 'application/json');
            req.setBody('{"postcode":"SW1A 1AA"}');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() == 200) {
                result.put('status', 'ok');
                result.put('message', 'API responding');
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testStreetData() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT Street_Data_Endpoint__c FROM NHS_API_Config__c LIMIT 1];
            String endpoint = !configs.isEmpty() && String.isNotBlank(configs[0].Street_Data_Endpoint__c) ? configs[0].Street_Data_Endpoint__c : 'https://api.data.street.co.uk/street-data-api/v2/';
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint + 'properties/areas/postcodes?postcode=SW1A1AA&results=1');
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() == 200 || resp.getStatusCode() == 401) {
                result.put('status', 'ok');
                result.put('message', 'Endpoint reachable');
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testTinyURL() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<NHS_API_Config__c> configs = [SELECT TinyURL_Endpoint__c FROM NHS_API_Config__c LIMIT 1];
            String endpoint = !configs.isEmpty() && String.isNotBlank(configs[0].TinyURL_Endpoint__c) ? configs[0].TinyURL_Endpoint__c : 'http://tinyurl.com/api-create.php';
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint + '?url=https://www.google.com');
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() == 200 && resp.getBody().contains('tinyurl')) {
                result.put('status', 'ok');
                result.put('message', 'API responding');
            } else {
                result.put('status', 'error');
                result.put('message', 'HTTP ' + resp.getStatusCode());
            }
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    private static Map<String, Object> testTwilio() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            List<TwilioSF__TwilioMetaData__c> configs = [SELECT TwilioSF__AccountSID__c FROM TwilioSF__TwilioMetaData__c WHERE TwilioSF__IsUsed__c = true LIMIT 1];
            if (configs.isEmpty() || String.isBlank(configs[0].TwilioSF__AccountSID__c)) {
                result.put('status', 'error');
                result.put('message', 'Not configured');
                return result;
            }
            result.put('status', 'ok');
            result.put('message', 'Managed package configured');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }
}
