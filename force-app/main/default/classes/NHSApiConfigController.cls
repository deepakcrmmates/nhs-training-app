public with sharing class NHSApiConfigController {

    @AuraEnabled
    public static List<Map<String, Object>> getAllConfigs() {
        List<Map<String, Object>> configs = new List<Map<String, Object>>();

        // Load saved health check statuses
        Map<String, String> healthStatuses = new Map<String, String>();
        String lastCheckStr = '';
        List<NHS_API_Config__c> healthConfigs = [SELECT API_Status__c, Last_Health_Check__c, Health_Check_Interval_Hours__c FROM NHS_API_Config__c LIMIT 1];
        if (!healthConfigs.isEmpty() && String.isNotBlank(healthConfigs[0].API_Status__c)) {
            // Parse compact format: Box:ok,Google Maps:ok,...
            for (String part : healthConfigs[0].API_Status__c.split(',')) {
                Integer colonIdx = part.lastIndexOf(':');
                if (colonIdx > 0) {
                    healthStatuses.put(part.substring(0, colonIdx).trim(), part.substring(colonIdx + 1).trim());
                }
            }
            if (healthConfigs[0].Last_Health_Check__c != null) {
                lastCheckStr = healthConfigs[0].Last_Health_Check__c.format('dd/MM/yyyy HH:mm');
            }
        }

        // Box Config
        List<Box_Config__c> boxConfigs = [SELECT Id, Client_Id__c, Client_Secret__c, Refresh_Token__c, Access_Token__c, Token_Expiry__c, Root_Folder_Id__c FROM Box_Config__c LIMIT 1];
        if (!boxConfigs.isEmpty()) {
            Box_Config__c b = boxConfigs[0];
            configs.add(buildConfig('Box', 'Box_Config__c', b.Id, new List<Map<String, String>>{
                field('Client Id', 'Client_Id__c', b.Client_Id__c, 'text'),
                field('Client Secret', 'Client_Secret__c', maskValue(b.Client_Secret__c), 'password'),
                field('Refresh Token', 'Refresh_Token__c', maskValue(b.Refresh_Token__c), 'readonly'),
                field('Access Token', 'Access_Token__c', maskValue(b.Access_Token__c), 'readonly'),
                field('Token Expiry', 'Token_Expiry__c', b.Token_Expiry__c != null ? String.valueOf(b.Token_Expiry__c) : '', 'readonly'),
                field('Root Folder Id', 'Root_Folder_Id__c', b.Root_Folder_Id__c, 'text')
            }));
        }

        // Google Maps Config
        List<Google_Maps_Config__c> gmConfigs = [SELECT Id, API_Key__c, Daily_Limit__c, Requests_Today__c, Last_Reset_Date__c, Distance_Method__c FROM Google_Maps_Config__c LIMIT 1];
        if (!gmConfigs.isEmpty()) {
            Google_Maps_Config__c g = gmConfigs[0];
            configs.add(buildConfig('Google Maps', 'Google_Maps_Config__c', g.Id, new List<Map<String, String>>{
                field('API Key', 'API_Key__c', maskValue(g.API_Key__c), 'password'),
                field('Daily Limit', 'Daily_Limit__c', g.Daily_Limit__c != null ? String.valueOf(g.Daily_Limit__c.intValue()) : '100', 'number'),
                field('Requests Today', 'Requests_Today__c', g.Requests_Today__c != null ? String.valueOf(g.Requests_Today__c.intValue()) : '0', 'readonly'),
                field('Last Reset Date', 'Last_Reset_Date__c', g.Last_Reset_Date__c != null ? String.valueOf(g.Last_Reset_Date__c) : '', 'readonly'),
                field('Distance Method', 'Distance_Method__c', g.Distance_Method__c, 'picklist')
            }));
        }

        // NHS API Config
        List<NHS_API_Config__c> nhsConfigs = [SELECT Id, Ideal_Postcodes_Key__c, RapidAPI_Key__c, Street_Data_Endpoint__c, TinyURL_Endpoint__c FROM NHS_API_Config__c LIMIT 1];
        if (!nhsConfigs.isEmpty()) {
            NHS_API_Config__c n = nhsConfigs[0];
            configs.add(buildConfig('Ideal Postcodes', 'NHS_API_Config__c', n.Id, new List<Map<String, String>>{
                field('API Key', 'Ideal_Postcodes_Key__c', maskValue(n.Ideal_Postcodes_Key__c), 'password')
            }));
            configs.add(buildConfig('RapidAPI (Property Data)', 'NHS_API_Config__c', n.Id, new List<Map<String, String>>{
                field('API Key', 'RapidAPI_Key__c', maskValue(n.RapidAPI_Key__c), 'password')
            }));
            configs.add(buildConfig('Street Data API', 'NHS_API_Config__c', n.Id, new List<Map<String, String>>{
                field('Endpoint', 'Street_Data_Endpoint__c', n.Street_Data_Endpoint__c, 'url')
            }));
            configs.add(buildConfig('TinyURL', 'NHS_API_Config__c', n.Id, new List<Map<String, String>>{
                field('Endpoint', 'TinyURL_Endpoint__c', n.TinyURL_Endpoint__c, 'url')
            }));
        }

        // Twilio (managed — read only display)
        List<TwilioSF__TwilioMetaData__c> twConfigs = [SELECT Id, Name, TwilioSF__AccountSID__c, TwilioSF__MessagingServiceId__c FROM TwilioSF__TwilioMetaData__c WHERE TwilioSF__IsUsed__c = true LIMIT 1];
        if (!twConfigs.isEmpty()) {
            TwilioSF__TwilioMetaData__c t = twConfigs[0];
            configs.add(buildConfig('Twilio SMS', 'TwilioSF__TwilioMetaData__c', t.Id, new List<Map<String, String>>{
                field('Account SID', 'TwilioSF__AccountSID__c', t.TwilioSF__AccountSID__c, 'readonly'),
                field('Messaging Service SID', 'TwilioSF__MessagingServiceId__c', t.TwilioSF__MessagingServiceId__c, 'readonly')
            }));
        }

        // Apply health statuses
        Map<String, String> statusKeyMap = new Map<String, String>{
            'Box' => 'Box', 'Google Maps' => 'Google Maps',
            'Ideal Postcodes' => 'Ideal Postcodes', 'RapidAPI (Property Data)' => 'RapidAPI',
            'Street Data API' => 'Street Data', 'TinyURL' => 'TinyURL', 'Twilio SMS' => 'Twilio'
        };
        for (Map<String, Object> c : configs) {
            String statusKey = statusKeyMap.get((String) c.get('name'));
            String status = statusKey != null ? healthStatuses.get(statusKey) : null;
            c.put('healthStatus', String.isNotBlank(status) ? status : 'unknown');
            c.put('healthMessage', String.isNotBlank(status) ? status : 'Not checked');
            c.put('lastCheck', lastCheckStr);
        }

        // Sort alphabetically
        configs.sort(new ConfigNameComparator());
        return configs;
    }

    @AuraEnabled
    public static Map<String, String> updateConfig(String objectName, Id recordId, String fieldName, String fieldValue) {
        Map<String, String> result = new Map<String, String>();
        try {
            SObject record = Database.query('SELECT Id FROM ' + String.escapeSingleQuotes(objectName) + ' WHERE Id = :recordId LIMIT 1');

            // Handle different field types
            Schema.SObjectField sField = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().get(fieldName);
            Schema.DisplayType fieldType = sField.getDescribe().getType();

            if (fieldType == Schema.DisplayType.DOUBLE || fieldType == Schema.DisplayType.INTEGER) {
                record.put(fieldName, String.isNotBlank(fieldValue) ? Decimal.valueOf(fieldValue) : null);
            } else if (fieldType == Schema.DisplayType.DATE) {
                record.put(fieldName, String.isNotBlank(fieldValue) ? Date.valueOf(fieldValue) : null);
            } else if (fieldType == Schema.DisplayType.DATETIME) {
                record.put(fieldName, String.isNotBlank(fieldValue) ? DateTime.valueOf(fieldValue) : null);
            } else {
                record.put(fieldName, fieldValue);
            }

            update record;
            result.put('status', 'success');
            result.put('message', 'Updated successfully');
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled
    public static String getFieldValue(String objectName, Id recordId, String fieldName) {
        SObject record = Database.query('SELECT ' + String.escapeSingleQuotes(fieldName) + ' FROM ' + String.escapeSingleQuotes(objectName) + ' WHERE Id = :recordId LIMIT 1');
        Object val = record.get(fieldName);
        return val != null ? String.valueOf(val) : '';
    }

    private static Map<String, Object> buildConfig(String name, String objectName, Id recordId, List<Map<String, String>> fields) {
        return buildConfig(name, objectName, recordId, fields, null);
    }

    private static Map<String, Object> buildConfig(String name, String objectName, Id recordId, List<Map<String, String>> fields, String statusStr) {
        Map<String, Object> config = new Map<String, Object>();
        config.put('name', name);
        config.put('objectName', objectName);
        config.put('recordId', recordId);
        config.put('fields', fields);
        config.put('key', name.replaceAll('[^a-zA-Z0-9]', '_'));

        // Parse status
        if (String.isNotBlank(statusStr) && statusStr.contains('|')) {
            List<String> parts = statusStr.split('\\|', 2);
            config.put('healthStatus', parts[0]);
            config.put('healthMessage', parts[1]);
        } else {
            config.put('healthStatus', 'unknown');
            config.put('healthMessage', 'Not checked');
        }

        return config;
    }

    private static Map<String, String> field(String label, String apiName, String value, String fieldType) {
        Map<String, String> f = new Map<String, String>();
        f.put('label', label);
        f.put('apiName', apiName);
        f.put('value', value != null ? value : '');
        f.put('fieldType', fieldType);
        f.put('key', apiName);
        return f;
    }

    private static String maskValue(String val) {
        if (String.isBlank(val)) return '';
        if (val.length() <= 8) return '••••••••';
        return val.substring(0, 4) + '••••••••' + val.substring(val.length() - 4);
    }

    public class ConfigNameComparator implements Comparator<Map<String, Object>> {
        public Integer compare(Map<String, Object> a, Map<String, Object> b) {
            return ((String) a.get('name')).compareTo((String) b.get('name'));
        }
    }
}
