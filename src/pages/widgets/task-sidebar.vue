<script setup lang="ts">
import Calculator from "../../components/Calculator.vue";
</script>

<template>
  <div class="mx-auto mb-8">
    <Calculator
        :send-button="false"
        :keyboard-open="false"
        :engineering-open="false"
        :history-open="false"
        :help-open="false"
        container-padding="p-4"
    />
  </div>
</template>