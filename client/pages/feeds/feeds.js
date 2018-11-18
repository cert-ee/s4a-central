export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('feeds.name'), align: 'left', value: 'name'},
                {text: this.$t('feeds.enabled'), align: 'left', value: 'enabled'},
                {text: this.$t('feeds.component_name'), align: 'left', value: 'component_name'},
                {text: this.$t('feeds.tags'), align: 'left', value: 'tagsStr'},
                {text: this.$t('feeds.actions'), align: 'left', sortable: false}
            ],
            feedTypes: ['url', 'file'], //TODO load
            feedComponents: ['suricata', 'moloch'], //TODO load
            feedComponentTypes: ['rules', 'wise_ip', 'wise_url', 'wise_domain', 'yara'], //TODO load
            addEditFeedDialog: {
                open: false,
                isEditDialog: false
            },
            deleteEntryDialog: {
                open: false,
                title: ""
            },
            deleteEntry: {},
            formValid: false,
            formFeeds: {
                required: (value) => !!value || this.$t('feeds.required'),
            },
            editFeed: {
                name: '',
                enabled: false,
                friendly_name: '',
                description: '',
                type: '',
                location: '',
                component_name: '',
                component_type: '',
                new_feed: false
            },
            tagNames: [],
            selectedfeeds: []
        }
    },

    computed: {
        search: {
            get() {
                return this.$store.state.feeds.search;
            },
            set(value) {
                this.$store.commit('feeds/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.feeds.pagination;
            },
            set(value) {
                this.$store.commit('feeds/setPagination', value);
            }
        },

        feeds: {
            get() {
                return this.$store.state.feeds.feeds;
            },
            set(value) {
                return this.$store.commit('components/setFeeds', value);
            }
        }
    },

    methods: {
        async toggleEnable(enabled) {
            try {
                let promises = [], feeds = [];

                for (const feed of this.selectedfeeds) {
                    let feedCopy = Object.assign({}, feed);
                    feedCopy.enabled = enabled;
                    feeds.push(feedCopy);
                    promises.push(this.$axios.post('feeds/toggleEnable', {name: feed.name, enabled: enabled}));
                }

                await Promise.all(promises);

                for (const feed of feeds) {
                    this.$store.commit('feeds/updateFeed', feed);
                }

                const text = `${enabled ? this.$t('enabled') : this.$t('disabled') }`;
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async toggleTag(tag, enabled) {
            try {
                let promises = [];

                for (const feed of this.selectedfeeds) {
                    promises.push(this.$axios.post('feeds/tagAll', {name: feed.name, tag: tag.id, enabled: enabled}));
                    const index = feed.tags.findIndex(t => t.id === tag.id);

                    if (enabled && index === -1) {
                        feed.tags.push(tag);
                    } else if (!enabled && index !== -1) {
                        feed.tags.splice(index, 1);
                    }

                    feed.tagsStr = feed.tags.map(t => t.name).join(', ');
                }

                await Promise.all(promises);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },


        async openDeleteDialog(entry) {
            this.deleteEntryDialog.open = true;
            this.deleteEntryDialog.title = entry.name;
            Object.assign(this.deleteEntry, entry);
        },

        async deleteEntryConfirm() {
            try {

                const disable_result = await this.$axios.post('feeds/toggleEnable', {
                    name: this.deleteEntry.name,
                    enabled: false
                });
                const deleted = await this.$axios.delete(`feeds/${this.deleteEntry.id}`);

                this.$store.commit('feeds/deleteEntry', this.deleteEntry);
                this.deleteEntryDialog.open = false;

                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('feeds.deleted')});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        openAddEditFeedDialog(feed) {
            this.$refs.addEditFeedForm.reset();

            this.$nextTick(() => {

                if (feed) {
                    Object.assign(this.editFeed, feed);
                    this.editFeed.new_feed = false;
                } else {
                    delete this.editFeed.id;
                    this.editFeed.new_feed = true;
                }

                delete this.editFeed.created_time;
                delete this.editFeed.modified_time;

                this.addEditFeedDialog.isEditDialog = !this.editFeed.new_feed;
                this.addEditFeedDialog.open = true;
            });
        },

        async addEditFeed() {
            try {
                this.$refs.addEditFeedForm.validate();
                if (!this.formValid) return;
                this.editFeed.enabled = !!this.editFeed.enabled;

                const changed = await this.$axios.$post('feeds/change', {entry: this.editFeed});

                this.addEditFeedDialog.open = false;
                if (this.editFeed.new_feed === true) {
                    this.$store.commit('feeds/addFeed', changed.data);
                } else {
                    this.$store.commit('feeds/updateFeed', changed.data);
                }
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('feeds.saved')});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {include: 'tags'}};

            let [feeds, tagNames] = await Promise.all([
                $axios.$get('feeds', {params}), $axios.$get('tags')
            ]);

            for (let feed of feeds) {
                // feed.enabled = feed.enabled ? i18n.t('yes') : i18n.t('no');
                feed.tagsStr = feed.tags.map(t => t.name).join(', ');
            }

            store.commit('feeds/setFeeds', feeds);

            return {tagNames};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}