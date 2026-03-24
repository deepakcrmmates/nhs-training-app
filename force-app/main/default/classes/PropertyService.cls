public class PropertyService {
    public static HttpResponse getPropertyReport(String postcode, String paon) {
        // Endpoint URL
        String endpoint = 'https://uk-property-data.p.rapidapi.com/propertytools.api.v1.Public/GetPropertyReport';

        // Create the HTTP request
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('X-Rapidapi-Key', '8fac3ca672msha2a5956bf785417p141314jsn1c1a7dfadf46');
        request.setHeader('X-Rapidapi-Host', 'uk-property-data.p.rapidapi.com');

        // Set the body
        request.setBody('{"postcode": "' + postcode + '", "paon": "' + paon + '"}');

        // Create the Http object to send the request
        Http http = new Http();
        HttpResponse response = http.send(request);

        return response;
    }
}