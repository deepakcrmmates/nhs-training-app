public without sharing class HouseBuilderPdfController {
    public String name { get; set; }
      public String urls { get; set; }
    public String houseBuilder { get; set; }
    public String region { get; set; }
    public String salesAdvisor { get; set; }
    public Date enquiryDate { get; set; }
    public String plot { get; set; }
    public String development { get; set; }
    public Decimal purchasePrice { get; set; }
    public string anticipatedCompletion { get; set; }
    public String applicantName { get; set; }
    public String applicantAddress { get; set; }
    public String applicantEmail { get; set; }
    public String applicantPhone { get; set; }
    public String agentName { get; set; }
    public String houseBuilderLogo { get; set; }
    public Decimal askingPrice { get; set; }
    public Opportunity application { get; set; }
    public Integer numberOfViewings { get; set; }
    public String propertyType { get; set; }
    public String qualifiedByHouseBuilder{get; set;}
    public Decimal numberOfBedrooms { get; set; }
    public Decimal clientEstimatedValuation {get; set;}
    public Decimal  outstandinMortgage {get; set;}
    public Boolean frontGarden { get; set; }
    public Boolean backGarden { get; set; }
    public Boolean noGarden { get; set; }
    public Boolean parking { get; set; }
    public Boolean detached {get;set;}
    public Boolean semiDetached {get; set;}
    public Boolean endTerrace {get; set;}
    public Boolean midTerrace {get; set;}
    public Boolean apartment {get; set;}
    public Boolean maisonette {get; set;}
    public Boolean studio {get; set;}
    public Boolean bungalow {get; set;}
    public Boolean garage { get; set; }
    public Boolean extension { get; set; }
    public Boolean conservatory { get; set; }
    public String ageOfProperty { get; set; }
    public Boolean freehold { get; set; }
    public Boolean leaseHold { get; set; }
    public Boolean monAm {get; set;}
    public Boolean monPm {get; set;}
    public Boolean tueAm {get; set;}
    public Boolean tuePm {get; set;}
    public Boolean wedAm {get; set;}
    public Boolean wedPm {get; set;}
    public Boolean thuAm {get; set;}
    public Boolean thuPm {get; set;}
    public Boolean friAm {get; set;}
    public Boolean friPm {get; set;}
    public Boolean satAm {get; set;}
    public Boolean satPm {get; set;}
    public Boolean sunAm {get; set;}
    public Boolean sunPm {get; set;}
    public String yearsLeftOnLease { get; set; }
    public Decimal serviceCharge { get; set; }
    public Decimal groundRent { get; set; }
    public Boolean principleResidence { get; set; }
    public Boolean secondHomeHolidayLet { get; set; }
    public String typeOfHeating { get; set; }
    public Decimal anyPreviousOffer {get; set;}
    public Boolean hasExtensions { get; set; }
    public Boolean hasPlanningPermission { get; set; }
    public String timeOnMarket { get; set; }
    public boolean Has_your_house_been_valued_by_an_agent {get;set;}
    public Decimal previousAskingPrice { get; set; }
    public ContentDocument latestImage { get; set; }
    
    public HouseBuilderPdfController(ApexPages.StandardController controller) {
        Id oppId = controller.getRecord().Id;
        List<Opportunity> oppList = [SELECT Id, Name,ETA_Comp_End__c,Is_your_house_on_the_market_NEW__c, Has_your_house_been_valued_by_an_agent__c, Time_on_the_market__c, Agent_1_Initial_Asking_Price__c,
                                     House_Builder__c, House_Builder__r.House_Builder_Logo__c,House_Builder__r.Logo_URL__c, House_Builder__r.Region__c,
                                     House_Builder__r.Name, Region__c, Sales_Advisor__c, 
                                     Date_of_Enquiry__c, Plot__c, Development__c, Purchase_Price__c, Mon_AM__c,Mon_PM__c,
                                     Tue_AM__c,Tue_PM__c, Wed_AM__c, Wed_PM__c, Thu_AM__c,Thu_PM__c,Fri_AM__c,Fri_PM__c, Sat_AM__c, Sat_PM__c, Sun_AM__c, Sun_PM__c, Client_Estimated_Valuation__c,
                                     Any_previous_offers__c,
                                     Outstanding_Mortgage__c, Qualified_By_House_Builders_FA__c, Anticipated_Completion_Date__c, Applicant__r.Name, 
                                     Applicant__r.MailingStreet, Applicant__r.MailingCity, Applicant__r.MobilePhone,
                                     Applicant__r.MailingState, Applicant__r.MailingPostalCode, 
                                     Applicant__r.MailingCountry, Applicant__r.Email, Applicant__r.Phone, 
                                     Agent_2__r.Name, Current_Asking_Price__c, Number_of_Viewings__c,
                                     Property__r.Number_Of_Bedrooms__c, Property__r.Front_Garden__c, Property__r.Detached__c, 
                                     Property__r.Semi_Detached__c, Property__r.End_Terrace__c, Property__r.Mid_Terrace__c,
                                     Property__r.Apartment__c,Property__r.Maisonette__c, Property__r.Maisonette_Studio__c,
                                     Property__r.Bungalow__c,
                                     Property__r.Back_Garden__c, Property__r.No_Garden__c, 
                                     Property__r.Parking__c, Property__r.Garage__c, Property__r.Extension__c, 
                                     Property__r.Conservatory__c, Property__r.Age_of_Property__c, 
                                     Property__r.Freehold__c, Property__r.Lease_Hold__c, 
                                     Property__r.Years_left_of_Lease__c, Property__r.Service_Charge__c, 
                                     Property__r.Ground_Rent__c, Property__r.Principle_Residence__c, 
                                     Property__r.Second_Home_Holiday_Let__c, Property__r.Type_of_Heating__c, 
                                     Property__r.AnyExtensions_LoftConverstion_SolarPanel__c, 
                                     Property__r.Building_Regs_Planning_Permission__c
                                     FROM Opportunity WHERE Id = :oppId LIMIT 1];
        
        
        //if the query returned the result 
        if(!oppList.isEmpty()){
            Opportunity opp = oppList[0];
            application = oppList[0];
            
            name = opp.Name;
            Has_your_house_been_valued_by_an_agent = opp.Is_your_house_on_the_market_NEW__c == 'Yes' ? true : false;
            houseBuilderLogo = opp.House_Builder__r != null ? opp.House_Builder__r.Logo_URL__c : ''; 
            //getDirectDropboxUrl ();
           
            system.debug('LOGO URL  Line 107 -:'+ houseBuilderLogo );
            houseBuilder = opp.House_Builder__r != null ? opp.House_Builder__r.Name : '';
            region = opp.House_Builder__r.Region__c != null ? opp.House_Builder__r.Region__c :'';
            salesAdvisor = opp.Sales_Advisor__c;
            enquiryDate = opp.Date_of_Enquiry__c;
            plot = opp.Plot__c;
            monAm = opp.Mon_AM__c;
            monPm = opp.Mon_PM__c;
            tueAm = opp.Tue_AM__c;
            tuePm = opp.Tue_PM__c;
            wedAm = opp.Wed_AM__c;
            wedPm = opp.Wed_PM__c;
            thuAm = opp.Thu_AM__c;
            thuPm = opp.Thu_PM__c;
            friAm = opp.Fri_AM__c;
            friPm = opp.Fri_PM__c;
            satAm = opp.Sat_AM__c;
            satPm = opp.Sat_PM__c;
            sunAm = opp.Sun_AM__c;
            sunPm = opp.Sun_PM__c;
            anyPreviousOffer = opp.Any_previous_offers__c;
            clientEstimatedValuation = opp.Client_Estimated_Valuation__c;
            outstandinMortgage = opp.Outstanding_Mortgage__c;
            qualifiedByHouseBuilder = opp.Qualified_By_House_Builders_FA__c;
            development = opp.Development__c;
            purchasePrice = opp.Purchase_Price__c;
            anticipatedCompletion = formatTextDate (opp.ETA_Comp_End__c);
            applicantName = opp.Applicant__r != null ? opp.Applicant__r.Name : '';
            applicantAddress = opp.Applicant__r != null ? 
                (opp.Applicant__r.MailingStreet + ', ' + opp.Applicant__r.MailingCity + ', ' + 
                 opp.Applicant__r.MailingState + ', ' + opp.Applicant__r.MailingPostalCode + ', ' + 
                 opp.Applicant__r.MailingCountry) : '';
            applicantEmail = opp.Applicant__r != null ? opp.Applicant__r.Email : '';
            applicantPhone = opp.Applicant__r != null ? opp.Applicant__r.Phone : '';
            agentName = opp.Agent_2__r != null ? opp.Agent_2__r.Name : '';
            askingPrice = opp.Current_Asking_Price__c;
            numberOfViewings = opp.Number_of_Viewings__c != null ? opp.Number_of_Viewings__c.intValue() : 0;
            previousAskingPrice = opp.Agent_1_Initial_Asking_Price__c != null ?  opp.Agent_1_Initial_Asking_Price__c : 0;
            timeOnMarket = opp.Time_on_the_market__c != null ? opp.Time_on_the_market__c:'';
            
            if (opp.Property__r != null) {
                propertyType = opp.Property__r.Number_Of_Bedrooms__c != null ? String.valueOf(opp.Property__r.Number_Of_Bedrooms__c) : 'N/A';
                numberOfBedrooms = opp.Property__r.Number_Of_Bedrooms__c;
                frontGarden = opp.Property__r.Front_Garden__c;
                backGarden = opp.Property__r.Back_Garden__c;
                noGarden = opp.Property__r.No_Garden__c;
                parking = opp.Property__r.Parking__c;
                garage = opp.Property__r.Garage__c;
                extension = opp.Property__r.Extension__c;
                endTerrace = opp.Property__r.End_Terrace__c;
                midTerrace = opp.Property__r.Mid_Terrace__c;
                apartment = opp.Property__r.Apartment__c;
                maisonette = opp.Property__r.Maisonette__c;
                studio = opp.Property__r.Maisonette_Studio__c;
                bungalow = opp.Property__r.Bungalow__c;
                conservatory = opp.Property__r.Conservatory__c;
                ageOfProperty = String.valueOf(opp.Property__r.Age_of_Property__c);
                freehold = opp.Property__r.Freehold__c;
                leaseHold = opp.Property__r.Lease_Hold__c;
                detached = opp.Property__r.Detached__c;
                semiDetached = opp.Property__r.Semi_Detached__c;
                yearsLeftOnLease = String.valueOf(opp.Property__r.Years_left_of_Lease__c);
                serviceCharge = opp.Property__r.Service_Charge__c;
                groundRent = opp.Property__r.Ground_Rent__c;
                principleResidence = opp.Property__r.Principle_Residence__c;
                secondHomeHolidayLet = opp.Property__r.Second_Home_Holiday_Let__c;
                typeOfHeating = opp.Property__r.Type_of_Heating__c;
                hasExtensions = opp.Property__r.AnyExtensions_LoftConverstion_SolarPanel__c;
                hasPlanningPermission = opp.Property__r.Building_Regs_Planning_Permission__c;
            }
            List<ContentDocumentLink> links = [
                SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId, ContentDocument.CreatedDate
                FROM ContentDocumentLink
                WHERE  LinkedEntityId = :opp.House_Builder__c
                LIMIT 1
                
            ];
            if (!links.isEmpty()) {
                // Get the latest image's content document
                latestImage = links[0].ContentDocument;
                string url = '/sfc/servlet.shepherd/version/download/'+latestImage.LatestPublishedVersionId;
                urls = url;
                system.debug('URL - '+ urls);
                
            }
        } else{
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Opportunity not found'));
        }
    }
    
    /**
* @AuraEnabled method to return the PDF URL for LWC
*/
    @AuraEnabled
    public static String getPdfUrl(Id recordId) {
        if (recordId == null) {
            throw new AuraHandledException('Record ID is required.');
        }
        // Construct the PDF URL
        String pdfUrl = '/apex/houseBuilderApplicationPDF?Id=' + recordId;// recordId;
        return pdfUrl;
    }
    
    // Generates a PDF Blob from the Visualforce Page
    @AuraEnabled
    public static void generatePdfBlob(Id recordId) {
        Opportunity op = [select id, name, House_Builder__c from Opportunity where id =: recordId];
        PageReference pdfPage = Page.houseBuilderApplicationPDF;
        pdfPage.getParameters().put('Id', recordId);
        Blob pdfBlob =  pdfPage.getContent();
        BoxFileService.uploadFileToBox(op.House_Builder__c, null, 'Application', recordId, pdfBlob);
    }

    // Create NHS Box folder structure (async via Queueable)
    @AuraEnabled
    public static void setupFoldersAndGeneratePdf(Id recordId) {
        System.enqueueJob(new NhsFolderSetupJob(recordId));
    }

    // Generate PDF and upload to the NHS Application subfolder in Box
    // Must be called from LWC context (requires user session for getContent)
    @AuraEnabled
    public static void generatePdfToNhsFolder(Id recordId) {
        Opportunity opp = [SELECT Id, Name, Box_Folder_Id__c, House_Builder__r.Name
                           FROM Opportunity WHERE Id = :recordId LIMIT 1];

        // Generate PDF
        PageReference pdfPage = Page.houseBuilderApplicationPDF;
        pdfPage.getParameters().put('Id', recordId);
        Blob pdfBlob = pdfPage.getContent();
        String base64File = EncodingUtil.base64Encode(pdfBlob);

        // Upload to NHS Application subfolder via @future
        if (String.isNotBlank(opp.Box_Folder_Id__c)) {
            String hbName = opp.House_Builder__r != null ? opp.House_Builder__r.Name : '';
            BoxFileService.uploadPdfToNhsFolderAsync(
                opp.Box_Folder_Id__c, opp.Name, hbName, base64File
            );
        }
    }
    
  
    public String formatTextDate(String textDate) {
        if (String.isEmpty(textDate) || !textDate.contains('-')) {
            return 'Invalid Date';
        }
        
        // Extract Year and Month
        List<String> parts = textDate.split('-');
        String year = parts[0];
        String monthNumber = parts[1];
        
        // Convert month number to month name
        Map<String, String> monthMap = new Map<String, String>{
            '01' => 'Jan', '02' => 'Feb', '03' => 'Mar', '04' => 'Apr',
            '05' => 'May', '06' => 'Jun', '07' => 'Jul', '08' => 'Aug',
            '09' => 'Sep', '10' => 'Oct', '11' => 'Nov', '12' => 'Dec'
        };
        
        String monthName = monthMap.get(monthNumber);
        return monthName + ' ' + year;
    }
}