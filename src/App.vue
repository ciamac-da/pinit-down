<template>
  <main>
    <header>
      <a href="https://pinia.vuejs.org/" target="_blank">
        <img src="./assets/pinit-down.png" alt="pinia logo" />
      </a>
      <div>
        <h1>Pinit Down</h1>
        <button class="theme-toggle" @click="themeStore.toggleTheme()">
          <i class="material-icons">
            {{ themeStore.isDark ? "dark_mode" : "light_mode" }}
          </i>
        </button>
      </div>
    </header>

    <div class="is-loading" v-if="isLoading">Loading... <LoadingSpinner /></div>
    <div v-else>
      <div class="new-task-form">
        <TaskForm />
      </div>
      <nav class="filter">
        <button @click="filter = 'All'">All Tasks</button>
        <button @click="filter = 'Favs'">Fav Tasks</button>
        <button @click="taskStore.$reset">Reset All Tasks</button>
      </nav>
      <div class="task-list" v-if="filter === 'All'">
        <p>
          You have {{ totalCount }}
          {{ totalCount <= 1 ? "Task" : "Tasks" }}
        </p>
        <div v-for="task in tasks" :key="task.id">
          <TaskDetails :task="task" />
        </div>
      </div>
      <div class="task-list" v-if="filter === 'Favs'">
        <p>
          You have {{ favCount }} Fav
          {{ favCount <= 1 ? "Task" : "Tasks" }}
        </p>
        <div v-for="task in favs">
          <TaskDetails :task="task" />
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { ref, onMounted } from "vue";
import { useTaskStore } from "./stores/TaskStore";
import { useThemeStore } from "./stores/ThemeStore";
import TaskDetails from "./components/TaskDetails.vue";
import TaskForm from "./components/TaskForm.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { storeToRefs } from "pinia";

export default {
  components: { TaskDetails, TaskForm, LoadingSpinner },

  setup() {
    const taskStore = useTaskStore();
    const themeStore = useThemeStore();
    onMounted(() => {
      themeStore.loadTheme();
    });

    const { tasks, isLoading, favs, totalCount, favCount } =
      storeToRefs(taskStore);

    // Fetch Tasks
    taskStore.getTasks();

    const filter = ref("All");

    return {
      taskStore,
      themeStore,
      filter,
      tasks,
      isLoading,
      favs,
      totalCount,
      favCount,
    };
  },
};
</script>
