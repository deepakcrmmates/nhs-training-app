/**
* @File Name : frontFacingAgentController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : January 22, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | January 22, 2025 |   | Initial Version
**/

public without sharing class frontFacingAgentController {

@AuraEnabled
public static Map<String, String> saveRecords(Map<String, Object> lender, Map<String, Object> advisor, Map<String, Object> solicitorCompany, Map<String, Object> solicitorPerson, boolean mortgageRequired) {
    Map<String, String> result = new Map<String, String>();

    try {
        // Create Lender (Account)
        Account lenderAccount = new Account();
      
        lenderAccount.Name = (String) lender.get('accountName'); // Required field
        lenderAccount.Email__c = String.isNotBlank((String) lender.get('Email')) ? (String) lender.get('Email') : null;
        lenderAccount.Phone = String.isNotBlank((String) lender.get('Phone')) ? (String) lender.get('Phone') : null;
        lenderAccount.BillingStreet = String.isNotBlank((String) lender.get('Street')) ? (String) lender.get('Street') : null;
        lenderAccount.BillingCity = String.isNotBlank((String) lender.get('City')) ? (String) lender.get('City') : null;
        lenderAccount.BillingCountry = String.isNotBlank((String) lender.get('Country')) ? (String) lender.get('Country') : null;
        lenderAccount.BillingState = String.isNotBlank((String) lender.get('Province')) ? (String) lender.get('Province') : null;
        lenderAccount.BillingPostalCode = String.isNotBlank((String) lender.get('PostalCode')) ? (String) lender.get('PostalCode') : null;
        lenderAccount.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Financial Institution').getRecordTypeId();
        
        if(mortgageRequired == true){
        // Insert Lender Account
        if (String.isNotBlank(lenderAccount.Name)) {
            insert lenderAccount;
            result.put('lenderAccountId', lenderAccount.Id);
        } else {
            result.put('lenderStatus', 'fail');
            throw new AuraHandledException('Lender Account Name is required.');
        }

        // Create Financial Advisor (Contact)
        Contact financialAdvisor = new Contact();
        financialAdvisor.FirstName = (String) advisor.get('FirstName'); // Required field
        financialAdvisor.LastName = (String) advisor.get('LastName'); // Required field
        financialAdvisor.Email = String.isNotBlank((String) advisor.get('Email')) ? (String) advisor.get('Email') : null;
        financialAdvisor.Phone = String.isNotBlank((String) advisor.get('Phone')) ? (String) advisor.get('Phone') : null;
        financialAdvisor.AccountId = lenderAccount.Id;
        financialAdvisor.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Financial Advisor').getRecordTypeId();
        
        // Insert Financial Advisor
        if (String.isNotBlank(financialAdvisor.FirstName) && String.isNotBlank(financialAdvisor.LastName)) {
            insert financialAdvisor;
            result.put('financialAdvisorId', financialAdvisor.Id);
        } else {
            result.put('advisorStatus', 'fail');
            throw new AuraHandledException('Financial Advisor First Name and Last Name are required.');
        }
        }
        // Create Solicitor's Company (Account)
        Account solicitorAcc = new Account();
        solicitorAcc.Name = (String) solicitorCompany.get('Name'); // Required field
        solicitorAcc.Phone = String.isNotBlank((String) solicitorCompany.get('Phone')) ? (String) solicitorCompany.get('Phone') : null;
        solicitorAcc.Email__c = String.isNotBlank((String) solicitorCompany.get('Email')) ? (String) solicitorCompany.get('Email') : null;
        solicitorAcc.BillingStreet = String.isNotBlank((String) solicitorCompany.get('BillingStreet')) ? (String) solicitorCompany.get('BillingStreet') : null;
        solicitorAcc.BillingCity = String.isNotBlank((String) solicitorCompany.get('BillingCity')) ? (String) solicitorCompany.get('BillingCity') : null;
        solicitorAcc.BillingCountry = String.isNotBlank((String) solicitorCompany.get('BillingCountry')) ? (String) solicitorCompany.get('BillingCountry') : null;
        solicitorAcc.BillingState = String.isNotBlank((String) solicitorCompany.get('BillingState')) ? (String) solicitorCompany.get('BillingState') : null;
        solicitorAcc.BillingPostalCode = String.isNotBlank((String) solicitorCompany.get('BillingPostalCode')) ? (String) solicitorCompany.get('BillingPostalCode') : null;
        solicitorAcc.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Solicitors').getRecordTypeId();
        
        // Insert Solicitor's Company
        if (String.isNotBlank(solicitorAcc.Name)) {
            insert solicitorAcc;
            result.put('solicitorAccountId', solicitorAcc.Id);
        } else {
            result.put('solicitorStatus', 'fail');
            throw new AuraHandledException('Solicitor Company Name is required.');
        }

        // Create Solicitor's Person (Contact)
        Contact solicitorContact = new Contact();
        solicitorContact.FirstName = (String) solicitorPerson.get('FirstName'); // Required field
        System.debug('solisName : ' + solicitorContact.FirstName);
        solicitorContact.LastName = (String) solicitorPerson.get('LastName'); // Required field
        solicitorContact.Phone = String.isNotBlank((String) solicitorPerson.get('Phone')) ? (String) solicitorPerson.get('Phone') : null;
        solicitorContact.Email = String.isNotBlank((String) solicitorPerson.get('Email')) ? (String) solicitorPerson.get('Email') : null;
        solicitorContact.AccountId = solicitorAcc.Id;
        solicitorContact.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Solicitor').getRecordTypeId();
        
        // Insert Solicitor's Person
        if (String.isNotBlank(solicitorContact.FirstName) && String.isNotBlank(solicitorContact.LastName)) {
            insert solicitorContact;
            result.put('solicitorContactId', solicitorContact.Id);
        } else {
            result.put('solicitorContactStatus', 'fail');
            throw new AuraHandledException('Solicitor Person First Name and Last Name are required.');
        }

        // Add success message
        result.put('message', 'Records created successfully.');
    } catch (Exception e) {
        // Log the error and throw an AuraHandledException
        System.debug('Error creating records: ' + e.getMessage());
        throw new AuraHandledException('Error creating records: ' + e.getMessage());
    }

    return result;
}
}