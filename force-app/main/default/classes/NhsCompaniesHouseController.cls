public with sharing class NhsCompaniesHouseController {

    private static final String BASE_URL = 'https://api.company-information.service.gov.uk';

    // Common SIC codes for NHS use cases
    private static final Map<String, String> SIC_GROUPS = new Map<String, String>{
        'Housebuilder'      => '41100,41201,41202,41100',
        'Estate Agents'     => '68100,68201,68202,68209,68310,68320',
        'Solicitors'        => '69101,69102',
        'Accountants'       => '69201,69202,69203',
        'Mortgage Advisor'  => '64999,66190,66220'
    };

    @AuraEnabled
    public static Map<String, Object> searchCompanies(String query, String sicGroup) {
        Map<String, Object> out = new Map<String, Object>{ 'status' => 'error', 'items' => new List<Object>() };
        if (String.isBlank(query) || query.length() < 2) {
            out.put('message', 'Enter at least 2 characters to search.');
            return out;
        }

        String apiKey = getApiKey();
        if (String.isBlank(apiKey)) {
            out.put('message', 'Companies House API key not configured. Set it on the NHS API Config page.');
            return out;
        }

        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(BASE_URL + '/search/companies?q=' + EncodingUtil.urlEncode(query, 'UTF-8') + '&items_per_page=20');
            req.setMethod('GET');
            req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(apiKey + ':')));
            req.setTimeout(15000);

            Http h = new Http();
            HttpResponse res = h.send(req);
            incrementCounter();

            if (res.getStatusCode() != 200) {
                out.put('message', 'Companies House returned ' + res.getStatusCode() + ': ' + res.getStatus());
                return out;
            }

            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> rawItems = (List<Object>) body.get('items');
            List<String> sicFilter = parseSicFilter(sicGroup);

            List<Map<String, Object>> items = new List<Map<String, Object>>();
            for (Object o : rawItems) {
                Map<String, Object> c = (Map<String, Object>) o;
                if (sicFilter != null && !matchesSic(c, sicFilter)) continue;

                Map<String, Object> m = new Map<String, Object>();
                m.put('number', c.get('company_number'));
                m.put('name', c.get('title'));
                m.put('status', c.get('company_status'));
                m.put('type', c.get('company_type'));
                m.put('snippet', c.get('description_identifier'));
                m.put('address', c.get('address_snippet'));
                m.put('dateOfCreation', c.get('date_of_creation'));
                items.add(m);
            }
            out.put('status', 'success');
            out.put('items', items);
            out.put('totalReturned', items.size());
            out.put('rawCount', rawItems == null ? 0 : rawItems.size());
            return out;
        } catch (Exception e) {
            out.put('message', 'Companies House call failed: ' + e.getMessage());
            return out;
        }
    }

    @AuraEnabled
    public static Map<String, Object> getCompany(String companyNumber) {
        Map<String, Object> out = new Map<String, Object>{ 'status' => 'error' };
        if (String.isBlank(companyNumber)) {
            out.put('message', 'Company number is required.');
            return out;
        }
        String apiKey = getApiKey();
        if (String.isBlank(apiKey)) {
            out.put('message', 'API key not configured.');
            return out;
        }
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(BASE_URL + '/company/' + EncodingUtil.urlEncode(companyNumber, 'UTF-8'));
            req.setMethod('GET');
            req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(apiKey + ':')));
            req.setTimeout(15000);

            Http h = new Http();
            HttpResponse res = h.send(req);
            incrementCounter();

            if (res.getStatusCode() != 200) {
                out.put('message', 'Companies House returned ' + res.getStatusCode());
                return out;
            }
            Map<String, Object> c = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

            Map<String, Object> data = new Map<String, Object>();
            data.put('number', c.get('company_number'));
            data.put('name', c.get('company_name'));
            data.put('status', c.get('company_status'));
            data.put('type', c.get('company_type'));
            data.put('dateOfCreation', c.get('date_of_creation'));

            List<Object> sics = (List<Object>) c.get('sic_codes');
            data.put('sicCodes', sics != null ? String.join(toStringList(sics), ', ') : '');

            Map<String, Object> addr = (Map<String, Object>) c.get('registered_office_address');
            if (addr != null) {
                data.put('addressLine1', addr.get('address_line_1'));
                data.put('addressLine2', addr.get('address_line_2'));
                data.put('locality', addr.get('locality'));
                data.put('region', addr.get('region'));
                data.put('postalCode', addr.get('postal_code'));
                data.put('country', addr.get('country'));
            }
            out.put('status', 'success');
            out.put('data', data);
            return out;
        } catch (Exception e) {
            out.put('message', 'Companies House call failed: ' + e.getMessage());
            return out;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────
    private static String getApiKey() {
        Companies_House_Config__c cfg = Companies_House_Config__c.getOrgDefaults();
        return cfg != null ? cfg.API_Key__c : null;
    }

    private static List<String> parseSicFilter(String sicGroup) {
        if (String.isBlank(sicGroup)) return null;
        String raw = SIC_GROUPS.get(sicGroup);
        if (String.isBlank(raw)) return null;
        List<String> out = new List<String>();
        for (String s : raw.split(',')) out.add(s.trim());
        return out;
    }

    private static Boolean matchesSic(Map<String, Object> c, List<String> sicFilter) {
        // Companies House search results only include SIC in description_identifier sometimes.
        // For a proper filter we'd call /company/{number} per hit which is expensive.
        // Phase 1: return all hits when filter set; LWC displays the SIC group so user can pick manually.
        return true;
    }

    private static List<String> toStringList(List<Object> items) {
        List<String> out = new List<String>();
        for (Object o : items) out.add(String.valueOf(o));
        return out;
    }

    private static void incrementCounter() {
        Companies_House_Config__c cfg = Companies_House_Config__c.getOrgDefaults();
        if (cfg == null) cfg = new Companies_House_Config__c();
        Date today = Date.today();
        if (cfg.Last_Reset_Date__c != today) {
            cfg.Requests_Today__c = 0;
            cfg.Last_Reset_Date__c = today;
        }
        cfg.Requests_Today__c = (cfg.Requests_Today__c == null ? 0 : cfg.Requests_Today__c) + 1;
        upsert cfg;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getSicGroups() {
        List<Map<String, String>> out = new List<Map<String, String>>();
        for (String k : SIC_GROUPS.keySet()) {
            out.add(new Map<String, String>{ 'label' => k, 'value' => k });
        }
        return out;
    }
}
