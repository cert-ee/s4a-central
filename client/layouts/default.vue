<template>
  <v-app>
    <v-navigation-drawer app overflow dark width="250" v-model="drawer">
      <v-list class="pa-0" dark>
        <v-list-tile avatar ripple>
          <v-list-tile-avatar>
            <v-icon dark>account_circle</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title>{{$store.state.user ? $store.state.user.username : 'Test User'}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
      <v-list class="pt-0" dense dark>
        <v-divider></v-divider>
        <v-subheader class="grey--text">Menu</v-subheader>
        <v-list-tile to="/" exact ripple>
          <v-list-tile-action>
            <v-icon dark>dashboard</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.dashboard') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/detectors" exact ripple>
          <v-list-tile-action>
            <v-icon dark>dns</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.detectors') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/tags" exact ripple>
          <v-list-tile-action>
            <v-icon dark>bookmark</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.tags') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/feeds" exact ripple>
          <v-list-tile-action>
            <v-icon dark>cloud</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.feeds') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/taskers" exact ripple>
          <v-list-tile-action>
            <v-icon dark>schedule</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.taskers') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/tasks" exact ripple>
          <v-list-tile-action>
              <v-icon dark>history</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
              <v-list-tile-title>{{ $t('menu.tasks') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/rulesets" exact ripple>
          <v-list-tile-action>
            <v-icon dark>track_changes</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.rulesets') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-group v-if="$store.state.rulesReview" v-model="rulesExpanded" group="/rules" no-action>
          <v-list-tile slot="activator" to="/rules" exact ripple>
            <v-list-tile-action>
              <v-icon dark>track_changes</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ $t('menu.rules') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile to="/rules/review" exact ripple>
            <v-list-tile-content>
              <v-list-tile-title>{{ $t('menu.rules_review') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-group>

        <v-list-tile v-else to="/rules" exact ripple>
          <v-list-tile-action>
            <v-icon dark>track_changes</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.rules') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile to="/feedback" exact ripple>
          <v-list-tile-action>
            <v-icon dark>feedback</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.feedback') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile v-if="$store.getters.hasAdminRole" to="/users" exact ripple>
          <v-list-tile-action>
            <v-icon dark>people</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.users') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile v-if="$store.state.debugMode" @click.stop="showResetDemoConfirm" exact ripple>
          <v-list-tile-action>
            <v-icon dark>gavel</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t('menu.reset_demo') }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-dialog v-model="resetDemoDialog" width="20%" lazy>
          <v-card>
            <v-card-text>
              {{ $t('menu.reset_demo') }} ?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn flat @click="resetDemoDialog = false">{{ $t('cancel') }}</v-btn>
              <v-btn flat color="error" @click="resetDemo">{{ $t('reset') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-divider></v-divider>
        <v-subheader class="grey--text">Versions</v-subheader>

        <v-list-tile ripple>
          <v-list-tile-action>
            server
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{$store.state.versions.server}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile ripple>
          <v-list-tile-action>
            client
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{$store.state.versions.client}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile ripple>
          <v-list-tile-action>
            main
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{$store.state.versions.main}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

      </v-list>
    </v-navigation-drawer>
    <nuxt />
    <v-snackbar top :timeout="5000"
                :color="$store.state.snackBar.type === 'error' ? 'error' :
                  $store.state.snackBar.type === 'success' ? 'success' : ''"
                v-model="snackBar"
    >
      {{ $store.state.snackBar.text }}
      <v-btn dark flat @click="$store.commit('closeSnackbar')">{{ $t('close') }}</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script src="./default.js"></script>