<template>
  <div>
    <v-navigation-drawer persistent dark overflow v-model="drawer" style="display: none;"></v-navigation-drawer>
    <v-toolbar fixed class="blue-grey darken-2" dark>
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.rules') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-menu v-if="selectedRules.length" offset-y>
          <v-btn primary slot="activator">
            {{ $t('rules.add_tag') }}
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
        <v-menu v-if="selectedRules.length" offset-y>
          <v-btn error slot="activator">
            {{ $t('rules.remove_tag') }}
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
        <v-btn v-if="selectedRules.length" success @click="toggleRules(true)">{{ $t('rules.enable_selected') }}</v-btn>
      </transition>
      <transition name="fade">
        <v-btn v-if="selectedRules.length" error @click="toggleRules(false)">{{ $t('rules.disable_selected') }}</v-btn>
      </transition>
      <v-spacer></v-spacer>
      <v-btn primary @click.stop="openAddEditRuleDialog()">{{ $t('rules.add_rule') }}</v-btn>
    </v-toolbar>
    <main>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs3>
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search" clearable></v-text-field>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('rules.severity')" :items="rulesetSeverities" v-model="rulesSeverityFilter" multiple clearable></v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('rules.ruleset')" :items="rulesetNames" v-model="rulesetFilter" multiple
                              item-text="name" item-value="name" clearable>
                    </v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('menu.tags')" :items="tagNames" v-model="tagsFilter" multiple chips
                              item-text="name" item-value="id" clearable>
                    </v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('rules.classtype')" :items="classTypeNames" v-model="classtypeFilter" multiple chips
                      item-text="name" item-value="name" clearable>
                    </v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('enabled')" :items="[ $t('yes'), $t('no') ]" v-model="enabledFilter" clearable></v-select>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                <v-data-table :headers="headers" :items="rules" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selectedRules" select-all
                >
                  <template slot="items" scope="props">
                    <td>
                      <v-checkbox primary hide-details v-model="props.selected"></v-checkbox>
                    </td>
                    <td>{{ props.item.sid }}</td>
                    <td>{{ props.item.enabled }}</td>
                    <td>{{ props.item.severity }}</td>
                    <td>{{ props.item.revision }}</td>
                    <td>{{ props.item.ruleset }}</td>
                    <td>{{ props.item.classtype }}</td>
                    <td>{{ props.item.message }}</td>
                    <td>{{ props.item.tagsStr }}</td>
                    <td>
                      <v-icon class="pointer" @click.stop="newRule.rule_data = props.item.rule_data; ruleDataDialog = true">
                        track_changes
                      </v-icon>
                    </td>
                    <td>
                      <v-icon v-if="props.item.ruleset === $store.state.rule_custom_name" primary class="pointer"
                              @click.stop="openAddEditRuleDialog(props.item)"
                      >
                        edit
                      </v-icon>
                      <v-icon v-else error>block</v-icon>
                    </td>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-flex>

          <v-dialog v-model="addEditRuleDialog.open" width="50%">
            <v-card>
              <v-form v-model="formValid" ref="addEditRuleForm" @submit.prevent="addEditRule">
                <v-card-title>
                  <span class="headline">{{ addEditRuleDialog.isEditDialog ? $t('rules.edit_rule') : $t('rules.add_rule') }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container grid-list-lg>
                    <v-layout row wrap>
                      <v-flex xs3>
                        <v-text-field label="SID" v-model="newRule.sid" required
                                      :rules="[formRules.required, formRules.sid]">
                        </v-text-field>
                      </v-flex>
                      <v-flex xs3>

                        <v-select :label="$t('rules.classtype')" :items="classTypeNames" v-model="newRule.classtype" required
                                  :rules="[formRules.required]" item-text="name" item-value="name">
                        </v-select>

                      </v-flex>

                      <v-flex xs3>
                        <v-select :label="$t('rules.severity')" :items="rulesetSeverities" v-model="newRule.severity" required
                                  :rules="[formRules.required]">
                        </v-select>
                      </v-flex>
                      <v-flex xs2>
                        <v-checkbox :label="$t('enabled')" v-model="newRule.enabled"></v-checkbox>
                      </v-flex>
                      <v-flex xs12 v-if="!addEditRuleDialog.isEditDialog">
                        <v-select :label="$t('menu.tags')" :items="tagNames" v-model="newRule.tags_changes" multiple chips
                                  item-text="name" item-value="id">
                        </v-select>
                      </v-flex>
                      <v-flex xs12>
                        <v-text-field :label="$t('rules.message')" v-model="newRule.message" required :rules="[formRules.required]"></v-text-field>
                      </v-flex>
                      <v-flex xs12>
                        <v-text-field :label="$t('rules.rule_data')" v-model="newRule.rule_data" required multi-line
                                      :rules="[formRules.required]">
                        </v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn type="button" flat @click="addEditRuleDialog.open = false">{{$t('cancel')}}</v-btn>
                  <v-btn type="submit" flat primary>{{ addEditRuleDialog.isEditDialog ? $t('save') : $t('add') }}</v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-dialog>

          <v-dialog v-model="ruleDataDialog" width="30%" lazy>
            <v-card>
              <v-card-text>
                <highlight>{{ newRule.rule_data | formatRule }}</highlight>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="ruleDataDialog = false">{{ $t('close') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>
      </v-container>
    </main>
  </div>
</template>

<script src="./rules.js"></script>