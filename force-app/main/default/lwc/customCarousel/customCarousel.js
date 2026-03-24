import { LightningElement, wire, track, api } from 'lwc';
import relatedFiles from '@salesforce/apex/propertyController.getFiles';
export default class CustomCarousel extends LightningElement {

@api recordId;
@track file = [{'id':0, 'src': '', 'alt':''}];

 connectedCallback() {
        console.log('recordId' + this.recordId);
    }

 @track images = [ 
        { id: 1, src: 'https://cdn.data.street.co.uk/property/images/67bcaa57-6b9c-5aca-9896-4f79d938c6b2', alt: 'Image 1' },
        { id: 2, src: 'https://cdn.data.street.co.uk/property/images/5a36b83d-06af-5133-9864-5754a466feb1', alt: 'Image 2' },
        { id: 3, src: 'https://cdn.data.street.co.uk/property/images/9034c508-f1fa-57e7-a592-08581288837a', alt: 'Image 3' },
         { id: 4, src: 'https://cdn.data.street.co.uk/property/images/67bcaa57-6b9c-5aca-9896-4f79d938c6b2', alt: 'Image 4' },
        { id: 5, src: 'https://cdn.data.street.co.uk/property/images/5a36b83d-06af-5133-9864-5754a466feb1', alt: 'Image 5' },
        { id: 6, src: 'https://cdn.data.street.co.uk/property/images/9034c508-f1fa-57e7-a592-08581288837a', alt: 'Image 6' }, 
        { id: 7, src: 'https://cdn.data.street.co.uk/property/images/67bcaa57-6b9c-5aca-9896-4f79d938c6b2', alt: 'Image 7' },
        { id: 8, src: 'https://cdn.data.street.co.uk/property/images/5a36b83d-06af-5133-9864-5754a466feb1', alt: 'Image 8' },
        { id: 9, src: 'https://cdn.data.street.co.uk/property/images/9034c508-f1fa-57e7-a592-08581288837a', alt: 'Image 9' }
        // Add more images as needed
    ];
    isLightboxOpen = false;
    currentImage = {};

    @wire(relatedFiles, { evaluatorId : 'a017Z00000WacA6QAJ'})
    wiredData({ error, data }) {
      if (data) {
        console.log('Data @@@@@@@@@@@@', data);
        var dta = data;
        var a ={};
        dta.forEach(function (itm, index){
            console.log('OUTPUT index : ',index);
           console.log('OUTPUT index : ',data);
        
        a.id += 1;
        a.src = itm;
        a.alt = a.id +''+'image';
        console.log('OUTPUT : ',a);
       // this.file.push(a);

            
        });
        console.log('OUTPUT :file ',this.file);
      } else if (error) {
         console.error('Error:', error);
      }
    }
  

    openLightbox(event) {
        const imageId = event.target.dataset.id;
        this.currentImage = this.images.find(image => image.id == imageId);
        this.isLightboxOpen = true;
    }

    closeLightbox() {
        this.isLightboxOpen = false;
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    showPreviousImage(event) {
        event.stopPropagation();
        const currentIndex = this.images.findIndex(image => image.id === this.currentImage.id);
        const previousIndex = (currentIndex === 0) ? this.images.length - 1 : currentIndex - 1;
        this.currentImage = this.images[previousIndex];
    }

    showNextImage(event) {
        event.stopPropagation();
        const currentIndex = this.images.findIndex(image => image.id === this.currentImage.id);
        const nextIndex = (currentIndex === this.images.length - 1) ? 0 : currentIndex + 1;
        this.currentImage = this.images[nextIndex];
    }
}