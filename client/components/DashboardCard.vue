<template>
  <v-card height="100%" :hover="link" style="display: flex; align-items: center;">
    <v-layout fill-height align-center justify-center>
      <v-card-title primary-title>
        <div class="text-xs-center">
          <h5>
            <v-icon v-if="icon" large>{{icon}}</v-icon>
            {{title}}
          </h5>
          <slot></slot>
        </div>
      </v-card-title>
    </v-layout>
  </v-card>
</template>

<script>
    export default {
        props: ['icon', 'title', 'link']
    }
</script>