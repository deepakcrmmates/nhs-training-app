public with sharing class AccountListController {

    @AuraEnabled
    public static Map<String, Object> getAccounts(String recordTypeDeveloperName, String searchTerm, String sortField, String sortDirection, Integer pageSize, Integer pageNumber) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            Id rtId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get(recordTypeDeveloperName).getRecordTypeId();

            Integer limitSize = pageSize != null ? pageSize : 25;
            Integer offsetVal = pageNumber != null ? (pageNumber - 1) * limitSize : 0;

            String baseQuery = 'SELECT Id, Name, BillingCity, BillingPostalCode, Phone, Email__c, CreatedDate, ' +
                '(SELECT Id, MobilePhone, Email FROM Contacts ORDER BY CreatedDate LIMIT 1) ' +
                'FROM Account WHERE RecordTypeId = :rtId';

            String countQuery = 'SELECT COUNT() FROM Account WHERE RecordTypeId = :rtId';

            if (String.isNotBlank(searchTerm)) {
                String likeTerm = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
                baseQuery += ' AND (Name LIKE :likeTerm OR BillingCity LIKE :likeTerm OR BillingPostalCode LIKE :likeTerm)';
                countQuery += ' AND (Name LIKE :likeTerm OR BillingCity LIKE :likeTerm OR BillingPostalCode LIKE :likeTerm)';
            }

            // Sort
            String sField = String.isNotBlank(sortField) ? sortField : 'Name';
            String sDir = sortDirection == 'desc' ? 'DESC' : 'ASC';
            baseQuery += ' ORDER BY ' + sField + ' ' + sDir + ' NULLS LAST';
            baseQuery += ' LIMIT :limitSize OFFSET :offsetVal';

            List<Account> accounts = Database.query(baseQuery);
            Integer totalCount = Database.countQuery(countQuery);

            List<Map<String, Object>> rows = new List<Map<String, Object>>();
            for (Account acc : accounts) {
                Map<String, Object> row = new Map<String, Object>();
                row.put('id', acc.Id);
                row.put('name', acc.Name);
                row.put('city', acc.BillingCity);
                row.put('postcode', acc.BillingPostalCode);
                row.put('phone', acc.Phone);
                row.put('email', acc.Email__c);

                if (!acc.Contacts.isEmpty()) {
                    row.put('contactMobile', acc.Contacts[0].MobilePhone);
                    row.put('contactEmail', acc.Contacts[0].Email);
                }
                rows.add(row);
            }

            result.put('status', 'success');
            result.put('accounts', rows);
            result.put('totalCount', totalCount);
            result.put('pageSize', limitSize);
            result.put('pageNumber', pageNumber != null ? pageNumber : 1);
            result.put('totalPages', (Integer) Math.ceil((Double) totalCount / limitSize));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, Object> getContacts(String recordTypeDeveloperName, String searchTerm, String sortField, String sortDirection, Integer pageSize, Integer pageNumber) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            Id rtId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get(recordTypeDeveloperName).getRecordTypeId();

            Integer limitSize = pageSize != null ? pageSize : 25;
            Integer offsetVal = pageNumber != null ? (pageNumber - 1) * limitSize : 0;

            String baseQuery = 'SELECT Id, FirstName, LastName, Name, Email, MobilePhone, Phone, MailingCity, MailingPostalCode, CreatedDate ' +
                'FROM Contact WHERE RecordTypeId = :rtId';

            String countQuery = 'SELECT COUNT() FROM Contact WHERE RecordTypeId = :rtId';

            if (String.isNotBlank(searchTerm)) {
                String likeTerm = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
                baseQuery += ' AND (Name LIKE :likeTerm OR MailingCity LIKE :likeTerm OR MailingPostalCode LIKE :likeTerm OR Email LIKE :likeTerm)';
                countQuery += ' AND (Name LIKE :likeTerm OR MailingCity LIKE :likeTerm OR MailingPostalCode LIKE :likeTerm OR Email LIKE :likeTerm)';
            }

            String sField = String.isNotBlank(sortField) ? sortField : 'Name';
            String sDir = sortDirection == 'desc' ? 'DESC' : 'ASC';
            baseQuery += ' ORDER BY ' + sField + ' ' + sDir + ' NULLS LAST';
            baseQuery += ' LIMIT :limitSize OFFSET :offsetVal';

            List<Contact> contacts = Database.query(baseQuery);
            Integer totalCount = Database.countQuery(countQuery);

            List<Map<String, Object>> rows = new List<Map<String, Object>>();
            for (Contact c : contacts) {
                Map<String, Object> row = new Map<String, Object>();
                row.put('id', c.Id);
                row.put('name', c.Name);
                row.put('city', c.MailingCity);
                row.put('postcode', c.MailingPostalCode);
                row.put('phone', c.Phone);
                row.put('email', c.Email);
                row.put('contactMobile', c.MobilePhone);
                row.put('contactEmail', c.Email);
                rows.add(row);
            }

            result.put('status', 'success');
            result.put('accounts', rows);
            result.put('totalCount', totalCount);
            result.put('pageSize', limitSize);
            result.put('pageNumber', pageNumber != null ? pageNumber : 1);
            result.put('totalPages', (Integer) Math.ceil((Double) totalCount / limitSize));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, Object> getProperties(String searchTerm, String sortField, String sortDirection, Integer pageSize, Integer pageNumber) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            Integer limitSize = pageSize != null ? pageSize : 25;
            Integer offsetVal = pageNumber != null ? (pageNumber - 1) * limitSize : 0;

            String baseQuery = 'SELECT Id, Name, ' +
                'Address__Street__s, Address__City__s, Address__PostalCode__s, ' +
                'Number_Of_Bedrooms__c, Property_Type__c, Current_Rating__c, ' +
                'Council_Tax_Band__c, Construction_Age_Band__c, ' +
                'Detached__c, Semi_Detached__c, End_Terrace__c, Mid_Terrace__c, ' +
                'Apartment__c, Maisonette__c, Bungalow__c, ' +
                'Freehold__c, Lease_Hold__c, ' +
                'Total_Floor_Area__c, Flood_Risk__c, ' +
                'CreatedDate ' +
                'FROM NHS_Property__c';

            String countQuery = 'SELECT COUNT() FROM NHS_Property__c';

            String whereClause = '';
            if (String.isNotBlank(searchTerm)) {
                String likeTerm = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
                whereClause = ' WHERE (Name LIKE :likeTerm OR Address__City__s LIKE :likeTerm OR Address__PostalCode__s LIKE :likeTerm OR Address__Street__s LIKE :likeTerm)';
            }

            baseQuery += whereClause;
            countQuery += whereClause;

            String sField = String.isNotBlank(sortField) ? sortField : 'CreatedDate';
            String sDir = sortDirection == 'desc' ? 'DESC' : 'ASC';
            if (sField == 'CreatedDate' && sortDirection != 'asc') sDir = 'DESC';
            baseQuery += ' ORDER BY ' + sField + ' ' + sDir + ' NULLS LAST';
            baseQuery += ' LIMIT :limitSize OFFSET :offsetVal';

            List<NHS_Property__c> props = Database.query(baseQuery);
            Integer totalCount = Database.countQuery(countQuery);

            List<Map<String, Object>> rows = new List<Map<String, Object>>();
            for (NHS_Property__c p : props) {
                Map<String, Object> row = new Map<String, Object>();
                row.put('id', p.Id);
                row.put('name', p.Name);
                row.put('street', p.Address__Street__s);
                row.put('city', p.Address__City__s);
                row.put('postcode', p.Address__PostalCode__s);
                row.put('bedrooms', p.Number_Of_Bedrooms__c);
                row.put('epcRating', p.Current_Rating__c);
                row.put('councilTax', p.Council_Tax_Band__c);
                row.put('constructionAge', p.Construction_Age_Band__c);
                row.put('floorArea', p.Total_Floor_Area__c);
                row.put('floodRisk', p.Flood_Risk__c);

                // Property type
                String pType = p.Property_Type__c;
                if (String.isBlank(pType)) {
                    if (p.Detached__c) pType = 'Detached';
                    else if (p.Semi_Detached__c) pType = 'Semi-Detached';
                    else if (p.End_Terrace__c) pType = 'End Terrace';
                    else if (p.Mid_Terrace__c) pType = 'Mid Terrace';
                    else if (p.Apartment__c) pType = 'Apartment';
                    else if (p.Maisonette__c) pType = 'Maisonette';
                    else if (p.Bungalow__c) pType = 'Bungalow';
                }
                row.put('propertyType', pType);

                // Tenure
                row.put('tenure', p.Freehold__c ? 'Freehold' : (p.Lease_Hold__c ? 'Leasehold' : ''));

                rows.add(row);
            }

            result.put('status', 'success');
            result.put('records', rows);
            result.put('totalCount', totalCount);
            result.put('pageSize', limitSize);
            result.put('pageNumber', pageNumber != null ? pageNumber : 1);
            result.put('totalPages', (Integer) Math.ceil((Double) totalCount / limitSize));
        } catch (Exception e) {
            result.put('status', 'error');
            result.put('message', e.getMessage());
        }

        return result;
    }
}
