public without sharing class CommonUtil {

     public static string getAllFields(String objectAPIName){
        string returnString;
        try {
            System.debug('REQUEST : '+objectAPIName);
            list<string> apiNames = new List<string>();
            Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe().get(objectAPIName.trim()).getDescribe().fields.getMap();
            for(string obj : objectFields.keySet()){
                apiNames.add(obj);
            }
            returnString = string.join(apiNames,',');
        } catch (Exception e) {
            System.debug('error in get all field class : '+e.getMessage()+' at line no : '+e.getLineNumber());
            returnString = '';
        }
        
        return returnString;
    }
    
    public static list<String> getPickListValues(String fieldName, string objectName){
        list<String> returnList = new list<String>();
        System.debug('Object : '+objectName+' : Field name : '+fieldName);
        try {
            Map<String, schema.SObjectField> feildMap = Schema.getGlobalDescribe().get(objectName.trim()).getDescribe().fields.getMap();
            list<Schema.PicklistEntry> values = feildMap.get(fieldName.trim()).getDescribe().getPickListValues();
            for (Schema.PicklistEntry obj : values) {
                returnList.add(obj.getValue().remove('\'').escapeUnicode());
            }
            returnList.sort();
            System.debug('MAP with FEILD TYPE : '+returnList);
        } catch (Exception e) {
            System.debug('error in datafetching method : '+e.getMessage()+' at line no : '+e.getLineNumber());
        }
        if (returnList.isEmpty()) {
            return null;
        }else {
            return returnList;
        }
    }
    
    public static list<Map<String,Object>> getLightningPickListValues(String fieldName, string objectName) {
        list<Map<String,Object>> returnList = new list<Map<String,Object>>();
        try {
            returnList.add(new Map<String,Object>{'label'=>'--Select--','value'=>'--Select--'});
            Map<String, schema.SObjectField> feildMap = Schema.getGlobalDescribe().get(objectName.trim()).getDescribe().fields.getMap();
            list<Schema.PicklistEntry> values = feildMap.get(fieldName.trim()).getDescribe().getPickListValues();
            for (Schema.PicklistEntry obj : values) {
                returnList.add(new Map<String,Object>{'label'=>obj.getLabel(),'value'=>obj.getValue().remove('\'').escapeUnicode()});
            }
            System.debug('MAP with FEILD TYPE : '+returnList);
        } catch (Exception e) {
            System.debug('Error in lightning picklist values : '+e.getMessage()+' at line no :'+e.getLineNumber());
            // return null;
        }
        return returnList;
    }
    
    public static list<SObject> getSobjectData(string type){
        string fields = getAllFields(type);
        if (String.isNotBlank(fields)) {
            list<SObject> returnObject = Database.query('select '+fields+' from '+type);
            return returnObject;
        }else {
            return null;
        }
    }
    
    public static String getNamespacePrefix(String className, String objective) {
        String namespace = '';
        if (objective == 'Class') {
            try {
                ApexClass ac = [SELECT NameSpacePrefix FROM ApexClass WHERE Name =: className];
                if(null != ac.NameSpacePrefix) {
                    namespace = ac.NameSpacePrefix + '__';
                }
            } catch (QueryException ex) {
                System.debug('error in Apex class name : '+ex.getMessage());
            }
        }else {
            try {
                Integer indexOfToken = -1;
                for ( Schema.SObjectType type : Schema.getGlobalDescribe().values() ) {
                    String sobjName = String.valueOf(type);
                    
                    if (null != sobjName) {
                        indexOfToken = sobjName.indexOf(className);
                    }
                    
                    if (indexOfToken != -1) {  namespace = sobjName.substring(0, indexOfToken);
                        break;
                    }
                }
            } catch (Exception e) {
                System.debug('SOBJECT error : '+e.getMessage());
            }
            
        }
        
        return namespace;
    }
    
    @AuraEnabled
    public static void handleFileUpload(String recordId, list<map<string,object>> fileListMap) {
        list<contentVersion> contentList = new List<ContentVersion>();
        for(Map<string,object> fileObj : fileListMap) {
            ContentVersion conVer = new ContentVersion();
            conVer.ContentLocation = 'S'; // S specify this document is in SF, use E for external files
            conVer.PathOnClient = fileObj.get('name').toString(); // The files name, extension is very important here which will help the file in preview.
            conVer.Title = fileObj.get('name').toString(); // Display name of the files
            conVer.VersionData = EncodingUtil.base64Decode(fileObj.get('url').toString()); // converting your binary string to Blog
            contentList.add(conVer);
        }
        
        insert contentList;
        list<contentVersion> conDocList = [SELECT ContentDocumentId FROM ContentVersion WHERE Id =:contentList];
        list<ContentDocumentLink> ContentDocumentLinkList = new List<ContentDocumentLink>();
        for(contentVersion condoc : conDocList) {
            //Create ContentDocumentLink
            ContentDocumentLink cDe = new ContentDocumentLink();
            cDe.ContentDocumentId = conDoc.ContentDocumentId;
            cDe.LinkedEntityId = recordId; // you can use objectId,GroupId etc
            cDe.ShareType = 'I'; // Inferred permission, checkout description of ContentDocumentLink object for more details
            cDe.Visibility = 'AllUsers';
            ContentDocumentLinkList.add(cDe);
        }
        
        insert ContentDocumentLinkList;
    }
    
    public static String getFieldType(string fieldName,String objectName){
        Map<String, schema.SObjectField> feildMap = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();
        Schema.SObjectField field = feildMap.get(fieldName);
        Schema.DisplayType dataType = field.getDescribe().getType();
        System.debug('Field Request : '+fieldName+' type : '+dataType);
        return String.valueOf(dataType);
    }
}