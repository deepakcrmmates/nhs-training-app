public class AvailabilityController {
    public Availability_Report__c availabilityReport { get; set; }
    public List<Viewings_Offer__c> viewOfferList { get; set; }
    public List<Weekly_Updates__c> weekUpdateList { get; set; }
    public List<ContentDocumentLink> files { get; set; }
    public String urlsMain { get; set; }
    public String urlsMain1 { get; set; }
    public Date currentDate { get; private set; }
    public integer size {get;set;}
    public string flag {get;set;}
    
    public AvailabilityController(ApexPages.StandardController stdController) {
        // Get the current date
        currentDate = Date.today();
        size = 0;

        // Get the ID of the Availability Report from the page parameters
        String availabilityReportId = ApexPages.currentPage().getParameters().get('Id');

        try {
            // Fetch the Availability Report with related records
            availabilityReport = [SELECT Id, Name, Application__c, Application__r.Development__c, 
                                  Application__r.Property__r.Primary_Image__c, Application__r.Property__c, 
                                  Application__r.House_Builder__r.Name, Application__r.Property_Address__c, 
                                  Price_Instructed_Date__c, Price_Instructed_Price__c, X1st_Reduction_Price__c, 
                                  X1st_Reduction_Date__c, X2nd_Reduction_Date__c, X2nd_Reduction_Price__c, 
                                  X3rd_Reduction_Date__c, X3rd_Reduction_Price__c, X4th_Reduction_Date__c, 
                                  X4th_Reduction_Price__c, Application__r.Agent_1_Initial_Asking_Price__c, 
                                  Application__r.Agent_2_Initial_Asking_Price__c, 
                                  Application__r.Agent_3_Initial_Asking_Price__c, 
                                  Application__r.Average_Initial_Asking_Price__c, 
                                  Application__r.Initial_Asking_Price__c, Application__r.Agent_1_Target_Sale__c, 
                                  Application__r.Agent_2_Target_Sale__c, Application__r.Agent_3_Target_Sale__c, 
                                  Application__r.Average_Target_Sale__c, Application__r.Target_Sale__c, 
                                  Application__r.Agent_1_Bottom_Line__c, Application__r.Agent_2_Bottom_Line__c, 
                                  Application__r.Agent_3_Bottom_Line__c, Application__r.Average_Bottom_Line__c, 
                                  Application__r.Forced_Sale__c, Application__r.Scheme__c, 
                                  Application__r.ETA_Comp_Start__c, Application__r.ETA_Comp_End__c, 
                                  Application__r.Client_Expectations__c, Application__r.Applicant__r.Name, 
                                  Application__r.Applicant__r.Email, Application__r.Applicant__r.Phone, 
                                  Application__r.Date_of_Application_Received__c, 
                                  Application__r.Photographic_ID_Seen_at_the_Appointment__c, 
                                  Application__r.Notes__c, Application__r.Address_Confirmation_Seen_at_the_Appoint__c, 
                                  Application__r.SSID_Mr__c, Application__r.SSID_Mrs__c, 
                                  Application__r.ID_Check_Form_In__c, Application__r.Agent_1__r.Name, 
                                  Application__r.Agent_2__r.Name, Application__r.Agent_3__r.Name, 
                                  Application__r.Agent_1__r.Phone, Application__r.Agent_1__r.Email__c, 
                                  Application__r.Agent_1_Emailed__c, Application__r.Agent_1_Appointment__c, 
                                  Application__r.Agent_1_Verbally_Confirmed__c, Application__r.Agent_2__r.Phone, 
                                  Application__r.Agent_2__r.Email__c, Application__r.Agent_2_Emailed_Confirmation__c, 
                                  Application__r.Agent_2_Appointment__c, Application__r.Agent_2_Verbally_Confirmed__c, 
                                  Application__r.Agent_3__r.Phone, Application__r.Agent_3__r.Email__c, 
                                  Application__r.Agent_3_Emailed_Confirmation__c, Application__r.Agent_3_Appointment__c, 
                                  Application__r.Agent_3_Verbally_Confirmed__c, Application__r.Tenure__c, 
                                  Application__r.Ground_Rent__c, Application__r.Service_Charge__c, 
                                  Application__r.Length_of_Lease_Remaining__c, Application__r.Council_Tax__c, 
                                  Application__r.Shared_Ownership__c, Application__r.Shared_Ownership_Notes__c, 
                                  Application__r.EPC_Rating__c, Application__r.Property__r.EPC_Rating__c,
                                  (SELECT Id, Name, Agent__r.Name, Date_of_Viewing__c, Viewer_Name__r.Name, 
                                   Buying_Position__c, Feedback__c, Feedback_Chased__c, Offer__c, 
                                   New_Offer__c, Notes_Updates__c FROM Viewings_Offers__r),
                                  (SELECT Id, Name, Agent_1__r.Name, Agent_2__r.Name, 
                                   Agent_3__r.Name, Agent_1_Notes__c, Agent_2_Notes__c, 
                                   Agent_3_Notes__c, week_number__c, Instructions_to_Market__r.Name, 
                                   Update_Date__c, Update_Agent__r.Name, Update_By__c, 
                                   Update_Notes__c, Application__c, CreatedDate
                                   FROM Weekly_Updates__r)
                                  FROM Availability_Report__c WHERE Id = :availabilityReportId LIMIT 1];

            // Assign related lists from the main query to the corresponding variables
            viewOfferList = availabilityReport.Viewings_Offers__r;
            weekUpdateList = availabilityReport.Weekly_Updates__r;

            // Get the Property ID from the Availability Report
            Id propertyId = availabilityReport.Application__r.Property__c;
            String pm = availabilityReport.Application__r.Property__r.Primary_Image__c != null 
                         ? availabilityReport.Application__r.Property__r.Primary_Image__c : '';
            ContentDocumentLink cdl;

            // Fetch files linked to the property using a direct filter by LinkedEntityId
            if (propertyId != null) {
                files = [SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType, 
                         ContentDocument.LatestPublishedVersionId FROM ContentDocumentLink 
                         WHERE LinkedEntityId = :propertyId LIMIT 4];
                if (pm != '') {
                    cdl = [SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType, 
                           ContentDocument.LatestPublishedVersionId FROM ContentDocumentLink 
                           WHERE LinkedEntityId = :propertyId AND Id = :pm LIMIT 1];
                }

                size = files.size();
                flag = 'null';

                // Initialize URLs for file download if files are found
                if (!files.isEmpty()) {
                    flag = 'not null';
                    if (cdl != null) {
                        urlsMain = '/sfc/servlet.shepherd/version/download/' + cdl.ContentDocument.LatestPublishedVersionId;
                        urlsMain1 = urlsMain; // Simplified since both are the same
                    } else {
                        urlsMain = '/sfc/servlet.shepherd/version/download/' + files[0].ContentDocument.LatestPublishedVersionId;
                        urlsMain1 = urlsMain; // Simplified since both are the same
                    }
                }
            }
        } catch (Exception e) {
            // Handle exception (e.g., log it, show a message, etc.)
            System.debug('An error occurred: ' + e.getMessage() +' ----- '+e.getLineNumber());
            // Optionally, set error messages or handle accordingly
        }

        System.debug(weekUpdateList.size());
    }
    /**
* Splits the Weekly Updates into chunks of the specified size
* 
* @return List<List<Weekly_Updates__c>> - Chunked weekly updates
*/
    public List<List<Weekly_Updates__c>> getChunkedUpdates() {
        List<List<Weekly_Updates__c>> chunkedUpdates = new List<List<Weekly_Updates__c>>();
        Integer chunkSize = 5;
        
        // Ensure the list is not null or empty
        if (weekUpdateList != null && !weekUpdateList.isEmpty()) {
            for (Integer i = 0; i < weekUpdateList.size(); i += chunkSize) {
                List<Weekly_Updates__c> chunk = new List<Weekly_Updates__c>();
                // Handle the case where the last chunk may be smaller than chunkSize
                for (Integer j = i; j < Math.min(i + chunkSize, weekUpdateList.size()); j++) {
                    chunk.add(weekUpdateList[j]);
                }
                chunkedUpdates.add(chunk);
            }
        }
        
        return chunkedUpdates;
    }
    
    public List<List<Viewings_Offer__c>> getChunkedOffers() {
        List<List<Viewings_Offer__c>> chunkedOffers = new List<List<Viewings_Offer__c>>();
        Integer chunkSize = 18;
        
        // Ensure the list is not null or empty
        if (viewOfferList != null && !viewOfferList.isEmpty()) {
            for (Integer i = 0; i < viewOfferList.size(); i += chunkSize) {
                List<Viewings_Offer__c> chunk = new List<Viewings_Offer__c>();
                // Handle the case where the last chunk may be smaller than chunkSize
                for (Integer j = i; j < Math.min(i + chunkSize, viewOfferList.size()); j++) {
                    chunk.add(viewOfferList[j]);
                }
                chunkedOffers.add(chunk);
            }
        }
        
        return chunkedOffers;
    }
    
     public Integer getTotalOfferChunks() {
        return (Integer)Math.ceil((Double)viewOfferList.size() / 16);
    }
    
}