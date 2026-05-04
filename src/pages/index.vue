<script setup lang="ts">
import Calculator from "../components/Calculator.vue";
</script>

<template>
  <div class="mx-auto mb-8">
    <Calculator
        :send-button="false"
        :keyboard-open="true"
        :engineering-open="false"
        :history-open="false"
        :help-open="false"
        container-padding=""
    />
  </div>
</template>