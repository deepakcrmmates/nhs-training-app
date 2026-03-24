import { LightningElement, wire, track } from 'lwc';
import getOpportunities from '@salesforce/apex/KanbanController.getOpportunities';

export default class OpportunityKanbanDemo extends LightningElement {

    @track opportunities = [];

    // 🔥 Mapping (Adapter)
   mapping = {
    id: 'Id',
    title: 'Name',
    stage: 'StageName',
    amount: 'Amount',
    createdDate: 'CreatedDate'
};

    // 🔥 Config (Behavior Engine)
    kanbanConfig = {
        enableSearch: true,
        enableSort: true,
        enableDragDrop: true,
        enableInfiniteScroll: true,
        enableHighlight: true,

        sortConfig: {
            field: 'amount',
            direction: 'desc'
        },

        highlightRules: [
            {
                field: 'amount',
                operator: '>',
                value: 100000,
                class: 'high-amount'
            },
            {
                field: 'amount',
                operator: '>',
                value: 50000,
                class: 'medium-amount'
            },
            {
                field: 'createdDate',
                condition: (date) => {
                    const days = (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24);
                    return days > 7;
                },
                class: 'old-record'
            }
        ]
    };

    // 🔥 Data Fetch
    @wire(getOpportunities)
    wiredData({ data, error }) {
        if (data) {
            this.opportunities = data;
        } else if (error) {
            console.error(error);
        }
    }
}