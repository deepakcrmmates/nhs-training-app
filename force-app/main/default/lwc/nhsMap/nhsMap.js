import { LightningElement, api, track } from 'lwc';
import resolveProvider from '@salesforce/apex/MapProviderResolver.resolve';
import incrementMapboxCounter from '@salesforce/apex/MapProviderResolver.incrementMapboxCounter';

export default class NhsMap extends LightningElement {
    @api markers = [];
    @api center;
    @api zoom = 11;
    @api drawRadius = null;
    @api drawRoutes = false;
    @api mapStyle = 'streets-v12';

    @track providerInfo = null;
    @track providerError = '';
    @track iframeReady = false;

    _listenerAttached = false;
    _pendingMarkers = null;
    _incrementedOnce = false;

    connectedCallback() {
        this.loadProvider();
        if (!this._listenerAttached) {
            window.addEventListener('message', this.handleIframeMessage);
            this._listenerAttached = true;
        }
    }

    disconnectedCallback() {
        if (this._listenerAttached) {
            window.removeEventListener('message', this.handleIframeMessage);
            this._listenerAttached = false;
        }
    }

    async loadProvider() {
        try {
            this.providerInfo = await resolveProvider();
        } catch (e) {
            this.providerError = e.body?.message || e.message || 'Failed to resolve map provider';
            this.providerInfo = { provider: 'Google Maps' };
        }
    }

    get iframeSrc() {
        if (!this.providerInfo?.token || !this.center) return '';
        const params = new URLSearchParams({
            token: this.providerInfo.token,
            lat: String(this.center.lat),
            lng: String(this.center.lng),
            zoom: String(this.zoom),
            style: this.mapStyle
        });
        if (this.drawRadius) params.set('radius', String(this.drawRadius));
        if (this.drawRoutes) params.set('routes', '1');
        if (this.markers && this.markers.length) {
            const simplified = this.markers.map(m => ({
                id: m.id,
                lat: Number(m.lat),
                lng: Number(m.lng),
                t: m.title || '',
                d: m.description || '',
                c: m.color || null,
                p: m.isProperty ? 1 : 0,
                l: m.label || ''
            }));
            try {
                params.set('markers', btoa(unescape(encodeURIComponent(JSON.stringify(simplified)))));
            } catch (e) {
                // Markers payload too large or encoding fail — markers will come via postMessage
            }
        }
        return '/apex/MapboxMap?' + params.toString();
    }

    renderedCallback() {
        if (this.isMapbox && this.iframeReady && this.markers.length) {
            this.pushMarkersToIframe();
        }
    }

    handleIframeMessage = (evt) => {
        const data = evt.data || {};
        if (data.source !== 'nhsMapbox') return;
        if (data.type === 'ready') {
            this.iframeReady = true;
            this.pushMarkersToIframe();
            if (!this._incrementedOnce) {
                this._incrementedOnce = true;
                incrementMapboxCounter().catch(() => {});
            }
        } else if (data.type === 'markerclick') {
            this.dispatchEvent(new CustomEvent('markerclick', { detail: { id: data.id } }));
        }
    };

    pushMarkersToIframe() {
        const iframe = this.template.querySelector('iframe.mapbox-frame');
        if (!iframe || !iframe.contentWindow) return;
        iframe.contentWindow.postMessage({
            source: 'nhsMapboxParent',
            type: 'setMarkers',
            markers: (this.markers || []).map(m => ({
                id: m.id,
                lat: Number(m.lat),
                lng: Number(m.lng),
                title: m.title || '',
                description: m.description || '',
                color: m.color || null,
                isProperty: !!m.isProperty
            }))
        }, '*');
    }

    // ── Getters ──
    get isGoogleMaps() { return this.providerInfo?.provider === 'Google Maps'; }
    get isMapbox() { return this.providerInfo?.provider === 'Mapbox' && this.iframeSrc; }
    get isLoading() { return !this.providerInfo; }

    get googleMarkers() {
        return (this.markers || []).map(m => {
            if (m.lat == null || m.lng == null) return null;
            return {
                location: { Latitude: Number(m.lat), Longitude: Number(m.lng) },
                title: m.title || '',
                description: m.description || '',
                mapIcon: {
                    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
                    fillColor: m.color || (m.isProperty ? '#4A6B5E' : '#2563EB'),
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                    scale: m.isProperty ? 1.2 : 1.0
                }
            };
        }).filter(Boolean);
    }

    get googleCenter() {
        return this.center ? { location: { Latitude: Number(this.center.lat), Longitude: Number(this.center.lng) } } : null;
    }

    get fallbackMessage() { return this.providerInfo?.fallbackReason || this.providerError || ''; }
    get providerLabel() { return this.providerInfo?.provider || ''; }
}
