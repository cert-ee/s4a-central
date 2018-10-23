<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.taskers') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-menu v-if="selectedtaskers.length" offset-y>
          <!--<v-btn color="primary" slot="activator">-->
            <!--{{ $t('taskers.add_tag') }}-->
            <!--<v-icon right>expand_more</v-icon>-->
          <!--</v-btn>-->
          <!--<v-list>-->
            <!--<v-list-tile v-for="tag in tagNames" :key="tag.id" @click="toggleTag(tag, true)">-->
              <!--<v-list-tile-title>{{ tag.name }}</v-list-tile-title>-->
            <!--</v-list-tile>-->
          <!--</v-list>-->
        </v-menu>
      </transition>
      <!--<transition name="fade">-->
        <!--<v-menu v-if="selectedtaskers.length" offset-y>-->
          <!--<v-btn color="error" slot="activator">-->
            <!--{{ $t('taskers.remove_tag') }}-->
            <!--<v-icon right>expand_more</v-icon>-->
          <!--</v-btn>-->
          <!--<v-list>-->
            <!--<v-list-tile v-for="tag in tagNames" :key="tag.id" @click="toggleTag(tag, false)">-->
              <!--<v-list-tile-title>{{ tag.name }}</v-list-tile-title>-->
            <!--</v-list-tile>-->
          <!--</v-list>-->
        <!--</v-menu>-->
      <!--</transition>-->
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-btn v-if="selectedtaskers.length" color="success" @click="toggleEnable(true)">{{ $t('taskers.enable') }}</v-btn>
      </transition>
      <transition name="fade">
        <v-btn v-if="selectedtaskers.length" color="error" @click="toggleEnable(false)">{{ $t('taskers.disable') }}</v-btn>
      </transition>
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
                <v-data-table :headers="headers" :items="taskers" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selectedtaskers" select-all="primary" item-key="name"
                >
                  <template slot="items" slot-scope="props">
                    <td>
                      <v-checkbox color="primary" hide-details v-model="props.selected"></v-checkbox>
                    </td>
                    <td>
                      {{ props.item.name }}
                    </td>
                    <td>
                      {{ props.item.enabled }}
                    </td>
                    <td>
                      {{ props.item.interval_mm }}
                    </td>
                    <td>
                      <v-btn small info v-if="props.item.enabled === true"
                             :loading="props.item.loading"
                             @click="runTask(props.item)">
                        {{ $t('taskers.run_task') }}
                      </v-btn>
                      <v-icon color="primary" class="pointer" @click.stop="openEditTaskerDialog(props.item)">
                        edit
                      </v-icon>

                    </td>
                    <!--:loading="props.item.loading"-->
                    <!--<td>-->
                      <!--<v-switch color="primary" v-model="props.item.automatically_enable_new_rules"-->
                                <!--@change="saveAutomaticUpdates(props.item)">-->
                      <!--</v-switch>-->
                    <!--</td>-->
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-flex>

            <v-dialog v-model="editTaskerDialog.open" width="50%">
                <v-card>
                    <v-form v-model="formValid" ref="editTaskerForm" @submit.prevent="editTasker">
                        <v-card-title>
                            <span class="headline">{{ $t('taskers.edit_tasker') }} {{ newTasker.name }}</span>
                        </v-card-title>
                        <v-card-text>
                            <v-container grid-list-lg>
                                <v-layout row wrap>
                                    <v-flex xs4>
                                        <v-text-field :label="$t('taskers.interval_mm')" v-model="newTasker.interval_mm" required
                                            :rules="[formTaskers.required]">
                                        </v-text-field>
                                        in minutes...
                                    </v-flex>

                                </v-layout>
                            </v-container>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn type="button" flat @click="editTaskerDialog.open = false">{{$t('cancel')}}</v-btn>
                            <v-btn type="submit" flat color="primary">{{$t('save') }}</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
            </v-dialog>


        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./taskers.js"></script>