import Highlight from 'vue-highlight-component';
import cronParser from 'cron-parser'

export default {
    components: {Highlight},

    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                {text: this.$t('name'), align: 'left', value: 'name'},
                {text: this.$t('enabled'), align: 'left', value: 'enabled'},
                {text: this.$t('taskers.cron_expression'), align: 'left', value: 'cron_expression'},
                {text: this.$t('taskers.actions'), align: 'left', sortable: false},
            ],
            objectDialog: {
                open: false,
                data: {}
            },
            editTaskerDialog: {
                open: false
            },
            formValid: false,
            formTaskers: {
                required: (value) => !!value || this.$t('taskers.required'),
                cron: (value) => (function () {
                    try {
                        cronParser.parseExpression(value);
                        return true;
                    } catch (err) {
                        return false;
                    }
                }
                ()) || this.$t('taskers.cron_expression_invalid'),

            },
            taskersAll: [],
            selectedtaskers: [],
            newTasker: {
                // name: '',
                // friendly_name: '',
                cron_expression: '',
            }

        }
    },

    computed: {
        search: {
            get() {
                return this.$store.state.taskers.search;
            },
            set(value) {
                this.$store.commit('taskers/setSearch', value);
            }
        },

        pagination: {
            get() {
                return this.$store.state.taskers.pagination;
            },
            set(value) {
                this.$store.commit('taskers/setPagination', value);
            }
        },

        taskers: {
            get() {
                return this.$store.state.taskers.taskers;
            },
            set(value) {
                return this.$store.commit('components/setTaskers', value);
            }
        }
    },

    methods: {

        async toggleEnable(enabled) {
            try {
                let promises = [], taskers = [];

                for (const tasker of this.selectedtaskers) {
                    let taskerCopy = Object.assign({}, tasker);
                    taskerCopy.enabled = enabled;
                    taskers.push(taskerCopy);
                    promises.push(this.$axios.post('taskers/toggleEnable', {name: tasker.name, enabled}));
                }

                await Promise.all(promises);

                for (const tasker of taskers) {
                    this.$store.commit('taskers/updateTasker', tasker);
                }

                const text = `${enabled ? this.$t('enabled') : this.$t('disabled')} all selected.`;
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async runTask(raw_tasker) {
            let tasker = Object.assign({}, raw_tasker);
            // console.log( "runTask" );
            // console.log( tasker );
            try {
                tasker.loading = true;
                this.$store.commit('taskers/updateTasker', tasker);
                let result_text = await this.$axios.post('taskers/runTask', {name: tasker.task_name});
                tasker = await this.$axios.$get(`taskers/${tasker.id}`);
                this.$store.commit('taskers/updateTasker', tasker);
                // console.log( tasker );
                // const text = "Task completed";
                // console.log( result_text );

                /*
                GET THE LAST TASK RESULT
                 */
                const params = {
                    filter:
                        {
                            completed: true,
                            order: 'completed_time DESC',
                            parent_name: tasker.name,
                            limit: 1
                        }
                };
                let last_task = await this.$axios.$get('tasks', {params});
                // console.log(last_task);

                let parsed_data = {
                    failed: last_task[0].failed,
                    logs: last_task[0].logs
                };
                // this.objectDialog.message = "";
                this.objectDialog.data = parsed_data;
                this.objectDialog.open = true;

                const text = result_text.data.message;
                this.$store.commit('showSnackbar', {type: 'success', text});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            } finally {
                tasker.loading = false;
                this.$store.commit('taskers/updateTasker', tasker);
            }
        },

        async openEditTaskerDialog(tasker) {
            this.$refs.editTaskerForm.reset();

            this.$nextTick(() => {
                if (tasker) {
                    this.taskerRef = tasker;
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
            });
        },

        async editTasker() {
            try {
                this.$refs.editTaskerForm.validate();
                if (!this.formValid) return;
                // this.newTasker.enabled = !!this.newTasker.enabled;
                // console.log( [ "enabled:", this.newTasker.enabled ] );
                // await this.$axios.post('feeds/change', { entry: this.newTasker } );
                await this.$axios.patch(`taskers/${this.newTasker.id}`,
                    {cron_expression: this.newTasker.cron_expression}
                );

                let tasker = await this.$axios.$get(`taskers/${this.newTasker.id}`);
                this.$store.commit('taskers/updateTasker', tasker);

                /*
                 RELOAD TASKER
                 */
                let reload_input = {name: tasker.name};
                await this.$axios.$post(`taskers/reloadTaskerTasks`, reload_input);

                // Object.assign(this.taskerRef, this.newTasker);
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
            const params = {filter: {}};

            // let [ taskersAll, tagNames ] = await Promise.all([
            //     $axios.$get('taskers', {params}), $axios.$get('tags')
            // ]);

            // let [ taskersAll ] = await Promise.all([
            //     $axios.$get('taskers', {params})
            // ]);

            // for (let tasker of taskersAll) {
            //     tasker.tagsStr = tasker.tags.map(t => t.name).join(', ');
            // }

            let [taskers] = await Promise.all([
                $axios.$get('taskers', {params})
            ]);

            // console.log( "debug taskers");
            // console.log( taskers );
            store.commit('taskers/setTaskers', taskers);
            // return { taskersAll, tagNames };
            // return { taskersAll };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}