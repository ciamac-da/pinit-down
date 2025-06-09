<template>
  <form class="submit-form" @submit.prevent="handleSubmit">
    <input type="text" v-model="newTask" placeholder="I need to..." />
    <button>Add</button>
  </form>
</template>

<script>
import { ref } from "vue";
import { useTaskStore } from "../stores/TaskStore";

export default {
  setup() {
    const taskStore = useTaskStore();

    const newTask = ref("");

    const handleSubmit = () => {
  if (newTask.value.length > 0) {
    taskStore.addTask({
      title: newTask.value,
      isFav: false
    })
    newTask.value = ""
  }
}

    return { handleSubmit, newTask };
  },
};
</script>
