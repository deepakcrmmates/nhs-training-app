import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class HomeButton extends NavigationMixin(LightningElement) {
  navigateToOpportunities() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Opportunity',
                actionName: 'list'
            },
            state: {
                filterName: '00BKJ0000015JKj2AM' // Replace with your list view unique name
            }
        });
    }
}