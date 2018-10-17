export function state() {
    return {
        search: '',
        pagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'name'
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