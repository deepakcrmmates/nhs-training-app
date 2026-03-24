public class UploadLogoFromApplication {
    
    @InvocableMethod(label = 'NHS - Upload Logo From Application' description='Fetch the file URL related to the account and update the rich text area field')
    public static void CreateOpportunityLineItems(List<OppAndAccountDetailsRequest> requestList){
        System.debug('CreateOpportunityLineItems method start');
        System.debug('Request List: ' + requestList);
        
        // Check if requestList is not empty
        if (requestList.isEmpty()) {
            System.debug('Error: Request list is empty.');
            return;
        }
        
        Id oppoCollection = requestList[0].oppId;
        System.debug('Opportunity ID: ' + oppoCollection);
        
        String entity = requestList[0].selectedEntity;
        System.debug('Selected Entity: ' + entity);
        
        // Fetch the Opportunity record
        Opportunity op;
        try {
            op = [SELECT Id, Name, 
                  House_Builder__c, House_Builder__r.House_Builder_Logo__c,
                  Agent_1_Logo__c, Agent_2_Logo__c, Agent_3_Logo__c, House_Builder_Logo__c,
                  Agent_1__c, Agent_1__r.Agent_1_Logo__c, 
                  Agent_2__c, Agent_2__r.Agent_1_Logo__c, 
                  Agent_3__c, Agent_3__r.Agent_1_Logo__c 
                  FROM Opportunity WHERE Id = :oppoCollection];
        } catch (Exception e) {
            System.debug('Error fetching Opportunity: ' + e.getMessage());
            return;
        }
        
        System.debug('Fetched Opportunity: ' + op);
        
        // Fetch the related ContentDocumentLink
        List<ContentDocumentLink> contentDocumentLinks;
        try {
            contentDocumentLinks = [
                SELECT ContentDocumentId ,SystemModstamp
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :oppoCollection order by SystemModstamp desc
                LIMIT 1
            ];
        } catch (Exception e) {
            System.debug('Error fetching ContentDocumentLinks: ' + e.getMessage());
            return;
        }
        
        // Check if any files are related to this account
        if (contentDocumentLinks.isEmpty()) {
            System.debug('No files related to this opportunity.');
            return;
        }
        
        System.debug('Fetched ContentDocumentLink: ' + contentDocumentLinks);
        
        Id contentDocumentId = contentDocumentLinks[0].ContentDocumentId;
        
        // Fetch the related ContentVersion
        ContentVersion contentVersion;
        try {
            contentVersion = [
                SELECT Id, FileType 
                FROM ContentVersion 
                WHERE ContentDocumentId = :contentDocumentId 
                LIMIT 1
            ];
        } catch (Exception e) {
            System.debug('Error fetching ContentVersion: ' + e.getMessage());
            return;
        }
        
        System.debug('Fetched ContentVersion: ' + contentVersion);
        
        String fileUrl = '/sfc/servlet.shepherd/version/download/' + contentVersion.Id;
        System.debug('File URL: ' + fileUrl);
        
        Account ac = new Account();
        Boolean updateAccount = false;
        
        if (entity == 'House Builder') {
            System.debug('Entity is House Builder');
            ac.House_Builder_Logo__c = '<img src="' + fileUrl + '" alt="House Builder Logo"/>';
            ac.Id = op.House_Builder__c;
            op.House_Builder_Logo__c = '<img src="' + fileUrl + '" alt="House Builder Logo"/>';
            updateAccount = true;
        } else if (entity == 'Agent1') {
            System.debug('Entity is Agent1');
            ac.Agent_1_Logo__c = '<img src="' + fileUrl + '" alt="Agent 1 Logo"/>';
            ac.Id = op.Agent_1__c;
            op.Agent_1_Logo__c = '<img src="' + fileUrl + '" alt="House Builder Logo"/>';
            updateAccount = true;
        } else if (entity == 'Agent2') {
            System.debug('Entity is Agent2');
            ac.Agent_1_Logo__c = '<img src="' + fileUrl + '" alt="Agent 2 Logo"/>';
            op.Agent_2_Logo__c = '<img src="' + fileUrl + '" alt="House Builder Logo"/>';
            ac.Id = op.Agent_2__c;
            updateAccount = true;
        } else if (entity == 'Agent3') {
            System.debug('Entity is Agent3');
            ac.Agent_1_Logo__c = '<img src="' + fileUrl + '" alt="Agent 3 Logo"/>';
            ac.Id = op.Agent_3__c;
            op.Agent_3_Logo__c = '<img src="' + fileUrl + '" alt="House Builder Logo"/>';
            updateAccount = true;
        } else {
            System.debug('Error: Invalid entity type');
            return;
        }
        
        if (updateAccount) {
            try {
                update ac;
                update op;
                System.debug('Account updated successfully: ' + ac);
            } catch (Exception e) {
                System.debug('Error updating Account: ' + e.getMessage());
            }
        } else {
            System.debug('No account updates were necessary.');
        }
        
        System.debug('CreateOpportunityLineItems method end');
    }
    
    public class OppAndAccountDetailsRequest {
        @InvocableVariable(required=true)
        public Id oppId;
        
        @InvocableVariable(required=true)
        public String selectedEntity;
    }
}