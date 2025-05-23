<template>
  <main>
    <header>
      <a href="https://pinia.vuejs.org/" target="_blank">
        <img src="./assets/pinia-logo.svg" alt="pinia logo" />
      </a>
      <h1>Pinit Down</h1>
    </header>
    <div class="task-list">
      <p>All Tasks</p>
      <div v-for="task in taskStore.tasks">
        <TaskDetails :task="task" />
      </div>
    </div>
    <div class="task-list">
      <p>Fav Tasks</p>
      <div v-for="task in taskStore.favs">
        <TaskDetails :task="task" />
      </div>
    </div>
  </main>
</template>

<script>
import { useTaskStore } from "./stores/TaskStore";
import TaskDetails from "./components/TaskDetails.vue";

export default {
  components: { TaskDetails },

  setup() {
    const taskStore = useTaskStore();
    return { taskStore };
  },
};
</script>
