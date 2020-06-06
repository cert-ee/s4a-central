import DashboardCard from '~/components/DashboardCard';

export default {
    components: {
        DashboardCard
    },

    data() {
        return {
            detectorsAll: [],
            onlineDetectors: 0,
            detectorsWithProblems: 0,
            unapprovedDetectors: 0,
            rule_drafts: {},
            feedbackTotalCount: 0,
            unsolvedFeedbackCount: 0,
            refreshing: false
        };
    },

    mounted() {
        this.syncInterval = setInterval(() => {
            this.refreshDashboard();
        }, 5000);
    },

    beforeDestroy() {
        clearInterval(this.syncInterval);
    },

    methods: {
        async refreshDashboard() {
            this.refreshing = true;

            let [ detectorsAll, rule_drafts, feedbacks ] = await Promise.all([
                this.$axios.$get('detectors'), this.$axios.$get('rule_drafts/count'), this.$axios.$get('feedbacks')
            ]);

            this.detectorsAll = detectorsAll;
            this.onlineDetectors = detectorsAll.filter(d => d.online === true).length;
            this.detectorsWithProblems = detectorsAll.filter(d => d.components_overall === false).length;
            this.unapprovedDetectors = detectorsAll.filter(d => d.registration_status === 'Unapproved').length;
            this.rule_drafts = rule_drafts;
            this.feedbackTotalCount = feedbacks.length;
            this.unsolvedFeedbackCount = feedbacks.filter(f => f.solved === false).length;

            setTimeout(() => {
                this.refreshing = false;
            }, 1000);
        },

        gotoOfflineDetectors() {
            this.$store.commit('detectors/clearFilters');
            this.$store.commit('detectors/setOnlineFilter', 'No');
            this.$router.push('/detectors');
        },

        gotoDetectorsWithProblems() {
            this.$store.commit('detectors/clearFilters');
            this.$store.commit('detectors/setComponentsFilter', 'Fail');
            this.$router.push('/detectors');
        },

        gotoUnapprovedDetectors() {
            this.$store.commit('detectors/clearFilters');
            this.$store.commit('detectors/setRegStatusFilter', ['Unapproved']);
            this.$router.push('/detectors');
        }
    },

    async asyncData({ store, error, app: {$axios} }) {
        try {
            let [ detectorsAll, rule_drafts, feedbacks ] = await Promise.all([
                $axios.$get('detectors'), $axios.$get('rule_drafts/count'), $axios.$get('feedbacks')
            ]);

            const onlineDetectors = detectorsAll.filter(d => d.online === true).length;
            const detectorsWithProblems = detectorsAll.filter(d => d.components_overall === false).length;
            const unapprovedDetectors = detectorsAll.filter(d => d.registration_status === 'Unapproved').length;
            const feedbackTotalCount = feedbacks.length;
            const unsolvedFeedbackCount = feedbacks.filter(f => f.solved === false).length;

            return {
                detectorsAll, onlineDetectors, detectorsWithProblems, unapprovedDetectors,
                rule_drafts, feedbackTotalCount, unsolvedFeedbackCount
            };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}