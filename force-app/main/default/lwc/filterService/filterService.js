// WHY: Centralized filtering logic (no UI dependency)

export const FilterService = {

    // 🔥 Date filter (weekly/monthly)
    filterByDate(data = [], filterType, field = 'createdDate') {
        if (!filterType) return data;

        const now = new Date();

        return data.filter(item => {
            const recordDate = new Date(item[field]);

            if (filterType === 'WEEK') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return recordDate >= weekAgo;
            }

            if (filterType === 'MONTH') {
                const monthAgo = new Date();
                monthAgo.setMonth(now.getMonth() - 1);
                return recordDate >= monthAgo;
            }

            return true;
        });
    }
};