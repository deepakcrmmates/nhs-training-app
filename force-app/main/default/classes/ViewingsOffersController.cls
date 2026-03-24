public with sharing class ViewingsOffersController {
    
    
    @AuraEnabled(cacheable=true)
    public static List<Viewings_Offer__c> getInitialData( string availabiltyId) {
        system.debug(availabiltyId);
        return [SELECT Id, Agent__c, Availability_Report__c, Date_of_Viewing__c, Buying_Position__c, Feedback__c, Feedback_Chased__c, Offer__c, New_Offer__c, Notes_Updates__c, Viewer_Name__c FROM Viewings_Offer__c where Availability_Report__c =: availabiltyId];
    }
    
    @AuraEnabled(cacheable=true)
    public static Availability_Report__c geAvailabilityData(string availablityId) {
        system.debug('availablityId=========='+ availablityId);
		Availability_Report__c av = [select id, Application__r.Agent_1__c, Application__r.Agent_2__c, Application__r.Agent_3__c  from Availability_Report__c where id =: availablityId limit 1];    
        return av;
    }
    
    @AuraEnabled
    public static void saveRecords(string jsonDatalist) {
        system.debug('dataList : '+jsonDatalist);
        try{
            List<Object> dataList = (List<Object>)JSON.deserializeUntyped(string.valueof(jsonDatalist));
        System.debug(dataList);
        List<Viewings_Offer__c>oplist = new List<Viewings_Offer__c>();
        for (Object data : dataList) {
            Map<String, Object> dataMap = (Map<String, Object>) data; // Cast each object to a map
            System.debug('dataMap'+dataMap);
            // Extract Id and stageName from the map
           
            Viewings_Offer__c vob = new Viewings_Offer__c();
            if(string.valueOf(dataMap.get('Id')) !=''){
                string idVal1 = string.valueOf(dataMap.get('Id'));
                vob.Id = Id.valueOf(idVal1);
            }
            if(string.valueOf(dataMap.get('Agent__c')) !=''){
                string idVal2 = string.valueOf(dataMap.get('Agent__c'));
                 vob.Agent__c = Id.valueOf(idVal2);
            }
            if(string.valueOf(dataMap.get('Viewer_Name__c')) !=''){
                 string idVal3 = string.valueOf(dataMap.get('Viewer_Name__c'));
                  vob.Viewer_Name__c = Id.valueOf(idVal3);
            }           
            if(string.valueOf(dataMap.get('Date_of_Viewing__c')) !=''){
                string dt = string.valueOf(dataMap.get('Date_of_Viewing__c'));
            vob.Date_of_Viewing__c = date.valueOf(dt);
            }
            if(string.valueOf(dataMap.get('Feedback_Chased__c')) != ''){
                string dt1 = string.valueOf(dataMap.get('Feedback_Chased__c'));
            vob.Feedback_Chased__c = date.valueOf(dt1);
            }
            if(string.valueOf(dataMap.get('Buying_Position__c')) !=''){
                  vob.Buying_Position__c = string.valueOf(dataMap.get('Buying_Position__c'));
            }
            if(string.valueOf(dataMap.get('Feedback__c')) !=''){
                 vob.Feedback__c = string.valueOf(dataMap.get('Feedback__c'));
            }
            if(string.valueOf(dataMap.get('Offer__c'))!=''){
                string val1 = string.valueOf(dataMap.get('Offer__c'));
                vob.Offer__c =  decimal.valueOf(val1);
            }
            if(string.valueOf(dataMap.get('New_Offer__c')) != ''){
                 string val2 = string.valueOf(dataMap.get('New_Offer__c'));
                vob.New_Offer__c = decimal.valueOf(val2);
            }
           
            if(string.valueOf(dataMap.get('Notes_Updates__c')) !=''){
                vob.Notes_Updates__c = string.valueOf(dataMap.get('Notes_Updates__c'));
            }
            
            if(string.valueOf(dataMap.get('Availability_Report__c')) !=''){
                string idVal = string.valueOf(dataMap.get('Availability_Report__c'));
            vob.Availability_Report__c = Id.valueOf(idVal);
            }
           // vob.key = (String) dataMap.get('key');
                     oplist.add(vob);
            
        }
        upsert oplist;
            system.debug(JSON.Serialize(oplist));
        }catch(exception e){
            system.debug(e);
             system.debug(e.getlinenumber());
        }
        
    }
}