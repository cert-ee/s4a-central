export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                { text: this.$t('name'), align: 'left', value: 'name' },
                { text: this.$t('rulesets.automatic_updates_enable_new'),
                    align: 'left', value: 'automatically_enable_new_rules', sortable: false
                },
                { text: this.$t('menu.tags'), align: 'left', value: 'tagsStr' }
            ],
            tagNames: [],
            rulesetsAll: [],
            selectedRulesets: []
        }
    },

    computed: {
        drawer: {
            get() { return this.$store.state.drawer; },
            set() {}
        },

        search: {
            get() { return this.$store.state.rulesets.search; },
            set(value) { this.$store.commit('rulesets/setSearch', value); }
        },

        pagination: {
            get() { return this.$store.state.rulesets.pagination; },
            set(value) { this.$store.commit('rulesets/setPagination', value); }
        },

        rulesets() {
            return this.rulesetsAll;
        }
    },

    methods: {
        async saveAutomaticUpdates(ruleset) {
            try {
                await this.$axios.patch(`rulesets/${ruleset.name}`,
                    {automatically_enable_new_rules: ruleset.automatically_enable_new_rules}
                );
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async toggleEnable(enabled) {
            try {
                let promises = [];

                for (const ruleset of this.selectedRulesets) {
                    promises.push(this.$axios.post('rulesets/toggleAll', {name: ruleset.name, enabled}));
                }

                await Promise.all(promises);
                const text = `${enabled ? this.$t('enabled') : this.$t('disabled') } all selected rules.`;
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async toggleTag(tag, enabled) {
            try {
                let promises = [];

                for (const ruleset of this.selectedRulesets) {
                    promises.push(this.$axios.post('rulesets/tagAll', {name: ruleset.name, tag: tag.id, enabled}));
                    const index = ruleset.tags.findIndex(t => t.id === tag.id);

                    if (enabled && index === -1) {
                        ruleset.tags.push(tag);
                    } else if (!enabled && index !== -1) {
                        ruleset.tags.splice(index, 1);
                    }

                    ruleset.tagsStr = ruleset.tags.map(t => t.name).join(', ');
                }

                await Promise.all(promises);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {include: 'tags'}};

            let [ {data: rulesetsAll}, {data: tagNames} ] = await Promise.all([
                $axios.get('rulesets', {params}), $axios.get('tags')
            ]);

            for (let ruleset of rulesetsAll) {
                ruleset.tagsStr = ruleset.tags.map(t => t.name).join(', ');
            }

            return { rulesetsAll, tagNames };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}