export function state() {
    return {
        debugMode: false,
        drawer: true,
        user: {},
        rulesReview: false,
        rulesExpanded: false,
        unauthorized: 'You are not authorized to view this page.',
        versions: {},
        snackBar: {
            type: 'error',
            text: '',
            open: false
        },
        locale: 'en',
        rulesSyncing: false
    };
}

export const getters = {
    hasAdminRole(state) {
        return state.user && state.user.roles && state.user.roles.some(r => r.name === 'admin');
    }
};

export const mutations = {
    toggleDrawer(state, value) {
        state.drawer = value === undefined ? !state.drawer : value;
    },

    setRulesReview(state, value) {
        state.rulesReview = value;
    },

    setRulesExpanded(state, value) {
        state.rulesExpanded = value;
    },

    showSnackbar(state, snackBar) {
        Object.assign(state.snackBar, snackBar);
        state.snackBar.open = true;
    },

    closeSnackbar(state) {
        state.snackBar.open = false;
    },

    setLocale(state, locale) {
        state.locale = locale;
        this.app.i18n.locale = locale;
    },

    setRulesSyncing(state, value) {
        state.rulesSyncing = value;
    }
};

export const actions = {
    async nuxtServerInit({state}, {req, env, error, isDev, app: {$axios}}) {
        try {
            console.log("FRONTEND | NUXT SERVER INIT");
             // console.log(req.headers);
            if (!req.headers["x-remote-user"]) {
                console.log("FRONTEND | no x-remote-user");
                error("no x-remote-user");
            }

            //get the header and save for store
            this.$axios.setHeader("x-remote-user", req.headers["x-remote-user"]);
            const params = {filter: {include: 'roles'}};
            const user = await $axios.$get('users/current', {params});
            state.user = user;
            state.rule_custom_name = "cert";
            state.rule_sid_limit = 10000000;
            state.rule_sid_limit_max = 20000000;
            state.API_URL = env.API_URL;
            state.GRAFANA_URL = env.URL_GRAFANA;
            state.debugMode = isDev;

            console.log("FRONTEND | API URL:", state.API_URL);
            console.log("FRONTEND | DEBUG MODE:", state.debugMode);

            const vers = await $axios.get('/system_info/version');
            state.versions = vers.data;

            const rule_drafts = await $axios.$get('rule_drafts/count');
            state.rulesReview = rule_drafts && rule_drafts.count;
        } catch (err) {
            console.log("FRONTEND | NUXT SERVER INIT ERROR");
            console.log( err );

            error({
                statusCode: err.statusCode,
                message: err.response && err.response.data.error.message || 'Error. Local API is down. Try again later.'
            });
        }
    },

    // async updateRules({commit, dispatch}) {
    //     commit('setRulesSyncing', true);
    //
    //     try {
    //         await this.$axios.get('rules/task');
    //     } catch (err) {
    //         dispatch('handleError', err);
    //     } finally {
    //         commit('setRulesSyncing', false);
    //     }
    // },

    handleError({commit}, err) {
        commit('showSnackbar', {
            type: 'error',
            text: err.response && err.response.data.error && err.response.data.error.message || err.message
        });
    }
};