<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
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
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>
          <v-flex xs12>
            <div class="headline">{{ $t('dashboard.detectors') }}</div>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="dns" :title="$t('dashboard.detectors_online')" link @click.native="gotoOfflineDetectors">
              <div class="headline" v-if="onlineDetectors < detectorsAll.length">
                <v-icon class="error--text mr-2">warning</v-icon>
                <span class="error--text">{{ onlineDetectors }}</span> / {{ detectorsAll.length }}
              </div>
              <div class="headline" v-else>
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">{{ onlineDetectors }}</span> / {{ detectorsAll.length }}
              </div>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="warning" :title="$t('dashboard.detectors_problems')" link @click.native="gotoDetectorsWithProblems">
              <div class="headline" v-if="!detectorsWithProblems">
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">0</span> / {{ detectorsAll.length }}
              </div>
              <div class="headline" v-else>
                <v-icon class="error--text mr-2">warning</v-icon>
                <span class="error--text">{{ detectorsWithProblems }}</span> / {{ detectorsAll.length }}
              </div>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="person_add" :title="$t('dashboard.detectors_unapproved')" link @click.native="gotoUnapprovedDetectors">
              <div class="headline" v-if="!unapprovedDetectors">
                <v-icon class="success--text mr-2">check_circle</v-icon>
                <span class="success--text">0</span> / {{ detectorsAll.length }}
              </div>
              <div class="headline" v-else>
                <v-icon class="deep-orange--text mr-2">warning</v-icon>
                <span class="deep-orange--text">{{ unapprovedDetectors }}</span> / {{ detectorsAll.length }}
              </div>
            </dashboard-card>
          </v-flex>

          <v-flex xs12 class="mt-3">
            <div class="headline">Rules</div>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <nuxt-link to="/rules/review" style="text-decoration: none;" v-if="rule_drafts.count">
              <dashboard-card icon="security" title="Unpublished Rules" link>
                <div class="headline deep-orange--text">
                  {{ rule_drafts.count }}
                </div>
              </dashboard-card>
            </nuxt-link>
            <dashboard-card icon="security" title="Unpublished Rules" v-else>
              <div class="headline success--text">
                <v-icon class="success--text">check_circle</v-icon> 0
              </div>
            </dashboard-card>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <dashboard-card icon="security" title="Rules">
              <div class="headline mt-3">
                <!--<v-btn flat block color="primary" style="height: auto;"-->
                       <!--:loading="$store.state.rulesSyncing" @click="$store.dispatch('updateRules')"-->
                <!--&gt;-->
                  <!--<span style="white-space: normal;">Check and Download Updates</span>-->
                <!--</v-btn>-->
              </div>
            </dashboard-card>
          </v-flex>

          <v-flex xs12 class="mt-3">
            <div class="headline">Feedback</div>
          </v-flex>
          <v-flex xs6 sm4 lg3>
            <nuxt-link to="/feedback" style="text-decoration: none;">
              <dashboard-card icon="feedback" title="Unsolved Feedback" link>
                <div class="headline" v-if="unsolvedFeedbackCount">
                  <v-icon class="error--text mr-2">warning</v-icon>
                  <span class="error--text">{{ unsolvedFeedbackCount }}</span> / {{ feedbackTotalCount }}
                </div>
                <div class="headline" v-else>
                  <v-icon class="success--text mr-2">check_circle</v-icon>
                  <span class="success--text">{{ unsolvedFeedbackCount }}</span> / {{ feedbackTotalCount }}
                </div>
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
    </v-content>
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