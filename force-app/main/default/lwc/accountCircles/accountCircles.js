import { LightningElement, api } from 'lwc';

export default class AccountCircles extends LightningElement {
    @api account; // Accept a single account object

    // Object to store unique colors for each owner
    static ownerColorMap = {};

    get processedAccount() {
        if (this.account) {
            const initials = this.getInitials(this.account.Owner);
            const color = this.getColorForOwner(this.account.Owner);
            return {
                ...this.account,
                initials,
                circleStyle: `background-color: ${color};`
            };
        }
        return {};
    }

    getInitials(name) {
        return name.split(' ').map(word => word[0]).join('').toUpperCase();
    }

    getColorForOwner(ownerName) {
        // If the owner already has an assigned color, use it
        if (AccountCircles.ownerColorMap[ownerName]) {
            return AccountCircles.ownerColorMap[ownerName];
        }
        // Otherwise, generate a new color and store it
        const color = this.getRandomColor();
        AccountCircles.ownerColorMap[ownerName] = color;
        return color;
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    handleMouseOver(event) {
        const popup = event.target.nextElementSibling;
        popup.style.display = 'block';
    }

    handleMouseOut(event) {
        const popup = event.target.nextElementSibling;
        popup.style.display = 'none';
    }
}