<template>
  <main>
    <header>
      <a href="https://pinia.vuejs.org/" target="_blank">
        <img src="./assets/pinia-logo.svg" alt="pinia logo" />
      </a>
      <h1>{{ taskStore.appName }}</h1>
    </header>
    <div class="task-list-wrapper">
      <div class="task-list" v-for="task in taskStore.tasks">
        {{ task.id }}
        {{ task.title }}
        {{ task.isFav }}
      </div>
    </div>
  </main>
</template>

<script>
import { useTaskStore } from "./stores/counter";

export default {
  setup() {
    const taskStore = useTaskStore();
    return { taskStore };
  },
};
</script>

<style scoped></style>
