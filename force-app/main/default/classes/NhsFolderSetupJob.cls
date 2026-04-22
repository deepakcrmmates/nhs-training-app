public class NhsFolderSetupJob implements Queueable, Database.AllowsCallouts {
    private Id opportunityId;

    public NhsFolderSetupJob(Id opportunityId) {
        this.opportunityId = opportunityId;
    }

    public void execute(QueueableContext context) {
        // Queueable wrapper — delegates to the synchronous runner and swallows any error
        // (the sync path is the preferred entry point now because errors surface to the UI).
        try {
            runFolderSetup(this.opportunityId);
        } catch (Exception e) {
            System.debug(System.LoggingLevel.ERROR,
                'NhsFolderSetupJob queueable failed: ' + e.getMessage() + ' | ' + e.getStackTraceString());
        }
    }

    /**
     * Synchronous folder setup. Creates the NHS Box folder structure for the given Opportunity
     * and writes `Box_Folder_Id__c`. Returns a result map so callers (e.g. LWC) can surface status.
     *   { status: 'success' | 'skipped' | 'error', folderId, message }
     */
    public static Map<String, String> runFolderSetup(Id opportunityId) {
        Map<String, String> result = new Map<String, String>();

        try {
            Opportunity opp = [SELECT Id, Name, Property_Address__c, Box_Folder_Id__c
                               FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            if (String.isNotBlank(opp.Box_Folder_Id__c)) {
                result.put('status', 'skipped');
                result.put('folderId', opp.Box_Folder_Id__c);
                result.put('message', 'Folder already exists (Id ' + opp.Box_Folder_Id__c + ')');
                return result;
            }

            String accessToken = BoxOAuthController.refreshAccessToken();
            if (String.isBlank(accessToken)) {
                result.put('status', 'error');
                result.put('message', 'Could not refresh Box access token. Check Box Config + OAuth connection.');
                System.debug(System.LoggingLevel.ERROR, 'NhsFolderSetupJob: ' + result.get('message'));
                return result;
            }

            Box_Config__c config = BoxOAuthController.getConfig();
            String rootFolderId = (config != null && String.isNotBlank(config.Root_Folder_Id__c))
                ? config.Root_Folder_Id__c : '0';

            String folderName = BoxFileService.sanitizeName(
                String.isNotBlank(opp.Property_Address__c) ? opp.Property_Address__c : opp.Name
            );

            // Create main property folder
            String mainFolderId = BoxFileService.getOrCreateFolder(folderName, rootFolderId, accessToken);
            if (String.isBlank(mainFolderId)) {
                result.put('status', 'error');
                result.put('message', 'Failed to create Box main folder for "' + folderName + '"');
                System.debug(System.LoggingLevel.ERROR, 'NhsFolderSetupJob: ' + result.get('message'));
                return result;
            }

            // Create subfolders (don't fail the overall run if one sub fails — log and continue)
            for (String sub : new List<String>{'Application', 'Valuations', 'Photos', 'Will Report'}) {
                try {
                    BoxFileService.getOrCreateFolder(sub, mainFolderId, accessToken);
                } catch (Exception subEx) {
                    System.debug(System.LoggingLevel.WARN,
                        'NhsFolderSetupJob: subfolder "' + sub + '" failed: ' + subEx.getMessage());
                }
            }

            // Save folder Id back to Opportunity
            update new Opportunity(Id = opp.Id, Box_Folder_Id__c = mainFolderId);

            result.put('status', 'success');
            result.put('folderId', mainFolderId);
            result.put('message', 'Folder structure created (Id ' + mainFolderId + ')');
            System.debug('NhsFolderSetupJob success: ' + mainFolderId);
            return result;

        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
            System.debug(System.LoggingLevel.ERROR,
                'NhsFolderSetupJob error: ' + e.getMessage() + ' | ' + e.getStackTraceString());
            return result;
        }
    }
}
