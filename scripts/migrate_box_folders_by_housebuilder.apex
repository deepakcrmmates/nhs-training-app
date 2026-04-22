/**
 * One-shot migration: move every Opportunity's Box folder from
 *   Root / <Property>
 * to
 *   Root / Housebuilder / <Builder Name> / <Property>
 *
 * Box folder Ids stay stable across moves — Box_Folder_Id__c stays valid.
 */
String token = BoxOAuthController.refreshAccessToken();
Box_Config__c cfg = BoxOAuthController.getConfig();
String rootFolderId = (cfg != null && String.isNotBlank(cfg.Root_Folder_Id__c)) ? cfg.Root_Folder_Id__c : '0';

// Ensure top-level "Housebuilder" folder exists
String hbRootId = BoxFileService.getOrCreateFolder('Housebuilder', rootFolderId, token);
System.debug('Housebuilder root folder Id: ' + hbRootId);

// Cache builder-folder lookups to cut down on callouts
Map<String, String> builderFolderIds = new Map<String, String>();

List<Opportunity> apps = [
    SELECT Id, Name, Property_Address__c, Box_Folder_Id__c,
           House_Builder__c, House_Builder__r.Name
    FROM Opportunity
    WHERE Box_Folder_Id__c != null
    ORDER BY House_Builder__r.Name NULLS LAST, CreatedDate ASC
];
System.debug('Migrating ' + apps.size() + ' opportunities');

Integer moved = 0, skipped = 0, errors = 0;

for (Opportunity opp : apps) {
    String builderName = (opp.House_Builder__r != null && String.isNotBlank(opp.House_Builder__r.Name))
        ? opp.House_Builder__r.Name : 'Unassigned';
    String safeBuilder = BoxFileService.sanitizeName(builderName);

    // Look up or create the builder folder (cached per run)
    String builderFolderId = builderFolderIds.get(safeBuilder);
    if (builderFolderId == null) {
        builderFolderId = BoxFileService.getOrCreateFolder(safeBuilder, hbRootId, token);
        if (String.isBlank(builderFolderId)) {
            System.debug('  ✗ ' + opp.Name + ' — cannot create builder folder "' + safeBuilder + '"');
            errors++;
            continue;
        }
        builderFolderIds.put(safeBuilder, builderFolderId);
    }

    // Check current parent via Box API — skip if already under the builder folder
    HttpRequest q = new HttpRequest();
    q.setEndpoint('https://api.box.com/2.0/folders/' + opp.Box_Folder_Id__c + '?fields=parent,name');
    q.setMethod('GET');
    q.setHeader('Authorization', 'Bearer ' + token);
    HttpResponse qr = new Http().send(q);
    if (qr.getStatusCode() != 200) {
        System.debug('  ✗ ' + opp.Name + ' — Box GET failed (' + qr.getStatusCode() + ')');
        errors++;
        continue;
    }
    Map<String, Object> fInfo = (Map<String, Object>) JSON.deserializeUntyped(qr.getBody());
    Map<String, Object> parent = (Map<String, Object>) fInfo.get('parent');
    String currentParentId = parent != null ? String.valueOf(parent.get('id')) : null;

    if (currentParentId == builderFolderId) {
        skipped++;
        continue;
    }

    // Move via PUT /folders/{id} with new parent
    HttpRequest mv = new HttpRequest();
    mv.setEndpoint('https://api.box.com/2.0/folders/' + opp.Box_Folder_Id__c);
    mv.setMethod('PUT');
    mv.setHeader('Authorization', 'Bearer ' + token);
    mv.setHeader('Content-Type', 'application/json');
    mv.setBody('{"parent":{"id":"' + builderFolderId + '"}}');
    HttpResponse mr = new Http().send(mv);
    if (mr.getStatusCode() >= 200 && mr.getStatusCode() < 300) {
        System.debug('  ✓ ' + opp.Name + ' → Housebuilder/' + safeBuilder + '/');
        moved++;
    } else {
        System.debug('  ✗ ' + opp.Name + ' — move failed (' + mr.getStatusCode() + '): ' + mr.getBody().substring(0, Math.min(200, mr.getBody().length())));
        errors++;
    }
}

System.debug('=== Migration summary: moved=' + moved + ', already in place=' + skipped + ', errors=' + errors + ' ===');
