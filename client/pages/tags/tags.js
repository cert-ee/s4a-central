export default {
    data() {
        return {
            rowsPerPage: [50, 100, {text: 'All', value: -1}],
            headers: [
                { text: this.$t('name'), align: 'left', value: 'name' },
                { text: this.$t('tags.description'), align: 'left', value: 'description' },
                { text: this.$t('edit'), align: 'left', sortable: false }
            ],
            tags: [],
            selectedTags: [],
            addEditTagDialog: {
                open: false,
                isEditDialog: false
            },
            formValid: false,
            rules: {
                required: (value) => !!value || this.$t("tags.required")
            },
            tagId: '',
            name: '',
            description: ''
        }
    },

    computed: {
        search: {
            get() { return this.$store.state.tags.search; },
            set(value) { this.$store.commit('tags/setSearch', value); }
        },

        pagination: {
            get() { return this.$store.state.tags.pagination; },
            set(value) { this.$store.commit('tags/setPagination', value); }
        }
    },

    methods: {
        openAddEditTagDialog(tag) {
            this.$refs.addEditTagForm.reset();
            this.tagId = undefined;

            if (tag) {
                this.tagId = tag.id;
                this.name = tag.name;
                this.description = tag.description;
                this.tagRef = tag;
            }

            this.addEditTagDialog.isEditDialog = !!tag;
            this.addEditTagDialog.open = true;
        },

        async addEditTag() {
            try {
                this.$refs.addEditTagForm.validate();
                if (!this.formValid) return;
                let tag = {id: this.tagId, name: this.name, description: this.description};
                tag = await this.$axios.$put('tags', tag);

                if (this.addEditTagDialog.isEditDialog) {
                    Object.assign(this.tagRef, tag);
                } else {
                    this.tags.push(tag);
                }

                this.addEditTagDialog.open = false;
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        },

        async deleteSelectedTags() {
            try {
                let promises = [];

                for (const tag of this.selectedTags) {
                    promises.push(this.$axios.delete(`tags/${tag.id}`));
                    const index = this.tags.findIndex(t => t.id === tag.id);
                    this.tags.splice(index, 1);
                }

                await Promise.all(promises);
                this.selectedTags = [];
            } catch (err) {
                this.$store.dispatch('handleError', err);
            }
        }
    },

    async asyncData({store, error, app: {$axios, i18n}}) {
        try {
            let tags = await $axios.$get('tags');
            if (!tags || !tags.length) return;
            return { tags };
        } catch (err) {
            if (err.response && err.response.status === 401) {
                return error({statusCode: 401, message: store.state.unauthorized});
            } else {
                return error({statusCode: err.statusCode, message: err.message});
            }
        }
    }
}