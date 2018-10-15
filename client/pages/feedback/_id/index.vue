<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>Feedback Case {{feedback.case_number}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="feedback.solved" color="error" @click="toggleSolved(false)">
        {{ $t('feedback.mark_as_unsolved') }}
      </v-btn>
      <v-btn v-else color="success" @click="toggleSolved(true)">
        {{ $t('feedback.mark_as_solved') }}
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-container fluid>
        <v-layout row wrap>
          <v-flex xs1>
            <v-btn fab dark color="primary" @click.native="$router.go(-1)">
              <v-icon dark>arrow_back</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 lg10>
            <v-tabs icons-and-text centered grow>
              <v-tabs-slider color="primary"></v-tabs-slider>
              <v-tab href="#details">
                <v-icon>account_balance</v-icon>
                Details
              </v-tab>
              <v-tab href="#logs">
                <v-icon>view_list</v-icon>
                Logs
              </v-tab>
              <v-tab href="#components">
                <v-icon>dns</v-icon>
                Components
              </v-tab>

              <v-tab-item id="details">
                <v-card>
                  <v-card-text>
                    <v-layout row wrap align-center>
                      <v-flex xs4 sm2>
                        <v-subheader>Case Number</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{feedback.case_number}}</v-flex>
                      <template v-if="feedback.detector && feedback.detector.friendly_name">
                        <v-flex xs4 sm2>
                          <v-subheader>Detector</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>
                          <nuxt-link :to="`/detectors/${feedback.detector.id}`">
                            {{feedback.detector.friendly_name}}
                          </nuxt-link>
                        </v-flex>
                      </template>
                      <v-flex xs4 sm2>
                        <v-subheader>Machine ID</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{feedback.machine_id}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Feedback Received</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{ feedback.created_time | moment('ddd, MMM DD YYYY HH:mm:ss') }}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Message</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{feedback.message}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Comment</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>
                        <v-textarea v-model="feedback.comment" readonly></v-textarea>
                      </v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Internal Comment</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>
                        <v-textarea v-model="feedback.internal_comment" @blur="saveInternalComment"></v-textarea>
                      </v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Solved</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{feedback.solvedStr}}</v-flex>

                      <template v-if="(feedback.system_info && Object.keys(feedback.system_info).length) ||
                                      (feedback.network_interfaces && feedback.network_interfaces.length)"
                      >
                        <v-flex xs12 class="mb-4">
                          <v-divider></v-divider>
                        </v-flex>
                        <v-flex xs12 class="mb-2">
                          <div class="title">System Info</div>
                        </v-flex>
                      </template>
                      <template v-if="feedback.system_info && Object.keys(feedback.system_info).length">
                        <template v-if="feedback.system_info.mem">
                          <v-flex xs4 sm2>
                            <v-subheader>Total Memory</v-subheader>
                          </v-flex>
                          <v-flex xs8 sm10>{{ feedback.system_info.mem | kbytesToSize }}</v-flex>
                        </template>
                        <template v-if="feedback.system_info.cpu">
                          <v-flex xs4 sm2>
                            <v-subheader>CPU</v-subheader>
                          </v-flex>
                          <v-flex xs8 sm10>
                            {{feedback.system_info.cpu.model}} ({{feedback.system_info.cpu.count}} cores)
                          </v-flex>
                        </template>
                        <template v-if="feedback.system_info.disks && feedback.system_info.disks.length">
                          <v-flex xs4 sm2>
                            <v-subheader>Disks</v-subheader>
                          </v-flex>
                          <v-flex xs8 sm10>
                            <v-data-table class="mt-3 mb-3" :headers="disksHeaders" :items="feedback.system_info.disks" hide-actions>
                              <template slot="items" slot-scope="props">
                                <td>{{ props.item.mount }}</td>
                                <td>{{ props.item.part }}</td>
                                <td>{{ props.item.type }}</td>
                                <td>{{ props.item.size }}</td>
                                <td>{{ props.item.free }}</td>
                              </template>
                            </v-data-table>
                          </v-flex>
                        </template>
                      </template>
                      <template v-if="feedback.network_interfaces && feedback.network_interfaces.length">
                        <v-flex xs4 sm2>
                          <v-subheader>Network Interfaces</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>
                          <v-data-table class="mt-3 mb-3" :headers="interfacesHeaders" :items="feedback.network_interfaces" hide-actions>
                            <template slot="items" slot-scope="props">
                              <td>{{ props.item.name }}</td>
                              <td>{{ props.item.state }}</td>
                              <td>{{ props.item.ip }}</td>
                            </template>
                          </v-data-table>
                        </v-flex>
                      </template>

                      <template v-if="feedback.contacts && Object.keys(feedback.contacts).length">
                        <v-flex xs12 class="mb-4">
                          <v-divider></v-divider>
                        </v-flex>
                        <v-flex xs12 class="mb-2">
                          <div class="title">Contact Information</div>
                        </v-flex>
                        <v-flex xs4 sm2>
                          <v-subheader>Name</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>{{feedback.contacts.first_name}} {{feedback.contacts.last_name}}</v-flex>
                        <v-flex xs4 sm2>
                          <v-subheader>Organization</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>{{feedback.contacts.organization_name}}</v-flex>
                        <v-flex xs4 sm2>
                          <v-subheader>Email</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>{{feedback.contacts.contact_email}}</v-flex>
                        <v-flex xs4 sm2>
                          <v-subheader>Phone</v-subheader>
                        </v-flex>
                        <v-flex xs8 sm10>{{feedback.contacts.contact_phone}}</v-flex>
                      </template>
                    </v-layout>
                  </v-card-text>
                </v-card>
              </v-tab-item>

              <v-tab-item id="logs">
                <v-card>
                  <v-card-text>
                    <v-layout row wrap align-center>
                      <v-flex xs12>
                        <v-textarea v-model="feedback.logs" readonly rows="30"></v-textarea>
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                </v-card>
              </v-tab-item>

              <v-tab-item id="components">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-text-field append-icon="search" label="Search" single-line hide-details
                                  v-model="search">
                    </v-text-field>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="componentsHeaders" :items="feedback.components"
                                  :rows-per-page-items="rowsPerPage" :search="search" :pagination.sync="pagination"
                    >
                      <template slot="items" slot-scope="props">
                        <td>{{ props.item.friendly_name }}</td>
                        <td :class="props.item.status ? 'success--text' : 'error--text'">
                          <v-icon v-if="props.item.status" class="success--text">
                            check_circle
                          </v-icon>
                          <v-icon class="error--text" v-else>warning</v-icon>
                          {{ props.item.statusStr }}
                        </td>
                        <td>{{ props.item.message }}</td>
                        <td>
                          <span v-if="props.item.logs">
                            <v-tooltip right>
                              <v-btn icon slot="activator"
                                     @click.stop="log = {name: props.item.friendly_name, data: props.item.logs}; logDialog = true"
                              >
                                <v-icon>view_list</v-icon>
                              </v-btn>
                              <span>View Log</span>
                            </v-tooltip>
                          </span>
                        </td>
                        <td>
                          <span v-if="props.item.logs_error">
                            <v-tooltip right>
                              <v-btn icon
                                     @click.stop="log = {name: `${props.item.friendly_name} Error`, data: props.item.logs_error}; logDialog = true"
                              >
                                <v-icon class="red--text">view_list</v-icon>
                              </v-btn>
                              <span>View Error Log</span>
                            </v-tooltip>
                          </span>
                        </td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tab-item>
            </v-tabs>
          </v-flex>

          <v-dialog v-model="logDialog" width="70%" lazy scrollable>
            <v-card>
              <v-card-title>
                <span class="headline">{{ log.name }} Log</span>
              </v-card-title>
              <v-card-text style="height: 500px;">
                <pre>{{ log.data }}</pre>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="logDialog = false">{{ $t('close') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script src="./feedback_details.js"></script>