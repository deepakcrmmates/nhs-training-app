import { LightningElement, track, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    "NHS_Property__c.Longitude_Latitude__Latitude__s",
    "NHS_Property__c.Longitude_Latitude__Longitude__s"
];

export default class MapViewer extends LightningElement {
    @api recordId;
    @track lat;
    @track lng;

    @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
    wiredProperty({ error, data }) {
        if (data) {
            try {
                this.lat = data.fields.Longitude_Latitude__Latitude__s.value;
                this.lng = data.fields.Longitude_Latitude__Longitude__s.value;
            } catch (e) {
                console.error("Error parsing coordinates", e);
            }
        } else if (error) {
            console.error("Error fetching record", error);
        }
    }

    get streetViewEmbedUrl() {
        return `https://www.google.com/maps/embed?pb=!4v1624967110112!6m8!1m7!1sCAoSLEFGMVFpcE1BZzZXd3JHVjZlSnh6azctcVhDR1pyN0FpdFlVVFhfR2tnUjFu!2m2!1d${this.lat}!2d${this.lng}!3f0!4f0!5f1.1924812503605782`;
    }

    get mapViewUrl() {
        return `https://www.google.com/maps?q=${this.lat},${this.lng}&hl=es;z=14&output=embed`;
    }

    loadStreetView() {
        const container = this.template.querySelector('.dynamic-streetview');
        if (!container || !window.google || !window.google.maps) return;

        const latLng = new google.maps.LatLng(this.lat, this.lng);
        new google.maps.StreetViewPanorama(container, {
            position: latLng,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
        });
    }

    handleLatChange(event) {
        this.lat = event.target.value;
        this.sendLocation();
    }

    handleLngChange(event) {
        this.lng = event.target.value;
        this.sendLocation();
    }

    sendLocation() {
        const iframe = this.template.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
                JSON.stringify({ lat: this.lat, lng: this.lng }),
                '*'
            );
        }
    }
}