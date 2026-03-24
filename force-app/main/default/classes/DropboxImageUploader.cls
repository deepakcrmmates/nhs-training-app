public with sharing class DropboxImageUploader {
    private static final String DROPBOX_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
    private static final String ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';

  public static void uploadImageToDropbox(String propertyId, String imageUrl) {
    Http http = new Http();
    HttpRequest request = new HttpRequest();
    request.setEndpoint(DROPBOX_UPLOAD_URL);
    request.setMethod('POST');
    request.setHeader('Authorization', 'Bearer ' + ACCESS_TOKEN);
    request.setHeader('Content-Type', 'application/octet-stream');

    // Extract the last part of the URL as the file name
    List<String> urlParts = imageUrl.split('/');
    String fileName = urlParts[urlParts.size() - 1]; // Correct way to get the last item

    String dropboxPath = '/PropertyImages/' + propertyId + '/' + fileName;
    request.setHeader('Dropbox-API-Arg', '{"path": "' + dropboxPath + '", "mode": "add"}');

    request.setBodyAsBlob(getImageBlob(imageUrl));

    HttpResponse response = http.send(request);
    if (response.getStatusCode() == 200) {
        System.debug('Image uploaded to Dropbox successfully.');
    } else {
        System.debug('Error uploading image to Dropbox: ' + response.getBody());
    }
}


    private static Blob getImageBlob(String imageUrl) {
        Http imgHttp = new Http();
        HttpRequest imgRequest = new HttpRequest();
        imgRequest.setEndpoint(imageUrl);
        imgRequest.setMethod('GET');
        HttpResponse imgResponse = imgHttp.send(imgRequest);
        return imgResponse.getBodyAsBlob();
    }
}