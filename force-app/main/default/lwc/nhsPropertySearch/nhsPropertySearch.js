import { LightningElement, track } from 'lwc';
import getGoogleMapsApiKey from '@salesforce/apex/PropertySearchController.getGoogleMapsApiKey';
import searchProperties from '@salesforce/apex/PropertySearchController.searchProperties';

export default class NhsPropertySearch extends LightningElement {
    @track postcode = '';
    @track radius = 5;
    @track properties = [];
    @track isSearching = false;
    @track errorMessage = '';
    @track searchComplete = false;
    @track selectedPropertyId = null;
    @track sortBy = 'distance';
    @track totalApplications = 0;
    @track applicationsThisMonth = 0;
    @track applicationsThisYear = 0;
    @track activeFilter = 'area'; // 'area' = all properties, 'all' = has any apps, 'month' = apps this month, 'year' = apps this year

    apiKey = '';
    mapsReady = false;
    pendingRender = null;

    get hasResults() { return this.filteredProperties.length > 0 || this.properties.length > 0; }
    get totalFound() { return this.properties.length; }
    get filteredCount() { return this.filteredProperties.length; }
    get mapPageUrl() { return '/apex/PropertySearchMap'; }

    get snapAllClass() { return 'ps-snap-item ps-snap-clickable' + (this.activeFilter === 'all' ? ' ps-snap-active' : ''); }
    get snapMonthClass() { return 'ps-snap-item ps-snap-clickable' + (this.activeFilter === 'month' ? ' ps-snap-active' : ''); }
    get snapYearClass() { return 'ps-snap-item ps-snap-clickable' + (this.activeFilter === 'year' ? ' ps-snap-active' : ''); }
    get snapAreaClass() { return 'ps-snap-item ps-snap-clickable' + (this.activeFilter === 'area' ? ' ps-snap-active' : ''); }

    get filteredProperties() {
        if (this.activeFilter === 'area') return this.properties;
        if (this.activeFilter === 'all') return this.properties.filter(p => p.applicationCount > 0);
        if (this.activeFilter === 'month') return this.properties.filter(p => p.applicationsMonth > 0);
        if (this.activeFilter === 'year') return this.properties.filter(p => p.applicationsYear > 0);
        return this.properties;
    }

    get sortedProperties() {
        const props = [...this.filteredProperties];
        if (this.sortBy === 'bedrooms') {
            props.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0));
        } else if (this.sortBy === 'epc') {
            const order = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7 };
            props.sort((a, b) => (order[a.epcRating] || 8) - (order[b.epcRating] || 8));
        }

        return props.map((p, idx) => ({
            ...p,
            number: idx + 1,
            cardClass: 'ps-card' + (p.id === this.selectedPropertyId ? ' ps-card-active' : ''),
            epcDisplay: p.epcRating || '--',
            epcClass: 'ps-icon-item' + (p.epcRating ? ' ps-epc-' + p.epcRating : ''),
            epcTooltip: p.epcRating ? 'EPC Rating: ' + p.epcRating + (p.epcScore ? ' (' + p.epcScore + ')' : '') : 'No EPC data',
            councilTaxDisplay: p.councilTaxBand || '--',
            councilTaxTooltip: p.councilTaxBand ? 'Council Tax Band ' + p.councilTaxBand : 'No council tax data',
            floodDisplay: p.floodRisk ? p.floodRisk.substring(0, 3) : '--',
            floodClass: 'ps-icon-item' + (p.floodRisk === 'High' ? ' ps-flood-high' : (p.floodRisk === 'Medium' ? ' ps-flood-med' : '')),
            floodTooltip: p.floodRisk ? 'Flood Risk: ' + p.floodRisk : 'No flood data',
            gasDisplay: p.mainsGas === 'Y' ? 'Yes' : (p.mainsGas === 'N' ? 'No' : '--'),
            gasTooltip: p.mainsGas === 'Y' ? 'Mains gas available' : (p.mainsGas === 'N' ? 'No mains gas' : 'No gas data'),
            areaDisplay: p.totalFloorArea ? p.totalFloorArea + 'm\u00B2' : '--',
            areaTooltip: p.totalFloorArea ? 'Floor area: ' + p.totalFloorArea + ' m\u00B2' : 'No area data',
            appPlural: p.applicationCount === 1 ? '' : 's',
            latestAppUrl: p.latestAppId ? '/' + p.latestAppId : null,
            propertyUrl: '/' + p.id
        }));
    }

    async connectedCallback() {
        try {
            const result = await getGoogleMapsApiKey();
            if (result.status === 'success') {
                this.apiKey = result.apiKey;
            } else {
                this.errorMessage = result.message;
            }
        } catch (e) {
            this.errorMessage = 'Failed to load API key.';
        }

        // Listen for messages from VF page
        this._messageHandler = this.handleMapMessage.bind(this);
        window.addEventListener('message', this._messageHandler);
    }

    disconnectedCallback() {
        window.removeEventListener('message', this._messageHandler);
    }

    handleMapMessage(event) {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'mapsReady') {
            this.mapsReady = true;
            if (this.pendingRender) {
                this.sendRenderMessage(this.pendingRender);
                this.pendingRender = null;
            }
        } else if (data.type === 'markerClick') {
            this.selectedPropertyId = data.propertyId;
            this.scrollToCard(data.propertyId);
        }
    }

    handlePostcodeChange(event) {
        this.postcode = event.target.value;
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }

    handleRadiusChange(event) {
        this.radius = Number(event.target.value);
    }

    handleFilterClick(event) {
        const filter = event.currentTarget.dataset.filter;
        this.activeFilter = filter;
        this.selectedPropertyId = null;
        this.rerenderMap();
    }

    handleSortChange(event) {
        this.sortBy = event.target.value;
        this.rerenderMap();
    }

    rerenderMap() {
        if (!this.mapsReady || !this._lastSearchCoords) return;
        const numbered = this.sortedProperties.map((p, idx) => ({
            ...this.filteredProperties.find(op => op.id === p.id),
            number: idx + 1
        }));
        const iframe = this.template.querySelector('.ps-map-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({
                action: 'render',
                searchLat: this._lastSearchCoords.lat,
                searchLng: this._lastSearchCoords.lng,
                radius: this.radius,
                properties: numbered
            }, '*');
        }
    }

    handleMapLoad() {
        // Send init message with API key to VF page
        const iframe = this.template.querySelector('.ps-map-iframe');
        if (iframe && this.apiKey) {
            iframe.contentWindow.postMessage({ action: 'init', apiKey: this.apiKey }, '*');
        }
    }

    async handleSearch() {
        if (!this.postcode.trim()) {
            this.errorMessage = 'Please enter a postcode.';
            return;
        }

        this.isSearching = true;
        this.errorMessage = '';
        this.searchComplete = false;
        this.properties = [];
        this.selectedPropertyId = null;

        try {
            const result = await searchProperties({
                postcode: this.postcode.trim(),
                radiusMiles: this.radius
            });

            if (result.status === 'success') {
                this.properties = result.properties || [];
                this.totalApplications = result.totalApplications || 0;
                this.applicationsThisMonth = result.applicationsThisMonth || 0;
                this.applicationsThisYear = result.applicationsThisYear || 0;
                this.searchComplete = true;

                if (this.properties.length > 0) {
                    this._lastSearchCoords = { lat: result.searchLat, lng: result.searchLng };
                    const numberedProps = this.properties.map((p, idx) => ({ ...p, number: idx + 1 }));
                    const renderData = {
                        searchLat: result.searchLat,
                        searchLng: result.searchLng,
                        radius: this.radius,
                        properties: numberedProps
                    };

                    // Wait for DOM to render the iframe
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    setTimeout(() => {
                        if (this.mapsReady) {
                            this.sendRenderMessage(renderData);
                        } else {
                            this.pendingRender = renderData;
                            // Init maps in iframe
                            const iframe = this.template.querySelector('.ps-map-iframe');
                            if (iframe && this.apiKey) {
                                iframe.contentWindow.postMessage({ action: 'init', apiKey: this.apiKey }, '*');
                            }
                        }
                    }, 300);
                }
            } else {
                this.errorMessage = result.message;
            }
        } catch (error) {
            this.errorMessage = error.body?.message || 'Search failed.';
        }

        this.isSearching = false;
    }

    sendRenderMessage(renderData) {
        const iframe = this.template.querySelector('.ps-map-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({
                action: 'render',
                ...renderData
            }, '*');
        }
    }

    handleLinkClick(event) {
        event.stopPropagation();
    }

    handleCardClick(event) {
        const propId = event.currentTarget.dataset.id;
        this.selectedPropertyId = propId;

        // Tell VF page to highlight this marker
        const iframe = this.template.querySelector('.ps-map-iframe');
        if (iframe) {
            // Send full prop data so VF can show info window
            const prop = this.properties.find(p => p.id === propId);
            iframe.contentWindow.postMessage({
                action: 'highlight',
                propertyId: propId,
                prop: prop
            }, '*');
        }
    }

    scrollToCard(propId) {
        const card = this.template.querySelector(`[data-id="${propId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
