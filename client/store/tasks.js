export function state() {
    return {
        search: '',
        pagination: {
            descending: true,
            page: 1,
            rowsPerPage: 100,
            sortBy: 'start_time'
        },
        taskerFilter: [],
        completedFilter: '',
        failedFilter: '',

    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    },

    setTaskerFilter(state, value) {
        state.taskerFilter = value;
    },

    setCompletedFilter(state, value) {
        state.completedFilter = value;
    },

    setFailedFilter(state, value) {
        state.failedFilter = value;
    }
};