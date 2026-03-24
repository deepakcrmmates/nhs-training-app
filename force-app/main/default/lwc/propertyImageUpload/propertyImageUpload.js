import { LightningElement, api, track, wire } from 'lwc';
import getPropertyImages from '@salesforce/apex/ImageController.getAllImages';
import getPropertyRecord from '@salesforce/apex/ImageController.getPropertyRecord'; 
import setPrimaryImage from '@salesforce/apex/ImageController.setPrimaryImage';

export default class PropertyImageUpload extends LightningElement {
    @api recordId;  // Property record Id
    @track images = []; // Array of image objects with id and url
    @track isLightboxOpen = false;
    @track primaryImageId = null; // ID of the selected primary image
    @track error;

    // Fetch images when the component is loaded
    @wire(getPropertyImages, { recordId: '$recordId' })
    getFiles({ error, data }) {
        if (data) {
            this.images = data.map(file => {
                let fileUrl = `/sfc/servlet.shepherd/version/download/${file.ContentDocument.LatestPublishedVersionId}`;
                console.log('Constructed File URL:', fileUrl); // Log the URL for debugging
                return {
                    id: file.Id,
                    fileUrl: fileUrl,
                    // Maintain the selected logic based on primaryImageId
                    selected: file.Id === this.primaryImageId,
                    title: file.ContentDocument.Title // Store title for alt attribute
                };
            });
            this.error = undefined; // Clear any previous errors
        } else if (error) {
            this.error = error; // Capture the error
            this.images = []; // Clear images on error
        }
    }

     // Fetch the property record to get the primary image ID
    @wire(getPropertyRecord, { recordId: '$recordId' })
    getPropertyRecord({ error, data }) {
        if (data) {
            this.primaryImageId = data.Primary_Image__c; // Assuming Primary_Image__c is the field name for primary image ID
            console.log('Fetched Primary Image ID:', this.primaryImageId);
        } else if (error) {
            console.error('Error fetching property record:', error);
        }
    }

    openLightbox() {
        this.isLightboxOpen = true;
    }

    closeLightbox() {
        this.isLightboxOpen = false;
    }

    // Method to handle image selection
    setPrimaryImage(event) {
        console.log('OUTPUT : ',event.target.dataset.id);
        this.primaryImageId = event.target.dataset.id; // Get selected ID

        // Update the selected property for images
        this.images = this.images.map(image => ({
            ...image,
            selected: image.id === this.primaryImageId // Set selected state based on primaryImageId
        }));
    }

    savePrimaryImage() {
        // Logic to save the primary image ID to the Property record
        setPrimaryImage({ propertyId: this.recordId, primaryImageId: this.primaryImageId }) // Call Apex method
            .then(() => {
                console.log('Primary Image ID saved:', this.primaryImageId);
                this.closeLightbox();
            })
            .catch(error => {
                console.error('Error saving primary image:', error);
            });
    }

    get hasImages() {
        return this.images.length > 0; // To check if images are available
    }

    get getPrimaryImageUrl() {
        // Retrieve the URL of the selected primary image
        const selectedImage = this.images.find(image => image.id === this.primaryImageId);
        return selectedImage ? selectedImage.fileUrl : null; // Return URL or null if no image is selected
    }
}