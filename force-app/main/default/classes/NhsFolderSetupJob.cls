public class NhsFolderSetupJob implements Queueable, Database.AllowsCallouts {
    private Id opportunityId;

    public NhsFolderSetupJob(Id opportunityId) {
        this.opportunityId = opportunityId;
    }

    public void execute(QueueableContext context) {
        try {
            String accessToken = BoxOAuthController.refreshAccessToken();
            if (accessToken == null) {
                System.debug('NhsFolderSetupJob: Failed to get access token');
                return;
            }

            Box_Config__c config = BoxOAuthController.getConfig();
            String rootFolderId = (config != null && String.isNotBlank(config.Root_Folder_Id__c))
                ? config.Root_Folder_Id__c : '0';

            Opportunity opp = [SELECT Id, Name, Property_Address__c, Box_Folder_Id__c
                               FROM Opportunity WHERE Id = :this.opportunityId LIMIT 1];

            // Skip if folder already exists
            if (String.isNotBlank(opp.Box_Folder_Id__c)) {
                System.debug('NhsFolderSetupJob: Folder already exists: ' + opp.Box_Folder_Id__c);
                return;
            }

            String folderName = BoxFileService.sanitizeName(
                String.isNotBlank(opp.Property_Address__c) ? opp.Property_Address__c : opp.Name
            );

            // Create main property folder
            String mainFolderId = BoxFileService.getOrCreateFolder(folderName, rootFolderId, accessToken);
            if (mainFolderId == null) {
                System.debug('NhsFolderSetupJob: Failed to create main folder');
                return;
            }

            // Create subfolders
            for (String sub : new List<String>{'Application', 'Valuations', 'Photos', 'Will Report'}) {
                BoxFileService.getOrCreateFolder(sub, mainFolderId, accessToken);
            }

            // Save folder ID to Opportunity (DML after callouts)
            opp.Box_Folder_Id__c = mainFolderId;
            update opp;
            System.debug('NhsFolderSetupJob: Folder structure created. Main: ' + mainFolderId);
        } catch (Exception e) {
            System.debug('NhsFolderSetupJob error: ' + e.getMessage() + ' | ' + e.getStackTraceString());
        }
    }
}
