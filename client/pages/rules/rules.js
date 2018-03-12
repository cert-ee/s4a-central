import Highlight from 'vue-highlight-component';

export default {
    components: { Highlight },

    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            rulesetSeverities: ['Critical', 'Major', 'Minor', 'Audit'],
            rulesetNames: [],
            tagNames: [],
            classTypeNames: [],
            rulesAll: [],
            selectedRules: [],
            headers: [
                {text: 'SID', align: 'left', value: 'sid'},
                {text: this.$t('enabled'), align: 'left', value: 'enabled'},
                {text: this.$t('rules.severity'), align: 'left', value: 'severity'},
                {text: this.$t('rules.revision'), align: 'left', value: 'revision'},
                {text: this.$t('rules.ruleset'), align: 'left', value: 'ruleset'},
                {text: this.$t('rules.classtype'), align: 'left', value: 'classtype'},
                {text: this.$t('message'), align: 'left', value: 'message'},
                {text: this.$t('menu.tags'), align: 'left', value: 'tagsStr'},
                {text: this.$t('rules.rule_data'), align: 'left', value: 'rule_data', sortable: false},
                {text: this.$t('edit'), align: 'left', sortable: false}
            ],
            addEditRuleDialog: {
                open: false,
                isEditDialog: false
            },
            formValid: false,
            formRules: {
                required: (value) => !!value || this.$t('rules.required'),
                sid: (value) => this.$store.state.rule_sid_limit_max >= value &&
                    value >= this.$store.state.rule_sid_limit ||
                    this.$t('rules.sid_format') + " " + this.$store.state.rule_sid_limit + " " +
                    this.$t('rules.sid_format_max') + " " + this.$store.state.rule_sid_limit_max
            },
            newRule: {
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
            ruleDataDialog: false
        }
    },

    filters: {
        formatRule(rule_data) {
            if( rule_data === undefined || rule_data === null ) return;

            const origRuleData = rule_data;
            let formattedRule = '';
            let match = rule_data.match(/\[(\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}\/\d{1,2},?)*\]/);

            if (match) {
                const i = rule_data.indexOf('[');
                formattedRule = rule_data.substring(0, i);
                const ips = match[0].split(',');

                for (const [i, ip] of ips.entries()) {
                    formattedRule += ip;
                    if (i < ips.length - 1) formattedRule += ',';
                    if (i > 0 && (i+1) % 3 === 0 || i === ips.length - 1) formattedRule += '\n';
                }
            }

            match = rule_data.indexOf('(');
            if (match === -1) return origRuleData;

            if (formattedRule.length) {
                formattedRule += rule_data.substring(rule_data.indexOf(']') + 1, match + 1) + '\n';
            } else {
                formattedRule = rule_data.substring(0, match + 1) + '\n';
            }

            rule_data = rule_data.substring(match + 1);
            const re = /\s*\w+:.+?;/g;
            let matches = [];

            while (match = re.exec(rule_data)) {
                matches.push(match);
            }

            for (let [i, match] of matches.entries()) {
                formattedRule += match[0];

                if (matches[i+1] && matches[i+1].index > match.index + match[0].length) {
                    formattedRule += rule_data.substring(match.index + match[0].length, matches[i+1].index);
                }

                formattedRule += '\n';
            }

            match = matches[matches.length-1];
            formattedRule += rule_data.substring(match.index + match[0].length);
            return formattedRule;
        },
    },

    computed: {
        search: {
            get() {
                return this.$store.state.rules.search;
            },
            set(value) {
                this.$store.commit('rules/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.rules.pagination;
            },
            set(value) {
                this.$store.commit('rules/setPagination', value);
            }
        },

        rulesetFilter: {
            get() {
                return this.$store.state.rules.rulesetFilter;
            },
            set(value) {
                this.$store.commit('rules/setRulesetFilter', value);
            }
        },

        rulesSeverityFilter: {
            get() {
                return this.$store.state.rules.rulesSeverityFilter;
            },
            set(value) {
                this.$store.commit('rules/setSeverityFilter', value);
            }
        },

        tagsFilter: {
            get() {
                return this.$store.state.rules.tagsFilter;
            },
            set(value) {
                this.$store.commit('rules/setTagsFilter', value);
            }
        },

        classtypeFilter: {
            get() {
                return this.$store.state.rules.classtypeFilter;
            },
            set(value) {
                this.$store.commit('rules/setClasstypeFilter', value);
            }
        },

        enabledFilter: {
            get() {
                return this.$store.state.rules.enabledFilter;
            },
            set(value) {
                this.$store.commit('rules/setEnabledFilter', value);
            }
        },

        rules() {
            let rules = this.rulesAll;
            if (!rules || !rules.length) return [];

            if (this.rulesSeverityFilter.length) {
                rules = rules.filter(r => this.rulesSeverityFilter.includes(r.severity));
            }

            if (this.rulesetFilter.length) {
                rules = rules.filter(r => this.rulesetFilter.includes(r.ruleset));
            }

            if (this.tagsFilter.length) {
                rules = rules.filter(r => r.tags.some(t => this.tagsFilter.includes(t.id)));
            }

            if (this.classtypeFilter.length) {
                rules = rules.filter(r => this.classtypeFilter.includes(r.classtype));
            }

            if (this.enabledFilter) {
                rules = rules.filter(r => r.enabled === this.enabledFilter);
            }

            return rules;
        }
    },

    methods: {
        async toggleTag(tag, added) {
            try {
                let changedRules = [];

                for (const rule of this.selectedRules) {
                    const changedRule = {id: rule.id, tags_changes: [{id: tag.id, name: tag.name, added}]};
                    changedRules.push(changedRule);
                }

                await this.$axios.post('rule_drafts/more', {changes: changedRules});
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('rules.saved')});
                this.$store.commit('setRulesReview', true);
                this.$store.commit('setRulesExpanded', true);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async toggleRules(value) {
            try {
                let changedRules = [];

                for (const rule of this.selectedRules) {
                    const changedRule = {id: rule.id, enabled: value};
                    changedRules.push(changedRule);
                }

                await this.$axios.post('rule_drafts/more', {changes: changedRules});
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('rules.saved')});
                this.$store.commit('setRulesReview', true);
                this.$store.commit('setRulesExpanded', true);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        openAddEditRuleDialog(rule) {
            this.$refs.addEditRuleForm.reset();

            if (rule) {
                Object.assign(this.newRule, rule);
                this.newRule.enabled = this.newRule.enabled === 'Yes';
                this.newRule.tags_changes = undefined;
                delete this.newRule.tags;
                delete this.newRule.tagsStr;
                delete this.newRule.created_time;
                delete this.newRule.modified_time;
                delete this.newRule.published;
            }

            this.addEditRuleDialog.isEditDialog = !!rule;
            this.addEditRuleDialog.open = true;
        },

        async addEditRule() {
            try {
                this.$refs.addEditRuleForm.validate();
                if (!this.formValid) return;
                this.newRule.enabled = !!this.newRule.enabled;
                await this.$axios.post('rule_drafts/more', {changes: [this.newRule]});
                this.addEditRuleDialog.open = false;
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('rules.saved')});
                this.$store.commit('setRulesReview', true);
                this.$store.commit('setRulesExpanded', true);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {include: 'tags'}};
            const origOnProgress = $axios.defaults.onDownloadProgress;
            $axios.defaults.onDownloadProgress = null; // temp disable axios progress control

            let [ rulesAll, rulesetNames, tagNames, classTypeNames ] = await Promise.all([
                $axios.$get('rules', {params}), $axios.$get('rulesets'), $axios.$get('tags'), $axios.$get('rule_classtypes')
            ]);

            if (!rulesAll || !rulesAll.length) return;

            for (const rule of rulesAll) {
                rule.enabled = rule.enabled ? i18n.t('yes') : i18n.t('no');
                rule.tagsStr = rule.tags.map(t => t.name).join(', ');
            }

            $axios.defaults.onDownloadProgress = origOnProgress; // enable axios progress control again
            return {rulesAll, rulesetNames, tagNames, classTypeNames};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}