// Regenerate the Box shared link for Wain Homes - North West using the updated BoxFileService
// (now includes can_download + can_preview permissions). File is already uploaded; just needs a new link.
// The file's Box ID isn't stored on the Account — we'll search the Wain Homes / Logo folder via the Box API.

String accessToken = BoxOAuthController.refreshAccessToken();
System.debug('>> Token ok: ' + (accessToken != null));

Box_Config__c cfg = BoxOAuthController.getConfig();
String rootId = cfg != null && String.isNotBlank(cfg.Root_Folder_Id__c) ? cfg.Root_Folder_Id__c : '0';

// Walk: root -> Housebuilder -> Wain Homes - North West -> Logo
String housebuilderFolderId = BoxFileService.getOrCreateFolder('Housebuilder', rootId, accessToken);
String builderFolderId = BoxFileService.getOrCreateFolder('Wain Homes - North West', housebuilderFolderId, accessToken);
String logoFolderId = BoxFileService.getOrCreateFolder('Logo', builderFolderId, accessToken);
System.debug('>> Folder chain: HB=' + housebuilderFolderId + ', Builder=' + builderFolderId + ', Logo=' + logoFolderId);

// List items in the Logo folder to find the SVG
HttpRequest req = new HttpRequest();
req.setEndpoint('https://api.box.com/2.0/folders/' + logoFolderId + '/items');
req.setMethod('GET');
req.setHeader('Authorization', 'Bearer ' + accessToken);
HttpResponse resp = new Http().send(req);
Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
List<Object> entries = (List<Object>) body.get('entries');
System.debug('>> Files in Logo folder: ' + (entries != null ? entries.size() : 0));

String fileId;
if (entries != null) {
    for (Object e : entries) {
        Map<String, Object> m = (Map<String, Object>) e;
        if ('file'.equals((String) m.get('type'))) {
            fileId = (String) m.get('id');
            System.debug('>> Using file: ' + m.get('name') + ' (id=' + fileId + ')');
            break;
        }
    }
}

if (fileId != null) {
    String url = BoxFileService.createSharedLink(fileId, accessToken);
    System.debug('>> New shared URL: ' + url);
    if (String.isNotBlank(url)) {
        Account acc = [SELECT Id, Name FROM Account WHERE Name = 'Wain Homes - North West' LIMIT 1];
        Account upd = new Account(Id = acc.Id);
        upd.put('Logo_URL__c', url);
        try { upd.put('House_Builder_Logo__c', '<img src="' + url + '" alt="' + acc.Name + ' Logo"/>'); } catch (Exception ex) {}
        update upd;
        System.debug('>> Updated Account.Logo_URL__c');
    }
}
