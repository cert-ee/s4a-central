export default {
    validate({ params }) {
        return params.id;
    },

    data() {
        return {
            detector: {},
            detectorName: '',
            apiKey: false,
            tagNames: [],
            registration_step: 1,
            registration_steps: [],
            search: '',
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            pagination: {
                descending: false,
                page: 1,
                rowsPerPage: 50,
                sortBy: ''
            },
            headers: [
                { text: 'Name', align: 'left', value: 'friendly_name' },
                { text: 'Status', align: 'left', value: 'statusStr' },
                { text: 'Message', align: 'left', value: 'message' }
            ],
            nameValid: true,
            rules: {
                required: (value) => !!value || "Required",
                name: (value) => /^[a-zA-Z0-9-_.]*$/.test(value) || 'Illegal characters'
            },
            rejectDialog: false,
            rejectionReason: '',
            rejectionReasonFilled: false,
            deleteDetectorDialog: false,
            loading: false
        }
    },

    methods: {
        async approveRegistration() {
            try {
                if (this.detectorName !== this.detector.name) {
                    let name_result = await this.$axios.post('registration/changeDetectorName', {
                        old_name: this.detectorName,
                        new_name: this.detector.name
                    });

                    this.detectorName = this.detector.name;
                }

                this.loading = true;

                await this.$axios.post('registration/approve', {
                    name: this.detector.name,
                    friendly_name: this.detector.friendly_name,
                    first_name: this.detector.first_name,
                    last_name: this.detector.last_name,
                    organization_name: this.detector.organization_name,
                    contact_phone: this.detector.contact_phone,
                    contact_email: this.detector.contact_email
                });

                this.loading = false;

                this.$store.commit('showSnackbar', {type: 'success', text: 'Registration successful'});
                this.registration_step++;
                this.registration_steps[2].complete = true;
            } catch (err) {
                this.loading = false;
                this.$store.dispatch('handleError', err);
            }
        },

        openDetectorDeleteDialog() {

            this.deleteDetectorDialog = true;
        },

        openRejectDialog() {
            this.$refs.rejectForm.reset();
            this.rejectDialog = true;
        },

        async rejectRegistration() {
            if (!this.$refs.rejectForm.validate()) return;

            try {
                await this.$axios.post('registration/reject', {name: this.detector.name, reject_reason: this.rejectionReason});
                this.registration_steps[0].complete = true;
                this.registration_steps[1].name = 'Skipped';
                this.registration_steps[1].complete = true;
                this.registration_steps[2].complete = true;
                this.registration_steps[2].name = 'Skipped';
                this.registration_steps[3].complete = true;
                this.registration_steps[3].name = 'Skipped';
                this.registration_steps[4].complete = true;
                this.registration_steps[4].text = 'Registration rejected!';
                this.registration_step = 5;
                this.rejectDialog = false;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async saveFriendlyName() {
            try {
                await this.$axios.patch(`detectors/${this.detector.id}`, {
                    friendly_name: this.detector.friendly_name
                });
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async saveTags() {
            try {
                await this.$axios.delete(`detectors/${this.detector.id}/tags`);
                let promises = [];

                for (const tagId of this.detector.tags) {
                    promises.push(this.$axios.put(`detectors/${this.detector.id}/tags/rel/${tagId}`));
                }

                await Promise.all(promises);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async deleteDetector() {
            try {
                await this.$axios.post('detectors/deleteDetector', {detectorId: this.detector.id});
                this.$router.go(-1);
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async showApiKey(){
            try {
                let result = await this.$axios.get('detectors/currentToken', {params: {detectorId: this.detector.id}});
                this.apiKey = result && result.data && result.data.token;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData ({ params, store, error, app: {$axios} }) {
        try {
            const include = {filter: {include: 'tags'}};

            let [ detector, tagNames ] = await Promise.all([
                $axios.$get(`detectors/${params.id}`, {params: include}), $axios.$get('tags')
            ]);

            if (!detector) return error({statusCode: 404, message: 'Not Found'});

            for (let component of detector.components) {
                component.statusStr = component.status ? 'OK' : 'Fail';
            }

            let registration_step = 1;

            if (detector.registration_status === 'Approved') {
                registration_step = 4;
            } else if (detector.registration_status === 'Completed' || detector.registration_status === 'Rejected') {
                registration_step = 5;
            }

            const registration_steps = [
                {
                    name: 'Continue/Reject',
                    complete: detector.registration_status === 'Approved' || detector.registration_status === 'Completed' ||
                        detector.registration_status === 'Rejected'
                },
                {
                    name: detector.registration_status === 'Rejected' ? 'Skipped' : 'Detector Name',
                    complete: detector.registration_status === 'Approved' || detector.registration_status === 'Completed' ||
                        detector.registration_status === 'Rejected'
                },
                {
                    name: detector.registration_status === 'Rejected' ? 'Skipped' : 'Check the registration information',
                    complete: detector.registration_status === 'Approved' || detector.registration_status === 'Completed' ||
                        detector.registration_status === 'Rejected'
                },
                {
                    name: detector.registration_status === 'Completed' ? 'Detector downloaded signed CSR' :
                        detector.registration_status === 'Rejected' ? 'Skipped' : 'Waiting for detector to download signed CSR',
                    complete: detector.registration_status === 'Completed' || detector.registration_status === 'Rejected'
                },
                {
                    name: 'Completed',
                    complete: detector.registration_status === 'Completed' || detector.registration_status === 'Rejected',
                    text: detector.registration_status === 'Completed' ? 'Registration is completed!' : 'Registration rejected!'
                }
            ];

			return {detector, detectorName: detector.name, tagNames, registration_step, registration_steps };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}
