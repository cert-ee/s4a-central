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
            feedTypes: ['url', 'file'],
            feedComponents: ['suricata', 'moloch'],
            feedComponentTypes: ['rules', 'wise_ip', 'wise_url', 'wise_domain', 'yara'],
            addEditEntryDialog: {
                open: false,
                isEditDialog: false
            },
            deleteEntryDialog: {
                open: false,
                title: ""
            },
            deleteEntry: {},
            formValid: false,
            form_entry: {
                required: (value) => !!value || this.$t('feeds.required'),
                tagger_name: (value) => /^[a-zA-Z0-9-_.]*$/.test(value) || 'Illegal characters'
            },
            entry: {
                name: '',
                enabled: false,
                friendly_name: '',
                description: '',
                type: '',
                location: '',
                location_url: '',
                location_folder: '',
                component_name: '',
                component_type: '',
                component_tag_name: '',
                new_entry: false
            },
            tagNames: [],
            selected_entries: []
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

        changeComponent() {
            if (this.entry.component_name == 'moloch') {
                this.feedComponentTypes = ['wise_ip', 'wise_url', 'wise_domain', 'yara'];
                // this.component_type = "wise_ip";
                this.component_tag_name = "";
            }
            if (this.entry.component_name == 'suricata') {
                this.feedComponentTypes = ['rules'];
                this.component_tag_name = "default";
            }
        },
        changeComponentType() {
            console.log("Change")
            if (this.entry.type == 'file' && (this.entry.location === undefined || this.entry.location.length == 0)) {
                this.entry.location = "Will be auto generated";
            }
            if (this.entry.type == 'url') {
                this.entry.location = "";
            }
        },
        async toggleEnable(enabled) {
            try {
                let promises = [], feeds = [];

                for (const feed of this.selected_entries) {
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
                let promises = [], current;

                for (const feed of this.selected_entries) {

                    current = await this.$axios.post('feeds/tagAll', {name: feed.name, tag: tag.id, enabled: enabled});
                    current = current.data.data;
                    current.tagsStr = "";
                    if (current.tags.length > 0) {
                        current.tagsStr = current.tags.map(t => t.name).join(', ');
                    }

                    this.$store.commit('feeds/updateFeed', current);
                }

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

        openAddEditEntryDialog(entry) {
            this.$refs.addEditEntryForm.reset();

            this.$nextTick(() => {

                if (entry) {
                    Object.assign(this.entry, entry);
                    this.entry.new_entry = false;
                } else {
                    delete this.entry.id;
                    this.location_folder = '';
                    this.location_url = '';
                    this.entry.new_entry = true;
                    this.entry.component_name = 'moloch';
                    this.entry.component_type = 'wise_ip';
                    this.changeComponent();
                    this.entry.type = 'file';
                    this.changeComponentType();
                }

                delete this.entry.created_time;
                delete this.entry.modified_time;

                this.addEditEntryDialog.isEditDialog = !this.entry.new_entry;
                this.addEditEntryDialog.open = true;
            });
        },

        async addEditEntry() {
            try {
                this.$refs.addEditEntryForm.validate();
                if (!this.formValid) return;
                this.entry.enabled = !!this.entry.enabled;

                if (this.entry.type == 'file') {
                    this.entry.location_folder = '';
                    this.entry.location_url = '';
                }

                if (this.entry.type == 'url') {
                    this.entry.location_folder = '';
                    this.entry.location_url = this.entry.location;
                }

                const changed = await this.$axios.$post('feeds/change', {entry: this.entry});

                changed.tagsStr = "";
                this.addEditEntryDialog.open = false;
                if (this.entry.new_entry === true) {
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

            let [entries, tagNames] = await Promise.all([
                $axios.$get('feeds', {params}), $axios.$get('tags')
            ]);

            for (let entry of entries) {
                // feed.enabled = feed.enabled ? i18n.t('yes') : i18n.t('no');
                entry.tagsStr = entry.tags.map(t => t.name).join(', ');
            }

            store.commit('feeds/setFeeds', entries);

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