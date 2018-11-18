import Highlight from 'vue-highlight-component';

export default {
    components: {Highlight},

    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('tasks.start_time'), align: 'left', value: 'start_time'},
                // {text: this.$t('tasks.modified_time'), align: 'left', value: 'modified_time'},
                {text: this.$t('tasks.loading'), align: 'left', value: 'loading'},
                {text: this.$t('tasks.name'), align: 'left', value: 'name'},
                {text: this.$t('tasks.completed'), align: 'left', value: 'completed'},
                {text: this.$t('tasks.completed_time'), align: 'left', value: 'completed_time'},
                {text: this.$t('tasks.failed'), align: 'left', value: 'failed'},
                // {text: this.$t('tasks.module_name'), align: 'left', value: 'module_name'},
                // {text: this.$t('tasks.parent_name'), align: 'left', value: 'parent_name'},
                {text: this.$t('tasks.logs'), align: 'left', value: 'logs', sortable: false},
                {text: this.$t('tasks.actions'), align: 'left', sortable: false},
            ],
            objectDialog: {
                data: {},
                open: false
            },
            clear_tasks_history_button_show: false,
            taskerNames: [],
            tasksAll: [],
            totalLoading: 0,
            totalFailed: 0,
            totalCompleted: 0,
            totalQueue: 0

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

        taskerFilter: {
            get() {
                return this.$store.state.tasks.taskerFilter;
            },
            set(value) {
                this.$store.commit('tasks/setTaskerFilter', value);
            }
        },

        completedFilter: {
            get() {
                return this.$store.state.tasks.completedFilter;
            },
            set(value) {
                this.$store.commit('tasks/setCompletedFilter', value);
            }
        },

        failedFilter: {
            get() {
                return this.$store.state.tasks.failedFilter;
            },
            set(value) {
                this.$store.commit('tasks/setFailedFilter', value);
            }
        },

        tasks() {
            let tasks = this.tasksAll;
            if (!tasks || !tasks.length) return [];

            if (this.taskerFilter.length) {
                tasks = tasks.filter(r => this.taskerFilter.includes(r.parent_name));
            }
            if (this.completedFilter) {
                tasks = tasks.filter(r => r.completed === this.completedFilter);
            }
            if (this.failedFilter) {
                tasks = tasks.filter(r => r.failed === this.failedFilter);
            }

            return tasks;
        }
    },

    methods: {
        async openObjectDialog(entry) {
            this.objectDialog.data = entry.logs;
            this.objectDialog.open = true;
        },

        async clearTasksHistory() {
            try {
                const result = await this.$axios.$post('tasks/clearTasksHistory', {});
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('tasks.tasks_removed')});
                await this.loadAllTasks();
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async loadAllTasks() {
            const params = {filter: {order: 'start_time DESC'}};

            let tasksAll = await this.$axios.$get('tasks', {params});
            for (const task of tasksAll) {
                task.completed = task.completed ? this.$t('yes') : this.$t('no');
                task.failed = task.failed ? this.$t('yes') : this.$t('no');
                task.loading = task.loading ? this.$t('yes') : this.$t('no');
            }
            this.tasksAll = tasksAll;
        },

        async setLoadingFalse(raw_task) {

            let task = Object.assign({}, raw_task);
            task.completed_time = this.$moment();
            task.name = raw_task.name;
            task.loading = false;
            task.failed = true;
            task.logs = {message: "manually stopped"};

            try {
                await this.$axios.put('tasks/', task);
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('tasks.loading_set_to_false')});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async showClearTasksHistoryButton() {
            this.clear_tasks_history_button_show = true;
        }

    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            const params = {filter: {order: 'start_time DESC', limit: 1000}};

            let [tasksAll, taskerNames] = await Promise.all([
                $axios.$get('tasks', {params}),
                $axios.$get('taskers')
            ]);

            const totalLoading = tasksAll.filter(t => t.loading === true).length;
            const totalFailed = tasksAll.filter(t => t.failed === true).length;
            const totalCompleted = tasksAll.filter(t => t.completed === true).length;
            const totalQueue = tasksAll.filter(t => t.completed === false).length;

            for (const task of tasksAll) {
                task.completed = task.completed ? i18n.t('yes') : i18n.t('no');
                task.failed = task.failed ? i18n.t('yes') : i18n.t('no');
                task.loading = task.loading ? i18n.t('yes') : i18n.t('no');
            }

            return {tasksAll, taskerNames, totalLoading, totalFailed, totalCompleted, totalQueue};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}