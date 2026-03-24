public with sharing class WeeklyUpdatesController {
    @AuraEnabled
    public static Boolean updateRecords(List<Object> data) {
        // Implement logic to update records in Salesforce
        // This is just a placeholder
        return true;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Weekly_Updates__c> getInitialData(string recId ) {
        
        return [SELECT Id, Agent_1__c, Agent_2__c, Agent_3__c, Agent_1_Notes__c, Agent_2_Notes__c,Instructions_to_Market__c,
                Agent_3_Notes__c, createdDate, lastmodifieddate,week_number__c,  CreatedBy.Name, LastModifiedBy.Name FROM Weekly_Updates__c where Instructions_to_Market__c=: recId order by week_number__c ASC];
    } 
    
    
    @AuraEnabled
    public static string saveRecords(string jsonDatalist) {
        system.debug('dataList : '+jsonDatalist);
        try{
            List<Object> dataList = (List<Object>)JSON.deserializeUntyped(string.valueof(jsonDatalist));
            System.debug(dataList);
            List<Weekly_Updates__c> weeklyUpdateList = new  List<Weekly_Updates__c>();
            for (Object data : dataList) {
                
                Map<String, Object> dataMap = (Map<String, Object>) data; // Cast each object to a map
                System.debug('dataMap'+dataMap);
                Weekly_Updates__c wObj = new Weekly_Updates__c();
                if(string.valueOf(dataMap.get('Id'))!=''){
                    wObj.Id = string.valueOf(dataMap.get('Id'));
                }
                if(string.valueOf(dataMap.get('agent1')) != ''){
                    wObj.Agent_1__c = string.valueOf(dataMap.get('agent1'));
                }
                if(string.valueOf(dataMap.get('agent2')) != ''){
                    wObj.Agent_2__c = string.valueOf(dataMap.get('agent2'));
                }
                if(string.valueOf(dataMap.get('agent3')) != ''){
                    wObj.Agent_3__c = string.valueOf(dataMap.get('agent3'));
                }
                if(string.valueOf(dataMap.get('application')) != ''){
                wobj.Application__c = string.valueOf(dataMap.get('application'));
                }
                if(string.valueOf(dataMap.get('notes1')) != ''){
                    wObj.Agent_1_Notes__c = string.valueOf(dataMap.get('notes1'));
                }
                if(string.valueOf(dataMap.get('notes2')) != ''){
                    wObj.Agent_2_Notes__c = string.valueOf(dataMap.get('notes2'));
                }
                if(string.valueOf(dataMap.get('notes3')) != ''){
                    wObj.Agent_3_Notes__c = string.valueOf(dataMap.get('notes3'));
                }
                if( string.valueOf(dataMap.get('availabiltyId')) !=''){
                    wObj.Instructions_to_Market__c =  string.valueOf(dataMap.get('availabiltyId'));
                }
                
                weeklyUpdateList.add(wobj);
            }
            system.debug((weeklyUpdateList));
            upsert weeklyUpdateList;
             system.debug((weeklyUpdateList.size()));
            return 's';
        }catch(exception e){
            system.debug(e);
            system.debug(e.getlinenumber());
            return 'n';
        }
    }
}