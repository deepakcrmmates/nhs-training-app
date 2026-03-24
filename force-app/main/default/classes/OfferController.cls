public without sharing class OfferController {
    @AuraEnabled(cacheable=true)
    public static List<map<string, object>> displayApplicationData( string recordId){
        List<map<string, object>> finalList = new List<map<string, object>>();
        Map<string, object> jsonMap = new Map<string, object>();
        List<Opportunity> applications = [select id, Name, Agent_1__r.name, Agent_1__r.email__c, Agent_1__c, Agent_1__r.Phone, Agent_1__r.Logo_Url__c,
                                          Agent_2__r.name, Agent_2__r.email__c, Agent_2__c, Agent_2__r.Phone,Agent_2__r.Logo_Url__c,
                                          Agent_3__r.name, Agent_3__r.email__c, Agent_3__c, Agent_3__r.Phone, Agent_3__r.Logo_Url__c,
                                          Applicant__r.Name, Applicant__r.Email, Applicant__r.Phone, Applicant__r.MobilePhone, Applicant__r.MailingCity, Applicant__r.MailingStreet,  
                                          Applicant__r.MailingPostalCode,  Applicant__r.MailingCountry,  Applicant__r.MailingState,
                                          Agent_1__r.BillingCity, Agent_1__r.BillingStreet, Agent_1__r.BillingPostalCode, Agent_1__r.BillingCountry, Agent_1__r.BillingState,
                                          Agent_2__r.BillingCity, Agent_2__r.BillingStreet, Agent_2__r.BillingPostalCode, Agent_2__r.BillingCountry, Agent_2__r.BillingState ,
                                          Agent_3__r.BillingCity, Agent_3__r.BillingStreet, Agent_3__r.BillingPostalCode, Agent_3__r.BillingCountry, Agent_3__r.BillingState ,
                                          Property_Address__c from Opportunity  where id =: recordId];
        
        jsonMap.put('Application', applications);
        finalList.add(jsonMap);
        
        return finalList;
    }
    
    @AuraEnabled(cacheable=true)
    public static Account searchAccounts(String accountId) {
        if (String.isEmpty(accountId)) {
            throw new AuraHandledException('Account Id cannot be null or empty.');
        }
        
        try {
            Account accountRecord = [
                SELECT Id, Name, BillingStreet, BillingCity, BillingCountry, BillingState, BillingPostalCode, Email__c, Phone,
                (SELECT Id, FirstName, LastName, Email, Phone FROM Contacts) 
                FROM Account
                WHERE Id = :accountId
                LIMIT 1
            ];
            
            return accountRecord;
        } catch (Exception ex) {
            throw new AuraHandledException('Failed to fetch account details: ' + ex.getMessage());
        }
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Contact searchContact(String contactId) {
        
        return [SELECT Id, Name, FirstName, LastName,
                MailingPostalCode, MailingCity, MailingStreet, MailingState, MailingCountry, Phone, Email
                FROM Contact WHERE Id =:contactId LIMIT 1];
        
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Contact> searchpurchaserSolicitor(String searchTerm) {
        searchTerm = '%' + searchTerm + '%';
        return [SELECT Id, Name, FirstName, LastName FROM Contact WHERE Name LIKE :searchTerm LIMIT 100];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> picklistData() {
        List<Map<String, Object>> result = new List<Map<String, Object>>();
        
        // Add Account data
        Map<String, Object> accountMap = new Map<String, Object>();
        accountMap.put('Account', [SELECT Id, Name FROM Account LIMIT 10]);
        result.add(accountMap);
        
        // Add Contact data
        Map<String, Object> contactMap = new Map<String, Object>();
        contactMap.put('Contact', [SELECT Id, Name FROM Contact LIMIT 100]);
        result.add(contactMap);
        
        // Add Account data
        Map<String, Object> purchaserSolicitorsPicklist = new Map<String, Object>();
        purchaserSolicitorsPicklist.put('purchaserSolicitors', [SELECT Id, Name FROM Account LIMIT 100]);
        result.add(purchaserSolicitorsPicklist);
        
        return result;
    }
    
    @AuraEnabled
    public static Map<String, String> createAccount(Map<String, Object> accountData) {
        Map<String, String> result = new Map<String, String>();
        
        // Get the RecordTypeId for 'Solicitors'
        String solicitorsRecordTypeId = null;
        Map<String, Schema.RecordTypeInfo> recordTypeInfoMap = Schema.SObjectType.Account.getRecordTypeInfosByName();
        if (recordTypeInfoMap.containsKey('Solicitors')) {
            solicitorsRecordTypeId = recordTypeInfoMap.get('Solicitors').getRecordTypeId();
        } else {
            System.debug('Solicitors record type not found!');
        }
        
        try {
            // Create a new Account record
            Account acc = new Account();
            acc.Name = (String) accountData.get('Name');
            acc.Phone = (String) accountData.get('Phone');
            acc.Email__c = (String) accountData.get('Email__c');
            acc.BillingStreet = (String) accountData.get('BillingStreet');
            acc.BillingCity = (String) accountData.get('BillingCity');
            acc.BillingState = (String) accountData.get('BillingState');
            acc.BillingPostalCode = (String) accountData.get('BillingPostalCode');
            acc.BillingCountry = (String) accountData.get('BillingCountry');
            acc.RecordTypeId = solicitorsRecordTypeId;
            
            // Insert the Account record
            insert acc;
            
            // Populate the result map with the Account Name and Id
            result.put('name', acc.Name);
            result.put('id', acc.Id);
            result.put('message', 'Account created successfully!');
            
            return result;
        } catch (Exception e) {
            // Log the exception and return the error message
            System.debug('Error creating account: ' + e.getMessage());
            result.put('error', 'Error creating account: ' + e.getMessage());
            return result;
        }
    }
    
    @AuraEnabled
    public static Map<String, String> createLender(Map<String, Object> accountData) {
        // Initialize the result map
        Map<String, String> result = new Map<String, String>();
        
        // Validate if accountData is null or empty
        if (accountData == null || accountData.isEmpty()) {
            result.put('status', 'error');
            result.put('message', 'Account data is null or empty. No records were created.');
            return result;
        }
        
        // Get the Financial Institution Record Type Id
        String financial_InstitutionRecordTypeId = null;
        Map<String, Schema.RecordTypeInfo> recordTypeInfoMap = Schema.SObjectType.Account.getRecordTypeInfosByName();
        if (recordTypeInfoMap.containsKey('Financial Institution')) {
            financial_InstitutionRecordTypeId = recordTypeInfoMap.get('Financial Institution').getRecordTypeId();
        } else {
            result.put('status', 'error');
            result.put('message', 'Financial Institution record type not found!');
            return result;
        }
        
        try {
            // Create a new Account record
            Account acc = new Account();
            
            // Assign values only if the data is available
            if (accountData.get('FirstName') != null && String.isNotBlank((String) accountData.get('FirstName'))) {
                acc.Name = (String) accountData.get('FirstName') + ' ' + (String) accountData.get('LastName');
            }
            if (accountData.get('Phone') != null && String.isNotBlank((String) accountData.get('Phone'))) {
                acc.Phone = (String) accountData.get('Phone');
            }
            if (accountData.get('Email__c') != null && String.isNotBlank((String) accountData.get('Email'))) {
                acc.Email__c = (String) accountData.get('Email__c');
            }
            if (accountData.get('BillingStreet') != null && String.isNotBlank((String) accountData.get('BillingStreet'))) {
                acc.BillingStreet = (String) accountData.get('BillingStreet');
            }
            if (accountData.get('BillingCity') != null && String.isNotBlank((String) accountData.get('BillingCity'))) {
                acc.BillingCity = (String) accountData.get('BillingCity');
            }
            if (accountData.get('BillingState') != null && String.isNotBlank((String) accountData.get('BillingState'))) {
                acc.BillingState = (String) accountData.get('BillingState');
            }
            if (accountData.get('BillingPostalCode') != null && String.isNotBlank((String) accountData.get('BillingPostalCode'))) {
                acc.BillingPostalCode = (String) accountData.get('BillingPostalCode');
            }
            if (accountData.get('BillingCountry') != null && String.isNotBlank((String) accountData.get('BillingCountry'))) {
                acc.BillingCountry = (String) accountData.get('BillingCountry');
            }
            
            acc.RecordTypeId = financial_InstitutionRecordTypeId;
            
            // Insert the Account record
            insert acc;
            String accId = acc.Id;
            
            if (accId != null) {
                // Get the Financial Advisor Record Type Id
                String financial_AdvisorRecordTypeId = null;
                Map<String, Schema.RecordTypeInfo> recordTypeInfoMap1 = Schema.SObjectType.Contact.getRecordTypeInfosByName();
                if (recordTypeInfoMap1.containsKey('Financial Advisor')) {
                    financial_AdvisorRecordTypeId = recordTypeInfoMap1.get('Financial Advisor').getRecordTypeId();
                    
                    // Create a new Contact record
                    Contact con = new Contact();
                    
                    // Assign values only if the data is available
                    if (accountData.get('FirstName') != null && String.isNotBlank((String) accountData.get('FirstName'))) {
                        con.FirstName = (String) accountData.get('FirstName');
                    }
                    if (accountData.get('LastName') != null && String.isNotBlank((String) accountData.get('LastName'))) {
                        con.LastName = (String) accountData.get('LastName');
                    }
                    if (acc.Email__c != null && String.isNotBlank(acc.Email__c)) {
                        con.Email = acc.Email__c;
                    }
                    if (acc.Phone != null && String.isNotBlank(acc.Phone)) {
                        con.Phone = acc.Phone;
                    }
                    
                    con.AccountId = accId; // Link Contact to the Account
                    
                    insert con;
                    
                    // Add success messages to the result map
                    result.put('status', 'success');
                    result.put('accountId', accId);
                    result.put('contactId', con.Id);
                    result.put('message', 'Account and Contact created successfully!');
                } else {
                    result.put('status', 'error');
                    result.put('message', 'Financial Advisor record type not found!');
                    return result;
                }
            } else {
                result.put('status', 'error');
                result.put('message', 'Account creation failed. No Account Id returned.');
                return result;
            }
        } catch (Exception e) {
            // Log the exception and add error message to the result map
            System.debug('Error creating account: ' + e.getMessage());
            result.put('status', 'error');
            result.put('message', 'Error creating account: ' + e.getMessage());
        }
        
        return result;
    }
    
    @AuraEnabled
    public static map<string, string> createContact(Contact contact) {
        map<string, string> returnMap = new map<string, string>();
        
        String household = null;
        Map<String, Schema.RecordTypeInfo> recordTypeInfoMap1 = Schema.SObjectType.Account.getRecordTypeInfosByName();
        if (recordTypeInfoMap1.containsKey('Household')) {
            household = recordTypeInfoMap1.get('Household').getRecordTypeId();
        }
        try {
            Account acc = new Account();
            if(household != ''){
                acc.Name = contact.LastName + ' ' +'Household';
                acc.Email__c = contact.Email != '' ? contact.Email : '' ; 
                acc.Phone = contact.Phone != '' ? contact.Phone : '';
                acc.RecordTypeId = household;
                insert acc;
                 returnMap.put('Account', acc.Id);
            }
            
            contact.AccountId = acc.id != null ? acc.id : '';
            insert contact;
            returnMap.put('contact', contact.Id);
            
        } catch (Exception e) {
            returnMap.put('no', 'Contact Not Created.');
            
            throw new AuraHandledException(e.getMessage());
            
        }
        return returnMap;
    }
    
    @AuraEnabled
    public static Map<String, String> createOffer(String offerDataJson) {
        Map<String, String> resultMap = new Map<String, String>();
        
        try {
            // Parse the JSON into a map
            Map<String, Object> offerData = (Map<String, Object>) JSON.deserializeUntyped(offerDataJson);
            
            // Create an Offer__c record
            Offer__c offer = new Offer__c();
            
            // Safely assign values from the map, checking for keys and nulls
            if (offerData.containsKey('Property') && offerData.get('Property') != null) {
                offer.Application__c = (String) offerData.get('Property');
            }

           if (offerData.containsKey('Date offer received') && offerData.get('Date offer received') != null) {
    String isoDateTime = (String) offerData.get('Date offer received');
               system.debug('IsoDateTime: ' + isoDateTime);
    
    // Convert ISO-8601 format (2025-01-24T16:52:05.889Z) to Salesforce-compatible format (yyyy-MM-dd HH:mm:ss)
    String formattedDateTime = isoDateTime.replace('T', ' ').replace('Z', '');
               system.debug('formattedtime' + formattedDateTime);
    
    
    // Parse the formatted date-time string
    offer.Date_of_Application_Received__c = DateTime.valueOf(formattedDateTime);
 system.debug('date and time' + DateTime.valueOf(formattedDateTime));
}


            
            if (offerData.containsKey('AgentName') && offerData.get('AgentName') != null) {
                offer.Agent__c = (String) offerData.get('AgentName');
            }
            
            if (offerData.containsKey('yes') && offerData.get('yes') != null) {
                offer.Offer_Active__c = (Boolean) offerData.get('yes') ? 'Yes' : 'No';
            }
            
            if (offerData.containsKey('OfferAmount') && offerData.get('OfferAmount') != null) {
                offer.Offer_Amount__c = Decimal.valueOf((String) offerData.get('OfferAmount'));
            }
            
            if (offerData.containsKey('PurchaserId') && offerData.get('PurchaserId') != null) {
                offer.Purchasers_Full_Name__c = (String) offerData.get('PurchaserId');
            }
            
            if (offerData.containsKey('MortgageRequired') && offerData.get('MortgageRequired') != null) {
                offer.Mortgage_Required__c = (Boolean) offerData.get('MortgageRequired');
            }
            
            if (offerData.containsKey('PurchasersBuyingPosition') && offerData.get('PurchasersBuyingPosition') != null) {
                offer.Buying_Position__c = (String) offerData.get('PurchasersBuyingPosition');
            }
            
            if (offerData.containsKey('NameOfLender') && offerData.get('NameOfLender') != null) {
                offer.Name_of_Lender__c = (String) offerData.get('NameOfLender');
            }
            
            if (offerData.containsKey('FinancialAdvisor') && offerData.get('FinancialAdvisor') != null) {
                offer.Financial_Advisors_Details__c = (String) offerData.get('FinancialAdvisor');
            }
            
            // if (offerData.containsKey('Deposit') && offerData.get('Deposit') != null) {
            //     offer.Deposit_Amount_if_any__c = Decimal.valueOf((String) offerData.get('Deposit'));
            // }
            if (offerData.containsKey('Deposit') && offerData.get('Deposit') != null) {
    Object depositValue = offerData.get('Deposit');
                System.debug(offerData.get('Deposit'));
                System.debug('deposit: ' + depositValue);
    
    if (depositValue instanceof String) {
        // If the value is a String, convert it to Decimal after parsing
        offer.Deposit_Amount_if_any__c = Decimal.valueOf((String) depositValue);
    } else if (depositValue instanceof Integer || depositValue instanceof Long || depositValue instanceof Double) {
        // If the value is already a number, cast it directly to Decimal
        offer.Deposit_Amount_if_any__c = (Decimal) depositValue;
    }
}

            if (offerData.containsKey('PurchasorSolicitorsname') && offerData.get('PurchasorSolicitorsname') != null) {
                offer.Purchasers_Solicitors_Name__c = (String) offerData.get('PurchasorSolicitorsname');
            }
            
            if (offerData.containsKey('ExchangeDeadline') && offerData.get('ExchangeDeadline') != null) {
                offer.Exchange_Deadline__c = Date.valueOf((String) offerData.get('ExchangeDeadline'));
            }
            
            if (offerData.containsKey('BuyerawareofEstimatedCompletionDate') &&
                offerData.get('BuyerawareofEstimatedCompletionDate') != null) {
                    offer.Buyer_aware_of_Estimated_Completion_Date__c = Date.valueOf((String) offerData.get('BuyerawareofEstimatedCompletionDate'));
                }
            
            if (offerData.containsKey('DecisioninPrinciple') && offerData.get('DecisioninPrinciple') != null) {
                offer.Decision_in_Principle__c = (Boolean) offerData.get('DecisioninPrinciple');
            }
            
            if (offerData.containsKey('IdVerified') && offerData.get('IdVerified') != null) {
                offer.Verification_ID__c = (Boolean) offerData.get('IdVerified');
            }
            
            if (offerData.containsKey('ProofofFunding') && offerData.get('ProofofFunding') != null) {
                offer.Proof_of_Funding__c = (Boolean) offerData.get('ProofofFunding');
            }
            
            if (offerData.containsKey('AMLCheck') && offerData.get('AMLCheck') != null) {
                offer.AML_Checked__c = (Boolean) offerData.get('AMLCheck');
            }
            
            if (offerData.containsKey('AnySpecialConditions') && offerData.get('AnySpecialConditions') != null) {
                offer.Any_Special_Conditions__c = (String) offerData.get('AnySpecialConditions');
            }
            offer.Offer_Status__c ='New Offers';
            
            // Insert the record
            insert offer;
            
            // Add success result to map
            resultMap.put('Status', 'Yes');
            resultMap.put('Id', offer.Id);
            resultMap.put('message', 'Offer created successfully..!');
        } catch (Exception e) {
            // Log and return error message
            System.debug('Error creating offer: ' + e.getMessage() + ' '+ e.getLineNumber());
            resultMap.put('Status', 'No');
            resultMap.put('ErrorMessage', e.getMessage());
        }
        
        return resultMap;
    }
    
    @AuraEnabled
    public static String uploadFiles(String formDataJson) {
        try {
            // Debug the incoming JSON string
            System.debug('formDataJson received in Apex: ' + formDataJson);
            
            // Check if the input is null or empty
            if (String.isBlank(formDataJson)) {
                throw new IllegalArgumentException('Form data JSON is null or empty.');
            }
            
            // Deserialize the JSON string to a Map
            Map<String, Object> formData = (Map<String, Object>) JSON.deserializeUntyped(formDataJson);
            System.debug('formData deserialized: ' + formData);
            
            // Retrieve the offer ID from formData
            String offerId = (String) formData.get('offerId');
            if (String.isBlank(offerId)) {
                throw new IllegalArgumentException('Offer ID is missing in the request.');
            }
            
            // Remove the offerId key from the formData map to process only files
            formData.remove('offerId');
            
            // Loop through the formData to upload files
            for (String key : formData.keySet()) {
                // Get the base64-encoded file content
                String fileContentBase64 = (String) formData.get(key);
                if (String.isBlank(fileContentBase64)) {
                    throw new IllegalArgumentException('File content is null or empty for key: ' + key);
                }
                
                // Convert the base64 string to a Blob
                Blob fileContent = EncodingUtil.base64Decode(fileContentBase64);
                String fileName = key; // Use the key as the file name
                
                // Create ContentVersion record for the file
                ContentVersion file = new ContentVersion(
                    Title = fileName,
                    PathOnClient = fileName,
                    VersionData = fileContent
                );
                insert file;
                
                // Retrieve the ContentDocumentId for the newly inserted file
                Id contentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :file.Id LIMIT 1].ContentDocumentId;
                
                // Link the file to the Offer__c record
                ContentDocumentLink link = new ContentDocumentLink(
                    ContentDocumentId = contentDocumentId,
                    LinkedEntityId = offerId,
                    ShareType = 'V' // Viewer access
                );
                insert link;
            }
            
            return 'Success';
        } catch (Exception e) {
            System.debug('Error uploading files: ' + e.getMessage());
            return e.getMessage();
        }
    }
    
    
    
}