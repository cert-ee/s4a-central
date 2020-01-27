<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.rulesets') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-menu v-if="selectedRulesets.length" offset-y>
          <v-btn color="primary" slot="activator">
            {{ $t('rulesets.add_tag') }}
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
        <v-menu v-if="selectedRulesets.length" offset-y>
          <v-btn color="error" slot="activator">
            {{ $t('rulesets.remove_tag') }}
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
        <v-btn v-if="selectedRulesets.length" color="success" @click="toggleEnable(true)">{{ $t('rulesets.enable_all') }}</v-btn>
      </transition>
      <transition name="fade">
        <v-btn v-if="selectedRulesets.length" color="error" @click="toggleEnable(false)">{{ $t('rulesets.disable_all') }}</v-btn>
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
                <v-data-table :headers="headers" :items="rulesets" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selectedRulesets" select-all="primary" item-key="name"
                >
                  <template slot="items" slot-scope="props">
                    <td>
                      <v-checkbox color="primary" hide-details v-model="props.selected"></v-checkbox>
                    </td>
                    <td>
                      {{ props.item.name }}
                    </td>
                    <!--                    <td>-->
                    <!--                      <v-switch color="primary" v-model="props.item.automatically_enable_new_rules"-->
                    <!--                                @change="saveAutomaticUpdates(props.item)">-->
                    <!--                      </v-switch>-->
                    <!--                    </td>-->
                    <td>
                      <v-switch color="primary" v-model="props.item.skip_review"
                                @change="saveSkipReview(props.item)">
                      </v-switch>
                    </td>
                    <td>
                      <v-switch color="primary" v-model="props.item.force_disabled"
                                @change="saveForceDisabled(props.item)">
                      </v-switch>
                    </td>
                    <td>{{ props.item.tagsStr }}</td>
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

<script src="./rulesets.js"></script>