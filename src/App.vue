<template>
  <main>
    <header>
      <a href="https://pinia.vuejs.org/" target="_blank">
        <img src="./assets/pinia-logo.svg" alt="pinia logo" />
      </a>
      <h1>Pinit Down</h1>
    </header>

    <div class="new-task-form">
      <TaskForm />
    </div>

    <nav class="filter">
      <button @click="filter = 'All'">All Tasks</button>
      <button @click="filter = 'Favs'">Fav Tasks</button>
    </nav>

    <div class="task-list" v-if="filter === 'All'">
      <p>
        You have {{ taskStore.totalCount }}
        {{ taskStore.totalCount <= 1 ? "Task" : "Tasks" }}
      </p>
      <div v-for="task in taskStore.tasks">
        <TaskDetails :task="task" />
      </div>
    </div>
    <div class="task-list" v-if="filter === 'Favs'">
      <p>
        You have {{ taskStore.favCount }} Fav
        {{ taskStore.favCount <= 1 ? "Task" : "Tasks" }}
      </p>
      <div v-for="task in taskStore.favs">
        <TaskDetails :task="task" />
      </div>
    </div>
  </main>
</template>

<script>
import { ref } from "vue";
import { useTaskStore } from "./stores/TaskStore";
import TaskDetails from "./components/TaskDetails.vue";
import TaskForm from "./components/TaskForm.vue";

export default {
  components: { TaskDetails, TaskForm },

  setup() {
    const taskStore = useTaskStore();

    const filter = ref("All");

    return { taskStore, filter };
  },
};
</script>
