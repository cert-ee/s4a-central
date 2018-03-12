export default {
    data() {
        return {
            addUserDialog: false,
            deleteUserDialog: false,
            selectedDeleteUser: {username: ''},
            newUser: '',
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            logRowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                { text: this.$t('users.username'), align: 'left', value: 'username' },
                { text: this.$t('users.roles'), align: 'left', value: 'rolesStr' },
                { text: '', value: '' }
            ],
            logHeaders: [
                { text: this.$t('users.time'), align: 'left', value: 'time' },
                { text: this.$t('users.user'), align: 'left', value: 'user' },
                { text: this.$t('users.message'), align: 'left', value: 'msg' }
            ],
            users: [],
            log: []
        }
    },

    computed: {
        search: {
            get() { return this.$store.state.users.search; },
            set(value) { this.$store.commit('users/setSearch', value); }
        },

        pagination: {
            get() { return this.$store.state.users.pagination; },
            set(value) { this.$store.commit('users/setPagination', value); }
        },

        logSearch: {
            get() { return this.$store.state.users.logSearch; },
            set(value) { this.$store.commit('users/setLogSearch', value); }
        },

        logPagination: {
            get() { return this.$store.state.users.logPagination; },
            set(value) { this.$store.commit('users/setLogPagination', value); }
        }
    },

    methods: {
        openAddUserDialog() {
            this.newUser = '';
            this.addUserDialog = true;
        },

        async addUser() {
            try {
                const user = await this.$axios.$post('users', {username: this.newUser});
                this.users.push(user);
                this.addUserDialog = false;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        showDeleteConfirm(user) {
            this.selectedDeleteUser = user;
            this.deleteUserDialog = true;
        },

        async deleteUser() {
            this.deleteUserDialog = false;

            try {
                await this.$axios.delete(`users/${this.selectedDeleteUser.id}`);
                this.users.splice(this.users.findIndex(u => u.id === this.selectedDeleteUser.id), 1);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({ store, error, app: {$axios, i18n} }) {
        try {
            const params = { filter: {include: 'roles', where: {detectorId: {exists: false}}} };
            const logParams = { filter: {where: {model: 'user'}} };

            let [ users, log ] = await Promise.all([
                $axios.$get('users', {params}), $axios.$get('log', {params: logParams})
            ]);

            if (!users || !users.length) return;

            for (let user of users) {
                if (user.roles && user.roles.length) {
                    user.rolesStr = user.roles.reduce((a, b, i, arr) => {
                        return a + b.name + (i < arr.length-1 ? ', ' : '');
                    }, '');
                }
            }

            return {users, log};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}