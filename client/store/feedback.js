import { i18n } from '~/plugins/i18n';

export function state() {
    return {
        search: '',
        pagination: {
            descending: true,
            page: 1,
            rowsPerPage: 50,
            sortBy: 'created_time'
        },
        solvedFilter: i18n.t('feedback.table.no')
    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },

    setPagination(state, value) {
        state.pagination = value;
    },

    setSolvedFilter(state, value) {
        state.solvedFilter = value;
    }
};