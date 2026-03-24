// WHY: Backend → UI decoupling (generic + reusable adapter)

import { FilterService } from 'c/filterService';

export const KanbanDataAdapter = {

    // 🔥 Generic Transform (mapping-driven)
    transform(records = [], mapping = {}) {
        if (!Array.isArray(records)) return [];

        return records.map(rec => ({
            id: rec[mapping.id] ?? rec.Id,
            title: rec[mapping.title] ?? rec.Name,
            stage: rec[mapping.stage],
            amount: rec[mapping.amount],
            priority: rec[mapping.priority],
            createdDate: rec[mapping.createdDate]
        }));
    },

    // 🔥 Full pipeline (transform + filter)
    transformAndFilter(records = [], config = {}, mapping = {}) {

        // 1. Transform (generic)
        let data = this.transform(records, mapping);

        // 2. Date Filter (calendar)
        if (config?.dateFilter) {
            data = FilterService.filterByDate(
                data,
                config.dateFilter,
                'createdDate'
            );
        }

        return data;
    },

    // 🔥 Group By Stage (column builder)
    groupByStage(data = []) {
        const map = {};

        data.forEach(item => {
            const stage = item.stage || 'Undefined';

            if (!map[stage]) {
                map[stage] = [];
            }

            map[stage].push(item);
        });

        return Object.keys(map).map(stage => ({
            stage,
            records: map[stage]
        }));
    }
};