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
     *
     * Path:
     *   Root / Housebuilder / <Housebuilder Name> / <Property Address> / {Application, Valuations, Photos, Will Report}
     */
    public static Map<String, String> runFolderSetup(Id opportunityId) {
        Map<String, String> result = new Map<String, String>();

        try {
            Opportunity opp = [SELECT Id, Name, Property_Address__c, Box_Folder_Id__c,
                                      House_Builder__c, House_Builder__r.Name
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

            // Resolve the builder name — default to 'Unassigned' if the Opportunity has no housebuilder
            String builderName = (opp.House_Builder__r != null && String.isNotBlank(opp.House_Builder__r.Name))
                ? opp.House_Builder__r.Name : 'Unassigned';

            String propertyName = BoxFileService.sanitizeName(
                String.isNotBlank(opp.Property_Address__c) ? opp.Property_Address__c : opp.Name
            );

            // Root / Housebuilder
            String hbRootId = BoxFileService.getOrCreateFolder('Housebuilder', rootFolderId, accessToken);
            if (String.isBlank(hbRootId)) {
                result.put('status', 'error');
                result.put('message', 'Failed to create/find the "Housebuilder" root folder');
                return result;
            }

            // Root / Housebuilder / <Builder Name>
            String builderFolderId = BoxFileService.getOrCreateFolder(
                BoxFileService.sanitizeName(builderName), hbRootId, accessToken);
            if (String.isBlank(builderFolderId)) {
                result.put('status', 'error');
                result.put('message', 'Failed to create/find housebuilder folder for "' + builderName + '"');
                return result;
            }

            // Root / Housebuilder / <Builder Name> / <Property Address>
            String propertyFolderId = BoxFileService.getOrCreateFolder(propertyName, builderFolderId, accessToken);
            if (String.isBlank(propertyFolderId)) {
                result.put('status', 'error');
                result.put('message', 'Failed to create property folder "' + propertyName + '" under builder');
                return result;
            }

            // Subfolders (don't fail the overall run if one sub fails — log and continue)
            for (String sub : new List<String>{'Application', 'Valuations', 'Photos', 'Will Report'}) {
                try {
                    BoxFileService.getOrCreateFolder(sub, propertyFolderId, accessToken);
                } catch (Exception subEx) {
                    System.debug(System.LoggingLevel.WARN,
                        'NhsFolderSetupJob: subfolder "' + sub + '" failed: ' + subEx.getMessage());
                }
            }

            // Save the property folder Id back to the Opportunity
            update new Opportunity(Id = opp.Id, Box_Folder_Id__c = propertyFolderId);

            result.put('status', 'success');
            result.put('folderId', propertyFolderId);
            result.put('message', 'Folder structure created at Housebuilder/' + builderName + '/' + propertyName);
            System.debug('NhsFolderSetupJob success: Id=' + propertyFolderId + ' Path=Housebuilder/' + builderName + '/' + propertyName);
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
