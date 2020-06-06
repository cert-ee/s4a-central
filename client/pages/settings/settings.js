export default {
    data() {
        return {
            editSmtpSettingsDialog: {
                open: false
            },
            editSmtpFormValid: false,
            editSmtpForm: {
                required: (value) => !!value || this.$t('required'),
            },
            smtpAuthMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],
            settings: {
                smtp_server_requires_auth: false,
                smtp_server_host: 'hostname',
                smtp_server_port: 465,
                smtp_server_tls: true,
                smtp_server_auth_method: 'PLAIN',
                smtp_server_force_notls: false,
                smtp_server_username: 'columbus',
                smtp_server_password: 'columbus',
                smtp_server_from: 'columbus@localhost'
            },

            // nginx: {},
            // nginx_loading: false,
            // nginxConfDialog: false,
            passwordVisible: false
        }
    },

    computed: {},

    methods: {
        // async updateSetting(name) {
        //     try {
        //         await this.$axios.post('settings/updateSetting', {name, value: this.settings[name]});
        //     } catch (err) {
        //         this.$store.dispatch('handleError', err);
        //     }
        // },

        async resetSmtpPortValue() {

            try {
                if (this.settings['smtp_server_tls']) {
                    if (this.settings['smtp_server_port'] != 465) {
                        this.settings['smtp_server_port'] = 465;
                    }

                    if (this.settings['smtp_server_force_notls']) {
                        this.settings['smtp_server_force_notls'] = false;
                    }
                } else {
                    if (this.settings['smtp_server_port'] != 587) {
                        this.settings['smtp_server_port'] = 587;
                    }
                }
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async resetSmtpPortValueAndUpdateTLS() {

            try {
                if (this.settings['smtp_server_force_notls']) {
                    if (this.settings['smtp_server_port'] != 587) {
                        this.settings['smtp_server_port'] = 587;
                    }
                    if (this.settings['smtp_server_tls']) {
                        this.settings['smtp_server_tls'] = false;
                    }
                }
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async editSmtp() {
            try {
                this.$refs.editSmtpForm.validate();
                if (!this.editSmtpFormValid) return;

                let input = {
                    smtp_server_requires_auth: this.settings.smtp_server_requires_auth,
                    smtp_server_host: this.settings.smtp_server_host,
                    smtp_server_port: this.settings.smtp_server_port,
                    smtp_server_tls: this.settings.smtp_server_tls,
                    smtp_server_auth_method: this.settings.smtp_server_auth_method,
                    smtp_server_force_notls: this.settings.smtp_server_force_notls,
                    smtp_server_username: this.settings.smtp_server_username,
                    smtp_server_password: this.settings.smtp_server_password,
                    smtp_server_from: this.settings.smtp_server_from
                };

                await this.$axios.patch(`settings/${this.settings.id}`, input);
                this.editSmtpSettingsDialog.open = false;

                this.$store.commit('showSnackbar', {type: 'success', text: this.$t('saved')});
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }

    },

    async asyncData({store, app: {$axios}}) {
        try {
            let [{data: settings}] = await Promise.all([
                $axios.get('settings/settingid')
            ]);

            return {settings};
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}