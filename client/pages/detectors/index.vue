<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('detectors.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn dark @click="$store.commit('detectors/clearFilters')">{{ $t('detectors.clear_filters') }}</v-btn>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs3>
                    <v-text-field append-icon="search" :label="$t('detectors.filters.search')"
                                  single-line hide-details v-model="search" clearable>
                    </v-text-field>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('detectors.filters.online')"
                              :items="[$t('detectors.table.yes'), $t('detectors.table.no')]"
                              v-model="onlineFilter" clearable></v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('detectors.filters.components_status')"
                              :items="[$t('detectors.table.ok'), $t('detectors.table.fail')]"
                              v-model="componentsFilter" clearable>
                    </v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('detectors.filters.registration_status')" :items="regStatuses"
                              v-model="regStatusFilter" multiple clearable>
                    </v-select>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('detectors.filters.tags')" :items="tagNames" v-model="detectorTagFilter"
                              multiple chips item-text="name" item-value="id" clearable>
                    </v-select>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                <v-data-table :headers="headers" :items="detectors" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination"
                >
                  <template slot="items" slot-scope="props">
                    <td>
                      <nuxt-link :to="`/detectors/${props.item.id}`">
                        <div>{{ props.item.friendly_name }}</div>
                      </nuxt-link>
                    </td>
                    <td :class="props.item.online ? 'success--text' : 'error--text'">
                      <v-icon v-if="props.item.online" class="success--text">
                        check_circle
                      </v-icon>
                      <v-icon class="error--text" v-else>warning</v-icon>
                      {{ props.item.onlineStr }}
                    </td>
                    <td>{{ props.item.last_seen | moment('DD MMM YYYY HH:mm:ss') }}</td>
                    <td :class="props.item.components_overall ? 'success--text' : 'error--text'">
                      <v-icon v-if="props.item.components_overall" class="success--text">
                        check_circle
                      </v-icon>
                      <v-icon class="error--text" v-else>warning</v-icon>
                      {{ props.item.componentsStatus }}
                    </td>
                    <td>
                      <div v-if="props.item.registration_status === 'Unapproved'" class="deep-orange--text">
                        <v-icon class="deep-orange--text">warning</v-icon>
                        {{ props.item.registration_status }}
                      </div>
                      <div v-else-if="props.item.registration_status === 'Approved' || props.item.registration_status === 'Completed'"
                           :class="props.item.registration_status === 'Completed' ? 'success--text' : 'deep-orange--text'"
                      >
                        <v-icon class="success--text">
                          {{ props.item.registration_status === 'Completed' ? 'check_circle' : 'check' }}
                        </v-icon>
                        {{ props.item.registration_status }}
                      </div>
                      <div v-else-if="props.item.registration_status === 'Rejected'" class="error--text">
                        <v-icon class="success--text">check_circle</v-icon>
                        {{ props.item.registration_status }}
                      </div>
                      <span v-else>{{ props.item.registration_status }}</span>
                    </td>
                    <td>{{ props.item.version }}</td>
                    <td>{{ props.item.tagsStr }}</td>
                    <td>
                      <a :href="$store.state.GRAFANA_URL + props.item.name" target="_blank">[grafana]</a>
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

<script src="./detectors.js"></script>