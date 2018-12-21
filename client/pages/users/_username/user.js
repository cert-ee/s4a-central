export default {
    validate({params}) {
        return params.username;
    },

    data() {
        return {
            apiKey: false,
            search: '',
            logSearch: '',
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            logRowsPerPage: [50, 100, {text: 'All', value: -1}],
            pagination: {rowsPerPage: 50},
            logPagination: {rowsPerPage: 50},
            headers: [
                {text: 'Role Name', align: 'left', value: 'name'},
                {text: 'Description', align: 'left', value: 'description'},
                {text: 'Active', align: 'left', value: 'active'}
            ],
            logHeaders: [
                {text: 'Time', align: 'left', value: 'time'},
                {text: 'User', align: 'left', value: 'user'},
                {text: 'Message', align: 'left', value: 'msg'}
            ],
            user: {},
            roles: [],
            log: [],
            password: '',
            passwordVisible: false
        }
    },

    methods: {
        async showApiKey() {
            try {
                let params = {user_id: this.user.id};
                let result = await this.$axios.$post('users/currentToken', params);
                this.apiKey = result.token;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async renewApiKey() {
            try {
                let params = {user_id: this.user.id};
                let result = await this.$axios.$post('users/renewToken', params);
                this.apiKey = result.token;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async toggleRole(role, active) {
            try {
                if (this.user.username == "admin") {
                    console.log(this.user.username)
                    this.$store.dispatch('handleError', {message: "Please do not edit the builtin user"});
                    return;
                }

                if (active) {
                    const roleMapping = {
                        principalType: 'USER',
                        principalId: this.user.id,
                        roleId: role.id
                    };

                    await this.$axios.post(`roles/${role.id}/principals`, roleMapping);
                } else {
                    await this.$axios.delete(`roles/${role.id}/users/rel/${this.user.id}`);
                }
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async updatePassword() {
            if (!this.password) return this.$store.commit('showSnackbar', {
                type: 'error', text: 'Please enter a password.'
            });

            try {
                await this.$axios.post('users/updatePassword', {username: this.user.username, password: this.password});
                this.$store.commit('showSnackbar', {type: 'success', text: 'Password changed successfully.'});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({params, store, error, app: {$axios}}) {
        try {
            const filter = {filter: {where: {username: params.username}, include: 'roles'}};
            const rulesFilter = {filter: {where: {name: {neq: 'detector'}}}};

            const [user, roles] = await Promise.all([
                $axios.$get('users/findOne', {params: filter}), $axios.$get('roles', {params: rulesFilter})
            ]);

            if (!user || !roles || !roles.length) return error({statusCode: 404});

            for (let role of roles) {
                role.active = user.roles.some(r => r.name === role.name);
            }

            const logFilter = {
                filter: {
                    where: {
                        and: [
                            {model: 'roleMapping'},
                            {or: [{target: user.username}, {target: user.id}]}
                        ]
                    }
                }
            };

            const log = await $axios.$get('log', {params: logFilter});
            return {user, roles, log};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}