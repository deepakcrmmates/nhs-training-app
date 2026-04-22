public class PdfGeneratorPageController {

    public Opportunity opp { get; set; }
    public String alcdDisplay { get; set; }
    public String generatedDate { get; set; }

    public PdfGeneratorPageController() {
        generatedDate = DateTime.now().format('dd/MM/yyyy');
        String recordId = ApexPages.currentPage().getParameters().get('id');
        if (String.isNotBlank(recordId)) {
            opp = [SELECT Id, Name,
                House_Builder__r.Name, House_Builder__r.Use_Timeline_Valuations__c,
                Property_Address__c,
                Vendor_1__r.Name, Vendor_1_Mobile__c, Vendor_1_Phone__c, Vendor_1_Email__c,
                Date_of_Application_Received__c, Notes__c, Development__c, Plot__c,
                Client_Expectations__c, ETA_Comp_End__c, Scheme__c, NHS_Process__c,
                Agent_1__r.Name, Agent_1_Phone__c, Agent_1_Email__c, Agent_1_Appointment__c,
                Agent_1_Emailed__c, Agent_1_Verbally_Confirmed__c,
                Agent_1_Initial_Asking_Price__c, Agent_1_Target_Sale__c, Agent_1_Bottom_Line__c,
                Agent_1_Open_Market__c, Agent_1_6_8_Week__c, Agent_1_4_6_Week__c, Agent_1_2_4_Week__c,
                Agent_2__r.Name, Agent_2_Phone__c, Agent_2_Email__c, Agent_2_Appointment__c,
                Agent_2_Agent_Emailed__c, Agent_2_Verbally_Confirmed__c,
                Agent_2_Initial_Asking_Price__c, Agent_2_Target_Sale__c, Agent_2_Bottom_Line__c,
                Agent_2_Open_Market__c, Agent_2_6_8_Week__c, Agent_2_4_6_Week__c, Agent_2_2_4_Week__c,
                Agent_3__r.Name, Agent_3_Phone__c, Agent_3_Email__c, Agent_3_Appointment__c,
                Agent_3_Agent_Emailed__c, Agent_3_Verbally_Confirmed__c,
                Agent_3_Initial_Asking_Price__c, Agent_3_Target_Sale__c, Agent_3_Bottom_Line__c,
                Agent_3_Open_Market__c, Agent_3_6_8_Week__c, Agent_3_4_6_Week__c, Agent_3_2_4_Week__c,
                Current_Asking_Price__c, Target_Sale__c, Forced_Sale__c,
                NHS_Rec_Open_Market__c, NHS_Rec_6_8_Week__c, NHS_Rec_4_6_Week__c, NHS_Rec_2_4_Week__c
                FROM Opportunity WHERE Id = :recordId LIMIT 1];

            if (String.isNotBlank(String.valueOf(opp.ETA_Comp_End__c))) {
                alcdDisplay = String.valueOf(opp.ETA_Comp_End__c);
            } else {
                alcdDisplay = '';
            }
        }
    }

    public Boolean getIsTimelineModel() {
        return opp != null && opp.House_Builder__r != null && opp.House_Builder__r.Use_Timeline_Valuations__c == true;
    }
    public Boolean getIsStandardModel() { return !getIsTimelineModel(); }

    public String getAgent1Emailed() { return opp != null && opp.Agent_1_Emailed__c == true ? 'Yes' : 'No'; }
    public String getAgent2Emailed() { return opp != null && opp.Agent_2_Agent_Emailed__c == true ? 'Yes' : 'No'; }
    public String getAgent3Emailed() { return opp != null && opp.Agent_3_Agent_Emailed__c == true ? 'Yes' : 'No'; }
    public String getAgent1Confirmed() { return opp != null && opp.Agent_1_Verbally_Confirmed__c == true ? 'Yes' : 'No'; }
    public String getAgent2Confirmed() { return opp != null && opp.Agent_2_Verbally_Confirmed__c == true ? 'Yes' : 'No'; }
    public String getAgent3Confirmed() { return opp != null && opp.Agent_3_Verbally_Confirmed__c == true ? 'Yes' : 'No'; }
}
