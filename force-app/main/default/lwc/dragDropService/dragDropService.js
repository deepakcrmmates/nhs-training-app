// WHY: Centralized drag-drop state manager (no UI dependency)

let dragState = {
    isDragging: false,
    data: null,
    sourceStage: null
};

export const DragDropService = {

    startDrag(record, sourceStage) {
        dragState.isDragging = true;
        dragState.data = record;
        dragState.sourceStage = sourceStage;
    },

    getDragData() {
        return dragState.data;
    },

    getSourceStage() {
        return dragState.sourceStage;
    },

    clear() {
        dragState.isDragging = false;
        dragState.data = null;
        dragState.sourceStage = null;
    },

    isDragging() {
        return dragState.isDragging;
    },

    // 🔥 FUTURE READY: validation hook
    canDrop(targetStage, config) {
        // Example: restriction logic
        if (!config?.enableDragDrop) return false;

        return true;
    }
};