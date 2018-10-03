export function state() {
    return {
        search: '',
        onlyWithParent: false,
        onlyMissing: false,
        pagination: {
            descending: true,
            page: 1,
            rowsPerPage: 100,
            sortBy: 'modifiedAt'
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