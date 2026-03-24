/**
			* @File Name : customOfferLayout.cls
			* @Description :
			* @Author :
			* @Last Modified By :
			* @Last Modified On : January 29, 2025
			* @Modification Log :
			*==============================================================================
			* Ver | Date | Author | Modification
			*==============================================================================
			* 1.0 | January 29, 2025 |   | Initial Version
			**/

			public class customOfferLayout {

			@AuraEnabled(cacheable=true)
			public static OfferWrapper getOfferData(string offerId) {
			system.debug('id------' +  offerId);
			// Fetch the current Offer
			Offer__c currentOffer = [
			SELECT Id, Name, Application__c, Decision_in_Principle__c, Verification_ID__c, Proof_of_Funding__c, Application__r.NHS_Sales_Advisor__c, Application__r.Name, Application__r.Application_Name__c,  Offer_Amount__c, Date_of_Application_Received__c, 
			Application__r.Applicant__r.Solicitors__r.Name, Application__r.Applicant__r.Solicitors__r.Phone, 
			Application__r.Applicant__r.Solicitors__r.Email__c, Application__r.Applicant__r.Solicitors__r.BillingStreet, 
			Application__r.Applicant__r.Solicitors__r.BillingCity, Application__r.Applicant__r.Solicitors__r.BillingState,
			Application__r.Applicant__r.Solicitors__r.BillingPostalCode, Application__r.Applicant__r.Solicitors__r.BillingCountry,  
			Offer_Acceptance_Status__c, Agent__c, Agent__r.Name, Agent__r.Phone, Financial_Advisors_Details__r.Name, Name_of_Lender__r.Name, 
			Deposit_Amount_if_any__c, Buying_Position__c, Application__r.House_Builder__r.Name, Application__r.Scheme__c, Application__r.Development__c,
			Application__r.Plot__c, Application__r.Property__r.Expiry_Date__c, Application__r.ETA_Comp_Start__c, Application__r.Applicant__r.Name, 
			Application__r.Applicant__r.MailingCity, Application__r.Applicant__r.MailingStreet, Application__r.Applicant__r.MailingState,
			Application__r.Applicant__r.MailingPostalCode, Application__r.Applicant__r.MobilePhone, Application__r.Applicant__r.Email, 
			Purchasers_Solicitors_Name__r.Name, Purchasers_Solicitors_Name__r.BillingCity, Purchasers_Solicitors_Name__r.BillingStreet, 
			Purchasers_Solicitors_Name__r.BillingState, Purchasers_Solicitors_Name__r.BillingPostalCode, Purchasers_Solicitors_Name__r.Phone,
			Purchasers_Solicitors_Name__r.Email__c, Any_Special_Conditions__c ,
			Purchasers_Full_Name__r.Name, Purchasers_Full_Name__r.MobilePhone, Purchasers_Full_Name__r.Email, Purchasers_Full_Name__r.MailingCity, 
			Purchasers_Full_Name__r.MailingStreet, Purchasers_Full_Name__r.MailingState, Purchasers_Full_Name__r.MailingCountry, 
			Purchasers_Full_Name__r.MailingPostalCode
			FROM Offer__c WHERE Id = :offerId LIMIT 1

			];

			if (currentOffer == null) {
			return null; // Return null if no Offer is found
			}

			// Get all unique Agent IDs for the same Application
			Set<Id> agentIds = new Set<Id>();
			List<Offer__c> allOffersForApplication = [
			SELECT Agent__c FROM Offer__c 
			WHERE Application__c = :currentOffer.Application__c
			];
			for (Offer__c offer : allOffersForApplication) {
			if (offer.Agent__c != null) {
			agentIds.add(offer.Agent__c);
			}
			}

			// Fetch related active offers that have the same Agent and belong to the same Application
			List<Offer__c> relatedOffers = new List<Offer__c>();
			if (!agentIds.isEmpty()) {
			relatedOffers = [
			SELECT Id, Name, Decision_in_Principle__c, Verification_ID__c, Proof_of_Funding__c, Application__c, Application__r.Name, Application__r.NHS_Sales_Advisor__c, Application__r.Application_Name__c, Offer_Amount__c, Date_of_Application_Received__c, 
			Offer_Acceptance_Status__c, Agent__c, Agent__r.Name, Agent__r.Phone, Financial_Advisors_Details__r.Name, Name_of_Lender__r.Name, 
			Deposit_Amount_if_any__c, Buying_Position__c, Application__r.House_Builder__r.Name, Application__r.Scheme__c, Application__r.Development__c,
			Application__r.Plot__c, Application__r.Property__r.Expiry_Date__c, Application__r.ETA_Comp_Start__c, Application__r.Applicant__r.Name, 
			Application__r.Applicant__r.MailingCity, Application__r.Applicant__r.MailingStreet, Application__r.Applicant__r.MailingState,
			Application__r.Applicant__r.MailingPostalCode, Application__r.Applicant__r.MobilePhone, Application__r.Applicant__r.Email, 
			Purchasers_Solicitors_Name__r.Name, Purchasers_Solicitors_Name__r.BillingCity, Purchasers_Solicitors_Name__r.BillingStreet, 
			Purchasers_Solicitors_Name__r.BillingState, Purchasers_Solicitors_Name__r.BillingPostalCode, Purchasers_Solicitors_Name__r.Phone,
			Purchasers_Solicitors_Name__r.Email__c, Any_Special_Conditions__c 
			FROM Offer__c 
			WHERE Application__c = :currentOffer.Application__c
			AND Agent__c IN :agentIds
			AND Offer_Active__c = 'Yes'
			];
			}

			return new OfferWrapper(currentOffer, relatedOffers);
			}

			public class OfferWrapper {
			@AuraEnabled public Offer__c currentOffer;
			@AuraEnabled public List<Offer__c> relatedOffers;

			public OfferWrapper(Offer__c currentOffer, List<Offer__c> relatedOffers) {
			this.currentOffer = currentOffer;
			this.relatedOffers = relatedOffers;
			}
			}
			}