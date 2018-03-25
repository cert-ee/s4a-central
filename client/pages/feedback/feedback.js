export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('feedback.table.case_number'), align: 'left', value: 'case_number'},
                {text: this.$t('feedback.table.detector'), align: 'left', value: 'detector.friendly_name'},
                {text: this.$t('feedback.table.created_time'), align: 'left', value: 'created_time'},
                {text: this.$t('feedback.table.message'), align: 'left', value: 'message'},
                {text: this.$t('feedback.table.comment'), align: 'left', value: 'comment'},
                {text: this.$t('feedback.table.internal_comment'), align: 'left', value: 'internal_comment'},
                {text: this.$t('feedback.table.solved'), align: 'left', value: 'solvedStr'}
            ],
            feedbackAll: [],
            selectedFeedbacks: []
        }
    },

    computed: {
        search: {
            get() {
                return this.$store.state.feedback.search;
            },
            set(value) {
                this.$store.commit('feedback/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.feedback.pagination;
            },
            set(value) {
                this.$store.commit('feedback/setPagination', value);
            }
        },

        solvedFilter: {
            get() { return this.$store.state.feedback.solvedFilter; },
            set(value) { this.$store.commit('feedback/setSolvedFilter', value); }
        },

        feedback() {
            let feedbacks = this.feedbackAll;
            if (!feedbacks || !feedbacks.length) return [];

            if (this.solvedFilter) {
                feedbacks = feedbacks.filter(f => f.solvedStr === this.solvedFilter);
            }

            return feedbacks;
        }
    },

    methods: {
        async toggleSolved(value) {
            try {
                let promises = [];

                for (let feedback of this.selectedFeedbacks) {
                    promises.push(this.$axios.patch(`feedbacks/${feedback.id}`, {solved: value}));
                    feedback.solved = value;
                    feedback.solvedStr = value ? this.$t('feedback.table.yes') : this.$t('feedback.table.no');
                }

                await Promise.all(promises);
                this.selectedFeedbacks = [];
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {include: 'detector'}};
            let feedbackAll = await $axios.$get('feedbacks', {params});

            for (let feedback of feedbackAll) {
                feedback.solvedStr = feedback.solved ? i18n.t('feedback.table.yes') : i18n.t('feedback.table.no');
            }

            return {feedbackAll};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}