public class ImageURLToFileObject {
    
    // Method to download images from a list of URLs and create ContentVersion records
    public static void storeImages(List<String> imageUrls, Id parentId) {
        try {
            List<ContentDocumentLink> cdlList =    [SELECT id, ContentDocument.Title, ContentDocument.FileType, ContentDocument.LatestPublishedVersionId,ContentDocumentId 
                                                    FROM ContentDocumentLink 
                                                    WHERE LinkedEntityId =:parentId];
            
            List<ContentVersion> contentVersions = new List<ContentVersion>();
            integer count = 0;   
            
            if(cdlList.isEmpty()){
                // Loop through each image URL
                for (String imageUrl : imageUrls) {
                    // Step 1: Download image content from URL
                    Http http = new Http();
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint(imageUrl);
                    request.setMethod('GET');
                    HttpResponse response = http.send(request);
                    system.debug(response.getStatusCode());
                    // Check if request was successful
                    if (response.getStatusCode() == 200) {
                        Blob imageBlob = response.getBodyAsBlob();
                        
                        // Step 2: Create ContentVersion record
                        ContentVersion cv = new ContentVersion();
                        cv.Title = 'Image'+ ''+ count++; // Set a title for the image file
                        cv.PathOnClient = 'image.jpg'; // Specify the file name
                        cv.VersionData = imageBlob; // Assign the image blob data
                        cv.FirstPublishLocationId = parentId; // Associate with a parent record
                        
                        // Add ContentVersion to list for bulk insertion
                        contentVersions.add(cv);
                    } else {
                        // Handle HTTP error responses
                        System.debug('HTTP Error: ' + response.getStatusCode() + ' ' + response.getStatus());
                    }
                }
                // Step 3: Insert all ContentVersion records
                if (!contentVersions.isEmpty()) {
                    insert contentVersions;
                }
            }
            else{
                
                for (Integer i = 0; i < cdlList.size(); i++) {
                    
                    // Step 1: Download image content from URL
                    Http http = new Http();
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint(imageUrls.get(i));
                    request.setMethod('GET');
                    HttpResponse response = http.send(request);
                    
                    // Check if request was successful
                    if (response.getStatusCode() == 200) {
                        Blob imageBlob = response.getBodyAsBlob();
                        
                        // Step 2: Create ContentVersion record
                        ContentVersion cv = new ContentVersion();
                        cv.Title = 'Image'+ ''+ count++; // Set a title for the image file
                        cv.PathOnClient = 'image.jpg'; // Specify the file name
                        cv.VersionData = imageBlob; // Assign the image blob data
                        //  cv.FirstPublishLocationId = parentId; // Associate with a parent record
                        if(!cdlList.isEmpty()){
                            
                            cv.ContentDocumentId = cdlList.get(i).ContentDocumentId; // existing document Id
                            system.debug('66-----');
                        }
                        cv.IsMajorVersion = true; 
                        
                        // Add ContentVersion to list for bulk insertion
                        contentVersions.add(cv);
                        
                    } else {
                        // Handle HTTP error responses
                        System.debug('HTTP Error: ' + response.getStatusCode() + ' ' + response.getStatus());
                    }
                }
                if (!contentVersions.isEmpty()) {
                    insert contentVersions;
                }      
            }
            
            // Optionally, you can get the ContentVersion Ids for further processing
            for (ContentVersion cv : contentVersions) {
                System.debug('ContentVersion Id: ' + cv.Id);
            }
            
        } catch (Exception e) {
            // Handle exceptions
            System.debug('Exception occurred: ' + e.getMessage());
        }
    }
    
    
}