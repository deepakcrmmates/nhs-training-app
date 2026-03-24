@isTest
public class StreetDataControllerTest {

    @isTest
    static void testFetchStreetData() {
        set<string> proSet = new set<string>();
        // Mock HTTP response for successful API call
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        NHS_Property__c pro = new NHS_Property__c();
        pro.Name = 'test';
        insert pro;
        proSet.add(pro.id);
        
          Test.startTest();
        StreetDataController.fetchStreetData('123 Test St', 'TEST123', pro.Id);
        streetDataService.fetchStreetDataFromUprnservice(proSet);
          Test.stopTest();

     
    }

    @isTest
    static void testFetchStreetDataWithError() {
        // Mock HTTP response for error scenario
        Test.setMock(HttpCalloutMock.class, new MockHttpErrorResponseGenerator());

        // Execute the method
        Map<String, String> result = StreetDataController.fetchStreetData('123 Test St', 'TEST123', '');

       
    }

    @isTest
    static void testFetchStreetDataFromUprn() {
        // Mock HTTP response for successful API call
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        
        
          NHS_Property__c pro = new NHS_Property__c();
        pro.Name = 'test';
        insert pro;
        // Execute the method
         Test.startTest();
        Map<String, String> result = StreetDataController.fetchStreetDataFromUprn('1234567890',pro.Id);
          Test.stopTest();
      
    }

    @isTest
    static void testFetchStreetDataFromUprnWithNoUprn() {
        // Execute the method with no UPRN
        Map<String, String> result = StreetDataController.fetchStreetDataFromUprn(null, 'somePropertyId');
    }

    @isTest
    static void testUpdatePropertyData() {
        // Setup mock property data
        /*
        PropertyDataWrapper mockPropertyData = new PropertyDataWrapper();
        mockPropertyData.data = new Data();
        mockPropertyData.data.attributes = new Attributes();
        mockPropertyData.data.attributes.property_type = new PropertyType();
        mockPropertyData.data.attributes.property_type.value = 'Residential';
        mockPropertyData.data.attributes.tenure = new Tenure();
        mockPropertyData.data.attributes.tenure.tenure_type = 'Freehold';
        */
        // Create a dummy NHS_Property__c record
        NHS_Property__c property = new NHS_Property__c();
        insert property;

    }

    // Mock class for successful HTTP response
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
           res.setBody('{ "data": { "attributes": { "property_type": { "value": "Residential" }, "tenure": { "tenure_type": "Freehold", "lease_details": { "date_of_lease": "2020-01-01", "lease_term": "99 years", "formatted_lease_term": "99 years", "calculated_start_of_lease": "2020-01-01", "calculated_end_of_lease": "2119-12-31", "lease_term_in_days": 36135 } }, "identities": { "street_group_property_id": "SGP12345", "royal_mail": { "udprn": "123456789", "umprn": "987654321" }, "ordnance_survey": { "uprn": "1234567890", "parent_uprn": "0987654321", "usrn": "11223344" } }, "location": { "coordinates": { "longitude": -0.123456, "latitude": 51.123456 } }, "energy_performance": { "lmk_key": "LMK123456789", "lodgement_date": "2022-01-15", "expiry_date": "2032-01-14", "number_habitable_rooms": "5", "number_heated_rooms": "5", "extension_count": "1", "total_floor_area": "120", "floor_level": "2", "floor_height": "3", "flat_top_storey": "Yes", "flat_storey_count": "3", "main_fuel": "Gas", "mains_gas_flag": "Yes", "mainheat_description": "Central Heating", "mainheat_energy_eff": "Good", "main_heating_controls": "Thermostatic Valves", "secondheat_description": "Electric", "hotwater_description": "Gas Boiler", "hot_water_energy_eff": "High", "windows_description": "Double Glazed", "windows_energy_eff": "Moderate", "glazed_area": "Full", "glazed_type": "Low-E Glass", "walls_description": "Insulated", "walls_energy_eff": "High", "roof_description": "Pitched", "roof_energy_eff": "Good", "floor_description": "Concrete", "floor_energy_eff": "Moderate", "lighting_description": "Energy-saving", "lighting_energy_eff": "High", "sheating_energy_eff": "High", "wind_turbine_count": "0", "environmental_impact": { "current_impact": "Moderate", "potential_impact": "Low" }, "energy_efficiency": { "current_rating": "B", "potential_rating": "A", "current_efficiency": 85, "potential_efficiency": 95 }, "meta": { "data_type": "Energy Performance", "source": "Government", "attribution_string": "© Crown copyright" } }, "nearby_listings": { "sale_listings": [ { "main_image_url": "http://example.com/main_image.jpg", "images": [ "http://example.com/image1.jpg", "http://example.com/image2.jpg" ] } ] }, "number_of_bedrooms": { "value": 3 }, "council_tax": { "band": "D", "current_annual_charge": 1500.5 }, "flood_risk": { "rivers_and_seas": { "risk": "Low", "risk_interpretation": "Unlikely to flood" } }, "is_bungalow": { "value": false }, "internal_area_square_metres": 110, "transactions": [ { "transaction_id": "TXN12345", "date": "2023-01-01", "price": 350000.75, "isNewBuild": true } ], "construction_age_band": "1990-2000", "localities": { "ward": "South Ward", "local_authority": "City Council", "county": "Greater County", "national_park": "None", "police_force": "Local Police" }, "plot": { "total_plot_area_square_metres": 200, "polygons": [ { "polygon_id": "POLY12345", "distance_from_property": "10m" } ] } } } }');

            
            //res.setBody('{ "data": { "attributes": { "property_type": { "value": "Residential" }, "tenure": { "tenure_type": "Freehold", "lease_details": { "date_of_lease": "2020-01-01", "lease_term": "99 years", "formatted_lease_term": "99 years", "calculated_start_of_lease": "2020-01-01", "calculated_end_of_lease": "2119-12-31", "lease_term_in_days": 36135 } }, "identities": { "street_group_property_id": "SGP12345", "royal_mail": { "udprn": "123456789", "umprn": "987654321" }, "ordnance_survey": { "uprn": "1234567890", "parent_uprn": "0987654321", "usrn": "11223344" } }, "location": { "coordinates": { "longitude": -0.123456, "latitude": 51.123456 } }, "energy_performance": { "lmk_key": "LMK123456789", "lodgement_date": "2022-01-15", "expiry_date": "2032-01-14", "number_habitable_rooms": "5", "number_heated_rooms": "5", "extension_count": "1", "total_floor_area": "120", "floor_level": "2", "floor_height": "3", "flat_top_storey": "Yes", "flat_storey_count": "3", "main_fuel": "Gas", "mains_gas_flag": "Yes", "mainheat_description": "Central Heating", "mainheat_energy_eff": "Good", "main_heating_controls": "Thermostatic Valves", "secondheat_description": "Electric", "hotwater_description": "Gas Boiler", "hot_water_energy_eff": "High", "windows_description": "Double Glazed", "windows_energy_eff": "Moderate", "glazed_area": "Full", "glazed_type": "Low-E Glass", "walls_description": "Insulated", "walls_energy_eff": "High", "roof_description": "Pitched", "roof_energy_eff": "Good", "floor_description": "Concrete", "floor_energy_eff": "Moderate", "lighting_description": "Energy-saving", "lighting_energy_eff": "High", "sheating_energy_eff": "High", "wind_turbine_count": "0", "environmental_impact": { "current_impact": "Moderate", "potential_impact": "Low" }, "energy_efficiency": { "current_rating": "B", "potential_rating": "A", "current_efficiency": 85, "potential_efficiency": 95 }, "meta": { "data_type": "Energy Performance", "source": "Government", "attribution_string": "© Crown copyright" } }, "nearby_listings": { "sale_listings": [ { "main_image_url": "http://example.com/main_image.jpg", "images": [ "http://example.com/image1.jpg", "http://example.com/image2.jpg" ] } ] }, "number_of_bedrooms": { "value": 3 }, "council_tax": { "band": "D", "current_annual_charge": 1500.5 }, "flood_risk": { "rivers_and_seas": { "risk": "Low", "risk_interpretation": "Unlikely to flood" } }, "is_bungalow": { "value": false }, "internal_area_square_metres": 110, "transactions": [ { "transaction_id": "TXN12345", "customDate": "2023-01-01", "price": 350000.75, "isNewBuild": true } ], "construction_age_band": "1990-2000", "localities": { "ward": "South Ward", "local_authority": "City Council", "county": "Greater County", "national_park": "None", "police_force": "Local Police" }, "plot": { "total_plot_area_square_metres": 200, "polygons": [ { "polygon_id": "POLY12345", "distance_from_property": "10m" } ] } } } }');
           // res.setBody('{"data": {"attributes": {"property_type": {"value": "Residential"}, "tenure": {"tenure_type": "Freehold"}, "identities": {"ordnance_survey": {"uprn": "1234567890"}}}}}}');
                       return res;
        }
    }

    // Mock class for HTTP error response
    private class MockHttpErrorResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(404);
            res.setBody('{"error": "Not Found"}');
            return res;
        }
    }
}