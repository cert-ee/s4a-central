<template>
  <div>
    <v-navigation-drawer persistent dark overflow v-model="drawer" style="display: none;"></v-navigation-drawer>
    <v-toolbar fixed class="blue-grey darken-2" dark>
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>Detector Details - {{detector.friendly_name}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn error v-if="$store.getters.hasAdminRole" @click="deleteDetector">Delete Detector</v-btn>
    </v-toolbar>
    <main>
      <v-container fluid>
        <v-layout row wrap>
          <v-flex xs1>
            <v-btn fab dark primary @click.native="$router.go(-1)">
              <v-icon dark>arrow_back</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs12 lg10>
            <v-tabs icons centered grow>
              <v-tabs-bar class="grey lighten-4">
                <v-tabs-slider class="primary"></v-tabs-slider>
                <v-tabs-item href="#details">
                  <v-icon>account_balance</v-icon>
                  Details
                </v-tabs-item>
                <v-tabs-item href="#components">
                  <v-icon class="red--after" v-badge="{value: '!', visible: !detector.components_overall}">
                    dns
                  </v-icon>
                  Components
                </v-tabs-item>
                <v-tabs-item href="#registration">
                  <v-icon v-if="registration_step === 1 || registration_step < 5" class="deep-orange--after"
                          v-badge:notifications_active.icon="{visible: registration_step === 1}"
                  >
                    assignment_ind
                  </v-icon>
                  <v-icon v-if="registration_step >= 5" class="success--after"
                          v-badge:check.icon="{visible: registration_step >= 5}"
                  >
                    assignment_ind
                  </v-icon>
                  Registration
                </v-tabs-item>
              </v-tabs-bar>

              <v-tabs-content id="details">
                <v-card>
                  <v-card-text>
                    <v-layout row wrap align-center>
                      <v-flex xs4 sm2>
                        <v-subheader>Detector Name</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.name}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Friendly Name</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>
                        <v-text-field v-if="$store.getters.hasAdminRole"
                                      v-model="detector.friendly_name" @blur="saveFriendlyName">
                        </v-text-field>
                        <span v-else>{{ detector.friendly_name }}</span>
                      </v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Detector Tags</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>
                        <v-select v-if="$store.getters.hasAdminRole"
                                  :items="tagNames" v-model="detector.tags" multiple chips
                                  item-text="name" item-value="id" @input="saveTags">
                        </v-select>
                        <span v-else>{{
                            detector.tags.reduce(function(a, b, i, arr) {
                                return a + b.name + (i < arr.length-1 ? ', ' : '');
                            }, '')
                          }}
                        </span>
                      </v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>IP Address</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.ip}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Organization Name</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.organization_name}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Contact Name</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.first_name}} {{detector.last_name}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Contact Phone</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.contact_phone}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Contact Email</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>{{detector.contact_email}}</v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>API Key</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10 >
                        <v-btn small class="ml-0" @click="showApiKey" v-if="apiKey == false">
                          Show
                        </v-btn>
                        <span v-if="apiKey != false">{{ apiKey }}</span>
                      </v-flex>
                      <v-flex xs12 class="mb-4">
                        <v-divider></v-divider>
                      </v-flex>
                      <v-flex xs12 class="mb-2">
                        <h6>Links</h6>
                      </v-flex>
                      <v-flex xs4 sm2>
                        <v-subheader>Grafana</v-subheader>
                      </v-flex>
                      <v-flex xs8 sm10>
                        <a :href="$store.state.GRAFANA_URL + detector.name">
                          {{ $store.state.GRAFANA_URL + detector.name }}
                        </a>
                      </v-flex>
                    </v-layout>
                  </v-card-text>
                </v-card>
              </v-tabs-content>

              <v-tabs-content id="components">
                <v-card>
                  <v-card-title class="mb-3">
                    <v-text-field append-icon="search" label="Search" single-line hide-details
                                  v-model="search">
                    </v-text-field>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table :headers="headers" :items="detector.components"
                                  :rows-per-page-items="rowsPerPage" :search="search" :pagination.sync="pagination"
                    >
                      <template slot="items" scope="props">
                        <td>{{ props.item.friendly_name }}</td>
                        <td :class="props.item.status ? 'success--text' : 'error--text'">
                          <v-icon v-if="props.item.status" class="success--text">
                            check_circle
                          </v-icon>
                          <v-icon class="error--text" v-else>warning</v-icon>
                          {{ props.item.statusStr }}
                        </td>
                        <td>{{ props.item.message }}</td>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-tabs-content>

              <v-tabs-content id="registration">
                <v-stepper v-model="registration_step" vertical>
                  <v-stepper-step step="1"
                                  :editable="registration_steps[0].complete && !registration_steps[2].complete"
                                  :complete="registration_steps[0].complete"
                  >
                    {{ registration_steps[0].name }}
                  </v-stepper-step>
                  <v-stepper-content step="1">
                    <v-btn primary @click="registration_step++; registration_steps[0].complete = true">
                      Continue
                    </v-btn>
                    <v-btn flat error @click.stop="openRejectDialog">Reject</v-btn>
                    <v-dialog v-model="rejectDialog">
                      <v-card>
                        <v-form v-model="rejectionReasonFilled" ref="rejectForm" @submit.prevent="rejectRegistration">
                          <v-card-title>
                            <span class="headline">Reject Registration</span>
                          </v-card-title>
                          <v-card-text>
                            <v-text-field label="Reason" v-model="rejectionReason" required
                                          :rules="[rules.required]" autofocus>
                            </v-text-field>
                          </v-card-text>
                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn type="button" flat @click="rejectDialog = false">Cancel</v-btn>
                            <v-btn type="submit" flat error>Reject</v-btn>
                          </v-card-actions>
                        </v-form>
                      </v-card>
                    </v-dialog>
                  </v-stepper-content>
                  <v-stepper-step step="2"
                                  :editable="registration_steps[1].complete && !registration_steps[2].complete"
                                  :complete="registration_steps[1].complete"
                  >
                    {{ registration_steps[1].name }}
                  </v-stepper-step>
                  <v-stepper-content step="2">
                    <p>
                      Registration received: {{ detector.created_time | moment('DD MMM YYYY HH:mm:ss') }}
                    </p>
                    <p>
                      <strong>Important:</strong>
                      Name change is only possible once! It cannot be changed after the registration form is approved.
                    </p>
                    <p>You can return to this step later.</p>
                    <v-form v-model="nameValid" @submit.prevent="">
                      <v-text-field label="Detector Name" class="mt-4" v-model="detector.name"
                                    required
                                    :rules="[rules.required, rules.name]">
                      </v-text-field>
                      <v-btn primary :disabled="!nameValid"
                             @click="registration_step++; registration_steps[1].complete = true"
                      >
                        Continue
                      </v-btn>
                    </v-form>
                  </v-stepper-content>
                  <v-stepper-step step="3" :complete="registration_steps[2].complete">
                    {{ registration_steps[2].name }}
                  </v-stepper-step>
                  <v-stepper-content step="3">
                    <v-card class="mb-4">
                      <v-card-text>
                        <v-text-field label="Detector friendly name" class="mt-2 mb-3"
                                      v-model="detector.friendly_name" required>
                        </v-text-field>
                        <span class="title">Contact Details</span>
                        <v-text-field label="Contact first name" class="mt-4"
                                      v-model="detector.first_name" required>
                        </v-text-field>
                        <v-text-field label="Contact last name" v-model="detector.last_name" required></v-text-field>
                        <v-text-field label="Organization name" class="mt-3" v-model="detector.organization_name"
                                      required>
                        </v-text-field>
                        <v-text-field label="Contact phone" v-model="detector.contact_phone" required></v-text-field>
                        <v-text-field label="Contact email" class="mb-3"
                                      v-model="detector.contact_email" required>
                        </v-text-field>
                        <v-expansion-panel>
                          <v-expansion-panel-content>
                            <div slot="header">CSR to be signed</div>
                            <v-card>
                              <v-card-text class="grey lighten-3">{{detector.csr_unsigned}}</v-card-text>
                            </v-card>
                          </v-expansion-panel-content>
                        </v-expansion-panel>
                      </v-card-text>
                    </v-card>
                    <v-btn primary @click="approveRegistration" :loading="loading" >Save & Approve*</v-btn>
                    <v-btn flat error @click.stop="openRejectDialog">Reject</v-btn>
                    <div class="caption red--text mt-2">
                      *Detector name cannot be changed after completing this step!
                    </div>
                  </v-stepper-content>
                  <v-stepper-step step="4" :complete="registration_steps[3].complete">
                    {{ registration_steps[3].name }}
                  </v-stepper-step>
                  <v-stepper-content step="4">
                    <p>This could take a few minutes.</p>
                  </v-stepper-content>
                  <v-stepper-step step="5" :complete="registration_steps[4].complete">
                    {{ registration_steps[4].name }}
                  </v-stepper-step>
                  <v-stepper-content step="5">
                    <div class="green--text">
                      <v-icon class="green--text">check_circle</v-icon>
                      {{ registration_steps[4].text }}
                    </div>
                  </v-stepper-content>
                </v-stepper>
              </v-tabs-content>
            </v-tabs>
          </v-flex>
        </v-layout>
      </v-container>
    </main>
  </div>
</template>

<script src="./detector.js"></script>