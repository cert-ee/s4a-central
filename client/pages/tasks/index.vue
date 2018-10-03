<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.tasks') }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12 lg10>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search" clearable></v-text-field>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                TODO: Here be more logs per task
                <v-data-table :headers="headers" :items="tasks" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination"

                              item-key="id"
                >
                  <!--v-model="selectedtasks"-->
                  <!--select-all="primary"-->
                  <template slot="items" slot-scope="props">
                    <!--<td>-->
                      <!--{{ props.item.id }}-->
                    <!--</td>-->
                    <td>
                      {{ props.item.modified_time }}
                    </td>
                    <td>
                      {{ props.item.name }}
                    </td>
                    <!--<td>-->
                      <!--{{ props.item.run_time }}-->
                    <!--</td>-->
                    <td>
                      {{ props.item.completed }}
                    </td>
                    <td>
                      {{ props.item.failed }}
                    </td>
                    <!--<td>-->
                      <!--{{ props.item.module_name }}-->
                    <!--</td>-->
                    <!--<td>-->
                      <!--{{ props.item.parent_name }}-->
                    <!--</td>-->
                    <td>
                      {{ props.item.logs }}
                    </td>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./tasks.js"></script>