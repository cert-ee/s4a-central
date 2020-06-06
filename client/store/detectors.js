export function state() {
    return {
        search: '',
        pagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'friendly_name'
        },
        onlineFilter: '',
        componentsFilter: '',
        regStatusFilter: [],
        detectorTagFilter: [],
        updatesFilter: ''
    };
}

export const mutations = {
    clearFilters(state) {
        state.search = '';
        state.onlineFilter = '';
        state.updatesFilter = '';
        state.componentsFilter = '';
        state.regStatusFilter = [];
        state.detectorTagFilter = [];

    },

    setSearch(state, value) {
        state.search = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    },

    setUpdatesFilter(state, value) {
        state.updatesFilter = value;
    },

    setOnlineFilter(state, value) {
        state.onlineFilter = value;
    },

    setComponentsFilter(state, value) {
        state.componentsFilter = value;
    },

    setRegStatusFilter(state, value) {
        state.regStatusFilter = value;
    },

    setDetectorTagFilter(state, value) {
        state.detectorTagFilter = value;
    }
};