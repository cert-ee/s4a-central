<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.rules_review') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-btn v-if="selectedRules.length" color="error" @click="deleteSelectedRules">{{ $t('delete_selected') }}</v-btn>
      </transition>
      <v-btn color="primary" @click="publish">{{ $t('rules.review.publish') }}</v-btn>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>
          <v-flex xs12>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-text-field append-icon="search" :label="$t('search')" single-line hide-details v-model="search" clearable></v-text-field>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                <v-data-table :headers="headers" :items="rules" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selectedRules" select-all="primary"
                >
                  <template slot="items" slot-scope="props">
                    <td>
                      <v-checkbox color="primary" hide-details v-model="props.selected"></v-checkbox>
                    </td>
                    <td :class="props.item.changes_fields.includes('sid') ? 'yellow lighten-3' : ''">
                      {{ props.item.sid }}
                    </td>
                    <td :class="props.item.changes_fields.includes('enabled') ? 'yellow lighten-3' : ''">
                      <v-switch color="primary" v-model="props.item.enabled" @change="changeEnabled(props.item)"></v-switch>
                    </td>
                    <td :class="props.item.changes_fields.includes('severity') ? 'yellow lighten-3' : ''">{{ props.item.severity }}</td>
                    <td :class="props.item.changes_fields.includes('revision') ? 'yellow lighten-3' : ''">
                      {{ props.item.revision }}
                    </td>
                    <td>{{ props.item.ruleset }}</td>
                    <td :class="props.item.changes_fields.includes('classtype') ? 'yellow lighten-3' : ''">{{ props.item.classtype }}</td>
                    <td :class="props.item.changes_fields.includes('message') ? 'yellow lighten-3' : ''">{{ props.item.message }}</td>
                    <td :class="props.item.tags_changes.length ? 'yellow lighten-3' : ''">
                      <v-select :label="$t('menu.tags')" :items="tagNames" v-model="props.item.tags" multiple chips single-line
                                item-text="name" item-value="id" return-object hide-details class="mb-2"
                                @input="saveTags(props.item)"
                      >
                        <template slot="selection" slot-scope="data">
                          <template v-for="tag in props.item.tags" v-if="tag.id === data.item.id">
                            <v-chip v-if="tag.added === true" :key="data.item.id" close small
                                    :selected="data.selected" class="chip--select-multi light-green"
                                    @input="data.parent.selectItem(data.item)"
                            >
                              {{ data.item.name }}
                            </v-chip>
                            <v-chip v-else :key="data.item.id" close small :selected="data.selected" class="chip--select-multi"
                                    @input="data.parent.selectItem(data.item)"
                            >
                              {{ data.item.name }}
                            </v-chip>
                          </template>
                        </template>
                      </v-select>
                      <v-chip v-for="tag in props.item.tags_changes" v-if="tag.added === false" :key="tag.id" small
                              class="chip--select-multi error white--text"
                      >
                        {{ tag.name }}
                      </v-chip>
                    </td>
                    <td :class="props.item.changes_fields.includes('rule_data') ? 'yellow lighten-3' : ''">
                      <v-icon class="pointer" @click.stop="editRule.rule_data = props.item.rule_data; ruleDataDialog = true">
                        track_changes
                      </v-icon>
                    </td>
                    <td>
                      <v-icon v-if="props.item.ruleset === $store.state.rule_custom_name" color="primary" class="pointer"
                              @click.stop="openEditRuleDialog(props.item)"
                      >
                        edit
                      </v-icon>
                      <v-icon v-else color="error">block</v-icon>
                    </td>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-flex>

          <v-dialog v-model="editRuleDialog" width="50%" lazy>
            <v-card>
              <v-form v-model="formValid" ref="editRuleForm" @submit.prevent="saveRule">
                <v-card-title>
                  <span class="headline">{{ $t('rules.edit_rule') }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container grid-list-lg>
                    <v-layout row wrap>
                      <v-flex xs3>
                        <v-text-field label="SID" v-model="editRule.sid" required
                                      :rules="[formRules.required, formRules.sid]">
                        </v-text-field>
                      </v-flex>
                      <v-flex xs4>
                        <v-select :label="$t('rules.classtype')" :items="classTypeNames" v-model="editRule.classtype" required
                                  :rules="[formRules.required]" item-text="name" item-value="name">
                        </v-select>
                      </v-flex>
                      <v-flex xs3>
                        <v-select :label="$t('rules.severity')" :items="rulesetSeverities" v-model="editRule.severity" required
                                  :rules="[formRules.required]">
                        </v-select>
                      </v-flex>
                      <v-flex xs2>
                        <v-checkbox color="primary" :label="$t('enabled')" v-model="editRule.enabled"></v-checkbox>
                      </v-flex>
                      <v-flex xs12>
                        <v-text-field :label="$t('rules.message')" v-model="editRule.message" required :rules="[formRules.required]"></v-text-field>
                      </v-flex>
                      <v-flex xs12>
                        <v-text-field :label="$t('rules.rule_data')" v-model="editRule.rule_data" required multi-line
                                      :rules="[formRules.required]">
                        </v-text-field>
                      </v-flex>
                    </v-layout>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn type="button" flat @click="editRuleDialog = false">{{ $t('cancel') }}</v-btn>
                  <v-btn type="submit" flat color="primary">{{ $t('save') }}</v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-dialog>

          <v-dialog v-model="ruleDataDialog" width="30%" lazy>
            <v-card>
              <v-card-text>
                <v-text-field :label="$t('rules.rule_data')" v-model="editRule.rule_data" readonly multi-line auto-grow>
                </v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="ruleDataDialog = false">{{ $t('close') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./review.js"></script>