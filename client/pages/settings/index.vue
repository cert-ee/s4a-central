<template>
  <div>
    <v-toolbar app dark fixed class="blue-grey darken-2">
      <v-toolbar-side-icon @click.stop="$store.commit('toggleDrawer')"></v-toolbar-side-icon>
      <v-toolbar-title>{{ $t('menu.settings') }}</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout row wrap>


          <v-dialog v-model="editSmtpSettingsDialog.open" width="50%">
            <v-card>
              <v-form v-model="editSmtpFormValid" ref="editSmtpForm" @submit.prevent="editSmtp">
                <v-card-title>
                  <span class="headline">{{ $t('settings.smtp_settings') }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container grid-list-lg>
                    <v-layout row wrap>
                      <v-flex xs12>
                        <v-switch color="primary" :label="$t('settings.smtp_server_requires_auth')"
                                  v-model="settings.smtp_server_requires_auth"
                        ></v-switch>
                      </v-flex>
                      <v-flex xs6>
                        <v-text-field :label="$t('settings.smtp_server_host')" required
                                      v-model="settings.smtp_server_host"
                                      :rules="[editSmtpForm.required]"></v-text-field>
                      </v-flex>
                      <v-flex xs6>
                        <v-text-field :label="$t('settings.smtp_server_port')" required
                                      v-model="settings.smtp_server_port"
                                      :rules="[editSmtpForm.required]"
                        ></v-text-field>
                      </v-flex>
                      <v-flex xs12>
                        <v-text-field :label="$t('settings.smtp_server_from')" required
                                      v-model="settings.smtp_server_from"
                                      :rules="[editSmtpForm.required]"
                        ></v-text-field>
                      </v-flex>

                      <v-flex xs6>
                        <v-text-field :label="$t('settings.smtp_server_username')" required
                                      :disabled="!settings.smtp_server_requires_auth"
                                      v-model="settings.smtp_server_username"
                                      :rules="[editSmtpForm.required]">
                        </v-text-field>
                      </v-flex>
                      <v-flex xs6>
                        <v-text-field
                                v-model="settings.smtp_server_password"
                                :disabled="!settings.smtp_server_requires_auth"
                                :append-icon="passwordVisible ? 'visibility_off' : 'visibility'"
                                @click:append="() => (passwordVisible = !passwordVisible)"
                                :type="passwordVisible ? 'text' : 'password'"
                                :label="$t('settings.smtp_server_password')" required
                                :rules="[editSmtpForm.required]">
                        </v-text-field>
                      </v-flex>
                      <v-flex xs4>
                        <v-select :label="$t('settings.smtp_server_auth_method')"
                                  :disabled="!settings.smtp_server_requires_auth"
                                  :items="smtpAuthMethods"
                                  v-model="settings.smtp_server_auth_method" required
                                  :rules="[editSmtpForm.required]"
                                  item-text="name" item-value="name">
                        </v-select>
                      </v-flex>
                      <v-flex xs4>
                        <v-switch color="primary" :label="$t('settings.smtp_server_tls')"
                                  v-model="settings.smtp_server_tls"
                                  @change="resetSmtpPortValue"></v-switch>
                      </v-flex>
                      <v-flex xs4>
                        <v-switch color="primary" :label="$t('settings.smtp_server_force_notls')"
                                  v-model="settings.smtp_server_force_notls"
                                  @change="resetSmtpPortValueAndUpdateTLS"></v-switch>
                      </v-flex>
                    </v-layout>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn type="button" flat @click="editSmtpSettingsDialog.open = false">{{$t('cancel')}}</v-btn>
                  <v-btn type="submit" color="success" @click="editSmtp">{{$t('save') }}</v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-dialog>


          <v-flex xs6>
            <v-card height="100%">
              <v-card-title primary-title>
                <div class="headline">{{ $t('settings.network_settings') }}</div>
              </v-card-title>
              <v-card-text>
                <!--<v-divider></v-divider>-->
                <!--<v-layout row wrap>-->
                <!--<v-flex xs6>-->
                <!--<v-subheader>{{ $t('settings.elasticsearch_settings') }}</v-subheader>-->
                <!--</v-flex>-->
                <!--<v-flex xs6>-->
                <!--&lt;!&ndash;<v-btn type="button" color="info" v-if="$store.getters.hasAdminRole"&ndash;&gt;-->
                <!--&lt;!&ndash;@click="editSmtpSettingsDialog.open = true">{{$t('edit')}}&ndash;&gt;-->
                <!--&lt;!&ndash;</v-btn>&ndash;&gt;-->
                <!--</v-flex>-->
                <!--</v-layout>-->
                <!--<v-divider></v-divider>-->
                <!--<v-layout row wrap>-->
                <!--<v-flex xs6>-->
                <!--{{ $t('settings.elasticsearch_port') }}-->
                <!--</v-flex>-->
                <!--<v-flex xs6>-->
                <!--{{ settings.port_elasticsearch }}-->
                <!--</v-flex>-->
                <!--</v-layout>-->
                <v-divider></v-divider>
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-subheader>{{ $t('settings.smtp_settings') }}</v-subheader>
                  </v-flex>
                  <v-flex xs6>
                    <v-btn type="button" color="info" v-if="$store.getters.hasAdminRole"
                           @click="editSmtpSettingsDialog.open = true">{{$t('edit')}}
                    </v-btn>
                  </v-flex>
                </v-layout>
                <v-divider></v-divider>
                <v-layout row wrap>
                  <v-flex xs6>
                    {{ $t('settings.smtp_server_requires_auth') }}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_requires_auth}}
                  </v-flex>
                  <v-flex xs6>
                    {{ $t('settings.smtp_server_host') }}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_host }}
                  </v-flex>
                  <v-flex xs6>
                    {{$t('settings.smtp_server_port')}}
                  </v-flex>
                  <v-flex xs6>
                    {{settings.smtp_server_port}}
                  </v-flex>
                  <v-flex xs6>
                    {{$t('settings.smtp_server_from')}}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_from }}
                  </v-flex>
                  <v-flex xs6>
                    {{$t('settings.smtp_server_username')}}
                  </v-flex>
                  <v-flex xs6>
                    {{settings.smtp_server_username }}
                  </v-flex>

                  <v-flex xs6>
                    {{ $t('settings.smtp_server_auth_method') }}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_auth_method }}
                  </v-flex>

                  <v-flex xs6>
                    {{ $t('settings.smtp_server_tls') }}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_tls }}
                  </v-flex>

                  <v-flex xs6>
                    {{ $t('settings.smtp_server_force_notls') }}
                  </v-flex>
                  <v-flex xs6>
                    {{ settings.smtp_server_force_notls }}
                  </v-flex>

                </v-layout>

              </v-card-text>
            </v-card>
          </v-flex>

        </v-layout>
      </v-container>


    </v-content>
  </div>
</template>

<script src="./settings.js"></script>