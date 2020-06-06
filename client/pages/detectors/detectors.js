export default {
    data() {
        return {
            regStatuses: ['Unapproved', 'Approved', 'Completed', 'Rejected'],
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('detectors.table.friendly_name'), align: 'left', value: 'friendly_name'},
                {text: this.$t('detectors.table.online'), align: 'left', value: 'onlineStr'},
                {text: this.$t('detectors.table.last_seen'), align: 'left', value: 'last_seen'},
                {text: this.$t('detectors.table.components'), align: 'left', value: 'componentsStatus'},
                {text: this.$t('detectors.table.updates'), align: 'left', value: 'updatesStatus'},
                {text: this.$t('detectors.table.registration_status'), align: 'left', value: 'registration_status'},
                {text: this.$t('detectors.table.version'), align: 'left', value: 'version'},
                {text: this.$t('detectors.table.tags'), align: 'left', value: 'tagsStr'},
                {text: this.$t('detectors.table.graphs'), align: 'left', sortable: false}
            ],
            tagNames: [],
            detectorsAll: [],
            refreshing: false
        };
    },

    mounted() {
        this.syncInterval = setInterval(() => {
            this.refreshDetectors();
        }, 300000);
    },

    beforeDestroy() {
        clearInterval(this.syncInterval);
    },

    computed: {
        search: {
            get() {
                return this.$store.state.detectors.search;
            },
            set(value) {
                this.$store.commit('detectors/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.detectors.pagination;
            },
            set(value) {
                this.$store.commit('detectors/setPagination', value);
            }
        },

        onlineFilter: {
            get() {
                return this.$store.state.detectors.onlineFilter;
            },
            set(value) {
                this.$store.commit('detectors/setOnlineFilter', value);
            }
        },

        componentsFilter: {
            get() {
                return this.$store.state.detectors.componentsFilter;
            },
            set(value) {
                this.$store.commit('detectors/setComponentsFilter', value);
            }
        },

        updatesFilter: {
            get() {
                return this.$store.state.detectors.updatesFilter;
            },
            set(value) {
                this.$store.commit('detectors/setUpdatesFilter', value);
            }
        },

        regStatusFilter: {
            get() {
                return this.$store.state.detectors.regStatusFilter;
            },
            set(value) {
                this.$store.commit('detectors/setRegStatusFilter', value);
            },
        },

        detectorTagFilter: {
            get() {
                return this.$store.state.detectors.detectorTagFilter;
            },
            set(value) {
                this.$store.commit('detectors/setDetectorTagFilter', value);
            }
        },

        detectors() {
            let detectors = this.detectorsAll;
            if (!detectors || !detectors.length) return [];

            if (this.onlineFilter) {
                detectors = detectors.filter(d => d.onlineStr === this.onlineFilter);
            }

            if (this.componentsFilter) {
                detectors = detectors.filter(d => d.componentsStatus === this.componentsFilter);
            }

            if (this.updatesFilter) {
                detectors = detectors.filter(d => d.updatesStatus === this.updatesFilter);
            }

            if (this.detectorTagFilter.length) {
                detectors = detectors.filter(d => d.tags.some(t => this.detectorTagFilter.includes(t.id)));
            }

            if (this.regStatusFilter.length) {
                detectors = detectors.filter(d => this.regStatusFilter.includes(d.registration_status));
            }

            return detectors;
        }
    },
    methods: {
        async refreshDetectors() {
            this.refreshing = true;

            const params = {filter: {include: 'tags'}};

            let [detectorsAll, tagNames] = await Promise.all([
                this.$axios.$get('detectors', {params}), this.$axios.$get('tags')
            ]);

            this.detectorsAll = detectorsAll;

            for (let detector of this.detectorsAll) {
                detector.onlineStr = detector.online ? this.$t('detectors.table.yes') : this.$t('detectors.table.no');
                detector.componentsStatus = detector.components_overall ? this.$t('detectors.table.ok') : this.$t('detectors.table.fail');
                detector.updatesStatus = detector.updates_overall ? this.$t('detectors.table.ok') : this.$t('detectors.table.updates');
                detector.tagsStr = detector.tags.map(t => t.name).join(', ');
            }

            setTimeout(() => {
                this.refreshing = false;
            }, 1000);
        }
    },
    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {include: 'tags'}};

            let [detectorsAll, tagNames] = await Promise.all([
                $axios.$get('detectors', {params}), $axios.$get('tags')
            ]);

            for (let detector of detectorsAll) {
                detector.onlineStr = detector.online ? i18n.t('detectors.table.yes') : i18n.t('detectors.table.no');
                detector.componentsStatus = detector.components_overall ? i18n.t('detectors.table.ok') : i18n.t('detectors.table.fail');
                detector.updatesStatus = detector.updates_overall ? i18n.t('detectors.table.ok') : i18n.t('detectors.table.updates');
                detector.tagsStr = detector.tags.map(t => t.name).join(', ');
            }

            return {detectorsAll, tagNames};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}