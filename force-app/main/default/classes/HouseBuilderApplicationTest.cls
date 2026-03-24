@isTest
public class HouseBuilderApplicationTest {
    
    @testSetup
    static void testSetupData(){
        Account ac = new Account();
        ac.Name = 'Test application';
        ac.Phone = '234578292';
        ac.Logo_URL__c = 'https://nhsolutions--training.sandbox.file.force.com/sfc/dist/version/renditionDownload?rendition=ORIGINAL_Jpeg&versionId=068KG000000MOI6&operationContext=DELIVERY&contentId=05TKG000000BjL6&page=0&d=/a/KG000000CfeD/gFQt0b_5Pn5HApk4ly5bkWYGUosqrPKwsnquBWuqbhI&oid=00D7a0000005DDN&dpt=null&viewId=';
        insert ac;
    }
     @isTest
    static void testAgentAccountUrl(){
        Account ac = [SELECT Id,  Logo_URL__c FROM Account Limit 1];
        Test.startTest();
        account result = houseBuilderApplication.getAccountFileUrl(ac.Id);
        Test.stopTest();    
    }
    
    @isTest
    static void testSaveRecord(){
        
          // Create required NHS Account to avoid early return
    New_Home_Solution__mdt config = New_Home_Solution__mdt.getInstance('NHS');
    Account ac = new Account(
        Name = config.Name__c,
        Phone = config.Phone__c,
        RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Estate Agents').getRecordTypeId()
    );
    insert ac;
       
        
        String recordType = 'Part Exchange';
        Map<Object,Object> propertyData = new Map<Object,Object>{
             'street' => '123 Main St',
        'city' => 'Testville',
        'pcode' => '12345',
            'Detached' => true,
            'SemiDetached' => true,
            'EndTerrace' => true,
            'MidTerrace' => true,
            'Apartment' => true,
            'Maisonette' => true,
            'Studio' => true,
            'Bungalow' => true,
            'NumberofBedrooms' => 3,
            'FrontGarden' => true,
            'BackGarden' => true,
            'NoGarden' => true ,
            'Parking' =>true,
            'Garage' =>true,
            'Extension' => true,
             'AnyExtensionssolarpanels' => true,
                'Conservatory' => true,
                'AgeofProperty' => '4',
                'Freehold' => true,
                'LeaseHold' => true,
                'YearsleftofLease' => '3',
                'ServiceChargePCM' => '2345.20',
                'PrincipleResidence' => true,
                'SecondHomeHolidayLet' => true,
                 'GroundRentPA' => '234.45',
                 'TypeofHeating' => 'testheat',
                 'BuildingRegsPlanningPermission' => true
         };
             Map<Object,Object> vendorData = new Map<Object,Object>{
               'firstname' => 'testfirstname',
               'lastname' => 'testlastname',
               'email' => 'testemail202@gmail.com',
               'mobilephone' => '8772928192', 'firstname1' => 'testfirstname',
                     'lastname1' => 'testlastname',
                     'email1' => 'testemail1349@gmail.com',
                     'mobilephone1' => '345682092'
             };
                 Map<Object,Object> agentData = new Map<Object,Object>{
                     'agentName' => 'TestAgent',
                     'agentPhone' => '746738373',
                      'agentEmail' =>' test234@gmail.com',
                       'street' => 'teststreet',
                        'city' => 'testcity',
                         'country' => 'testcountry',
                         'province' => 'testprovince'
                         
                 };
                    // Application Data (Map<Object, Object>)
Map<Object, Object> applicationData = new Map<Object, Object>{
    'expectation' => 100000, // Integer for Client_Expectations__c
    'scheme' => 'Part Exchange',
    'startDate' => '2024-01-01', // String for ETA_Comp_Start__c
    'endDate' => '2024-12-31', // String for ETA_Comp_End__c
    'notes' => 'Test Notes',
    'housebuilderId' => ac.Id, // Use the NHS Account ID
    'development' => 'Test Development',
    'plot' => 'Plot 123',
    'dateOfApplicationReceived' => '2023-10-01', // Date string
    'salesAdvisor' => UserInfo.getUserId(), // Use current user ID
    'Region' => 'Test Region',
    'PurchasePrice' => '250000.00', // String to be parsed to Decimal
    'marketstatusYes' => 'Yes',
    'Has_your_house_been_valued_by_an_agent' => true,
    'terms' => true,
    'ClientsEstimatedValuation' => '300000.00',
    'OutstandingMortgage' => '150000.00',
    'OutstandingMortgageQualified' => 'Yes',
    'Previousaskingprice' => '275000.00',
    'CurrentAskingPrice' => '280000.00',
    'NumberofViewings' => 5,
    'Anypreviousoffers' => '265000.00','monAM'=>true, 'monAM'=>true, 'monPM'=>true,'tueAM'=>true,'tuePM'=>true,'wedAM'=>true,'wedPM'=>true,'thuAM'=>true,'thuPM'=>true,'friAM'=>true,'friPM'=>true,'satAM'=>true,'satPM'=>true,'sunAM'=>true,'sunPM'=>true,
        'ClientsEstimatedValuation'=>'123','OutstandingMortgage'=>'2121','OutstandingMortgageQualified'=>'212','dateOfApplicationReceived'=>'',
        'Previousaskingprice'=>'123','CurrentAskingPrice'=>'123','NumberofViewings'=>'3','Anypreviousoffers'=>'123'
};
             //build a form data with corrected map type
         Map<String, Object> formData = new Map<String, Object>{
        'Property' => propertyData,
          'Vendor' => vendorData,
            'Agent' => agentData,
            'Application' => applicationData};
            
            
          Test.startTest();
         Map<String,String> result =  houseBuilderApplication.saveData(formData, recordType);
         houseBuilderApplication.saveData(formData, 'New Home');
          houseBuilderApplication.saveData(formData, 'Assisted Sale');
        Test.stopTest();
    }
}