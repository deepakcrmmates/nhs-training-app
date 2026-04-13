public with sharing class PropertySearchController {

    private static final String GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

    @AuraEnabled
    public static Map<String, Object> getGoogleMapsApiKey() {
        Map<String, Object> result = new Map<String, Object>();
        List<Google_Maps_Config__c> configs = [SELECT API_Key__c FROM Google_Maps_Config__c LIMIT 1];
        if (configs.isEmpty() || String.isBlank(configs[0].API_Key__c)) {
            result.put('status', 'error');
            result.put('message', 'Google Maps API key not configured.');
            return result;
        }
        result.put('status', 'success');
        result.put('apiKey', configs[0].API_Key__c);
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> searchProperties(String postcode, Decimal radiusMiles) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            if (String.isBlank(postcode)) {
                result.put('status', 'error');
                result.put('message', 'Please enter a postcode.');
                return result;
            }

            // Get Google Maps config
            List<Google_Maps_Config__c> configs = [SELECT Id, API_Key__c, Daily_Limit__c, Requests_Today__c, Last_Reset_Date__c FROM Google_Maps_Config__c LIMIT 1];
            Google_Maps_Config__c config = configs.isEmpty() ? null : configs[0];
            if (config == null || String.isBlank(config.API_Key__c)) {
                result.put('status', 'error');
                result.put('message', 'Google Maps API key not configured.');
                return result;
            }

            // Reset daily counter if new day
            if (config.Last_Reset_Date__c != Date.today()) {
                config.Requests_Today__c = 0;
                config.Last_Reset_Date__c = Date.today();
            }

            Decimal dailyLimit = config.Daily_Limit__c != null ? config.Daily_Limit__c : 100;
            if (config.Requests_Today__c >= dailyLimit) {
                result.put('status', 'error');
                result.put('message', 'Daily API limit reached. Try again tomorrow.');
                return result;
            }

            // Geocode the search postcode
            Map<String, Decimal> searchCoords = geocodePostcode(postcode.trim().toUpperCase(), config.API_Key__c);
            config.Requests_Today__c = (config.Requests_Today__c != null ? config.Requests_Today__c : 0) + 1;

            if (searchCoords == null) {
                update config;
                result.put('status', 'error');
                result.put('message', 'Could not geocode postcode: ' + postcode);
                return result;
            }

            result.put('searchLat', searchCoords.get('lat'));
            result.put('searchLng', searchCoords.get('lng'));

            Decimal maxDist = radiusMiles != null ? radiusMiles : 5;

            // Query all properties with coordinates
            List<NHS_Property__c> properties = [
                SELECT Id, Name,
                       Address__Street__s, Address__City__s, Address__PostalCode__s,
                       Longitude_Latitude__Latitude__s, Longitude_Latitude__Longitude__s,
                       Number_Of_Bedrooms__c, Property_Type__c,
                       Current_Rating__c, Current_Efficiency__c, Potential_Rating__c,
                       Council_Tax_Band__c, Construction_Age_Band__c,
                       Detached__c, Semi_Detached__c, End_Terrace__c, Mid_Terrace__c,
                       Apartment__c, Maisonette__c, Bungalow__c,
                       Freehold__c, Lease_Hold__c,
                       Front_Garden__c, Back_Garden__c, Parking__c, Garage__c,
                       Total_Floor_Area__c, Internal_Area_Square_Meter__c,
                       Flood_Risk__c, Mains_Gas_Flag__c
                FROM NHS_Property__c
                WHERE Longitude_Latitude__Latitude__s != null
                AND Longitude_Latitude__Longitude__s != null
                LIMIT 2000
            ];

            // Get application counts per property (all-time, this month, this year)
            Map<Id, Integer> appCounts = new Map<Id, Integer>();
            Map<Id, Integer> appCountsMonth = new Map<Id, Integer>();
            Map<Id, Integer> appCountsYear = new Map<Id, Integer>();
            Map<Id, Id> latestAppIds = new Map<Id, Id>();

            List<AggregateResult> aggResults = [
                SELECT Property__c propId, COUNT(Id) cnt
                FROM Opportunity
                WHERE Property__c IN :properties
                GROUP BY Property__c
            ];
            for (AggregateResult ar : aggResults) {
                appCounts.put((Id) ar.get('propId'), (Integer) ar.get('cnt'));
            }

            // Get latest application per property
            for (Opportunity opp : [
                SELECT Id, Property__c FROM Opportunity
                WHERE Property__c IN :properties
                ORDER BY CreatedDate DESC
            ]) {
                if (!latestAppIds.containsKey(opp.Property__c)) {
                    latestAppIds.put(opp.Property__c, opp.Id);
                }
            }

            Date monthStart = Date.today().toStartOfMonth();
            List<AggregateResult> aggMonth = [
                SELECT Property__c propId, COUNT(Id) cnt
                FROM Opportunity
                WHERE Property__c IN :properties AND CreatedDate >= :monthStart
                GROUP BY Property__c
            ];
            for (AggregateResult ar : aggMonth) {
                appCountsMonth.put((Id) ar.get('propId'), (Integer) ar.get('cnt'));
            }

            Date yearStart = Date.newInstance(Date.today().year(), 1, 1);
            List<AggregateResult> aggYear = [
                SELECT Property__c propId, COUNT(Id) cnt
                FROM Opportunity
                WHERE Property__c IN :properties AND CreatedDate >= :yearStart
                GROUP BY Property__c
            ];
            for (AggregateResult ar : aggYear) {
                appCountsYear.put((Id) ar.get('propId'), (Integer) ar.get('cnt'));
            }

            // Filter by distance
            List<Map<String, Object>> propertyList = new List<Map<String, Object>>();
            for (NHS_Property__c prop : properties) {
                Decimal dist = calculateDistance(
                    searchCoords.get('lat'), searchCoords.get('lng'),
                    prop.Longitude_Latitude__Latitude__s, prop.Longitude_Latitude__Longitude__s
                );

                if (dist <= maxDist) {
                    Map<String, Object> p = new Map<String, Object>();
                    p.put('id', prop.Id);
                    p.put('name', prop.Name);
                    p.put('street', prop.Address__Street__s);
                    p.put('city', prop.Address__City__s);
                    p.put('postcode', prop.Address__PostalCode__s);
                    p.put('lat', prop.Longitude_Latitude__Latitude__s);
                    p.put('lng', prop.Longitude_Latitude__Longitude__s);
                    p.put('bedrooms', prop.Number_Of_Bedrooms__c);
                    p.put('propertyType', prop.Property_Type__c);
                    p.put('epcRating', prop.Current_Rating__c);
                    p.put('epcScore', prop.Current_Efficiency__c);
                    p.put('councilTaxBand', prop.Council_Tax_Band__c);
                    p.put('constructionAge', prop.Construction_Age_Band__c);
                    p.put('totalFloorArea', prop.Total_Floor_Area__c);
                    p.put('distance', dist.setScale(1));
                    p.put('floodRisk', prop.Flood_Risk__c);
                    p.put('mainsGas', prop.Mains_Gas_Flag__c);

                    // Property type display
                    String typeDisplay = getPropertyTypeDisplay(prop);
                    p.put('typeDisplay', typeDisplay);

                    // Tenure
                    p.put('tenure', prop.Freehold__c ? 'Freehold' : (prop.Lease_Hold__c ? 'Leasehold' : ''));

                    // Features
                    List<String> features = new List<String>();
                    if (prop.Front_Garden__c) features.add('Front Garden');
                    if (prop.Back_Garden__c) features.add('Back Garden');
                    if (prop.Parking__c) features.add('Parking');
                    if (prop.Garage__c) features.add('Garage');
                    p.put('features', String.join(features, ', '));

                    // Application history
                    Integer appCount = appCounts.containsKey(prop.Id) ? appCounts.get(prop.Id) : 0;
                    Integer appMonth = appCountsMonth.containsKey(prop.Id) ? appCountsMonth.get(prop.Id) : 0;
                    Integer appYear = appCountsYear.containsKey(prop.Id) ? appCountsYear.get(prop.Id) : 0;
                    p.put('applicationCount', appCount);
                    p.put('applicationsMonth', appMonth);
                    p.put('applicationsYear', appYear);
                    p.put('hasApplications', appCount > 0);
                    p.put('latestAppId', latestAppIds.containsKey(prop.Id) ? latestAppIds.get(prop.Id) : null);

                    propertyList.add(p);
                }
            }

            // Sort by distance
            propertyList.sort(new PropertyDistanceComparator());

            // Save counter
            update config;

            // Area snapshot: sum from per-property counts
            Integer totalApps = 0;
            Integer appsThisMonth = 0;
            Integer appsThisYear = 0;
            for (Map<String, Object> p : propertyList) {
                totalApps += (Integer) p.get('applicationCount');
                appsThisMonth += (Integer) p.get('applicationsMonth');
                appsThisYear += (Integer) p.get('applicationsYear');
            }

            result.put('status', 'success');
            result.put('properties', propertyList);
            result.put('totalFound', propertyList.size());
            result.put('totalApplications', totalApps);
            result.put('applicationsThisMonth', appsThisMonth);
            result.put('applicationsThisYear', appsThisYear);
            result.put('requestsUsed', config.Requests_Today__c);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    private static String getPropertyTypeDisplay(NHS_Property__c prop) {
        if (String.isNotBlank(prop.Property_Type__c)) return prop.Property_Type__c;
        if (prop.Detached__c) return 'Detached';
        if (prop.Semi_Detached__c) return 'Semi-Detached';
        if (prop.End_Terrace__c) return 'End Terrace';
        if (prop.Mid_Terrace__c) return 'Mid Terrace';
        if (prop.Apartment__c) return 'Apartment';
        if (prop.Maisonette__c) return 'Maisonette';
        if (prop.Bungalow__c) return 'Bungalow';
        return 'Unknown';
    }

    private static Map<String, Decimal> geocodePostcode(String postcode, String apiKey) {
        try {
            String url = GEOCODE_URL + '?address=' + EncodingUtil.urlEncode(postcode + ', UK', 'UTF-8') + '&key=' + apiKey;
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                List<Object> results = (List<Object>) body.get('results');
                if (!results.isEmpty()) {
                    Map<String, Object> geometry = (Map<String, Object>) ((Map<String, Object>) results[0]).get('geometry');
                    Map<String, Object> location = (Map<String, Object>) geometry.get('location');
                    return new Map<String, Decimal>{ 'lat' => (Decimal) location.get('lat'), 'lng' => (Decimal) location.get('lng') };
                }
            }
        } catch (Exception e) {
            System.debug('Geocode error: ' + e.getMessage());
        }
        return null;
    }

    private static Decimal calculateDistance(Decimal lat1, Decimal lng1, Decimal lat2, Decimal lng2) {
        Double R = 3958.8;
        Double dLat = toRad((Double)(lat2 - lat1));
        Double dLng = toRad((Double)(lng2 - lng1));
        Double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(toRad((Double)lat1)) * Math.cos(toRad((Double)lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return Decimal.valueOf(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    private static Double toRad(Double deg) { return deg * Math.PI / 180; }

    public class PropertyDistanceComparator implements Comparator<Map<String, Object>> {
        public Integer compare(Map<String, Object> a, Map<String, Object> b) {
            Decimal distA = (Decimal) a.get('distance');
            Decimal distB = (Decimal) b.get('distance');
            if (distA < distB) return -1;
            if (distA > distB) return 1;
            return 0;
        }
    }
}
