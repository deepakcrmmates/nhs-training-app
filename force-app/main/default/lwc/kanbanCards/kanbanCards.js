import { LightningElement, api } from 'lwc';
import { DragDropService } from 'c/dragDropService';
import { ConfigService } from 'c/configService';

// WHY: Pure UI component (dumb component, no business logic)

export default class KanbanCard extends LightningElement {

    @api record;
    @api config;
    @api stage; // source stage (important for drag)

   get cardClass() {
    if (!this.record) return 'card';

    let classes = ['card'];

    const highlightClasses = ConfigService.getHighlightClasses(
        this.record,
        this.config
    );

    if (highlightClasses?.length) {
        classes.push(...highlightClasses);
    }

    return classes.join(' ');
}

    // 🔥 Drag start (delegated to service)
    handleDragStart() {
    if (!this.record) return;

    if (!ConfigService.isEnabled(this.config, 'enableDragDrop')) return;

    DragDropService.startDrag(this.record, this.stage);
}
}