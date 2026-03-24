public class PropertyReportService {
    private static final String BASE_URL = 'https://api-ir7ctmwisa-ew.a.run.app/';
    private static final String API_KEY = '31167cfcdemsha6750c19120eb41p1a194ejsndc90791e9b4a';
    private static final String API_HOST = 'uk-property-data.p.rapidapi.com';
     private static final String API_X = 'ePJXh5UDVEsQrUXbnRbj';

    public static HttpResponse fetchPropertyReport(String postcode, String paon) {
        String endpoint = BASE_URL + 'propertytools.api.v1.Public/GetPropertyReport';

        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('X-Rapidapi-Key', API_KEY);
        request.setHeader('X-Rapidapi-Host', API_HOST);
          request.setHeader('X-Rapidapi-Host', API_X);

        // Ensure JSON body is correctly formatted
        String requestBody = JSON.serialize(new Map<String, String>{
            'postcode' => postcode,
            'paon' => paon
        });
        request.setBody(requestBody);

        Http http = new Http();
        HttpResponse response = http.send(request);

        return response;
    }
}