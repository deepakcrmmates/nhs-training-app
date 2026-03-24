import { LightningElement, wire, track, api } from 'lwc';
import relatedFiles from '@salesforce/apex/propertyController.getFiles';
export default class Lightbox extends LightningElement {
@api recordId;

 @track currentPage = 1;
    imagesPerPage = 6; // 3 images per row, 2 rows per page
    @track files = [];
    error;
    @track imglist = [];
    @track isLightboxOpen = false;
    @track currentImage = {};

    connectedCallback() {
        console.log('recordId' + this.recordId);
    }

    @wire(relatedFiles, { recordId: '$recordId' })
    getFiles({ error, data }) {
        var countd = 1;
        if (data) {
            console.log('OUTPUT : data-----------=', data);

            this.files = data.map(file => {
                let isImage = ((file.ContentDocument.FileType === 'PNG') || (file.ContentDocument.FileType === 'JPG'));
                let fileUrl = `/sfc/servlet.shepherd/version/download/${file.ContentDocument.LatestPublishedVersionId}`;
                console.log('OUTPUT :  this.files8883', this.fileUrl);
                return {
                    ...file,
                    isImage,
                    fileUrl
                };
            });
            console.log('OUTPUT :  this.files', this.files);


            this.files.forEach(currentItem => {
                currentItem['id'] = countd++ ,
                    currentItem['src'] = currentItem.fileUrl,
                    currentItem['alt'] = currentItem.ContentDocument.Title
                console.log('OUTPUT : currentItem[Id] ', currentItem);
            });

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.files = undefined;
        }

    }
    get currentImages() {
        const start = (this.currentPage - 1) * this.imagesPerPage;
        const end = start + this.imagesPerPage;
        return this.files.slice(start, end);
    }

    get isPrevDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage === Math.ceil(this.files.length / this.imagesPerPage);
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
        }
    }

    nextPage() {
        if (this.currentPage < Math.ceil(this.files.length / this.imagesPerPage)) {
            this.currentPage += 1;
        }
    }



    openLightbox(event) {
        const imageId = event.target.dataset.id;
        this.currentImage = this.files.find(image => image.id == imageId);
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
        const currentIndex = this.files.findIndex(image => image.id === this.currentImage.id);
        const previousIndex = (currentIndex === 0) ? this.files.length - 1 : currentIndex - 1;
        this.currentImage = this.files[previousIndex];
    }

    showNextImage(event) {
        event.stopPropagation();
        const currentIndex = this.files.findIndex(image => image.id === this.currentImage.id);
        const nextIndex = (currentIndex === this.files.length - 1) ? 0 : currentIndex + 1;
        this.currentImage = this.files[nextIndex];
    }

}