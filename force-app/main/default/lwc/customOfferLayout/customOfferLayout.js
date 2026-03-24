import { LightningElement, api, wire, track } from 'lwc';
import getOfferData from '@salesforce/apex/customOfferLayout.getOfferData';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import html2canvas from '@salesforce/resourceUrl/html2canvas';
import { loadScript } from 'lightning/platformResourceLoader';
//import generatePDF from '@salesforce/apex/PdfGeneratorController.generatePDF';
export default class CustomOfferLayout extends LightningElement {
    @api recordId;
    @track acceptedOffer = {};
    @track offerDetails = {};
    @track relatedOffers = [];
    @track isLoading = true;

    agent1Offers = {};
    agent2Offers = {};
    agent3Offers = {};

    jsPDFInitialized = false;

    connectedCallback() {
        Promise.all([
            loadScript(this, jsPDF),
            loadScript(this, html2canvas)
        ]).then(() => {
            this.jsPDFInitialized = true;
        }).catch(error => {
            console.error('Error loading PDF libraries:', error);
        });
    }
    
    checkNull(value, defaultValue = 'N/A') {
        return value ?? defaultValue;
    }

    // Fetch offer data from Apex
    @wire(getOfferData, { offerId: '$recordId' })
    wiredOffer({ error, data }) {
        if (data) {
            console.log('DATA : ', data);
            if (data) {
                console.log('DATA : ', data);
                // ✅ Format Applicant Address into a single string
                const applicantAddress = [
                    data.currentOffer?.Application__r?.Applicant__r?.MailingStreet,
                    data.currentOffer?.Application__r?.Applicant__r?.MailingCity,
                    data.currentOffer?.Application__r?.Applicant__r?.MailingState,
                    data.currentOffer?.Application__r?.Applicant__r?.MailingPostalCode
                ].filter(Boolean).join(', ') ?? 'N/A';

                // ✅ Format Solicitor Address into a single string
                const solicitorAddress = [
                    data.currentOffer?.Purchasers_Solicitors_Name__r?.BillingStreet,
                    data.currentOffer?.Purchasers_Solicitors_Name__r?.BillingCity,
                    data.currentOffer?.Purchasers_Solicitors_Name__r?.BillingState,
                    data.currentOffer?.Purchasers_Solicitors_Name__r?.BillingPostalCode
                ].filter(Boolean).join(', ') ?? 'N/A';

                const purchaserAddress = [
                    data.currentOffer?.Purchasers_Full_Name__r?.MailingStreet,
                    data.currentOffer?.Purchasers_Full_Name__r?.MailingCity,
                    data.currentOffer?.Purchasers_Full_Name__r?.MailingState,
                    data.currentOffer?.Purchasers_Full_Name__r?.MailingPostalCode,
                    data.currentOffer?.Purchasers_Full_Name__r?.MailingCountry
                ].filter(Boolean).join(', ') ?? 'N/A';

                // ✅ Format Solicitor Address into a single string
                const vendorSolicitorAddress = [
                    data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.BillingStreet,
                    data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.BillingCity,
                    data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.BillingState,
                    data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.BillingPostalCode,
                    data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.BillingCountry
                ].filter(Boolean).join(', ') ?? 'N/A';

                // ✅ Store key properties directly in offerDetails
                this.offerDetails = {
                    ...data.currentOffer, // Keep existing properties
                    applicationName: this.checkNull(data.currentOffer?.Application__r?.Name),
                    salesAdvisor: this.checkNull(data.currentOffer?.Application__r?.NHS_Sales_Advisor__c),
                    scheme: this.checkNull(data.currentOffer?.Application__r?.Scheme__c),
                    houseBuilder: this.checkNull(data.currentOffer?.Application__r?.House_Builder__r?.Name),
                    development: this.checkNull(data.currentOffer?.Application__r?.Development__c),
                    plot: this.checkNull(data.currentOffer?.Application__r?.Plot__c),
                    applicantName: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.Name),
                    applicantEmail: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.Email),
                    applicantMobile: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.MobilePhone),
                    agentName: this.checkNull(data.currentOffer?.Agent__r?.Name),
                    agentPhone: this.checkNull(data.currentOffer?.Agent__r?.Phone),
                    applicantAddress,
                    solicitorAddress,
                    purchaserAddress,
                    vendorSolicitorAddress,
                    financialAdvisor: this.checkNull(data.currentOffer?.Financial_Advisors_Details__r?.Name),
                    lenderName: this.checkNull(data.currentOffer?.Name_of_Lender__r?.Name),
                    purchaserName: this.checkNull(data.currentOffer?.Purchasers_Full_Name__r?.Name),
                    purchaserEmail: this.checkNull(data.currentOffer?.Purchasers_Full_Name__r?.Email),
                    purchaserPhone: this.checkNull(data.currentOffer?.Purchasers_Full_Name__r?.MobilePhone),
                    solicitorName: this.checkNull(data.currentOffer?.Purchasers_Solicitors_Name__r?.Name),
                    solicitorPhone: this.checkNull(data.currentOffer?.Purchasers_Solicitors_Name__r?.Phone),
                    solicitorEmail: this.checkNull(data.currentOffer?.Purchasers_Solicitors_Name__r?.Email__c),
                    buyingPosition: this.checkNull(data.currentOffer?.Buying_Position__c),
                    offerAmount: this.checkNull(data.currentOffer?.Offer_Amount__c, 0),
                    depositAmount: this.checkNull(data.currentOffer?.Deposit_Amount_if_any__c, 0),
                    offerStatus: this.checkNull(data.currentOffer?.Offer_Acceptance_Status__c),
                    eTA_Date: this.checkNull(data.currentOffer?.Application__r?.ETA_Comp_Start__c),
                    expiryDate: this.checkNull(data.currentOffer?.Application__r?.Property__r?.Expiry_Date__),
                    idSeen: data.currentOffer?.Verification_ID__c ? 'Yes' : 'No',
                    dIPSeen: data.currentOffer?.Decision_in_Principle__c ? 'Yes' : 'No',
                    pOFSeen: data.currentOffer?.Proof_of_Funding__c ? 'Yes' : 'No',
                    vendorSolicitorName: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.Name),
                    vendorSolicitorEmail: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.Email__c),
                    vendorSolicitorPhone: this.checkNull(data.currentOffer?.Application__r?.Applicant__r?.Solicitors__r?.Phone),
                    otherCondition: this.checkNull(data.currentOffer?.Any_Special_Conditions__c),
                };


                // ✅ Store only the first accepted offer
                const accepted = data.relatedOffers?.find(offer => offer.Offer_Acceptance_Status__c === 'Accepted') ?? null;

                this.acceptedOffer = accepted ? {
                    ...accepted,
                    applicationName: this.checkNull(accepted?.Application__r?.Name),
                    salesAdvisor: this.checkNull(accepted?.Application__r?.NHS_Sales_Advisor__c),
                    scheme: this.checkNull(accepted?.Application__r?.Scheme__c),
                    houseBuilder: this.checkNull(accepted?.Application__r?.House_Builder__r?.Name),
                    development: this.checkNull(accepted?.Application__r?.Development__c),
                    plot: this.checkNull(accepted?.Application__r?.Plot__c),
                    applicantName: this.checkNull(accepted?.Application__r?.Applicant__r?.Name),
                    applicantEmail: this.checkNull(accepted?.Application__r?.Applicant__r?.Email),
                    applicantMobile: this.checkNull(accepted?.Application__r?.Applicant__r?.MobilePhone),
                    agentName: this.checkNull(accepted?.Agent__r?.Name),
                    agentPhone: this.checkNull(accepted?.Agent__r?.Phone),
                    financialAdvisor: this.checkNull(accepted?.Financial_Advisors_Details__r?.Name),
                    lenderName: this.checkNull(accepted?.Name_of_Lender__r?.Name),
                    solicitorName: this.checkNull(accepted?.Purchasers_Solicitors_Name__r?.Name),
                    solicitorPhone: this.checkNull(accepted?.Purchasers_Solicitors_Name__r?.Phone),
                    solicitorEmail: this.checkNull(accepted?.Purchasers_Solicitors_Name__r?.Email__c),
                    buyingPosition: this.checkNull(accepted?.Buying_Position__c),
                    offerAmount: this.checkNull(accepted?.Offer_Amount__c, 0),
                    depositAmount: this.checkNull(accepted?.Deposit_Amount_if_any__c, 0),
                    offerStatus: this.checkNull(accepted?.Offer_Acceptance_Status__c),
                } : null;

                this.isLoading = false;
            }

            this.relatedOffers = Array.isArray(data.relatedOffers)
                ? data.relatedOffers.map(offer => ({
                    ...offer,
                    isAccepteds: offer.Offer_Acceptance_Status__c
                }))
                : [];

            console.log('OUTPUT :this.offerDetails ', JSON.stringify(this.offerDetails));
            // ✅ Initialize agent objects
            this.agent1Offers = {};
            this.agent2Offers = {};
            this.agent3Offers = {};

            // ✅ Distribute offers dynamically across 3 agent slots
            // Ensure that the agent offers are correctly assigned with fallback to "N/A"
            this.relatedOffers.forEach((offer, index) => {
                let agentName = offer.Agent__r?.Name ?? 'N/A';  // Handle agent name (check if exists)
                let offerAmount = offer.Offer_Amount__c != null ? offer.Offer_Amount__c : 'N/A';  // Handle offer amount
                let formattedDate = '';
                let isAccepted = offer.isAccepteds ?? 'N/A'; // Handle offer acceptance status

                // Check if Date_of_Application_Received__c exists before processing
                if (offer.Date_of_Application_Received__c) {
                    const dateReceived = new Date(offer.Date_of_Application_Received__c);
                    formattedDate = dateReceived.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                } else {
                    formattedDate = 'N/A'; // Fallback for formattedDate if not available
                }

                // Prepare agent offers
                if (index === 0) {
                    // Assign to agent 1
                    this.agent1Offers = {
                        agentName,
                        offerAmount,
                        formattedDate,
                        isAccepted
                    };
                } else if (index === 1) {
                    // Assign to agent 2
                    this.agent2Offers = {
                        agentName,
                        offerAmount,
                        formattedDate,
                        isAccepted
                    };
                } else if (index === 2) {
                    // Assign to agent 3
                    this.agent3Offers = {
                        agentName,
                        offerAmount,
                        formattedDate,
                        isAccepted
                    };
                }
            });



            // ✅ Store only one accepted offer
            // this.acceptedOffer = this.relatedOffers.find(offer => offer.isAccepteds) ?? null;
            console.log('OUTPUT this.acceptedOffer: ', JSON.stringify(this.acceptedOffer));
            this.isLoading = false;
        }
        else if (error) {
            console.error('Error fetching offer data:', error);
            this.isLoading = false;
        }
    }



    generatePDF() {
        // Capture the HTML content inside the printable area
        let printableContent = this.refs.printableArea.innerHTML;
        console.log('OUTPUT : 1');
        generatePDF({ htmlContent: printableContent })
            .then(pdfUrl => {
                console.log('OUTPUT : 2');
                if (pdfUrl) {
                    console.log('OUTPUT : 3');
                    window.open(pdfUrl, '_blank');
                } else {
                    console.error('Failed to generate PDF');
                }
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
            });
    }


}