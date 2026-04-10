public class AccountLogoUploader {

  @InvocableMethod(label='NHS - Account Logo Uploader' description='Fetch the file URL related to the account and update the rich text area field')
    public static void updateAccountWithFileUrl(List<Id> accountIds) {
        for (Id accountId : accountIds) {
            String fileUrl = getFileUrl(accountId);
            updateAccountRichTextField(accountId, fileUrl);
        }
    }
    
    @AuraEnabled
    public static String getFileUrl(Id accountId) {
        List<ContentDocumentLink> contentDocumentLinks = [
            SELECT ContentDocumentId ,SystemModstamp      
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :accountId order by SystemModstamp desc 
            LIMIT 1 
        ];

        if (contentDocumentLinks.isEmpty()) {
            throw new AuraHandledException('No files related to this account.');
        }

        Id contentDocumentId = contentDocumentLinks[0].ContentDocumentId;

        ContentVersion contentVersion = [
            SELECT Id, FileType 
            FROM ContentVersion 
            WHERE ContentDocumentId = :contentDocumentId 
            LIMIT 1
        ];

        String fileUrl = '/sfc/servlet.shepherd/version/download/' + contentVersion.Id;
        updateAccountRichTextField(accountId, fileUrl);
          // Upload to Dropbox with try-catch to handle potential errors
        
        try {
            BoxFileService.uploadFileToDropbox(accountId, contentDocumentId, 'Logo', null, null);
        } catch (Exception e) {
            System.debug('Failed to upload file to Box for Account ' + accountId + ': ' + e.getMessage() + ' line: ' + e.getLineNumber());
        }
        return fileUrl;
    }

    @AuraEnabled
    public static void updateAccountRichTextField(Id accountId, String fileUrl) {
        Account account = [SELECT Id, House_Builder_Logo__c, Agent_1_Logo__c, RecordType.Name FROM Account WHERE Id = :accountId LIMIT 1];
         if(account.RecordType.Name == 'House Builder'){
             account.House_Builder_Logo__c = '<img src="' + fileUrl + '" alt="Account Image"/>';
             //account.Logo_URL__c = fileUrl;
        }
       
         if(account.RecordType.Name == 'Estate Agents'){
            // account.Agent_1_Logo__c = '<img src="' + fileUrl + '" alt="Account Image"/>';
            //  account.Logo_URL__c = fileUrl;
        }
        update account;
    }


}