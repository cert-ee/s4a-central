export default {
    validate({ params }) {
        return params.id;
    },

    data() {
        return {
            feedback: {},
            search: '',
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            pagination: {
                descending: false,
                page: 1,
                rowsPerPage: 50,
                sortBy: ''
            },
            disksHeaders: [
                {text: this.$t("feedback.disk_mount"), align: 'left', value: 'mount'},
                {text: this.$t("feedback.disk_part"), align: 'left', value: 'part'},
                {text: this.$t("feedback.disk_type"), align: 'left', value: 'type'},
                {text: this.$t("feedback.disk_size"), align: 'left', value: 'size'},
                {text: this.$t("feedback.disk_free"), align: 'left', value: 'free'},
            ],
            interfacesHeaders: [
                {text: this.$t("feedback.net_name"), align: 'left', value: 'name'},
                {text: this.$t("feedback.net_state"), align: 'left', value: 'state'},
                {text: this.$t("feedback.net_ip"), align: 'left', value: 'ip'}
            ],
            componentsHeaders: [
                { text: 'Name', align: 'left', value: 'friendly_name' },
                { text: 'Status', align: 'left', value: 'statusStr' },
                { text: 'Message', align: 'left', value: 'message' },
                { text: 'Logs', align: 'left', sortable: false },
                { text: 'Error Logs', align: 'left', sortable: false }
            ],
            log: { name: '', data: '' },
            logDialog: false
        }
    },

    filters: {
        kbytesToSize(kbytes) {
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (kbytes === 0) return 'n/a';
            kbytes *= 1024;
            const i = parseInt(Math.floor(Math.log(kbytes) / Math.log(1024)), 10);
            if (i === 0) return `${kbytes} ${sizes[i]})`;
            return `${(kbytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
        }
    },

    methods: {
        async toggleSolved(value) {
            try {
                await this.$axios.patch(`feedbacks/${this.feedback.id}`, {solved: value});
                this.feedback.solved = value;
                this.feedback.solvedStr = value ? this.$t('feedback.table.yes') : this.$t('feedback.table.no');
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async saveInternalComment() {
            try {
                await this.$axios.patch(`feedbacks/${this.feedback.id}`, {
                    internal_comment: this.feedback.internal_comment
                });
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData ({ params, store, error, app: {$axios, i18n} }) {
        try {
            const include = {filter: {include: 'detector'}};
            let feedback = await $axios.$get(`feedbacks/${params.id}`, {params: include});
            if (!feedback) return error({statusCode: 404, message: 'Not Found'});

            try {
                feedback.logs = JSON.stringify(feedback.logs, null, 2);
            } catch(err) {
                feedback.logs = "BROKEN JSON ... " + feedback.logs
            }

            feedback.solvedStr = feedback.solved ? i18n.t('feedback.table.yes') : i18n.t('feedback.table.no');

            for (let component of feedback.components) {
                component.statusStr = component.status ? i18n.t('ok') : i18n.t('fail');
            }

			return {feedback};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}
