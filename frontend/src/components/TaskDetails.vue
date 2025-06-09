<template>
  <div class="task">
    <h3>{{ task.title }}</h3>
    <div class="icon">
      <i @click="taskStore.deleteTask(task._id)" class="material-icons"
        >delete</i
      >
      <i
        @click="taskStore.toggleFav(task._id)"
        :class="['material-icons', task.isFav ? 'fav' : '']"
        >favorite</i
      >
    </div>
  </div>
</template>

<script>
import { useTaskStore } from "../stores/TaskStore";

export default {
  props: ["task"],

  setup() {
    const taskStore = useTaskStore();

    return { taskStore };
  },
};
</script>
