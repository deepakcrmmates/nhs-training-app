public with sharing class MapProviderResolver {

    public class ProviderInfo {
        @AuraEnabled public String provider;
        @AuraEnabled public String token;
        @AuraEnabled public String fallbackReason;
        @AuraEnabled public Integer mapboxUsed;
        @AuraEnabled public Integer mapboxLimit;
        @AuraEnabled public Integer googleUsed;
        @AuraEnabled public Integer googleLimit;
        @AuraEnabled public String preferred;
    }

    @AuraEnabled(cacheable=false)
    public static ProviderInfo resolve() {
        ProviderInfo info = new ProviderInfo();

        NHS_API_Config__c apiCfg = NHS_API_Config__c.getOrgDefaults();
        List<Google_Maps_Config__c> gCfgs = [SELECT Id, API_Key__c, Daily_Limit__c, Requests_Today__c, Last_Reset_Date__c FROM Google_Maps_Config__c LIMIT 1];
        Google_Maps_Config__c gCfg = gCfgs.isEmpty() ? null : gCfgs[0];

        String preferred = apiCfg != null && String.isNotBlank(apiCfg.Map_Provider__c) ? apiCfg.Map_Provider__c : 'Auto';
        info.preferred = preferred;

        // Auto-reset Mapbox counter daily
        Date today = Date.today();
        if (apiCfg != null && apiCfg.Mapbox_Last_Reset_Date__c != today) {
            apiCfg.Mapbox_Requests_Today__c = 0;
            apiCfg.Mapbox_Last_Reset_Date__c = today;
            try { upsert apiCfg; } catch (Exception e) { /* silent */ }
        }

        // Auto-reset Google counter daily
        if (gCfg != null && gCfg.Last_Reset_Date__c != today) {
            gCfg.Requests_Today__c = 0;
            gCfg.Last_Reset_Date__c = today;
            try { update gCfg; } catch (Exception e) { /* silent */ }
        }

        Integer mapboxUsed = apiCfg != null && apiCfg.Mapbox_Requests_Today__c != null ? apiCfg.Mapbox_Requests_Today__c.intValue() : 0;
        Integer mapboxLimit = apiCfg != null && apiCfg.Mapbox_Daily_Limit__c != null ? apiCfg.Mapbox_Daily_Limit__c.intValue() : 1500;
        Boolean mapboxTokenSet = apiCfg != null && String.isNotBlank(apiCfg.Mapbox_Public_Token__c);
        Boolean mapboxAvailable = mapboxTokenSet && mapboxUsed < mapboxLimit;

        Integer googleUsed = gCfg != null && gCfg.Requests_Today__c != null ? gCfg.Requests_Today__c.intValue() : 0;
        Integer googleLimit = gCfg != null && gCfg.Daily_Limit__c != null ? gCfg.Daily_Limit__c.intValue() : 100;
        Boolean googleKeySet = gCfg != null && String.isNotBlank(gCfg.API_Key__c);
        Boolean googleAvailable = googleKeySet && googleUsed < googleLimit;

        info.mapboxUsed = mapboxUsed;
        info.mapboxLimit = mapboxLimit;
        info.googleUsed = googleUsed;
        info.googleLimit = googleLimit;

        // Resolution logic
        if (preferred == 'Mapbox') {
            if (mapboxAvailable) {
                info.provider = 'Mapbox';
                info.token = apiCfg.Mapbox_Public_Token__c;
            } else {
                info.provider = 'Google Maps';
                info.fallbackReason = mapboxTokenSet ? 'Mapbox daily limit reached — using Google Maps.' : 'Mapbox token not configured — using Google Maps.';
            }
        } else if (preferred == 'Google Maps') {
            if (googleAvailable) {
                info.provider = 'Google Maps';
            } else {
                info.provider = mapboxAvailable ? 'Mapbox' : 'Google Maps';
                if (info.provider == 'Mapbox') {
                    info.token = apiCfg.Mapbox_Public_Token__c;
                    info.fallbackReason = googleKeySet ? 'Google Maps daily limit reached — using Mapbox.' : 'Google Maps API key not configured — using Mapbox.';
                }
            }
        } else {
            // Auto — prefer Mapbox (free tier is larger)
            if (mapboxAvailable) {
                info.provider = 'Mapbox';
                info.token = apiCfg.Mapbox_Public_Token__c;
            } else if (googleAvailable) {
                info.provider = 'Google Maps';
                info.fallbackReason = mapboxTokenSet ? 'Mapbox daily limit reached — auto-switched to Google Maps.' : null;
            } else {
                info.provider = 'Google Maps';
                info.fallbackReason = 'Neither provider is fully configured. Using default Google Maps.';
            }
        }

        return info;
    }

    @AuraEnabled
    public static void incrementMapboxCounter() {
        NHS_API_Config__c apiCfg = NHS_API_Config__c.getOrgDefaults();
        if (apiCfg == null) return;
        Date today = Date.today();
        if (apiCfg.Mapbox_Last_Reset_Date__c != today) {
            apiCfg.Mapbox_Requests_Today__c = 0;
            apiCfg.Mapbox_Last_Reset_Date__c = today;
        }
        apiCfg.Mapbox_Requests_Today__c = (apiCfg.Mapbox_Requests_Today__c != null ? apiCfg.Mapbox_Requests_Today__c : 0) + 1;
        try { upsert apiCfg NHS_API_Config__c.Fields.Id; } catch (Exception e) { /* silent */ }
    }
}
