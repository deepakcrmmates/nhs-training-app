public with sharing class AgentFinderController {

    private static final String GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
    private static final String DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

    @AuraEnabled
    public static Map<String, Object> findNearestAgents(Id opportunityId, Decimal maxDistanceMiles) {
        Map<String, Object> result = new Map<String, Object>();

        try {
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

            List<Google_Maps_Config__c> configs = [SELECT Id, API_Key__c, Daily_Limit__c, Requests_Today__c, Last_Reset_Date__c, Distance_Method__c FROM Google_Maps_Config__c LIMIT 1];
            Google_Maps_Config__c config = configs.isEmpty() ? null : configs[0];
            String distanceMethod = config != null && String.isNotBlank(config.Distance_Method__c) ? config.Distance_Method__c : 'Postcodes.io';
            Boolean usePostcodesIo = distanceMethod == 'Postcodes.io';

            Decimal dailyLimit = 0;

            // Validate Google Maps config if using Google
            if (!usePostcodesIo) {
                if (config == null || String.isBlank(config.API_Key__c)) {
                    result.put('status', 'error');
                    result.put('message', 'Google Maps API key not configured. Switch to Postcodes.io (free) in API Config.');
                    return result;
                }

                if (config.Last_Reset_Date__c != Date.today()) {
                    config.Requests_Today__c = 0;
                    config.Last_Reset_Date__c = Date.today();
                }

                dailyLimit = config.Daily_Limit__c != null ? config.Daily_Limit__c : 100;
                if (config.Requests_Today__c >= dailyLimit) {
                    result.put('status', 'error');
                    result.put('message', 'Daily API limit reached (' + dailyLimit.intValue() + '). Switch to Postcodes.io (free) or try tomorrow.');
                    return result;
                }
            }

            // Geocode property postcode
            Map<String, Decimal> propertyCoords;
            if (usePostcodesIo) {
                propertyCoords = geocodeWithPostcodesIo(propertyPostcode);
            } else {
                propertyCoords = geocodePostcode(propertyPostcode, config.API_Key__c);
                config.Requests_Today__c = (config.Requests_Today__c != null ? config.Requests_Today__c : 0) + 1;
            }

            if (propertyCoords == null) {
                if (!usePostcodesIo) update config;
                result.put('status', 'error');
                result.put('message', 'Could not geocode postcode: ' + propertyPostcode);
                return result;
            }

            // Get Estate Agent accounts
            Id estateAgentRT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Estate_Agents').getRecordTypeId();
            String areaCode = propertyPostcode.trim().split(' ')[0].replaceAll('[0-9]', '');
            String areaLike = areaCode + '%';

            List<Account> agents = [
                SELECT Id, Name, BillingStreet, BillingPostalCode, BillingCity, Phone, Email__c,
                       Geo_Latitude__c, Geo_Longitude__c, Rightmove_URL__c,
                       (SELECT Id, MobilePhone FROM Contacts ORDER BY CreatedDate LIMIT 1)
                FROM Account
                WHERE RecordTypeId = :estateAgentRT
                AND BillingPostalCode != null
                AND Id != :opp.Agent_1__c
                AND BillingPostalCode LIKE :areaLike
                LIMIT 50
            ];

            // Geocode agents without cached coordinates
            List<Account> agentsToUpdate = new List<Account>();
            Integer newGeocodes = 0;

            for (Account agent : agents) {
                if (agent.Geo_Latitude__c == null || agent.Geo_Longitude__c == null) {
                    if (newGeocodes >= 95) break;
                    if (!usePostcodesIo && config.Requests_Today__c >= dailyLimit) break;
                    Map<String, Decimal> coords = usePostcodesIo
                        ? geocodeWithPostcodesIo(agent.BillingPostalCode)
                        : geocodePostcode(agent.BillingPostalCode, config.API_Key__c);
                    if (!usePostcodesIo) config.Requests_Today__c = config.Requests_Today__c + 1;
                    newGeocodes++;
                    if (coords != null) {
                        agent.Geo_Latitude__c = coords.get('lat');
                        agent.Geo_Longitude__c = coords.get('lng');
                        agentsToUpdate.add(agent);
                    }
                }
            }

            if (!agentsToUpdate.isEmpty()) {
                update agentsToUpdate;
            }

            // Pre-filter by aerial distance (1.5x radius to allow for driving routes)
            Decimal maxDist = maxDistanceMiles != null ? maxDistanceMiles : 10;
            Boolean useDistanceMatrix = !usePostcodesIo && config.Distance_Method__c == 'Distance Matrix';
            List<Account> candidateAgents = new List<Account>();
            Map<Id, Decimal> aerialDistances = new Map<Id, Decimal>();

            for (Account agent : agents) {
                if (agent.Geo_Latitude__c != null && agent.Geo_Longitude__c != null) {
                    Decimal aerialDist = calculateDistance(
                        propertyCoords.get('lat'), propertyCoords.get('lng'),
                        agent.Geo_Latitude__c, agent.Geo_Longitude__c
                    );
                    Decimal filterRadius = useDistanceMatrix ? maxDist * 1.5 : maxDist;
                    if (aerialDist <= filterRadius) {
                        candidateAgents.add(agent);
                        aerialDistances.put(agent.Id, aerialDist.setScale(1));
                    }
                }
            }

            // Distance Matrix API (driving distances) — 1 API call for up to 25 agents
            Map<Id, Decimal> drivingDistances = new Map<Id, Decimal>();
            Map<Id, String> drivingDurations = new Map<Id, String>();

            if (useDistanceMatrix && !candidateAgents.isEmpty()) {
                Integer batchSize = Math.min(candidateAgents.size(), 25);
                String destinations = '';
                List<Account> batchAgents = new List<Account>();
                for (Integer i = 0; i < batchSize; i++) {
                    if (i > 0) destinations += '|';
                    destinations += candidateAgents[i].BillingPostalCode + ', UK';
                    batchAgents.add(candidateAgents[i]);
                }

                String dmUrl = DISTANCE_MATRIX_URL
                    + '?origins=' + EncodingUtil.urlEncode(propertyPostcode + ', UK', 'UTF-8')
                    + '&destinations=' + EncodingUtil.urlEncode(destinations, 'UTF-8')
                    + '&units=imperial'
                    + '&key=' + config.API_Key__c;

                HttpRequest dmReq = new HttpRequest();
                dmReq.setEndpoint(dmUrl);
                dmReq.setMethod('GET');
                dmReq.setTimeout(15000);

                HttpResponse dmResp = new Http().send(dmReq);
                config.Requests_Today__c = config.Requests_Today__c + batchSize;

                if (dmResp.getStatusCode() == 200) {
                    Map<String, Object> dmBody = (Map<String, Object>) JSON.deserializeUntyped(dmResp.getBody());
                    List<Object> rows = (List<Object>) dmBody.get('rows');
                    if (rows != null && !rows.isEmpty()) {
                        List<Object> elements = (List<Object>) ((Map<String, Object>) rows[0]).get('elements');
                        for (Integer i = 0; i < elements.size() && i < batchAgents.size(); i++) {
                            Map<String, Object> element = (Map<String, Object>) elements[i];
                            if ((String) element.get('status') == 'OK') {
                                Map<String, Object> distObj = (Map<String, Object>) element.get('distance');
                                Map<String, Object> durObj = (Map<String, Object>) element.get('duration');
                                Decimal meters = (Decimal) distObj.get('value');
                                Decimal miles = (meters / 1609.344).setScale(1);
                                drivingDistances.put(batchAgents[i].Id, miles);
                                drivingDurations.put(batchAgents[i].Id, (String) durObj.get('text'));
                            }
                        }
                    }
                }
            }

            // Save counter (only for Google Maps)
            if (!usePostcodesIo && config != null) {
                update config;
            }

            // Build results
            List<Map<String, Object>> agentList = new List<Map<String, Object>>();
            for (Account agent : candidateAgents) {
                Decimal distance;
                String duration = null;
                String distType;

                if (useDistanceMatrix && drivingDistances.containsKey(agent.Id)) {
                    distance = drivingDistances.get(agent.Id);
                    duration = drivingDurations.get(agent.Id);
                    distType = 'driving';
                } else {
                    distance = aerialDistances.get(agent.Id);
                    distType = 'aerial';
                }

                if (distance > maxDist) continue;

                Map<String, Object> agentMap = new Map<String, Object>();
                agentMap.put('id', agent.Id);
                agentMap.put('name', agent.Name);
                agentMap.put('street', agent.BillingStreet);
                agentMap.put('postcode', agent.BillingPostalCode);
                agentMap.put('city', agent.BillingCity);
                agentMap.put('phone', agent.Phone);
                agentMap.put('email', agent.Email__c);
                String mobile = null;
                if (!agent.Contacts.isEmpty() && agent.Contacts[0].MobilePhone != null) {
                    mobile = agent.Contacts[0].MobilePhone;
                }
                agentMap.put('mobile', mobile);
                agentMap.put('rightmoveUrl', agent.Rightmove_URL__c);
                agentMap.put('distance', distance);
                agentMap.put('duration', duration);
                agentMap.put('distanceType', distType);
                agentMap.put('isAgent2', agent.Id == opp.Agent_2__c);
                agentMap.put('isAgent3', agent.Id == opp.Agent_3__c);
                agentMap.put('isAssigned', agent.Id == opp.Agent_2__c || agent.Id == opp.Agent_3__c);
                agentList.add(agentMap);
            }

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
            result.put('distanceMethod', usePostcodesIo ? 'Postcodes.io' : (useDistanceMatrix ? 'Distance Matrix' : 'Geocoding'));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, String> assignAgent(Id opportunityId, String agentId, String agentSlot) {
        Map<String, String> result = new Map<String, String>();
        try {
            Opportunity opp = [SELECT Id, Agent_2__c, Agent_3__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            Id agentIdVal = String.isNotBlank(agentId) ? Id.valueOf(agentId) : null;

            if (agentSlot == 'agent2') {
                if (agentIdVal != null && opp.Agent_3__c == agentIdVal) {
                    result.put('status', 'error');
                    result.put('message', 'This agent is already assigned as Agent 3.');
                    return result;
                }
                opp.Agent_2__c = agentIdVal;
            } else if (agentSlot == 'agent3') {
                if (agentIdVal != null && opp.Agent_2__c == agentIdVal) {
                    result.put('status', 'error');
                    result.put('message', 'This agent is already assigned as Agent 2.');
                    return result;
                }
                opp.Agent_3__c = agentIdVal;
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

    @AuraEnabled
    public static List<Map<String, Object>> getAvailableSlots(Id opportunityId) {
        List<Map<String, Object>> slots = new List<Map<String, Object>>();
        // Show all vendor availability slots from today onwards (not filtered by Booked__c)
        List<Vendor_Availability__c> avails = [
            SELECT Id, Date__c, AM__c, PM__c, Slots__c
            FROM Vendor_Availability__c
            WHERE Application__c = :opportunityId
            AND Date__c >= TODAY
            ORDER BY Date__c ASC
            LIMIT 30
        ];

        for (Vendor_Availability__c va : avails) {
            Map<String, Object> slot = new Map<String, Object>();
            slot.put('id', va.Id);
            slot.put('date', va.Date__c);
            slot.put('am', va.AM__c);
            slot.put('pm', va.PM__c);
            slot.put('time', va.Slots__c);

            DateTime dt = DateTime.newInstance(va.Date__c, Time.newInstance(0, 0, 0, 0));
            slot.put('dayName', dt.format('EEEE'));
            slot.put('dateFormatted', dt.format('dd MMM yyyy'));
            slots.add(slot);
        }
        return slots;
    }

    @AuraEnabled
    public static Map<String, String> bookAppointment(Id opportunityId, String agentSlot, Id availabilityId, String selectedTime) {
        Map<String, String> result = new Map<String, String>();
        try {
            Vendor_Availability__c va = [SELECT Id, Date__c, AM__c, PM__c, Booked__c, Application__c FROM Vendor_Availability__c WHERE Id = :availabilityId LIMIT 1];

            // Parse selected time — use GMT so the stored time matches the intended local time
            List<String> timeParts = selectedTime.split(':');
            Integer hour = Integer.valueOf(timeParts[0]);
            Integer minute = Integer.valueOf(timeParts[1]);
            DateTime apptDateTime = DateTime.newInstanceGmt(va.Date__c.year(), va.Date__c.month(), va.Date__c.day(), hour, minute, 0);
            DateTime apptEndDateTime = apptDateTime.addHours(1);

            // Get opportunity with agent and vendor details
            Opportunity opp = [SELECT Id, Agent_1__c, Agent_2__c, Agent_3__c, Vendor_1__c, Property_Address__c FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // Determine agent ID
            Id agentId;
            if (agentSlot == 'agent1') { agentId = opp.Agent_1__c; opp.Agent_1_Appointment__c = apptDateTime; }
            else if (agentSlot == 'agent2') { agentId = opp.Agent_2__c; opp.Agent_2_Appointment__c = apptDateTime; }
            else if (agentSlot == 'agent3') { agentId = opp.Agent_3__c; opp.Agent_3_Appointment__c = apptDateTime; }
            update opp;

            // Do NOT mark Booked__c — same slot stays available for other agents

            // Create an Event record (syncs with Agent Booking component)
            if (agentId != null && opp.Vendor_1__c != null) {
                String agentName = [SELECT Name FROM Account WHERE Id = :agentId LIMIT 1].Name;

                // Check if event already exists for this agent + opportunity + vendor
                List<Event> existing = [SELECT Id FROM Event WHERE Agent__c = :agentId AND WhatId = :opportunityId AND WhoId = :opp.Vendor_1__c LIMIT 1];
                Event evt;
                if (!existing.isEmpty()) {
                    evt = existing[0];
                } else {
                    evt = new Event();
                    evt.Agent__c = agentId;
                    evt.WhatId = opportunityId;
                    evt.WhoId = opp.Vendor_1__c;
                }
                evt.StartDateTime = apptDateTime;
                evt.EndDateTime = apptEndDateTime;
                evt.Subject = 'Valuation appointment with ' + agentName;
                evt.IsBooked__c = true;
                evt.Location = opp.Property_Address__c;
                upsert evt;
            }

            result.put('status', 'success');
            result.put('message', 'Appointment booked for ' + apptDateTime.format('dd MMM yyyy HH:mm'));
            result.put('dateTime', String.valueOf(apptDateTime));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    // Geocode using Postcodes.io (free, no API key required)
    private static Map<String, Decimal> geocodeWithPostcodesIo(String postcode) {
        try {
            String cleanPostcode = postcode.trim().replaceAll('\\s+', '');
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.postcodes.io/postcodes/' + cleanPostcode);
            req.setMethod('GET');
            req.setTimeout(10000);
            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                Map<String, Object> resultData = (Map<String, Object>) body.get('result');
                if (resultData != null) {
                    Decimal lat = (Decimal) resultData.get('latitude');
                    Decimal lng = (Decimal) resultData.get('longitude');
                    return new Map<String, Decimal>{ 'lat' => lat, 'lng' => lng };
                }
            }
        } catch (Exception e) {
            System.debug('Postcodes.io geocode error: ' + e.getMessage());
        }
        return null;
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
