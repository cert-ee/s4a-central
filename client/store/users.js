export function state() {
    return {
        list: [],
        search: '',
        logSearch: '',
        pagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'username'
        },
        logPagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'time'
        }
    };
}

export const mutations = {
    set(state, users) {
        state.list = users;
    },

    setSearch(state, value) {
        state.search = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    },

    setLogSearch(state, value) {
        state.logSearch = value;
    },

    setLogPagination(state, value) {
        state.logPagination = value;
    }
};