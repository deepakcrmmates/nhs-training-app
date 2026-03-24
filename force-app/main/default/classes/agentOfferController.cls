/*
public with sharing class agentOfferController {
    
    @AuraEnabled
    public static OfferWrapper getOfferData(Id offerId) {
        OfferWrapper offerDetails = new OfferWrapper();
        
        try {
           
            Offer__c currentOffer = [
                SELECT Id, Name, Offer_Acceptance_Status__c, Offer_Amount__c, Deposit_Amount_if_any__c, Buying_Position__c,
                Verification_ID__c, Decision_in_Principle__c, Proof_of_Funding__c, Any_Special_Conditions__c,
                Application__r.Name, Application__r.NHS_Sales_Advisor__c, Application__r.Scheme__c,
                Application__r.House_Builder__r.Name, Application__r.Development__c, Application__r.Plot__c,
                Application__r.Applicant__r.Name, Application__r.Applicant__r.Email, 
                Application__r.Applicant__r.MobilePhone, Application__r.Applicant__r.MailingStreet,
                Application__r.Applicant__r.MailingCity, Application__r.Applicant__r.MailingState,
                Application__r.Applicant__r.MailingPostalCode, Application__r.Applicant__r.Solicitors__r.Name,
                Application__r.Applicant__r.Solicitors__r.Email__c, Application__r.Applicant__r.Solicitors__r.Phone,
                Application__r.Applicant__r.Solicitors__r.BillingStreet, Application__r.Applicant__r.Solicitors__r.BillingCity,
                Application__r.Applicant__r.Solicitors__r.BillingState, Application__r.Applicant__r.Solicitors__r.BillingPostalCode,
                Application__r.Property__r.Expiry_Date__c, Application__r.ETA_Comp_Start__c,
                Purchasers_Solicitors_Name__r.Name, Purchasers_Solicitors_Name__r.Email__c, Purchasers_Solicitors_Name__r.Phone,
                Purchasers_Solicitors_Name__r.BillingStreet, Purchasers_Solicitors_Name__r.BillingCity,
                Purchasers_Solicitors_Name__r.BillingState, Purchasers_Solicitors_Name__r.BillingPostalCode,
                Purchasers_Full_Name__r.Name, Purchasers_Full_Name__r.Email, Purchasers_Full_Name__r.MobilePhone,
                Purchasers_Full_Name__r.MailingStreet, Purchasers_Full_Name__r.MailingCity,
                Purchasers_Full_Name__r.MailingState, Purchasers_Full_Name__r.MailingPostalCode, Purchasers_Full_Name__r.MailingCountry,
                Agent__r.Name, Agent__r.Phone, Financial_Advisors_Details__r.Name, Name_of_Lender__r.Name
                FROM Offer__c
                WHERE Id = :offerId
                LIMIT 1
            ];
            
            
            List<Offer__c> relatedOffers = [
                SELECT Id, Offer_Amount__c, Offer_Acceptance_Status__c, Buying_Position__c, Date_of_Application_Received__c,
                Application__r.Name, Application__r.NHS_Sales_Advisor__c, Application__r.Scheme__c,
                Application__r.House_Builder__r.Name, Application__r.Development__c, Application__r.Plot__c,
                Agent__r.Name, Agent__r.Phone, Financial_Advisors_Details__r.Name, Name_of_Lender__r.Name
                FROM Offer__c
                WHERE Application__c = :currentOffer.Application__c
                ORDER BY Date_of_Application_Received__c DESC
            ];
            
            // Format applicant and solicitor addresses
            offerDetails.applicantAddress = formatAddress(
                currentOffer.Application__r.Applicant__r.MailingStreet,
                currentOffer.Application__r.Applicant__r.MailingCity,
                currentOffer.Application__r.Applicant__r.MailingState,
                currentOffer.Application__r.Applicant__r.MailingPostalCode,
                currentOffer.Application__r.Applicant__r.MailingCountry
            );
            
            offerDetails.solicitorAddress = formatAddress(
                currentOffer.Purchasers_Solicitors_Name__r.BillingStreet,
                currentOffer.Purchasers_Solicitors_Name__r.BillingCity,
                currentOffer.Purchasers_Solicitors_Name__r.BillingState,
                currentOffer.Purchasers_Solicitors_Name__r.BillingPostalCode,
                currentOffer.Purchasers_Solicitors_Name__r.BillingCountry
            );
            
            offerDetails.purchaserAddress = formatAddress(
                currentOffer.Purchasers_Full_Name__r.MailingStreet,
                currentOffer.Purchasers_Full_Name__r.MailingCity,
                currentOffer.Purchasers_Full_Name__r.MailingState,
                currentOffer.Purchasers_Full_Name__r.MailingPostalCode,
                currentOffer.Purchasers_Full_Name__r.MailingCountry
            );
            
            offerDetails.vendorSolicitorAddress = formatAddress(
                currentOffer.Application__r.Applicant__r.Solicitors__r.BillingStreet,
                currentOffer.Application__r.Applicant__r.Solicitors__r.BillingCity,
                currentOffer.Application__r.Applicant__r.Solicitors__r.BillingState,
                currentOffer.Application__r.Applicant__r.Solicitors__r.BillingPostalCode,
                currentOffer.Application__r.Applicant__r.Solicitors__r.BillingCountry
            );
            
           
            offerDetails.offerAmount = currentOffer.Offer_Amount__c;
            offerDetails.offerStatus = currentOffer.Offer_Acceptance_Status__c;
            offerDetails.depositAmount = currentOffer.Deposit_Amount_if_any__c;
            offerDetails.purchaserName = currentOffer.Purchasers_Full_Name__r.Name;
            offerDetails.purchaserEmail = currentOffer.Purchasers_Full_Name__r.Email;
            offerDetails.purchaserPhone = currentOffer.Purchasers_Full_Name__r.MobilePhone;
            offerDetails.solicitorName = currentOffer.Purchasers_Solicitors_Name__r.Name;
            offerDetails.solicitorPhone = currentOffer.Purchasers_Solicitors_Name__r.Phone;
            offerDetails.solicitorEmail = currentOffer.Purchasers_Solicitors_Name__r.Email__c;
            offerDetails.expiryDate = currentOffer.Application__r.Property__r.Expiry_Date__c;
            offerDetails.eTA_Date = currentOffer.Application__r.ETA_Comp_Start__c;
            offerDetails.idSeen = currentOffer.Verification_ID__c != null ? 'Yes' : 'No';
            offerDetails.dIPSeen = currentOffer.Decision_in_Principle__c != null ? 'Yes' : 'No';
            offerDetails.pOFSeen = currentOffer.Proof_of_Funding__c != null ? 'Yes' : 'No';
            
            
            for (Offer__c offer : relatedOffers) {
                if (offer.Offer_Acceptance_Status__c == 'Accepted') {
                    offerDetails.acceptedOffer = offer;
                    break;
                }
            }
            
            return offerDetails;
            
        } catch (Exception e) {
            System.debug('Error fetching offer data: ' + e.getMessage());
            return null;
        }
    }
    
    
    private static String formatAddress(String street, String city, String state, String postalCode, String country) {
        List<String> addressParts = new List<String>();
        if (street != null) addressParts.add(street);
        if (city != null) addressParts.add(city);
        if (state != null) addressParts.add(state);
        if (postalCode != null) addressParts.add(postalCode);
        if (country != null) addressParts.add(country);
        
        return addressParts.isEmpty() ? 'N/A' : String.join(addressParts, ', ');
    }
    
    
  
    public class OfferWrapper {
        public String applicantAddress;
        public String solicitorAddress;
        public String purchaserAddress;
        public String vendorSolicitorAddress;
        public Decimal offerAmount;
        public Decimal depositAmount;
        public String offerStatus;
        public date expiryDate;
        public String eTA_Date;
        public String idSeen;
        public String dIPSeen;
        public String pOFSeen;
        public String purchaserName;
        public String purchaserEmail;
        public String purchaserPhone;
        public String solicitorName;
        public String solicitorPhone;
        public String solicitorEmail;
        public Offer__c acceptedOffer;
    }
}
*/
public with sharing class agentOfferController {
    public Id recordId { get; set; }
    public Offer__c offerDetails { get; set; }
    public List<Offer__c> relatedOffers { get; set; }
    public Offer__c acceptedOffer { get; set; }

    public agentOfferController() {
        recordId = ApexPages.currentPage().getParameters().get('id');
        if (recordId != null) {
            fetchOfferData();
        }
    }
    
    @testVisible
    private void fetchOfferData() {
        try {
            offerDetails = [
                SELECT Id, Offer_Amount__c, Deposit_Amount_if_any__c, Buying_Position__c, Offer_Acceptance_Status__c,
                    Financial_Advisors_Details__r.Name, Name_of_Lender__r.Name, Verification_ID__c, 
                    Decision_in_Principle__c, Proof_of_Funding__c, Any_Special_Conditions__c,
                    
                    Application__r.Name, Application__r.NHS_Sales_Advisor__c, Application__r.Scheme__c, 
                    Application__r.Development__c, Application__r.Plot__c, Application__r.House_Builder__r.Name,
                    Application__r.ETA_Comp_Start__c, Application__r.Property__r.Expiry_Date__c,
                    
                    Application__r.Applicant__r.Name, Application__r.Applicant__r.Email, 
                    Application__r.Applicant__r.MobilePhone, 
                    
                    Application__r.Applicant__r.MailingStreet, Application__r.Applicant__r.MailingCity, 
                    Application__r.Applicant__r.MailingState, Application__r.Applicant__r.MailingPostalCode, 
                    
                    Application__r.Applicant__r.Solicitors__r.Name, Application__r.Applicant__r.Solicitors__r.Email__c, 
                    Application__r.Applicant__r.Solicitors__r.Phone, 
                    Application__r.Applicant__r.Solicitors__r.BillingStreet, 
                    Application__r.Applicant__r.Solicitors__r.BillingCity,
                    Application__r.Applicant__r.Solicitors__r.BillingState,
                    Application__r.Applicant__r.Solicitors__r.BillingPostalCode, 
                    Application__r.Applicant__r.Solicitors__r.BillingCountry,

                    Purchasers_Full_Name__r.Name, Purchasers_Full_Name__r.Email, Purchasers_Full_Name__r.MobilePhone,
                    Purchasers_Full_Name__r.MailingStreet, Purchasers_Full_Name__r.MailingCity, 
                    Purchasers_Full_Name__r.MailingState, Purchasers_Full_Name__r.MailingPostalCode, 
                    Purchasers_Full_Name__r.MailingCountry,

                    Purchasers_Solicitors_Name__r.Name, Purchasers_Solicitors_Name__r.Phone, 
                    Purchasers_Solicitors_Name__r.Email__c, 
                    Purchasers_Solicitors_Name__r.BillingStreet, Purchasers_Solicitors_Name__r.BillingCity,
                    Purchasers_Solicitors_Name__r.BillingState, Purchasers_Solicitors_Name__r.BillingPostalCode
                FROM Offer__c 
                WHERE Id = :recordId
                LIMIT 1
            ];

            relatedOffers = [
                SELECT Id, Offer_Acceptance_Status__c, Offer_Amount__c, Date_of_Application_Received__c,
                    Agent__r.Name, Agent__r.Phone
                FROM Offer__c
                WHERE Application__r.Id = :offerDetails.Application__r.Id
            ];

            acceptedOffer = null;
            for (Offer__c offer : relatedOffers) {
                if (offer.Offer_Acceptance_Status__c == 'Accepted') {
                    acceptedOffer = offer;
                    break;
                }
            }
        } catch (Exception e) {
            System.debug('Error fetching offer data: ' + e.getMessage());
        }
    }

    // Helper method to format addresses
    @testVisible
    private static String formatAddress(String street, String city, String state, String postalCode, String country) {
        List<String> addressParts = new List<String>();
        if (street != null) addressParts.add(street);
        if (city != null) addressParts.add(city);
        if (state != null) addressParts.add(state);
        if (postalCode != null) addressParts.add(postalCode);
        if (country != null) addressParts.add(country);
        
        return addressParts.isEmpty() ? 'N/A' : String.join(addressParts, ', ');
    }

    // Getter methods for formatted fields
    public String getApplicantAddress() {
        return formatAddress(offerDetails.Application__r.Applicant__r.MailingStreet,
                             offerDetails.Application__r.Applicant__r.MailingCity,
                             offerDetails.Application__r.Applicant__r.MailingState,
                             offerDetails.Application__r.Applicant__r.MailingPostalCode, null);
    }

    public String getSolicitorAddress() {
        return formatAddress(offerDetails.Purchasers_Solicitors_Name__r.BillingStreet,
                             offerDetails.Purchasers_Solicitors_Name__r.BillingCity,
                             offerDetails.Purchasers_Solicitors_Name__r.BillingState,
                             offerDetails.Purchasers_Solicitors_Name__r.BillingPostalCode, null);
    }

    public String getPurchaserAddress() {
        return formatAddress(offerDetails.Purchasers_Full_Name__r.MailingStreet,
                             offerDetails.Purchasers_Full_Name__r.MailingCity,
                             offerDetails.Purchasers_Full_Name__r.MailingState,
                             offerDetails.Purchasers_Full_Name__r.MailingPostalCode,
                             offerDetails.Purchasers_Full_Name__r.MailingCountry);
    }

    public String getVendorSolicitorAddress() {
        return formatAddress(offerDetails.Application__r.Applicant__r.Solicitors__r.BillingStreet,
                             offerDetails.Application__r.Applicant__r.Solicitors__r.BillingCity,
                             offerDetails.Application__r.Applicant__r.Solicitors__r.BillingState,
                             offerDetails.Application__r.Applicant__r.Solicitors__r.BillingPostalCode,
                             offerDetails.Application__r.Applicant__r.Solicitors__r.BillingCountry);
    }
}