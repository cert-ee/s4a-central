<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('feedback.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <transition name="fade">
        <v-btn v-if="selectedFeedbacks.length" color="error" @click="toggleSolved(false)">
          {{ $t('feedback.mark_as_unsolved') }}
        </v-btn>
      </transition>
      <transition name="fade">
        <v-btn v-if="selectedFeedbacks.length" color="success" @click="toggleSolved(true)">
          {{ $t('feedback.mark_as_solved') }}
        </v-btn>
      </transition>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap justify-center>
          <v-flex xs12>
            <v-card>
              <v-card-title class="mb-3">
                <v-layout row wrap>
                  <v-flex xs3>
                    <v-text-field append-icon="search" :label="$t('feedback.filters.search')"
                                  single-line hide-details v-model="search" clearable>
                    </v-text-field>
                  </v-flex>
                  <v-flex xs3>
                    <v-select :label="$t('feedback.filters.solved')"
                              :items="[$t('feedback.table.yes'), $t('feedback.table.no')]"
                              v-model="solvedFilter" clearable></v-select>
                  </v-flex>
                </v-layout>
              </v-card-title>
              <v-card-text>
                <v-data-table :headers="headers" :items="feedback" :rows-per-page-items="rowsPerPage" :search="search"
                              :pagination.sync="pagination" v-model="selectedFeedbacks" select-all="primary"
                >
                  <template slot="items" slot-scope="props">
                    <td>
                      <v-checkbox color="primary" hide-details v-model="props.selected"></v-checkbox>
                    </td>
                    <td>
                      <nuxt-link :to="`/feedback/${props.item.id}`">
                        <div>{{ props.item.case_number }}</div>
                      </nuxt-link>
                    </td>
                    <td>
                      <nuxt-link v-if="props.item.detector && props.item.detector.friendly_name"
                                 :to="`/detectors/${props.item.detector.id}`"
                      >
                        <div>{{ props.item.detector.friendly_name }}</div>
                      </nuxt-link>
                    </td>
                    <td>{{ props.item.created_time | moment('ddd, MMM DD YYYY HH:mm:ss') }}</td>
                    <td>{{ props.item.message }}</td>
                    <td>
                      <span v-if="props.item.comment && props.item.comment.length > 30">
                        {{ props.item.comment.substr(0, 30) }} ...
                      </span>
                      <span v-else>
                        {{ props.item.comment }}
                      </span>
                    </td>
                    <td>
                      <span v-if="props.item.internal_comment && props.item.internal_comment.length > 30">
                        {{ props.item.internal_comment.substr(0, 30) }} ...
                      </span>
                      <span v-else>
                        {{ props.item.internal_comment }}
                      </span>
                    </td>
                    <td :class="props.item.solved ? 'success--text' : 'error--text'">
                      <v-icon v-if="props.item.solved" class="success--text">check_circle</v-icon>
                      <v-icon class="error--text" v-else>warning</v-icon>
                      {{ props.item.solvedStr }}
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

<script src="./feedback.js"></script>