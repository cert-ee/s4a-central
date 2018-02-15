export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: 'SID', align: 'left', value: 'sid'},
                {text: this.$t('enabled'), align: 'left', value: 'enabled'},
                {text: this.$t('rules.severity'), align: 'left', value: 'severity'},
                {text: this.$t('rules.ruleset'), align: 'left', value: 'ruleset'},
                {text: this.$t('rules.classtype'), align: 'left', value: 'classtype'},
                {text: this.$t('rules.message'), align: 'left', value: 'message'},
                {text: this.$t('menu.tags'), align: 'left', value: 'tags_changes'},
                {text: this.$t('rules.rule_data'), align: 'left', value: 'rule_data', sortable: false},
                {text: this.$t('rules.edit_rule'), align: 'left', sortable: false}
            ],
            rulesetSeverities: ['Critical', 'Major', 'Minor', 'Audit'],
            classTypeNames: [],
            tagNames: [],
            rulesAll: [],
            selectedRules: [],
            formValid: false,
            formRules: {
                required: (value) => !!value || this.$t('rules.required'),
                sid: (value) => this.$store.state.rule_sid_limit_max >= value &&
                    value >= this.$store.state.rule_sid_limit ||
                    this.$t('rules.sid_format') + " " + this.$store.state.rule_sid_limit + " " +
                    this.$t('rules.sid_format_max') + " " + this.$store.state.rule_sid_limit_max
            },
            editRule: {
                sid: '',
                classtype: '',
                severity: '',
                message: '',
                rule_data: '',
                enabled: true,
                revision: '1',
                ruleset: this.$store.state.rule_custom_name,
                tags_changes: []
            },
            ruleDataDialog: false,
            editRuleDialog: false
        };
    },

    computed: {
        drawer: {
            get() {
                return this.$store.state.drawer;
            },
            set() {
            }
        },

        search: {
            get() {
                return this.$store.state.rules.reviewSearch;
            },
            set(value) {
                this.$store.commit('rules/setReviewSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.rules.reviewPagination;
            },
            set(value) {
                this.$store.commit('rules/setReviewPagination', value);
            }
        },

        rules() {
            let rules = this.rulesAll;
            if (!rules || !rules.length) return [];
            return rules;
        }
    },

    methods: {
        async changeEnabled(rule) {
            try {
                await this.$axios.patch(`rule_drafts/${rule.id}`, {enabled: rule.enabled});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async saveTags(rule) {
            try {
                await this.$axios.patch(`rule_drafts/${rule.id}`, {tags_changes: rule.tags});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        openEditRuleDialog(rule) {
            this.ruleRef = rule;
            Object.assign(this.editRule, rule);
            delete this.editRule.created_time;
            delete this.editRule.modified_time;
            delete this.editRule.published;
            delete this.editRule.revision;
            delete this.editRule.changes_fields;
            delete this.editRule.new_rule;
            this.editRuleDialog = true;
        },

        async saveRule() {
            try {
                this.$refs.editRuleForm.validate();
                if (!this.formValid) return;
                this.editRule.enabled = !!this.editRule.enabled;
                await this.$axios.patch(`rule_drafts/${this.editRule.id}`, this.editRule);
                Object.assign(this.ruleRef, this.editRule);
                this.editRuleDialog = false;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async deleteSelectedRules() {
            try {
                let promises = [];

                for (const rule of this.selectedRules) {
                    promises.push(this.$axios.delete(`rule_drafts/${rule.id}`));
                    const index = this.rulesAll.findIndex(r => r.id === rule.id);
                    this.rulesAll.splice(index, 1);
                }

                await Promise.all(promises);
                this.selectedRules = [];
                this.$store.commit('setRulesReview', this.rulesAll.length);
                if (!this.rulesAll.length) this.$router.push('/rules');
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async publish() {
            try {
                await this.$axios.post('rule_drafts/publish');
                this.rulesAll = [];
                this.$store.commit('setRulesReview', false);
                this.$router.push('/rules');
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            let [{data: rulesAll}, {data: tagNames}, {data: classTypeNames } ] = await Promise.all([
                $axios.get('rule_drafts'), $axios.get('tags'), $axios.get('rule_classtypes')
            ]);

            for (let rule of rulesAll) {
                rule.tags = rule.tags_changes.filter(t => t.added !== false);
            }

            return {rulesAll, tagNames, classTypeNames};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}