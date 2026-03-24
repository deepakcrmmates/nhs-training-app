import { LightningElement, track } from 'lwc';
export default class MainKanbanScreen extends LightningElement {
@track recordType = '';
@track flag1 = false;
@track flag2 = false;
@track flag3 = false;
@track flag4 = false;

handleTabChange(event){
 console.log('OUTPUT : ', event.target.value);
        const tabValue = event.target.value;

         if (tabValue === '1') {
            this.recordType = 'Part_Exchange_Applications';
            this.flag1 = true;
             console.log('OUTPUT :recordType ', this.recordType);
            return;
         }
         if (tabValue === '2') {
            this.recordType = 'New_Home_Sales';
             this.flag2 = true;
             console.log('OUTPUT : recordType', this.recordType);
            return;
         }
         if (tabValue === '3') {
            this.recordType = 'Assisted_Sales';
             this.flag3 = true;
             console.log('OUTPUT : recordType',this.recordType);
            return;
         }
          if (tabValue === '4') {
           
            this.flag4 = true;
             console.log('OUTPUT :recordType ', this.recordType);
            return;
         }
}
}