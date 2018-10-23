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
            formValid: false,
            formFeeds: {
                required: (value) => !!value || this.$t('feeds.required'),
                //TODO check that suricata: rules, moloch: yara or wise
                // sid: (value) => this.$store.state.rule_sid_limit_max >= value &&
                //     value >= this.$store.state.rule_sid_limit ||
                //     this.$t('rules.sid_format') + " " + this.$store.state.rule_sid_limit + " " +
                //     this.$t('rules.sid_format_max') + " " + this.$store.state.rule_sid_limit_max
            },
            newFeed: {

                // name: "yara_rules_local",
                // friendly_name: "",
                // enabled: false,
                // type: "file",
                // location: "/srv/s4a-central/moloch/yara_rules_local/",
                // filename: "yara_local.txt",
                // component_name: "moloch",
                // component_type: "yara",
                // description: "Yara rules local",
                // checksum: "empty"

                name: '',
                enabled: false,
                friendly_name: '',
                description: '',
                type: '',
                location: '',
                component_name: '',
                component_type: '',
                new_feed: false,
                // message: ''
                // new_feed: false
                // rule_data: ''

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
            feedsAll: [],
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

        feeds() {
            return this.feedsAll;
        }
    },

    methods: {
        async toggleEnable(enabled) {
            try {
                let promises = [];

                for (const feed of this.selectedfeeds) {
                    promises.push(this.$axios.post('feeds/toggleEnable', {name: feed.name, enabled}));
                }

                await Promise.all(promises);
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
                    promises.push(this.$axios.post('feeds/tagAll', {name: feed.name, tag: tag.id, enabled}));
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
        openAddEditFeedDialog(feed) {
            this.$refs.addEditFeedForm.reset();

            this.$nextTick(() => {
                if (feed) {
                    this.feedRef = feed;
                    Object.assign(this.editFeed, feed);
                    this.editFeed.new_feed = false;
                    delete this.editFeed.created_time;
                    delete this.editFeed.modified_time;
                } else {
                    this.editFeed.new_feed = true;
                }

                this.addEditFeedDialog.isEditDialog = !this.editFeed.new_feed;
                this.addEditFeedDialog.open = true;
            });
        },

        async addEditFeed() {
            try {
                this.$refs.addEditFeedForm.validate();
                if (!this.formValid) return;
                this.editFeed.enabled = !!this.editFeed.enabled;
                // console.log( [ "enabled:", this.editFeed.enabled ] );
                await this.$axios.post('feeds/change', {entry: this.editFeed});
                this.addEditFeedDialog.open = false;
                if (this.editFeed.new_feed === true) {
                    this.feedsAll.push(this.editFeed);
                } else {
                    Object.assign(this.feedRef, this.editFeed);
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

            let [feedsAll, tagNames] = await Promise.all([
                $axios.$get('feeds', {params}), $axios.$get('tags')
            ]);

            for (let feed of feedsAll) {
                // feed.enabled = feed.enabled ? i18n.t('yes') : i18n.t('no');
                feed.tagsStr = feed.tags.map(t => t.name).join(', ');
            }

            return {feedsAll, tagNames};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}