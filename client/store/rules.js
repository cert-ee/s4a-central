export function state() {
    return {
        search: '',
        reviewSearch: '',
        pagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: ''
        },
        reviewPagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: ''
        },
        rulesSeverityFilter: [],
        rulesetFilter: ['cert'],
        tagsFilter: [],
        classtypeFilter: [],
        enabledFilter: 'Yes'
    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },

    setReviewSearch(state, value) {
        state.reviewSearch = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    },

    setReviewPagination(state, value) {
        state.reviewPagination = value;
    },

    setSeverityFilter(state, value) {
        state.rulesSeverityFilter = value;
    },
    setRulesetFilter(state, value) {
        state.rulesetFilter = value;
    },

    setTagsFilter(state, value) {
        state.tagsFilter = value;
    },

    setClasstypeFilter(state, value) {
        state.classtypeFilter = value;
    },

    setEnabledFilter(state, value) {
        state.enabledFilter = value;
    }
};