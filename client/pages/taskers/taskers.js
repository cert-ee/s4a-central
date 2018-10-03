export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                { text: this.$t('name'), align: 'left', value: 'name' },
                { text: this.$t('enabled'), align: 'left', value: 'enabled' },
                { text: this.$t('taskers.interval_mm'), align: 'left', value: 'interval_mm' },
                { text: this.$t('taskers.actions'), align: 'left', sortable: false },
            ],
            editTaskerDialog: {
                open: false
            },
            formValid: false,
            formTaskers: {
                required: (value) => !!value || this.$t('taskers.required'),
            },
            taskersAll: [],
            selectedtaskers: [],
            newTasker: {
                // name: '',
                // friendly_name: '',
                interval_mm: '',
            }

        }
    },

    computed: {
        search: {
            get() { return this.$store.state.taskers.search; },
            set(value) { this.$store.commit('taskers/setSearch', value); }
        },

        pagination: {
            get() { return this.$store.state.taskers.pagination; },
            set(value) { this.$store.commit('taskers/setPagination', value); }
        },

        taskers() {
            return this.taskersAll;
        }
    },

    methods: {
        async toggleEnable(enabled) {
            try {
                let promises = [];

                for (const tasker of this.selectedtaskers) {
                    promises.push(this.$axios.post('taskers/toggleEnable', {name: tasker.name, enabled}));
                }

                await Promise.all(promises);
                const text = `${enabled ? this.$t('enabled') : this.$t('disabled') } all selected.`;
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async runTask(params) {
            // let comp = Object.assign({}, component);

            try {
                //TODO loading
                // comp.loading = true;
                // this.$store.commit('components/updateComponent', comp);
                // let params = {component_name: comp.name};
                await this.$axios.post('taskers/runTask', { name: params.task_name });
                // comp = await this.$axios.$get(`components/${comp.name}`);
                const text = "Task completed";
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            } finally {
                // comp.loading = false;
                // this.$store.commit('components/updateComponent', comp);
            }
        },

        async openEditTaskerDialog(tasker) {
            this.$refs.editTaskerForm.reset();

            console.log( "OPEN");
            console.log(tasker);
            if (tasker) {
                Object.assign(this.newTasker, tasker);
                // this.newFeed.enabled = false;
                // delete this.newFeed.tags;
                // console.log( this.newFeed );
                // this.newFeed.enabled = this.newFeed.enabled === 'Yes';
                // this.newFeed.tags_changes = undefined;
                // delete this.newFeed.tagsStr;
                delete this.newTasker.created_time;
                delete this.newTasker.modified_time;
                // delete this.newFeed.published;
                // console.log( this.newFeed );
            }

            this.editTaskerDialog.open = true;
        },

        async editTasker() {
            try {
                this.$refs.editTaskerForm.validate();
                if (!this.formValid) return;
                // this.newTasker.enabled = !!this.newTasker.enabled;
                // console.log( [ "enabled:", this.newTasker.enabled ] );
                // await this.$axios.post('feeds/change', { entry: this.newTasker } );
                await this.$axios.patch(`taskers/${this.newTasker.id}`,
                    {interval_mm: this.newTasker.interval_mm}
                );
                this.editTaskerDialog.open = false;
                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('taskers.saved')});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            // const params = {filter: {include: 'tags'}};
            const params = {filter: { }};

            // let [ taskersAll, tagNames ] = await Promise.all([
            //     $axios.$get('taskers', {params}), $axios.$get('tags')
            // ]);

            let [ taskersAll ] = await Promise.all([
                $axios.$get('taskers', {params})
            ]);

            // for (let tasker of taskersAll) {
            //     tasker.tagsStr = tasker.tags.map(t => t.name).join(', ');
            // }

            // return { taskersAll, tagNames };
            return { taskersAll };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}