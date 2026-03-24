public with sharing class AddressController {
    
    // Define the AddressOption inner class
    public class AddressOption {
        @AuraEnabled public String full_address { get; set; }
        @AuraEnabled public String id { get; set; }

        public AddressOption(String full_address, String id) {
            this.full_address = full_address;
            this.id = id;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<AddressOption> searchAddresses(String searchTerm) {
        List<AddressOption> addresses = new List<AddressOption>();
        // Perform your address search logic here and populate 'addresses' list
        
        // Example: Dummy data for demonstration
        addresses.add(new AddressOption('1 Main St, Anytown, USA', '1'));
        addresses.add(new AddressOption('2 Elm St, Othertown, USA', '2'));
        
        return addresses;
    }
}