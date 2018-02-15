export default {
    validate({ params }) {
        return params.username;
    },

    data() {
        return {
            search: '',
            logSearch: '',
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            logRowsPerPage: [50, 100, {text: 'All', value: -1}],
            pagination: {rowsPerPage: 50},
            logPagination: {rowsPerPage: 50},
            headers: [
                { text: 'Role Name', align: 'left', value: 'name' },
                { text: 'Description', align: 'left', value: 'description' },
                { text: 'Active', align: 'left', value: 'active' }
            ],
            logHeaders: [
                { text: 'Time', align: 'left', value: 'time' },
                { text: 'User', align: 'left', value: 'user' },
                { text: 'Message', align: 'left', value: 'msg' }
            ],
            user: {},
            roles: [],
            log: [],
            password: '',
            passwordVisible: false
        }
    },

    computed: {
        drawer: {
            get() { return this.$store.state.drawer; },
            set() {}
        }
    },

    methods: {
        async toggleRole(role, active) {
            try {
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
                this.errorText = err.message;
                this.errorSnack = true;
            }
        },

        async updatePassword() {
            if (!this.password) return this.$store.commit('showSnackbar', {
                type: 'error', text: 'Please enter a password.'
            });

            try {
                await this.$axios.post('users/updatePassword', { username: this.user.username, password: this.password} );
                this.$store.commit('showSnackbar', {type: 'success', text: 'Password changed successfully.'});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({ params, store, error, app: {$axios} }) {
        try {

            const filter = { filter: {where: {username: params.username}, include: 'roles'} };
            const userPromise = $axios.get('users/findOne', {params: filter});
            const rulesFilter = { filter: {where: {name: {neq: 'detector'}}} };
            const rolesPromise = $axios.get('roles', {params: rulesFilter});
            const [ {data: user}, {data: roles} ] = await Promise.all([userPromise, rolesPromise]);
            if (!user || !roles || !roles.length) return error({statusCode: 404});

            for (let role of roles) {
                role.active = user.roles.some(r => r.name === role.name);
            }

            const logFilter = { filter: {where: { and: [
                { model: 'roleMapping' },
                { or: [ {target: user.username}, {target: user.id} ] }
            ]}}};

            const {data: log} = await $axios.get('log', {params: logFilter});
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