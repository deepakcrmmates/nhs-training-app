@istest
public class CommonUtilTest {

    @istest
    public static void CommmounUtilTest(){
       CommonUtil.getAllFields('Account');
       CommonUtil.getPickListValues('','');
        CommonUtil.getSobjectData('Account');
        CommonUtil.getNamespacePrefix('InventoryDmsController', 'Inventory__c');
        CommonUtil.getLightningPickListValues('Status', 'Account');
        
        //CommonUtil.getFieldType('','');
        //CommonUtil.getFieldType('Status', 'Account');
        
    } 
    
    
      @IsTest
    static void testGetAllFields() {
        String objectAPIName = 'Account';
        String fields = CommonUtil.getAllFields(objectAPIName);
      
    }
    
    @IsTest
    static void testGetPickListValues() {
        String fieldName = 'Status';
        String objectName = 'Opportunity';
        List<String> picklistValues = CommonUtil.getPickListValues(fieldName, objectName);
        
    }
    
    @IsTest
    static void testGetLightningPickListValues() {
        String fieldName = 'Status';
        String objectName = 'Opportunity';
        List<Map<String, Object>> picklistValues = CommonUtil.getLightningPickListValues(fieldName, objectName);
       
    }
    
    @IsTest
    static void testGetSobjectData() {
        String type = 'Account';
        List<SObject> sobjectData = CommonUtil.getSobjectData(type);
       
    }
    
    @IsTest
    static void testGetNamespacePrefix() {
        String className = 'TestClass';
        String objective = 'Class';
        String namespace = CommonUtil.getNamespacePrefix(className, objective);
      
    }
    @IsTest
    static void testHandleFileUpload() {
        String recordId = '0695i00000CfU4NAAV';
        List<Map<String, Object>> fileListMap = new List<Map<String, Object>>();
        Map<String, Object> fileObj = new Map<String, Object>();
        fileObj.put('name', 'TestFile.txt');
        fileObj.put('url', 'VGhpcyBpcyBhIHRlc3QgZmlsZQ=='); // Base64 encoded file content
        fileListMap.add(fileObj);
        
        Test.startTest();
         account acc = new account();
        acc.Name = 'JAG SETHI MOTORS';
        insert acc; 
        
        
        
        ContentVersion conVer = new ContentVersion();
        String yourFilesContent = 'TheBlogReaders.com File upload content';
        conVer.ContentLocation = 'S'; 
        conVer.PathOnClient = 'testing.txt';
        conVer.Title = 'Testing Files';
        conVer.VersionData = EncodingUtil.base64Decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsJCQcJCQcJCQkJCwkJCQkJCQsJCwsMCwsLDA0QDBEODQ4MEhkSJRodJR0ZHxwpKRYlNzU2GioyPi0pMBk7IRP/2wBDAQcICAsJCxULCxUsHRkdLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCz/wAARCAEKAZEDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAQIAAwQFBgf/xABNEAABAwMCAwQFBwgFCgcAAAABAAIDBAUREiETMVEGIkFhFBVxgZEyVJKhscHRIyRCUlOCk9IlNGJj8BZDZHJ0lMPh4vEHM0RVoqOy/8QAGwEAAgMBAQEAAAAAAAAAAAAAAQIAAwQFBgf/xAA5EQACAgECAwQHBwQCAwEAAAAAAQIRAwQhBRIxE0FRkQYUFWGBodEWIlJxweHwMlOx8UJD'); // converting your binary string to Blog
        insert conVer;   
        
        Id conDoc = [SELECT ContentDocumentId FROM ContentVersion WHERE Id =:conVer.Id].ContentDocumentId;
        ContentDocumentLink conDocLink = New ContentDocumentLink();
        conDocLink.LinkedEntityId =acc.Id ; 
        conDocLink.ContentDocumentId = conDoc;      
        conDocLink.shareType = 'V';
        insert conDocLink;
        

        CommonUtil.handleFileUpload(conDocLink.LinkedEntityId, fileListMap);
        
        Test.stopTest();
        
        List<ContentDocumentLink> contentDocumentLinks = [SELECT Id FROM ContentDocumentLink WHERE LinkedEntityId = :recordId];
       
    }
    
    @IsTest
    static void testGetFieldType() {
        String fieldName = 'Name';
        String objectName = 'Account';
        String fieldType = CommonUtil.getFieldType(fieldName, objectName);
    }
    
      /****************************************************************** AG code Start ************************************************************************/      
   
}