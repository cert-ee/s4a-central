export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('tasks.modified_time'), align: 'left', value: 'modified_time'},
                {text: this.$t('tasks.name'), align: 'left', value: 'name'},
                // {text: this.$t('tasks.run_time'), align: 'left', value: 'run_time'},
                {text: this.$t('tasks.completed'), align: 'left', value: 'completed'},
                {text: this.$t('tasks.failed'), align: 'left', value: 'failed'},
                // {text: this.$t('tasks.module_name'), align: 'left', value: 'module_name'},
                // {text: this.$t('tasks.parent_name'), align: 'left', value: 'parent_name'},
                {text: this.$t('tasks.logs'), align: 'left', value: 'logs'},
            ],
            tasksAll: [],
        }
    },

    computed: {
        search: {
            get() {
                return this.$store.state.tasks.search;
            },
            set(value) {
                this.$store.commit('tasks/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.tasks.pagination;
            },
            set(value) {
                this.$store.commit('tasks/setPagination', value);
            }
        },

        tasks() {
            return this.tasksAll;
        }
    },

    methods: {},

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {}};

            let [tasksAll] = await Promise.all([
                $axios.$get('tasks', {params})
            ]);

            return {tasksAll};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}