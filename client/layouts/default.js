export default {
    data () {
        return {
            rulesExpanded: false
        }
    },

    computed: {
        drawer: {
            get() { return this.$store.state.drawer; },
            set(value) { this.$store.commit('toggleDrawer', value); }
        },

        snackBar: {
            get() { return this.$store.state.snackBar.open; },
            set() { this.$store.commit('closeSnackbar'); }
        }
    },

    methods: {

        async resetCentral() {
            console.log("resetCentral");

            const result = await this.$axios.get('registration/resetCentral');
            console.log( result );

            this.$router.push('/');

        }
    }
}