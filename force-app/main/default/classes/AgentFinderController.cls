public with sharing class AgentFinderController {

    private static final String GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

    @AuraEnabled
    public static Map<String, Object> findNearestAgents(Id opportunityId, Decimal maxDistanceMiles) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            // Get property postcode
            Opportunity opp = [
                SELECT Id, Property__r.Address__PostalCode__s, Property_Address__c,
                       Agent_1__c, Agent_2__c, Agent_3__c
                FROM Opportunity WHERE Id = :opportunityId LIMIT 1
            ];

            String propertyPostcode = opp.Property__r != null ? opp.Property__r.Address__PostalCode__s : null;
            if (String.isBlank(propertyPostcode) && String.isNotBlank(opp.Property_Address__c)) {
                String addr = opp.Property_Address__c.trim();
                Pattern p = Pattern.compile('([A-Z]{1,2}[0-9][0-9A-Z]?\\s?[0-9][A-Z]{2})$');
                Matcher m = p.matcher(addr.toUpperCase());
                if (m.find()) {
                    propertyPostcode = m.group(1);
                }
            }

            if (String.isBlank(propertyPostcode)) {
                result.put('status', 'error');
                result.put('message', 'No postcode found for this property.');
                return result;
            }

            result.put('propertyPostcode', propertyPostcode);
            result.put('currentAgent1', opp.Agent_1__c);
            result.put('currentAgent2', opp.Agent_2__c);
            result.put('currentAgent3', opp.Agent_3__c);

            // Check API config
            List<Google_Maps_Config__c> configs = [SELECT Id, API_Key__c, Daily_Limit__c, Requests_Today__c, Last_Reset_Date__c FROM Google_Maps_Config__c LIMIT 1];
            Google_Maps_Config__c config = configs.isEmpty() ? null : configs[0];
            if (config == null || String.isBlank(config.API_Key__c)) {
                result.put('status', 'error');
                result.put('message', 'Google Maps API key not configured. Go to Setup > Custom Settings > Google Maps Config.');
                return result;
            }

            // Reset daily counter if new day
            if (config.Last_Reset_Date__c != Date.today()) {
                config.Requests_Today__c = 0;
                config.Last_Reset_Date__c = Date.today();
                update config;
            }

            Decimal dailyLimit = config.Daily_Limit__c != null ? config.Daily_Limit__c : 100;
            if (config.Requests_Today__c >= dailyLimit) {
                result.put('status', 'error');
                result.put('message', 'Daily Google Maps API limit reached (' + dailyLimit.intValue() + '). Try again tomorrow.');
                return result;
            }

            // 1 API call: geocode the property postcode
            Map<String, Decimal> propertyCoords = geocodePostcode(propertyPostcode, config.API_Key__c);
            config.Requests_Today__c = (config.Requests_Today__c != null ? config.Requests_Today__c : 0) + 1;

            if (propertyCoords == null) {
                update config;
                result.put('status', 'error');
                result.put('message', 'Could not geocode property postcode: ' + propertyPostcode);
                return result;
            }

            // Get Estate Agent accounts near the property postcode
            // Extract outward code (e.g. "LS12" from "LS12 5AT") for filtering
            Id estateAgentRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Estate_Agents').getRecordTypeId();
            String outwardCode = propertyPostcode.trim().split(' ')[0]; // e.g. "LS12"
            String areaCode = outwardCode.replaceAll('[0-9]', ''); // e.g. "LS"
            String outwardLike = outwardCode + '%';
            String areaLike = areaCode + '%';

            // First: agents matching the exact outward code, then broader area code
            List<Account> agents = [
                SELECT Id, Name, BillingPostalCode, BillingCity, Phone, Email__c,
                       Geo_Latitude__c, Geo_Longitude__c, Rightmove_URL__c
                FROM Account
                WHERE RecordTypeId = :estateAgentRT
                AND BillingPostalCode != null
                AND Id != :opp.Agent_1__c
                AND BillingPostalCode LIKE :areaLike
                LIMIT 50
            ];

            // Geocode agents that don't have cached coordinates
            // Limit to 95 callouts max (property used 1, Salesforce limit is 100)
            List<Account> agentsToUpdate = new List<Account>();
            Integer newGeocodes = 0;
            Integer maxNewGeocodes = 95;

            for (Account agent : agents) {
                if (agent.Geo_Latitude__c == null || agent.Geo_Longitude__c == null) {
                    if (newGeocodes >= maxNewGeocodes) break;
                    if (config.Requests_Today__c >= dailyLimit) break;

                    Map<String, Decimal> coords = geocodePostcode(agent.BillingPostalCode, config.API_Key__c);
                    config.Requests_Today__c = config.Requests_Today__c + 1;
                    newGeocodes++;

                    if (coords != null) {
                        agent.Geo_Latitude__c = coords.get('lat');
                        agent.Geo_Longitude__c = coords.get('lng');
                        agentsToUpdate.add(agent);
                    }
                }
            }

            // Save cached coordinates (one-time per agent)
            if (!agentsToUpdate.isEmpty()) {
                update agentsToUpdate;
            }

            // Save updated request count
            update config;

            // Calculate distances using cached coordinates (no API calls)
            Decimal maxDist = maxDistanceMiles != null ? maxDistanceMiles : 10;
            List<Map<String, Object>> agentList = new List<Map<String, Object>>();
            for (Account agent : agents) {
                if (agent.Geo_Latitude__c != null && agent.Geo_Longitude__c != null) {
                    Decimal distance = calculateDistance(
                        propertyCoords.get('lat'), propertyCoords.get('lng'),
                        agent.Geo_Latitude__c, agent.Geo_Longitude__c
                    );

                    // Filter by max distance
                    if (distance > maxDist) continue;

                    Map<String, Object> agentMap = new Map<String, Object>();
                    agentMap.put('id', agent.Id);
                    agentMap.put('name', agent.Name);
                    agentMap.put('postcode', agent.BillingPostalCode);
                    agentMap.put('city', agent.BillingCity);
                    agentMap.put('phone', agent.Phone);
                    agentMap.put('email', agent.Email__c);
                    agentMap.put('rightmoveUrl', agent.Rightmove_URL__c);
                    agentMap.put('distance', distance.setScale(1));
                    agentMap.put('isAgent2', agent.Id == opp.Agent_2__c);
                    agentMap.put('isAgent3', agent.Id == opp.Agent_3__c);
                    agentMap.put('isAssigned', agent.Id == opp.Agent_2__c || agent.Id == opp.Agent_3__c);
                    agentList.add(agentMap);
                }
            }

            // Sort by distance and take top 10
            agentList.sort(new AgentDistanceComparator());
            if (agentList.size() > 10) {
                List<Map<String, Object>> top10 = new List<Map<String, Object>>();
                for (Integer i = 0; i < 10; i++) {
                    top10.add(agentList[i]);
                }
                agentList = top10;
            }

            result.put('status', 'success');
            result.put('agents', agentList);
            result.put('requestsUsed', config.Requests_Today__c);
            result.put('dailyLimit', dailyLimit);
            result.put('newGeocodes', newGeocodes);
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, String> assignAgent(Id opportunityId, Id agentId, String agentSlot) {
        Map<String, String> result = new Map<String, String>();
        try {
            Opportunity opp = [SELECT Id, Agent_2__c, Agent_3__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            if (agentSlot == 'agent2') {
                if (opp.Agent_3__c == agentId) {
                    result.put('status', 'error');
                    result.put('message', 'This agent is already assigned as Agent 3.');
                    return result;
                }
                opp.Agent_2__c = agentId;
            } else if (agentSlot == 'agent3') {
                if (opp.Agent_2__c == agentId) {
                    result.put('status', 'error');
                    result.put('message', 'This agent is already assigned as Agent 2.');
                    return result;
                }
                opp.Agent_3__c = agentId;
            }

            update opp;
            result.put('status', 'success');
            result.put('message', 'Agent assigned successfully.');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // ── Geocoding (1 API call per postcode) ──
    private static Map<String, Decimal> geocodePostcode(String postcode, String apiKey) {
        try {
            String encodedPostcode = EncodingUtil.urlEncode(postcode + ', UK', 'UTF-8');
            String url = GEOCODE_URL + '?address=' + encodedPostcode + '&key=' + apiKey;

            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(10000);

            Http http = new Http();
            HttpResponse resp = http.send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                List<Object> results = (List<Object>) body.get('results');
                if (!results.isEmpty()) {
                    Map<String, Object> firstResult = (Map<String, Object>) results[0];
                    Map<String, Object> geometry = (Map<String, Object>) firstResult.get('geometry');
                    Map<String, Object> location = (Map<String, Object>) geometry.get('location');

                    Map<String, Decimal> coords = new Map<String, Decimal>();
                    coords.put('lat', (Decimal) location.get('lat'));
                    coords.put('lng', (Decimal) location.get('lng'));
                    return coords;
                }
            }
        } catch (Exception e) {
            System.debug('Geocode error for ' + postcode + ': ' + e.getMessage());
        }
        return null;
    }

    // ── Haversine distance (miles) ──
    private static Decimal calculateDistance(Decimal lat1, Decimal lng1, Decimal lat2, Decimal lng2) {
        Double R = 3958.8;
        Double dLat = toRadians((Double)(lat2 - lat1));
        Double dLng = toRadians((Double)(lng2 - lng1));
        Double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(toRadians((Double)lat1)) * Math.cos(toRadians((Double)lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Decimal.valueOf(R * c);
    }

    private static Double toRadians(Double degrees) {
        return degrees * Math.PI / 180;
    }

    public class AgentDistanceComparator implements Comparator<Map<String, Object>> {
        public Integer compare(Map<String, Object> a, Map<String, Object> b) {
            Decimal distA = (Decimal) a.get('distance');
            Decimal distB = (Decimal) b.get('distance');
            if (distA < distB) return -1;
            if (distA > distB) return 1;
            return 0;
        }
    }
}
