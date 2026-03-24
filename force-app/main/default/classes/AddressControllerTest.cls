@isTest
public class AddressControllerTest {
    
    @isTest
    static void testSearchAddress(){
        
        String searchTerm = 'main St';
        Test.startTest();
        List<AddressController.AddressOption> results = AddressController.searchAddresses(searchTerm);
        Test.stopTest();
        
        
        
    
    }
    

}