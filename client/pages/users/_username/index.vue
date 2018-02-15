<template>
  <div>
    <v-navigation-drawer persistent dark overflow v-model="drawer" style="display: none;"></v-navigation-drawer>
    <v-toolbar fixed class="blue-grey darken-2" dark>
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>User Details - {{user.username}}</v-toolbar-title>
    </v-toolbar>
    <main>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>
          <v-flex xs1>
            <v-btn fab dark primary @click.native="$router.go(-1)">
              <v-icon dark>arrow_back</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 lg10>
            <v-tabs icons centered grow>
              <v-tabs-bar class="grey lighten-4">
                <v-tabs-slider class="primary"></v-tabs-slider>
                <v-tabs-item href="#roles">
                  <v-icon>people</v-icon>
                  User Roles & Password
                </v-tabs-item>
                <v-tabs-item href="#logs">
                  <v-icon>view_list</v-icon>
                  Logs
                </v-tabs-item>
              </v-tabs-bar>
              <v-tabs-content id="roles">
                <v-card>
                  <v-form @submit.prevent="updatePassword">
                    <v-card-title>
                      <v-layout row wrap>
                        <v-flex xs6>
                          <v-text-field label="Password" v-model="password"
                                        :append-icon="passwordVisible ? 'visibility_off' : 'visibility'"
                                        :append-icon-cb="() => (passwordVisible = !passwordVisible)"
                                        :type="passwordVisible ? 'text' : 'password'">
                          </v-text-field>
                        </v-flex>
                        <v-flex xs6>
                          <v-btn primary type="submit">Update</v-btn>
                        </v-flex>
                      </v-layout>
                    </v-card-title>
                  </v-form>
                  <v-card-title class="mb-3">
                    <v-layout row wrap>
                      <v-flex xs6>
                        <v-text-field append-icon="search" label="Search" single-line hide-details v-model="search"></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="headers" :items="roles" :search="search" :rows-per-page-items="rowsPerPage"
                                  :pagination.sync="pagination"
                    >
                      <template slot="items" scope="props">
                        <td>{{ props.item.name }}</td>
                        <td>{{ props.item.description }}</td>
                        <td>
                          <v-switch v-model="props.item.active" @change="active => toggleRole(props.item, active)"></v-switch>
                        </td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tabs-content>
              <v-tabs-content id="logs">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-layout row wrap>
                      <v-flex xs6>
                        <v-text-field append-icon="search" label="Search" single-line hide-details v-model="logSearch"></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="logHeaders" :items="log" :rows-per-page-items="logRowsPerPage" :search="logSearch"
                                  :pagination.sync="logPagination"
                    >
                      <template slot="items" scope="props">
                        <td>{{ props.item.time | moment('ddd, MMM DD YYYY HH:mm:ss') }}</td>
                        <td>{{ props.item.user }}</td>
                        <td>{{ props.item.msg }}</td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tabs-content>
            </v-tabs>
          </v-flex>
        </v-layout>
      </v-container>
    </main>
  </div>
</template>

<script src="./user.js"></script>
