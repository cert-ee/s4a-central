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
                    <span>Stats for selected {{ tasksAll.length }} </span> |
                    <span v-bind:class="{ 'error--text': totalFailed > 0 }"> Failed: {{ totalFailed }} </span> |
                    <span v-bind:class="{ 'success--text': totalLoading > 0 }"> Running: {{ totalLoading }} </span> |
                    <span> Queue: {{ totalQueue }} </span>
                  </v-flex>
                  <v-flex xs6>

                      <v-btn small class="ml-0" @click="showClearTasksHistoryButton" v-if="clear_tasks_history_button_show == false">
                        <v-icon dark>delete</v-icon>
                      </v-btn>
                    <v-btn v-if="clear_tasks_history_button_show == true" flat color="error" @click="clearTasksHistory()">
                      {{ $t('tasks.clear_tasks_history') }} <v-icon dark>delete</v-icon>
                    </v-btn>

                  </v-flex>
                  <v-flex xs6>
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search" clearable></v-text-field>
                  </v-flex>
                  <v-flex xs3>

                    <v-select :label="$t('tasks.taskers')" :items="taskerNames" v-model="taskerFilter" multiple
                              item-text="name" item-value="name" clearable>
                    </v-select>
                  </v-flex>

                  <v-flex xs3>
                      <v-select :label="$t('tasks.completed')" :items="[ $t('yes'), $t('no') ]" v-model="completedFilter" clearable></v-select>
                    </v-flex>
                    <v-flex xs3>
                      <v-select :label="$t('tasks.failed')" :items="[ $t('yes'), $t('no') ]" v-model="failedFilter" clearable></v-select>
                    </v-flex>

                    <v-flex xs3>
                      <v-btn flat color="info" @click="loadAllTasks()">
                        {{ $t('tasks.load_all_tasks') }}
                      </v-btn>
                    </v-flex>



                </v-layout>
              </v-card-title>
              <v-card-text>

                <v-data-table :headers="headers" :items="tasks" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination"

                              item-key="id"
                >
                  <!--v-model="selectedtasks"-->
                  <!--select-all="primary"-->
                  <template slot="items" slot-scope="props">
                    <tr v-bind:class="{
                        'success--text': props.item.loading == $t('yes'), 'error--text': props.item.failed == $t('yes'),
                        'warning--text': props.item.cancelled == true, 'grey--text': props.item.completed == $t('no') &&
                        props.item.cancelled == false && props.item.loading == $t('no') }" >
                    <!--<td>-->
                      <!--{{ props.item.id }}-->
                    <!--</td>-->
                    <td v-if="props.item.start_time">
                      {{ props.item.start_time | moment('ddd, MMM DD YYYY HH:mm:ss') }}
                    </td>
                    <!--<td>-->
                      <!--{{ props.item.modified_time }}-->
                    <!--</td>-->
                    <td>
                      {{ props.item.loading }}
                    </td>
                    <td>
                      {{ props.item.name }}
                    </td>
                    <td>
                      {{ props.item.completed }}
                    </td>
                    <td v-if="props.item.completed_time">
                        {{ props.item.completed_time | moment('ddd, MMM DD YYYY HH:mm:ss') }}
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
                      <td>
                        <v-btn small info v-if="props.item.loading === true || props.item.loading === 'Yes'"
                               @click="setLoadingFalse(props.item)">
                          {{ $t('tasks.stop') }}
                        </v-btn>
                      </td>
                    </tr>
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