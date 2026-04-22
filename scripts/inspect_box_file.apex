// Inspect the Box file directly to see what shared_link permissions look like.
String accessToken = BoxOAuthController.refreshAccessToken();
HttpRequest req = new HttpRequest();
req.setEndpoint('https://api.box.com/2.0/files/2206221599105?fields=id,name,shared_link,permissions,is_accessible_via_shared_link');
req.setMethod('GET');
req.setHeader('Authorization', 'Bearer ' + accessToken);
HttpResponse resp = new Http().send(req);
System.debug('>> Status: ' + resp.getStatusCode());
System.debug('>> Body: ' + resp.getBody());
