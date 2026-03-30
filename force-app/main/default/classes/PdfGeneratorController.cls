public with sharing class PdfGeneratorController {

    @AuraEnabled
    public static String generatePDF(String recordId) {
        try {
            PageReference pdfPage = new PageReference('/apex/PdfGeneratorPage?id=' + recordId);
            Blob pdfBlob = pdfPage.getContentAsPDF();

            Opportunity opp = [SELECT Vendor_1__r.Name FROM Opportunity WHERE Id = :recordId LIMIT 1];
            String vendorName = opp.Vendor_1__r?.Name != null ? opp.Vendor_1__r.Name.replaceAll('[^a-zA-Z0-9]', '_') : 'Application';

            ContentVersion pdfFile = new ContentVersion();
            pdfFile.Title = vendorName + '_Application_' + DateTime.now().format('yyyy-MM-dd');
            pdfFile.PathOnClient = vendorName + '_Application.pdf';
            pdfFile.VersionData = pdfBlob;
            insert pdfFile;

            Id fileId = [SELECT Id FROM ContentDocument WHERE Id IN
                         (SELECT ContentDocumentId FROM ContentVersion WHERE Id = :pdfFile.Id)
                         LIMIT 1].Id;

            return '/sfc/servlet.shepherd/document/download/' + fileId;

        } catch (Exception e) {
            throw new AuraHandledException('PDF generation failed: ' + e.getMessage());
        }
    }
}
