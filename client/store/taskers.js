export function state() {
    return {
        search: '',
        onlyWithParent: false,
        onlyMissing: false,
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

    setOnlyParentSwitch(state, value) {
        state.onlyWithParent = value;
    },

    setOnlyMissingSwitch(state, value) {
        state.onlyMissing = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    }
};