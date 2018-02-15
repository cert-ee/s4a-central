<template>
    <v-app>
        <main>
            <v-container fluid fill-height>
                <v-layout align-center justify-center>
                    <v-flex xs12 class="text-xs-center">
                        <h2>{{ statusCode }} </h2>
                        <h4> {{ message }} </h4>
                        <p v-if="statusCode === 404">
                            <nuxt-link to="/">Back to the home page</nuxt-link>
                        </p>
                    </v-flex>
                </v-layout>
            </v-container>
        </main>
    </v-app>
</template>

<script>
    export default {
        name: 'nuxt-error',
        props: ['error'],
        head () {
            return {
                title: this.statusCode + ' - ' + this.message
            }
        },
        computed: {
            statusCode () {
                return (this.error && this.error.statusCode) || 500
            },
            message () {
                return (this.error && this.error.message) || 'Nuxt Server Error'
            }
        }
    }
</script>