import { LightningElement, api, track } from 'lwc';

export default class InitialsCircle extends LightningElement {
    @api name;
    @track initials;
    @track showFullName = false;
    @track circleClass;

    connectedCallback() {
        this.circleClass = `circle ${this.getRandomColorClass()}`;
        this.initials = this.getInitials(this.name);
    }

    // Function to get a random color class
    getRandomColorClass() {
        const colors = [
            'circle-red', 'circle-green', 'circle-blue', 'circle-yellow',
            'circle-orange', 'circle-purple', 'circle-pink', 'circle-brown',
            'circle-grey', 'circle-black', 'circle-rose'
        ];
        const randomIndex = Math.floor(Math.random() * colors.length);
        return colors[randomIndex];
    }

    // Function to get initials from a name
    getInitials(name) {
        if (!name) {
            return '';
        }
        const nameArray = name.trim().split(' ');
        const initials = nameArray.map(word => word.charAt(0).toUpperCase()).join('');
        return initials;
    }

    // Show popup on hover
    showPopup() {
        this.showFullName = true;
    }

    // Hide popup when not hovering
    hidePopup() {
        this.showFullName = false;
    }
}