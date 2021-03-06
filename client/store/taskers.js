import Vue from 'vue';

export function state() {
    return {
        search: '',
        pagination: {
            descending: false,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'name'
        },
        taskers: []
    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },
    setPagination(state, value) {
        state.pagination = value;
    },
    setTaskers(state, taskers) {
        state.taskers = taskers;
    },
    updateTasker(state, tasker) {
        const i = state.taskers.findIndex(t => t.name === tasker.name);
        Vue.set(state.taskers, i, tasker);
    }
};