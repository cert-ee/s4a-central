export function state() {
    return {
        search: '',
        onlyWithParent: false,
        onlyMissing: false,
        pagination: {
            descending: true,
            page: 1,
            rowsPerPage: 100,
            sortBy: 'modified_time'
        }
    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    }
};