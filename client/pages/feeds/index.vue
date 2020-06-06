<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.feeds') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-menu v-if="selected_entries.length" offset-y>
          <v-btn color="primary" slot="activator">
            {{ $t('feeds.add_tag') }}
            <v-icon right>expand_more</v-icon>
          </v-btn>
          <v-list>
            <v-list-tile v-for="tag in tagNames" :key="tag.id" @click="toggleTag(tag, true)">
              <v-list-tile-title>{{ tag.name }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </transition>
      <transition name="fade">
        <v-menu v-if="selected_entries.length" offset-y>
          <v-btn color="error" slot="activator">
            {{ $t('feeds.remove_tag') }}
            <v-icon right>expand_more</v-icon>
          </v-btn>
          <v-list>
            <v-list-tile v-for="tag in tagNames" :key="tag.id" @click="toggleTag(tag, false)">
              <v-list-tile-title>{{ tag.name }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </transition>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-btn v-if="selected_entries.length" color="success" @click="toggleEnable(true)">{{ $t('feeds.enable') }}
        </v-btn>
      </transition>
      <transition name="fade">
        <v-btn v-if="selected_entries.length" color="error" @click="toggleEnable(false)">{{ $t('feeds.disable') }}
        </v-btn>
      </transition>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click.stop="openAddEditEntryDialog()">{{ $t('feeds.add_feed') }}</v-btn>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12 lg10>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search"
                                  clearable></v-text-field>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                <v-data-table :headers="headers" :items="feeds" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selected_entries" select-all="primary"
                              item-key="name"
                >
                  <template slot="items" slot-scope="props">


                    <tr v-bind:class="{ 'grey--text': props.item.enabled == false }">

                      <td>
                        <v-checkbox color="primary" hide-details v-model="props.selected"></v-checkbox>
                      </td>
                      <td>
                        {{ props.item.name }}
                      </td>
                      <td>
                        {{ props.item.enabled }}
                        <!--name: "yara_rules_local",-->
                        <!--friendly_name: "Yara rules local",-->
                        <!--enabled: false,-->
                        <!--type: "file",-->
                        <!--location: "/srv/s4a-central/moloch/yara_rules_local/",-->
                        <!--filename: "yara_local.txt",-->
                        <!--component_name: "moloch",-->
                        <!--component_type: "yara",-->
                        <!--description: "Yara rules local",-->
                        <!--checksum: "empty"-->

                      </td>
                      <td>
                        {{ props.item.component_name }}
                      </td>
                      <!--<td>-->
                      <!--<v-switch color="primary" v-model="props.item.automatically_enable_new_rules"-->
                      <!--@change="saveAutomaticUpdates(props.item)">-->
                      <!--</v-switch>-->
                      <!--</td>-->

                      <td>{{ props.item.tagsStr }}</td>
                      <td>
                        <v-icon color="primary" class="pointer"
                                @click.stop="openAddEditEntryDialog(props.item)"
                        >
                          edit
                        </v-icon>
                        <!--<v-icon v-else color="error">block</v-icon>-->

                        <v-icon v-if="props.item.primary !== true" class="red--text pointer"
                                @click.stop="openDeleteDialog(props.item)">delete
                        </v-icon>
                        <v-icon v-else color="error">block</v-icon>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-flex>


          <v-dialog v-model="addEditEntryDialog.open" width="50%">
            <v-card>
              <v-form v-model="formValid" ref="addEditEntryForm" @submit.prevent="addEditEntry">
                <v-card-title>
                  <span class="headline">{{ addEditEntryDialog.isEditDialog ? $t('feeds.edit_feed') : $t('feeds.add_feed') }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container grid-list-lg>
                    <v-layout row wrap>
                      <v-flex xs4>
                        <v-text-field :label="$t('feeds.name')" v-model="entry.name" required
                                      :rules="[form_entry.required]">
                        </v-text-field>
                      </v-flex>
                      <v-flex xs8>
                        <v-text-field :label="$t('feeds.friendly_name')" v-model="entry.friendly_name" required
                                      :rules="[form_entry.required]">
                        </v-text-field>
                      </v-flex>

                      <v-flex xs4>
                        <v-select :label="$t('feeds.component_name')" :items="feedComponents"
                                  v-model="entry.component_name" required
                                  @change="changeComponent"
                                  :rules="[form_entry.required]">
                        </v-select>
                      </v-flex>

                      <v-flex xs4>
                        <v-select :label="$t('feeds.component_type')" :items="feedComponentTypes"
                                  v-model="entry.component_type" required
                                  :rules="[form_entry.required]">
                        </v-select>
                      </v-flex>

                      <v-flex xs2>
                        <v-checkbox color="primary" :label="$t('enabled')" v-model="entry.enabled"></v-checkbox>
                      </v-flex>

                      <v-flex xs12 v-if="entry.component_name === 'moloch' && entry.component_type !== 'yara'">
                        <v-tooltip top>
                          <v-text-field :label="$t('feeds.component_tag_name')" v-model="entry.component_tag_name"
                                        required
                                        slot="activator"
                                        :disabled="entry.component_name !== 'moloch' && entry.component_type !== 'yara'"
                                        :rules="[form_entry.required, form_entry.tagger_name ]">
                          </v-text-field>
                          <span>Moloch tagger tag name</span>
                        </v-tooltip>
                      </v-flex>

                      <v-flex xs3>
                        <v-select :label="$t('feeds.type')" :items="feedTypes" v-model="entry.type" required
                                  @change="changeComponentType"
                                  :rules="[form_entry.required]">
                        </v-select>
                      </v-flex>

                      <v-flex xs9>
                        <v-text-field :label="$t('feeds.filename')" v-model="entry.filename" required
                                      :rules="[form_entry.required]">
                        </v-text-field>
                      </v-flex>

                      <v-flex xs12>
                        <v-tooltip top>
                          <v-text-field :label="$t('feeds.location')" v-model="entry.location" required
                                        slot="activator"
                                        :disabled="entry.type !== 'url'"
                                        :rules="[form_entry.required]">
                          </v-text-field>
                          <span>File-based feed location will be autogenerated</span>
                        </v-tooltip>
                      </v-flex>

                      <v-flex xs12>
                        <v-text-field :label="$t('feeds.location_folder')" v-model="entry.location_folder"
                                      slot="activator" :disabled="1==1">
                        </v-text-field>
                      </v-flex>

                      <!--<v-flex xs12 v-if="!addEditRuleDialog.isEditDialog">-->
                      <!--<v-select :label="$t('menu.tags')" :items="tagNames" v-model="newRule.tags_changes" multiple chips-->
                      <!--item-text="name" item-value="id">-->
                      <!--</v-select>-->
                      <!--</v-flex>-->
                      <v-flex xs12>
                        <v-text-field :label="$t('feeds.description')" v-model="entry.description"></v-text-field>
                      </v-flex>
                      <!--<v-flex xs12>-->
                      <!--<v-text-field :label="$t('rules.rule_data')" v-model="newRule.rule_data" required multi-line-->
                      <!--:rules="[formRules.required]">-->
                      <!--</v-text-field>-->
                      <!--</v-flex>-->
                    </v-layout>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn type="button" flat @click="addEditEntryDialog.open = false">{{$t('cancel')}}</v-btn>
                  <v-btn type="submit" flat color="primary">{{ addEditEntryDialog.isEditDialog ? $t('save') : $t('add')
                    }}
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-dialog>

          <v-dialog v-model="deleteEntryDialog.open" width="20%" lazy>
            <v-card>
              <v-card-text>
                {{ $t('feeds.delete') }} {{ deleteEntryDialog.title }}?
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="deleteEntryDialog.open = false">{{ $t('feeds.cancel') }}</v-btn>
                <v-btn flat color="error" @click="deleteEntryConfirm">{{ $t('feeds.delete') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./feeds.js"></script>