let throttleTimer;

export const ScrollService = {

    throttle(callback, delay = 100) {
        if (throttleTimer) return;

        throttleTimer = setTimeout(() => {
            callback();
            throttleTimer = null;
        }, delay);
    },

    getVisibleRange(scrollTop, itemHeight, containerHeight, buffer = 5) {
        const start = Math.floor(scrollTop / itemHeight) - buffer;
        const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;

        return {
            start: Math.max(0, start),
            end: start + visibleCount
        };
    }
};