<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>User Details - {{user.username}}</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>
          <v-flex xs1>
            <v-btn fab dark color="primary" @click.native="$router.go(-1)">
              <v-icon dark>arrow_back</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 lg10>
            <v-tabs icons-and-text centered grow>
              <v-tabs-slider color="primary"></v-tabs-slider>
              <v-tab href="#roles">
                User Roles & Password
                <v-icon>people</v-icon>
              </v-tab>
              <v-tab href="#logs">
                Logs
                <v-icon>view_list</v-icon>
              </v-tab>
              <v-tab-item value="roles">
                <v-card>
                  <v-form @submit.prevent="updatePassword">
                    <v-card-title>
                      <v-layout row wrap>
                        <v-flex xs6>
                          <v-text-field label="Password" v-model="password"
                                        :append-icon="passwordVisible ? 'visibility_off' : 'visibility'"
                                        @click:append="() => (passwordVisible = !passwordVisible)"
                                        :type="passwordVisible ? 'text' : 'password'"
                                        autocomplete="new-password">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs6>
                          <v-btn color="primary" type="submit">Update</v-btn>
                        </v-flex>
                      </v-layout>
                    </v-card-title>
                  </v-form>
                  <v-card-title class="mb-3">
                    <v-layout row wrap>
                      <v-flex xs6>
                        <v-layout row wrap>
                          <v-flex xs4>
                            <v-subheader>API Key</v-subheader>
                          </v-flex>
                          <v-flex xs8>
                            <v-btn small class="ml-0" @click="renewApiKey">
                              Renew API Key
                            </v-btn>

                            <v-btn small class="ml-0" @click="showApiKey" v-if="apiKey == false">
                              Show Current
                            </v-btn>
                            <span v-if="apiKey != false">{{ apiKey }}</span>
                          </v-flex>
                        </v-layout>
                      </v-flex>
                    </v-layout>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="headers" :items="roles" :search="search" :rows-per-page-items="rowsPerPage"
                                  :pagination.sync="pagination"
                    >
                      <template slot="items" slot-scope="props">
                        <td>{{ props.item.name }}</td>
                        <td>{{ props.item.description }}</td>
                        <td>
                          <v-switch color="primary" v-model="props.item.active"
                                    @change="active => toggleRole(props.item, active)"></v-switch>
                        </td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tab-item>
              <v-tab-item value="logs">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-layout row wrap>
                      <v-flex xs6>
                        <v-text-field append-icon="search" label="Search" single-line hide-details
                                      v-model="logSearch"></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="logHeaders" :items="log" :rows-per-page-items="logRowsPerPage"
                                  :search="logSearch"
                                  :pagination.sync="logPagination"
                    >
                      <template slot="items" slot-scope="props">
                        <td>{{ props.item.time | moment('ddd, MMM DD YYYY HH:mm:ss') }}</td>
                        <td>{{ props.item.user }}</td>
                        <td>{{ props.item.msg }}</td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tab-item>
            </v-tabs>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./user.js"></script>
