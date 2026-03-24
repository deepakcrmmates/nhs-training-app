public class streetDataService {
    @Future(callout=true)
    public static void fetchStreetData(set<string> propertyIds) {
        List<NHS_Property__c> updatePropertyslist = new List<NHS_Property__c>();
        for(NHS_Property__c propert:[select id,Uprn__c,Address__Street__s,Address__PostalCode__s  from NHS_Property__c where Id in :propertyIds]){
            streetData__mdt config =  streetData__mdt.getInstance('streetApi');
            String endpoint = config.Endpoint__c;// 'https://api.data.street.co.uk/street-data-api/v2/properties/addresses?fields%5Bproperty%5D=energy_performance&tier=core';
            String apiKey = config.ApiKey__c;//'kmpxyslwBegN1nMwRsEFZWQxSgsOtWNZl_Y6z2nmEcY';
            list<string> imgList = new list<string>();
            
            try{
                
                Http http = new Http();
                HttpRequest request = new HttpRequest();
                request.setEndpoint(endpoint);
                request.setMethod('POST');
                request.setHeader('Content-Type', 'application/json');
                request.setHeader('x-api-key', apiKey);
                request.setTimeout(120000); 
                Map<String, Object> payload = new Map<String, Object>();
                
                payload.put('data', new Map<String, String>{'address' => propert.Address__Street__s, 'postcode' => propert.Address__PostalCode__s});
                
                request.setBody(JSON.serialize(payload));
                system.debug(JSON.serialize(payload));
                
                HttpResponse response = http.send(request);
                system.debug('res'+response.getBody());
                if (response.getStatusCode() == 200) {
                    
                    Map<String,Object> prop = (Map<String,Object>)System.JSON.deserializeUntyped(response.getBody());
                    system.debug('Prop--------- '+prop);
                    PropertyDataWrapper propertyData = (PropertyDataWrapper)JSON.deserialize(response.getBody(), PropertyDataWrapper.class);
                    Map<String, Object> jsonResponse = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                    system.debug('Deserialized Response: ' + jsonResponse);
                    updatePropertyData(propertyData, propert.Id, jsonResponse);
                }
            }catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
        }
    }
    
    
    @Future(callout=true)
    public static void fetchStreetDataFromUprnservice(set<string> propertyIds){
        try{
            Map<String, String> resMap = new Map<String, String>();
            
            for(NHS_Property__c property:[select id,Uprn__c,Address__Street__s,Address__PostalCode__s  from NHS_Property__c where Id in :propertyIds]){
               
                if (String.isNotBlank(property.UPRN__c)) {
                 
                    streetData__mdt config = streetData__mdt.getInstance('Get_Data_from_uprn');
                    String endpoint = config.Endpoint__c + property.UPRN__c + '?tier=core';
                    String apiKey = config.ApiKey__c;
                    
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint(endpoint);
                    request.setMethod('GET');
                    request.setHeader('Content-Type', 'application/json');
                    request.setHeader('x-api-key', apiKey);
                    request.setTimeout(120000); 
                    
                    HttpResponse response = sendHttpRequest(request);
                    
                    if (response.getStatusCode() == 200) {
                      
                        system.debug('resp--'+response.getBody());
                        PropertyDataWrapper propertyData = (PropertyDataWrapper) JSON.deserialize(response.getBody(), PropertyDataWrapper.class);
                        Map<String, Object> jsonResponse = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
                        system.debug('Deserialized Response: ' + jsonResponse);
                        updatePropertyData(propertyData, property.Id, jsonResponse);
                        resMap.put('Y', response.getBody());
                    } else {
                        resMap.put('N', response.getBody());
                    }
                } else {
                    resMap.put('N', 'UPRN is not available');
                }
            }
        }catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        } 
    }
       private static HttpResponse sendHttpRequest(HttpRequest request) {
        Http http = new Http();
        return http.send(request);
    }
    
    private static void updatePropertyData(PropertyDataWrapper propertyData, String propId,  Map<String, Object> jsonResponse) {
        try{
            
            List<NHS_Property__c> updatePropertyslist = new List<NHS_Property__c>();
            NHS_Property__c property = new NHS_Property__c(Id = propId);
            List<String> imgList = new List<String>();
         
            // Navigate to the 'transactions' list
            Map<String, Object> dataMap = (Map<String, Object>) jsonResponse.get('data');
            Map<String, Object> attributesMap = (Map<String, Object>) dataMap.get('attributes');
           
            if( attributesMap.get('transactions')!= null){
                List<Object> transactionsList = (List<Object>) attributesMap.get('transactions');
                
                // Extract the date from the first transaction (assuming there's only one)
                system.debug('transactions 2' + transactionsList.isEmpty());
                if (!transactionsList.isEmpty()) {
                    // Cast the first element of the transactionsList to a Map
                    Map<String, Object> transactions = (Map<String, Object>) transactionsList[0];
                    String dateStr = (String) transactions.get('date');
                    system.debug('dateStr' + dateStr);
                    String dateString = string.valueOf(transactions.get('date'));
                    property.Last_Transaction_Date__c = Date.valueOf(dateString);
                    
                }
            }      

        if (propertyData.data.attributes.property_type != null) {
            property.Property_Type__c = propertyData.data.attributes.property_type.value;
        }
        if (propertyData.data.attributes.tenure != null) {
            property.Tenure_Type__c = propertyData.data.attributes.tenure.tenure_type;
            
            if(propertyData.data.attributes.tenure.lease_details != null){
                if (propertyData.data.attributes.tenure.lease_details.date_of_lease != null) {
                    property.Date_of_lease__c = propertyData.data.attributes.tenure.lease_details.date_of_lease;
                }
                
                if (propertyData.data.attributes.tenure.lease_details.lease_term != null) {
                    property.Lease_Term__c = propertyData.data.attributes.tenure.lease_details.lease_term;
                }
                
                if (propertyData.data.attributes.tenure.lease_details.formatted_lease_term != null) {
                    property.Formatted_lease_term__c = propertyData.data.attributes.tenure.lease_details.formatted_lease_term;
                }
                
                if (propertyData.data.attributes.tenure.lease_details.calculated_start_of_lease != null) {
                    property.Calculated_start_of_lease__c = propertyData.data.attributes.tenure.lease_details.calculated_start_of_lease;
                }
                
                if (propertyData.data.attributes.tenure.lease_details.calculated_end_of_lease != null) {
                    property.Calculated_end_of_lease__c = propertyData.data.attributes.tenure.lease_details.calculated_end_of_lease;
                }
                
                if (propertyData.data.attributes.tenure.lease_details.lease_term_in_days != null) {
                    property.Lease_term_in_days__c = propertyData.data.attributes.tenure.lease_details.lease_term_in_days;
                }
            }
        }        
        if (propertyData.data.attributes.identities != null){
            if (propertyData.data.attributes.identities.ordnance_survey.uprn != null) {
                if(propertyData.data.attributes.identities.street_group_property_id != null){
                    property.Street_Group_Property_Id__c = propertyData.data.attributes.identities.street_group_property_id;
                }
                if (propertyData.data.attributes.identities.ordnance_survey.uprn != null) {
                    property.UPRN__c = propertyData.data.attributes.identities.ordnance_survey.uprn;
                }
                if (propertyData.data.attributes.identities.ordnance_survey.usrn != null) {
                    property.USRN__c = propertyData.data.attributes.identities.ordnance_survey.usrn;
                }
                if (propertyData.data.attributes.identities.ordnance_survey.parent_uprn != null) {
                    property.PARENT_UPRN__c = propertyData.data.attributes.identities.ordnance_survey.parent_uprn;
                }
            }
            
            if (propertyData.data.attributes.identities.royal_mail != null) {
                if (propertyData.data.attributes.identities.royal_mail.udprn != null) {
                    property.UDPRN__c = propertyData.data.attributes.identities.royal_mail.udprn;
                }
                if (propertyData.data.attributes.identities.royal_mail.umprn != null) {
                    property.UMPRN__c = propertyData.data.attributes.identities.royal_mail.umprn;
                }
            }
        }
        if (propertyData.data.attributes.location != null ) {
            if (propertyData.data.attributes.location.coordinates.latitude != null) {
                property.Longitude_Latitude__Latitude__s = propertyData.data.attributes.location.coordinates.latitude;
            }
            
            if (propertyData.data.attributes.location.coordinates.longitude != null) {
                property.Longitude_Latitude__Longitude__s = propertyData.data.attributes.location.coordinates.longitude;
            }
        }
        if (propertyData.data.attributes.council_tax != null ) {
            property.Council_Tax_Band__c = propertyData.data.attributes.council_tax.band;
            property.Council_Tax_Annual_Charges__c = propertyData.data.attributes.council_tax.current_annual_charge;
        }
        if (propertyData.data.attributes.flood_risk != null ) {
            if(propertyData.data.attributes.flood_risk.rivers_and_seas.risk != null){
                property.Flood_Risk__c = propertyData.data.attributes.flood_risk.rivers_and_seas.risk ;
            }
             if(propertyData.data.attributes.flood_risk.rivers_and_seas.risk_interpretation != null){
                property.Flood_Chance__c = propertyData.data.attributes.flood_risk.rivers_and_seas.risk_interpretation;
            }

        }
        if(propertyData.data.attributes.is_bungalow != null &&  string.valueOf(propertyData.data.attributes.is_bungalow) == 'true'){
            property.Is_Bungalow__c = true;
        }
        if (propertyData.data.attributes.internal_area_square_metres != null ) {
            property.Internal_Area_Square_Meter__c = propertyData.data.attributes.internal_area_square_metres;
        }
        if (propertyData.data.attributes.number_of_bedrooms != null ) {
            property.Number_Of_Bedrooms__c = propertyData.data.attributes.number_of_bedrooms.value;
        }
        if (propertyData.data.attributes.construction_age_band != null ) {
            property.Construction_Age_Band__c = propertyData.data.attributes.construction_age_band;
        }
        if (propertyData.data.attributes.localities != null ) {
            if (propertyData.data.attributes.localities.ward != null) {
                property.Ward__c = propertyData.data.attributes.localities.ward;
            }
            
            if (propertyData.data.attributes.localities.local_authority != null) {
                property.Local_Authority__c = propertyData.data.attributes.localities.local_authority;
            }
            
            if (propertyData.data.attributes.localities.country != null) {
                property.Country__c = propertyData.data.attributes.localities.country;
            }
            
            if (propertyData.data.attributes.localities.national_park != null) {
                property.National_Park__c = propertyData.data.attributes.localities.national_park;
            }
            
            if (propertyData.data.attributes.localities.police_force != null) {
                property.Police_Force__c = propertyData.data.attributes.localities.police_force;
            }
        }
        
        if (propertyData.data.attributes.plot != null ) {
            if(propertyData.data.attributes.plot.total_plot_area_square_metres != null){
                property.Total_Plot_Area_in_Square_Meters__c = propertyData.data.attributes.plot.total_plot_area_square_metres;
            }
            if(propertyData.data.attributes.plot.polygons != null){
                for(Polygon pg: propertyData.data.attributes.plot.polygons){
                    property.Polygon_Id__c = pg.polygon_id;
                    property.Distance_From_Property__c = pg.distance_from_property;
                }
            }
        }
       
        if (propertyData.data.attributes.energy_performance != null ) {
            if(propertyData.data.attributes.energy_performance.energy_efficiency != null){
                if(propertyData.data.attributes.energy_performance.energy_efficiency.current_rating != null && propertyData.data.attributes.energy_performance.energy_efficiency.current_rating != ''){
                    property.Current_Rating__c =propertyData.data.attributes.energy_performance.energy_efficiency.current_rating;
                }
                if(propertyData.data.attributes.energy_performance.energy_efficiency.potential_rating != null && propertyData.data.attributes.energy_performance.energy_efficiency.potential_rating != ''){
                    property.Potential_Rating__c =propertyData.data.attributes.energy_performance.energy_efficiency.potential_rating;
                }
                if(propertyData.data.attributes.energy_performance.energy_efficiency.current_efficiency != null && propertyData.data.attributes.energy_performance.energy_efficiency.current_efficiency != 0 ){
                    property.Current_Efficiency__c = propertyData.data.attributes.energy_performance.energy_efficiency.current_efficiency;
                }
                if(propertyData.data.attributes.energy_performance.energy_efficiency.potential_efficiency != null && propertyData.data.attributes.energy_performance.energy_efficiency.potential_efficiency != 0){
                    property.Potential_Efficiency__c = propertyData.data.attributes.energy_performance.energy_efficiency.potential_efficiency;
                }
            }
            if(propertyData.data.attributes.energy_performance.lmk_key != null ){
                property.LMK_Key__c =  propertyData.data.attributes.energy_performance.lmk_key;
            }
           
            if(propertyData.data.attributes.energy_performance.number_habitable_rooms!= null){
                property.Number_of_Habitable_Rooms__c = propertyData.data.attributes.energy_performance.number_habitable_rooms;
            }
            if(propertyData.data.attributes.energy_performance.expiry_date!= null){
                 property.Expiry_Date__c = propertyData.data.attributes.energy_performance.expiry_date;
            }
            if (propertyData.data.attributes.energy_performance.number_heated_rooms != null) {
                property.Number_of_Heated_Rooms__c = propertyData.data.attributes.energy_performance.number_heated_rooms;
            }
            if (propertyData.data.attributes.energy_performance.hot_water_energy_eff != null) {
                property.Hot_Water_Energy_Eff__c = propertyData.data.attributes.energy_performance.hot_water_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.extension_count != null) {
                property.Extension_Count__c = propertyData.data.attributes.energy_performance.extension_count;
            }
            
            if (propertyData.data.attributes.energy_performance.total_floor_area != null) {
                property.Total_Floor_Area__c = propertyData.data.attributes.energy_performance.total_floor_area;
            }
            
            if (propertyData.data.attributes.energy_performance.floor_level != null) {
                property.Floor_Level__c = propertyData.data.attributes.energy_performance.floor_level;
            }
            
            if (propertyData.data.attributes.energy_performance.floor_height != null) {
                property.Floor_Height__c = propertyData.data.attributes.energy_performance.floor_height;
            }
            
            if (propertyData.data.attributes.energy_performance.flat_top_storey != null) {
                property.Flat_Top_Storey__c = propertyData.data.attributes.energy_performance.flat_top_storey;
            }
            
            if (propertyData.data.attributes.energy_performance.flat_storey_count != null) {
                property.Flat_Storey_Count__c = propertyData.data.attributes.energy_performance.flat_storey_count;
            }
            
            if (propertyData.data.attributes.energy_performance.main_fuel != null) {
                property.Main_Fuel__c = propertyData.data.attributes.energy_performance.main_fuel;
            }
            
            if (propertyData.data.attributes.energy_performance.mains_gas_flag != null) {
                property.Mains_Gas_Flag__c = propertyData.data.attributes.energy_performance.mains_gas_flag;
            }
            
            if (propertyData.data.attributes.energy_performance.mainheat_description != null) {
                property.Mainheat_Description__c = propertyData.data.attributes.energy_performance.mainheat_description;
            }
            
            if (propertyData.data.attributes.energy_performance.mainheat_energy_eff != null) {
                property.Mainheat_Energy_Eff__c = propertyData.data.attributes.energy_performance.mainheat_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.main_heating_controls != null) {
                property.Main_Heating_Controls__c = propertyData.data.attributes.energy_performance.main_heating_controls;
            }
            
            if (propertyData.data.attributes.energy_performance.secondheat_description != null) {
                property.Secondheat_Description__c = propertyData.data.attributes.energy_performance.secondheat_description;
            }
            
            if (propertyData.data.attributes.energy_performance.hotwater_description != null) {
                property.Hotwater_Description__c = propertyData.data.attributes.energy_performance.hotwater_description;
            }
            
            if (propertyData.data.attributes.energy_performance.windows_description != null) {
                property.Windows_Description__c = propertyData.data.attributes.energy_performance.windows_description;
            }
            
            if (propertyData.data.attributes.energy_performance.windows_energy_eff != null) {
                property.Windows_Energy_Eff__c = propertyData.data.attributes.energy_performance.windows_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.glazed_area != null) {
                property.Glazed_Area__c = propertyData.data.attributes.energy_performance.glazed_area;
            }
            
            if (propertyData.data.attributes.energy_performance.glazed_type != null) {
                property.Glazed_Type__c = propertyData.data.attributes.energy_performance.glazed_type;
            }
            
            if (propertyData.data.attributes.energy_performance.walls_description != null) {
                property.Walls_Description__c = propertyData.data.attributes.energy_performance.walls_description;
            }
            
            if (propertyData.data.attributes.energy_performance.walls_energy_eff != null) {
                property.Walls_Energy_Eff__c = propertyData.data.attributes.energy_performance.walls_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.roof_description != null) {
                property.Roof_Description__c = propertyData.data.attributes.energy_performance.roof_description;
            }
            
            if (propertyData.data.attributes.energy_performance.roof_energy_eff != null) {
                property.Roof_Energy_Eff__c = propertyData.data.attributes.energy_performance.roof_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.floor_description != null) {
                property.Floor_Description__c = propertyData.data.attributes.energy_performance.floor_description;
            }
            
            if (propertyData.data.attributes.energy_performance.floor_energy_eff != null) {
                property.Floor_Energy_Eff__c = propertyData.data.attributes.energy_performance.floor_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.lighting_description != null) {
                property.Lighting_Description__c = propertyData.data.attributes.energy_performance.lighting_description;
            }
            
            if (propertyData.data.attributes.energy_performance.lighting_energy_eff != null) {
                property.Lighting_Energy_Eff__c = propertyData.data.attributes.energy_performance.lighting_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.sheating_energy_eff != null) {
                property.Sheating_Energy_Eff__c = propertyData.data.attributes.energy_performance.sheating_energy_eff;
            }
            
            if (propertyData.data.attributes.energy_performance.wind_turbine_count != null) {
                property.Wind_Turbine_Count__c = propertyData.data.attributes.energy_performance.wind_turbine_count;
            }
            
        if (propertyData.data.attributes.energy_performance.meta != null ) {
            if(propertyData.data.attributes.energy_performance.meta.source != null){
                property.Source__c = propertyData.data.attributes.energy_performance.meta.source;
            }
             if(propertyData.data.attributes.energy_performance.meta.data_type != null){
                property.Data_Type__c = propertyData.data.attributes.energy_performance.meta.data_type;
            }
            
        }
        if (propertyData.data.attributes.energy_performance.environmental_impact != null ) {
            if(propertyData.data.attributes.energy_performance.environmental_impact.current_impact != null){
                property.Current_Impact__c = propertyData.data.attributes.energy_performance.environmental_impact.current_impact;
            }
            if(propertyData.data.attributes.energy_performance.environmental_impact.potential_impact != null){
                property.Potential_Impact__c = propertyData.data.attributes.energy_performance.environmental_impact.potential_impact;
            }
        }

        }
       
       
        if(propertyData.data.attributes.transactions != null){
            for(TransactionWrapper ob :propertyData.data.attributes.transactions){
                property.Last_Transaction_Id__c = ob.transaction_id;
               // property.Last_Transaction_Date__c = ob.customDate;
                property.Last_Transaction_Price__c = ob.price;
            }
        }

        if (propertyData.data.attributes.nearby_listings != null && !propertyData.data.attributes.nearby_listings.sale_listings.isEmpty()) {
            SaleListing saleListing = propertyData.data.attributes.nearby_listings.sale_listings[0];
            imgList.addAll(saleListing.images);
            imgList.add(saleListing.main_image_url);
            ImageURLToFileObject.storeImages(imgList, property.Id);
        }

        update property;
		updatePropertyslist.add(property);
        
        if (!updatePropertyslist.isEmpty()) {
            update updatePropertyslist;
        }
        }catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
            }
    }

    /*----------- Wrapper class to capture response-------------------*/  
    
    public class PropertyDataWrapper {
        public Data data;
    }
    public class Data {
        public Attributes attributes;
    }
    
    public class Attributes {
        public Identities identities;
        public Location location;
        public PropertyType property_type;
        public Tenure tenure;
        public EnergyPerformance energy_performance;
        Public NearbyListing nearby_listings;
        public NofBedroom number_of_bedrooms;
        public councilTax council_tax;
        public floodRisk flood_risk;
        public IsBunglow is_bungalow;
        public integer internal_area_square_metres;
        public list<TransactionWrapper> transactions;
        public string construction_age_band;
        public Localities localities;
        public Plot plot;
        
    }
    
    public class Identities {
        public String street_group_property_id;
        public RoyalMail royal_mail;
        public OrdnanceSurvey ordnance_survey;
        
    }
    
    public class RoyalMail {
        public String udprn;
        public String umprn;
    }
    
    public class OrdnanceSurvey {
        public String uprn;
        public string parent_uprn;
        public string usrn;
    }
    public class Location{
        public Coordinates coordinates;
    }
    public class Coordinates{
        public decimal longitude;
        public decimal latitude;
    }
    
    public class PropertyType {
        public String value;       
    }
    
    public class Tenure {
        public String tenure_type;
        public LeaseDetail lease_details;
    }
    public class LeaseDetail {
        public date date_of_lease;
        public string lease_term;
        public string formatted_lease_term;
        public date calculated_start_of_lease;
        public date calculated_end_of_lease;
        public integer lease_term_in_days;
    }
    public class EnergyPerformance {
        public string lmk_key;
        public date lodgement_date;
        public date expiry_date;
        public string number_habitable_rooms;
        public string number_heated_rooms;
        public string extension_count;
        public string total_floor_area;
        public string floor_level;
        public string floor_height;
        public string flat_top_storey;
        public string flat_storey_count;
        public string main_fuel;
        public string mains_gas_flag;
        public string mainheat_description;
        public string mainheat_energy_eff;
        public string main_heating_controls;
        public string secondheat_description;
        public string hotwater_description;
        public string hot_water_energy_eff;
        public string windows_description;
        public string windows_energy_eff;
        public string glazed_area;
        public string glazed_type;
        public string walls_description;
        public string walls_energy_eff;
        public string roof_description;
        public string roof_energy_eff;
        public string floor_description;
        public string floor_energy_eff;
        public string lighting_description;
        public string lighting_energy_eff;
        public string sheating_energy_eff;
        public string wind_turbine_count;
        
        public EnvironmentalImpact environmental_impact;
        public EnergyEfficiency energy_efficiency;
        public Meta meta;
    }
    
    public class EnvironmentalImpact {
        public string current_impact;
        public string potential_impact;
    }
    
    public class EnergyEfficiency {
        public String current_rating;
        public String potential_rating;
        public Integer current_efficiency;
        public Integer potential_efficiency;
    }
    public class Meta{
        public string data_type;
        public string source;
        public string attribution_string;
    }
    
    public class NearbyListing {
        public List<SaleListing> sale_listings ;
    }
    public class SaleListing {
        public String main_image_url ;
        public List<String> images ;
    }
    public class NofBedroom{
        public integer value;
    }
    public class councilTax{
        public string band;
        public double current_annual_charge;
    }
    
    public class floodRisk{
        public riverAndSeas rivers_and_seas;
    }
    public class riverAndSeas{
        public string risk;
        public string risk_interpretation;
    }
    public class IsBunglow{
        public boolean value;
    }
    
    public class TransactionWrapper {
        // Properties corresponding to the transaction fields
        public String transaction_id;
        @JsonProperty('date') public Date customDate;
        public Decimal price;
        public Boolean isNewBuild;
        
    }
    public class Localities{
        public string ward;
        public string local_authority;
        public string country;
        public string national_park;
        public string police_force;
    }
    
    public class Plot{
        public integer total_plot_area_square_metres;
        public Polygon[] polygons;
    }
    public class Polygon{
        public string polygon_id;
        public string distance_from_property;
    }

}