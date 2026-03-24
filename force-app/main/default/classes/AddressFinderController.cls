public with sharing class AddressFinderController {
    @AuraEnabled
    public static string methodName(string query){
        try {
            HttpRequest request = new HttpRequest();
            //api-key = ak_lvk9pji2IKkDT00S7UXmYEBZCqtsc
            request.setEndpoint('https://api.ideal-postcodes.co.uk/v1/addresses?api_key='+System.Label.idealpcapi+'&query='+query);
            request.setMethod('GET');
            Http http = new Http();
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                System.debug('@@@resp '+response.getBody());
                return response.getBody();
            } else {
                System.debug('Error: ' + response.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return null;
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getFieldSet(string objName, string[] fieldsetname) {
        Map<String, String> allfieldsets= new Map<String, String>();
        Schema.DescribeSObjectResult sobjres = Schema.getGlobalDescribe().get(objName).getDescribe();
        Map<String, Schema.FieldSet> fsMap = sobjres.fieldSets.getMap();
        for(String fsname : fieldsetname) {
            Schema.FieldSet fset = fsMap.get(fsname);
            allfieldsets.put(fset.getLabel(), JSON.serialize(fset.getFields()));
        }
        return allfieldsets;
    }
}