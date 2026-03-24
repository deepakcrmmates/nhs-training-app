// 🔥 Default fallback config (safe baseline)
export const DEFAULT_CONFIG = {
    enableSearch: true,
    enableSort: true,
    enableDragDrop: true,
    enableInfiniteScroll: true,
    enableHighlight: true,

    highlightRules: [],
    sortConfig: {
        field: 'title',
        direction: 'asc'
    }
};

// 🔥 Central Config Engine
export const ConfigService = {

    // 1. Merge default + custom config
    mergeConfig(customConfig = {}) {
        return {
            ...DEFAULT_CONFIG,
            ...customConfig,
            highlightRules: customConfig.highlightRules || DEFAULT_CONFIG.highlightRules,
            sortConfig: {
                ...DEFAULT_CONFIG.sortConfig,
                ...(customConfig.sortConfig || {})
            }
        };
    },

    // 2. Feature toggle checker
    isEnabled(config, key) {
        return !!config?.[key];
    },

    // 3. Highlight Rule Engine
    getHighlightClasses(record, config) {
        if (!this.isEnabled(config, 'enableHighlight')) return [];

        const rules = config.highlightRules || [];
        const classes = [];

        for (let rule of rules) {
            try {
                const value = record?.[rule.field];

                // 🔥 Support multiple rule types
                if (this.evaluateCondition(value, rule)) {
                    if (rule.class) {
                        classes.push(rule.class);
                    }
                }

            } catch (e) {
                console.error('Highlight rule error:', e);
            }
        }

        return classes;
    },

    // 🔥 Generic condition evaluator (future-proof)
    evaluateCondition(value, rule) {
        if (value === undefined || value === null) return false;

        // 1. Function based
        if (typeof rule.condition === 'function') {
            return rule.condition(value);
        }

        // 2. Operator based (config driven)
        switch (rule.operator) {
            case '>': return value > rule.value;
            case '<': return value < rule.value;
            case '>=': return value >= rule.value;
            case '<=': return value <= rule.value;
            case '===': return value === rule.value;
            case '!==': return value !== rule.value;
            case 'includes': return value?.includes(rule.value);
            default: return false;
        }
    },

    // 4. Sort Engine (config driven)
    sortData(data = [], config) {
        if (!this.isEnabled(config, 'enableSort')) return data;

        const { field, direction } = config.sortConfig || {};

        return [...data].sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';

            return direction === 'asc'
                ? valA.toString().localeCompare(valB.toString())
                : valB.toString().localeCompare(valA.toString());
        });
    },

    // 5. Search Engine (config driven)
    filterData(data = [], keyword, config) {
        if (!this.isEnabled(config, 'enableSearch') || !keyword) return data;

        return data.filter(item =>
            item.title?.toLowerCase().includes(keyword)
        );
    }
};