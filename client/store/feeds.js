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
        feeds: []
    };
}

export const mutations = {
    setSearch(state, value) {
        state.search = value;
    },
    setPagination(state, value) {
        state.pagination = value;
    },
    addFeed(state, feed) {
        state.feeds.push(feed);
    },
    setFeeds(state, feeds) {
        state.feeds = feeds;
    },
    updateFeed(state, feed) {
        const i = state.feeds.findIndex(t => t.id === feed.id);
        Vue.set(state.feeds, i, feed);
    },
    deleteEntry(state, entry) {
        const i = state.feeds.findIndex(t => t.id === entry.id);
        Vue.delete(state.feeds, i);
    }
};