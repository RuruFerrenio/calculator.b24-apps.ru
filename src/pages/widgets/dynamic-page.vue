<script setup lang="ts">
import WorkdayManager from "../../components/WorkdayManager.vue";
</script>

<template>
  <div class="lg:col-span-3">
    <WorkdayManager
        :mode="start"
        :auto-close-delay="2000"
    />
  </div>
</template>
