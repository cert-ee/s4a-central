<template>
  <div>
    <v-navigation-drawer persistent dark overflow v-model="drawer" style="display: none;"></v-navigation-drawer>
    <v-toolbar fixed class="blue-grey darken-2" dark>
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('dashboard.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon :loading="refreshing" @click="refreshDashboard">
        <v-icon dark>refresh</v-icon>
        <span slot="loader" class="custom-loader">
          <v-icon dark>refresh</v-icon>
        </span>
      </v-btn>
    </v-toolbar>
    <main>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>
          <v-flex xs12>
            <h5>{{ $t('dashboard.detectors') }}</h5>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="dns" :title="$t('dashboard.detectors_online')" link @click.native="gotoOfflineDetectors">
              <h5 v-if="onlineDetectors < detectorsAll.length">
                <v-icon class="error--text mr-2">warning</v-icon>
                <span class="error--text">{{ onlineDetectors }}</span> / {{ detectorsAll.length }}
              </h5>
              <h5 v-else>
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">{{ onlineDetectors }}</span> / {{ detectorsAll.length }}
              </h5>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="warning" :title="$t('dashboard.detectors_problems')" link @click.native="gotoDetectorsWithProblems">
              <h5 v-if="!detectorsWithProblems">
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">0</span> / {{ detectorsAll.length }}
              </h5>
              <h5 v-else>
                <v-icon class="error--text mr-2">warning</v-icon>
                <span class="error--text">{{ detectorsWithProblems }}</span> / {{ detectorsAll.length }}
              </h5>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="person_add" :title="$t('dashboard.detectors_unapproved')" link @click.native="gotoUnapprovedDetectors">
              <h5 v-if="!unapprovedDetectors">
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">0</span> / {{ detectorsAll.length }}
              </h5>
              <h5 v-else>
                <v-icon class="deep-orange--text mr-2">warning</v-icon>
                <span class="deep-orange--text">{{ unapprovedDetectors }}</span> / {{ detectorsAll.length }}
              </h5>
            </dashboard-card>
          </v-flex>

          <v-flex xs12 class="mt-3">
            <h5>Rules</h5>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <nuxt-link to="/rules/review" style="text-decoration: none;" v-if="rule_drafts.count">
              <dashboard-card icon="security" title="Unpublished Rules" link>
                <h5 class="deep-orange--text">
                  {{ rule_drafts.count }}
                </h5>
              </dashboard-card>
            </nuxt-link>
            <dashboard-card icon="security" title="Unpublished Rules" v-else>
              <h5 class="success--text">
                <v-icon class="success--text">check_circle</v-icon> 0
              </h5>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="security" title="Rules">
              <h5>
                <v-btn flat primary :loading="$store.state.rulesSyncing" @click="$store.dispatch('updateRules')">
                  Check and Download Updates
                </v-btn>
              </h5>
            </dashboard-card>
          </v-flex>

          <v-flex xs12 class="mt-3">
            <h5>Feedback</h5>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <nuxt-link to="/feedback" style="text-decoration: none;">
              <dashboard-card icon="feedback" title="Unsolved Feedback" link>
                <h5 v-if="unsolvedFeedbackCount">
                  <v-icon class="error--text mr-2">warning</v-icon>
                  <span class="error--text">{{ unsolvedFeedbackCount }}</span> / {{ feedbackTotalCount }}
                </h5>
                <h5 v-else>
                  <v-icon class="success--text mr-2">check_circle</v-icon>
                  <span class="success--text">{{ unsolvedFeedbackCount }}</span> / {{ feedbackTotalCount }}
                </h5>
              </dashboard-card>
            </nuxt-link>
          </v-flex>

          <v-flex xs12 class="mt-5"></v-flex>

          <v-flex xs6 sm4 lg3>
            <dashboard-card>
              <img src="~/assets/image/eu_logo_horizontal.jpg" width="100%" />
            </dashboard-card>
          </v-flex>
        </v-layout>
      </v-container>
    </main>
  </div>
</template>

<script src="./index.js"></script>

<style scoped>
  .custom-loader {
    animation: loader 1s infinite;
    display: flex;
  }
  @-moz-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @-webkit-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @-o-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>