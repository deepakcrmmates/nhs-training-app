public without sharing class valuatonFormPdfController {
    public Valuation_Assessment__c valAss{get;set;}
    public string imageUrl{get;set;}
    public boolean agent1{get;set;} 
    public boolean agent2{get;set;} 
    public boolean agent3{get;set;} 
    public ContentDocument latestImage { get; set; }
    public String imageUrls { get; set; }
    public string valId{get;set;} 
    public string scheme{get;set;}
     public string agentAddress{get;set;}
    
    public String soldPropertyAddress1{ get; set; }
    public String soldPropertyAddress2{ get; set; }
    public String marketPropertyAddress1{ get; set; }
    public String marketPropertyAddress2{ get; set; }
    public String agentLogo{ get; set; }
    
    public  String  headerdata{get;set;}
    public  String  aprn{get;set;}
    
    public  String  formattedDate{get;set;}
    public string urlvalue{get;set;}
    public string url{get;set;}
    public dateTime requestedDate{get;set;}
    
    public valuatonFormPdfController(ApexPages.StandardController stdSetController){
        string ids = ApexPages.currentPage().getParameters().get('id');
        
        
        headerdata= ApexPages.currentPage().getHeaders().get('Host');
        
        urlvalue=Apexpages.currentPage().getUrl();
        
        url='https://' + headerdata+ urlvalue;
        system.debug('headerdata--'+headerdata);
        system.debug('urlvalue--'+urlvalue);
        system.debug('url--'+url);
        
        DateTime dt = DateTime.now();  
        formattedDate = dt.format();  
        System.debug(formattedDate);  
        
        try{
            
            
            valAss = [select Id, Agent__r.Logo_url__c, Application__r.Scheme__c,Application__r.Agent_2__c,Application__r.Agent_1__c,Application__r.Agent_3__c, Application__r.Application_Reference_Number__c, Name,Application__c,Agent__c,Agent__r.Name,Property__c,Customer_Name__c,Customer_Phone__c,Customer_Email__c,
                      Agent__r.BillingCity, Agent__r.BillingStreet, Agent__r.BillingState, Agent__r.BillingPostalCode, Agent__r.BillingCountry,
                      Application__r.Agent_1_Valuation_Requested_Date_Time__c,Application__r.Agent_2_Valuation_Requested_Date_Time__c,Application__r.Agent_3_Valuation_Requested_Date_Time__c, 
                      Date_and_Time_of_Appraisal__c,Customer_Name__r.Phone,Customer_Name__r.Name,Property__r.Name,Agent_Telephone__c,Agent_Email__c,Freehold__c,Leasehold__c,Years_Left__c,Ground_Rent__c,
                      Age_of_Property__c,Number_of_Bedrooms__c,Reception_Living__c,List_of_Any_other_Additional_Rooms__c,Garage__c,Garden__c,
                      Central_Heating__c,Double_Glazing__c,Interior__c,Kitchen__c,Bathroom_En_Suites__c,Gardens__c,Exterior__c,Appliances__c,
                      Outbuildings__c,Any_other_comments_on_the_property__c,Any_essential_repairs_prior_to_marteting__c,Positive_Aspects_of_the_Property__c,
                      Negative_Aspects_of_the_Property__c,Notes_to_Valuers__c,Please_outline_the_current_local_market__c,Description__c,Contact_Name__c,
                      Sold_Date__c,Asking_Price__c,Time_on_Market__c,Sold_Price__c,Description_On_Market__c,Agent_On_Market__c,Asking_Price_On_Market__c,
                      Time_on_Market_s__c,What_other_tools_for_accurate_valuation__c,Should_this_property_be_considered_for_p__c,Market_Price__c,
                      X6_Week_Sale__c,Forced_Sale__c,Resale__c,Description_ext__c,Description_On_Market_ext__c,Sold_Date_ext__c,Asking_Price_ext__c,
                      Asking_Price_On_Market_ext__c,Time_on_Market_ext__c,Time_on_Market_s_ext__c,Sold_Price_ext__c,Sold_Property_1__Street__s,
                      Sold_Property_1__City__s,Sold_Property_1__PostalCode__s,Sold_Property_1__StateCode__s,Sold_Property_1__CountryCode__s,
                      Sold_Property_1__Latitude__s,Sold_Property_1__Longitude__s,Sold_Property_1__GeocodeAccuracy__s,Sold_Property_1__c,
                      Sold_Property_2__Street__s,Sold_Property_2__City__s,Sold_Property_2__PostalCode__s,Sold_Property_2__StateCode__s,
                      Sold_Property_2__CountryCode__s,Sold_Property_2__Latitude__s,Sold_Property_2__Longitude__s,Sold_Property_2__GeocodeAccuracy__s,
                      Sold_Property_2__c,On_Market_Property_1__Street__s,On_Market_Property_1__City__s,On_Market_Property_1__PostalCode__s,
                      On_Market_Property_1__StateCode__s,On_Market_Property_1__CountryCode__s,On_Market_Property_1__Latitude__s,On_Market_Property_1__Longitude__s,On_Market_Property_1__GeocodeAccuracy__s,
                      On_Market_Property_1__c,On_Market_Property_2__Street__s,On_Market_Property_2__City__s,On_Market_Property_2__PostalCode__s,
                      On_Market_Property_2__StateCode__s,On_Market_Property_2__CountryCode__s,On_Market_Property_2__Latitude__s,
                      On_Market_Property_2__Longitude__s,On_Market_Property_2__GeocodeAccuracy__s,On_Market_Property_2__c,
                      Sold_Property_Agent_1__c,Sold_Property_Agent_2__c,On_Market_Property_Agent_1__c,Bed_Room_Photo__c,Bath_Room_Photo__c,Living_Room_Photo__c,Garden_Photo__c,Parking_Photo__c,Other_Photo__c,
                      On_Market_Property_Agent_2__c,Type_of_Construction__c,Property_Type__c,Kitchen_Photo__c from Valuation_Assessment__c where id =:ids];
            agent1 = false;
            agent2 = false;
            agent3 = false;
            agentLogo = '';
            scheme = '';
           

 agentAddress = '';
if (valAss.Agent__r != null) {
    agentAddress = 
        (String.isNotBlank(valAss.Agent__r.BillingStreet) ? valAss.Agent__r.BillingStreet + ', ' : '') +
        (String.isNotBlank(valAss.Agent__r.BillingCity) ? valAss.Agent__r.BillingCity + ', ' : '') +
        (String.isNotBlank(valAss.Agent__r.BillingState) ? valAss.Agent__r.BillingState + ', ' : '') +
        (String.isNotBlank(valAss.Agent__r.BillingPostalCode) ? valAss.Agent__r.BillingPostalCode + ', ' : '') +
        (String.isNotBlank(valAss.Agent__r.BillingCountry) ? valAss.Agent__r.BillingCountry : '');

    // Remove trailing comma and space if any
    if (agentAddress.endsWith(', ')) {
        agentAddress = agentAddress.substring(0, agentAddress.length() - 2);
    }
}

            scheme = 'MARKETING APPRAISAL '+' - '+valAss.Application__r.Scheme__c;
            if(valAss.Agent__c == valAss.Application__r.Agent_2__c){
                agent2 = true;
            }
            if(valAss.Agent__c == valAss.Application__r.Agent_1__c){
                agent1 = true;
            }
            if(valAss.Agent__c == valAss.Application__r.Agent_3__c){
                agent3 = true;
            }
            if (String.isNotBlank(valAss.Agent__r.Logo_url__c)) {
                agentLogo = valAss.Agent__r.Logo_url__c;
            }
            
            List<ContentDocumentLink> links = [
                SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :valAss.Agent__c
                LIMIT 1
            ];
            if (!links.isEmpty()) {
                // Get the latest image's content document
                latestImage = links[0].ContentDocument;
                // Set the image URL
                if (latestImage.LatestPublishedVersionId != null) {
                    imageUrls = '/sfc/servlet.shepherd/version/download/' + latestImage.LatestPublishedVersionId;
                }
                system.debug(imageUrls);
            }
            
            system.debug(JSON.serialize(valAss));
            soldPropertyAddress1 ='';
            soldPropertyAddress2 = '';
            marketPropertyAddress1 = '';
            marketPropertyAddress2 ='';
            soldPropertyAddress1 = valAss.Sold_Property_1__Street__s +'  '+ valAss.Sold_Property_1__City__s;
            soldPropertyAddress2 = valAss.Sold_Property_2__Street__s +'  '+ valAss.Sold_Property_2__City__s;
            marketPropertyAddress1 = valAss.On_Market_Property_1__Street__s +' '+ valAss.On_Market_Property_1__City__s;
            marketPropertyAddress2 = valAss.On_Market_Property_2__Street__s +' '+ valAss.On_Market_Property_2__City__s;
            
            if(valAss.Application__r.Agent_1_Valuation_Requested_Date_Time__c != null){
                requestedDate = valAss.Application__r.Agent_1_Valuation_Requested_Date_Time__c;
            }
            if(valAss.Application__r.Agent_2_Valuation_Requested_Date_Time__c != null){
                requestedDate = valAss.Application__r.Agent_2_Valuation_Requested_Date_Time__c;
            }
            if(valAss.Application__r.Agent_3_Valuation_Requested_Date_Time__c != null){
                requestedDate = valAss.Application__r.Agent_3_Valuation_Requested_Date_Time__c;
            }
            aprn = valAss.Application__r.Application_Reference_Number__c;
        }catch(Exception e){
            system.debug('Error ' + e.getMessage() + ' at line no :' + e.getLineNumber()+''+e);
        }
    }
    
    @AuraEnabled
    public static String getPdfUrl(Id recordId) {
        String baseUrl = URL.getOrgDomainUrl().toExternalForm();  // Use getOrgDomainUrl() 
        //String pdfUrl = baseUrl + '/apex/ValuatonFormPDF?Id=' +  recordId;
        String pdfUrl = 'valueForm/apex/ValuatonFormPDF?Id=' + recordId;// recordId;
        //String pdfUrl ='https://nhsolutions--training.sandbox.my.salesforce-sites.com/apex/ValuatonFormPDF?id='+'a0bKG000000TdWwYAK';
        
        return pdfUrl;
    }
    
    // Generates a PDF Blob from the Visualforce Page
    @AuraEnabled
    public static void generatePdfBlob(Id recordId) {
        Valuation_Assessment__c op = [select id, name, agent__c from Valuation_Assessment__c where id =: recordId];
        PageReference pdfPage = Page.ValuatonFormPDF;
        pdfPage.getParameters().put('Id', recordId);
        Blob pdfBlob =  pdfPage.getContent();
        BoxFileService.uploadFileToDropbox(op.agent__c, null, 'Valuation', recordId, pdfBlob);
        //  return pdfPage.getContent();
    }
    
    // @AuraEnabled
    //     public static String getPdfUrl(Id recordId) {
    //         // VF Page URL for PDF
    //         String pdfUrl = '/apex/ValuatonFormPDF?Id=' + 'a0bKG000000TdWwYAK';
    
    //         // Generate PDF Blob
    //         PageReference pdfPage = new PageReference(pdfUrl);
    //         Blob pdfBlob = pdfPage.getContent();
    
    //         // Create Public File
    //         ContentVersion cv = new ContentVersion();
    //         cv.Title = 'GeneratedPDF';
    //         cv.PathOnClient = 'GeneratedPDF.pdf';
    //         cv.VersionData = pdfBlob;
    
    //         insert cv;
    
    //         // Get the Public Link
    //         ContentDistribution cd = new ContentDistribution();
    //         cd.ContentVersionId = cv.Id;
    //         cd.Name = 'Public PDF Link';
    //         cd.PreferencesAllowViewInBrowser = true;
    //         cd.PreferencesAllowOriginalDownload = true;
    //         insert cd;
    
    //         return cd.DistributionPublicUrl; // Return public URL
    //     }
}