<template>
  <div>
    <v-navigation-drawer persistent dark overflow v-model="drawer" style="display: none;"></v-navigation-drawer>
    <v-toolbar fixed class="blue-grey darken-2" dark>
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.users') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn primary @click.stop="openAddUserDialog">{{ $t('users.add_user') }}</v-btn>
    </v-toolbar>
    <main>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12 lg10>
            <v-tabs icons centered grow>
              <v-tabs-bar class="grey lighten-4">
                <v-tabs-slider class="primary"></v-tabs-slider>
                <v-tabs-item href="#users">
                  <v-icon>people</v-icon>
                  {{ $t('users.user_management') }}
                </v-tabs-item>
                <v-tabs-item href="#logs">
                  <v-icon>view_list</v-icon>
                  {{ $t('logs') }}
                </v-tabs-item>
              </v-tabs-bar>
              <v-tabs-content id="users">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-layout row wrap>
                      <v-flex xs6>
                        <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search" clearable></v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="headers" :items="users" :rows-per-page-items="rowsPerPage" :search="search"
                                  :pagination.sync="pagination"
                    >
                      <template slot="items" scope="props">
                        <td>
                          <nuxt-link :to="`/users/${props.item.username}`">
                            {{ props.item.username }}
                          </nuxt-link>
                        </td>
                        <td>{{ props.item.rolesStr }}</td>
                        <td>
                          <v-icon class="red--text pointer" @click.stop="showDeleteConfirm(props.item)">delete</v-icon>
                        </td>
                      </template>
                    </v-data-table>
                    <v-dialog v-model="addUserDialog" lazy>
                      <v-card>
                        <form @submit.prevent="addUser">
                          <v-card-title>
                            <span class="headline">{{ $t('users.add_user') }}</span>
                          </v-card-title>
                          <v-card-text>
                            <v-text-field :label="$t('users.username')" required v-model="newUser" autofocus></v-text-field>
                          </v-card-text>
                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn type="button" flat @click="addUserDialog = false">{{ $t('cancel') }}</v-btn>
                            <v-btn type="submit" flat primary>{{ $t('add') }}</v-btn>
                          </v-card-actions>
                        </form>
                      </v-card>
                    </v-dialog>
                    <v-dialog v-model="deleteUserDialog" lazy>
                      <v-card>
                        <v-card-text>
                          {{ $t('users.really_delete_user') }} {{ selectedDeleteUser.username }}?
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn flat @click="deleteUserDialog = false">{{ $t('cancel') }}</v-btn>
                          <v-btn flat error @click="deleteUser">{{ $t('delete') }}</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </v-card-text>
                </v-card>
              </v-tabs-content>
              <v-tabs-content id="logs">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="logSearch" clearable></v-text-field>
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

<script src="./users.js"></script>