public with sharing class PdfGeneratorController {
    
    @AuraEnabled
    public static String generatePDF(String htmlContent) {
        try {
            // Encode HTML content to pass safely as a parameter
            String encodedHtml = EncodingUtil.base64Encode(Blob.valueOf(htmlContent));

            // Construct the Visualforce page URL with encoded content
            String vfPageUrl = '/apex/PdfGeneratorPage?content=' + encodedHtml;

            // Convert the Visualforce page to a PDF
            PageReference pdfPage = new PageReference(vfPageUrl);
            Blob pdfBlob = pdfPage.getContentAsPDF();

            // Store PDF as a File record in Salesforce
            ContentVersion file = new ContentVersion();
            file.Title = 'GeneratedPDF';
            file.PathOnClient = 'GeneratedPDF.pdf';
            file.VersionData = pdfBlob;
            insert file;

            // Retrieve the file ID for download
            Id fileId = [SELECT Id FROM ContentDocument WHERE Id IN 
                         (SELECT ContentDocumentId FROM ContentVersion WHERE Id = :file.Id) 
                         LIMIT 1].Id;

            return '/sfc/servlet.shepherd/document/download/' + fileId;
            
        } catch (Exception e) {
            System.debug('Error generating PDF: ' + e.getMessage());
            return null;
        }
    }
}