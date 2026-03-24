@isTest
public class IdealPostcodeControllerTest {

    @isTest
    static void testSearchAddresses() {
        // Set up a search term to test
        String searchTerm = 'Test Address';

        // Call the method to test
        Test.startTest();
        List<String> result = IdealPostcodeController.searchAddresses(searchTerm);
        List<AddressController.AddressOption> results = AddressController.searchAddresses('Main St');
        Test.stopTest();

        // Assert the result is not null
        System.assertNotEquals(null, result, 'The result should not be null');

        // Since no actual API call is made, assert that the returned list is empty as expected
        System.assertEquals(0, result.size(), 'The list should be empty since this is a mock test');
    }
}