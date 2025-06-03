import { defineStore } from 'pinia'

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: [],
    isLoading: false,
}),
getters: {
  favs() {
    return this.tasks.filter(t => t.isFav)
  },

  favCount() {
    return this.tasks.reduce((previous, current) => {
      return current.isFav ? previous +1 : previous
    }, 0)
  },

  totalCount: (state) => {
    return state.tasks.length
  },
},
actions: {

 async getTasks() {
  this.isLoading = true;

  const resPromise = fetch("http://localhost:3000/tasks");
  const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));

  const [res] = await Promise.all([resPromise, delayPromise]);

  const data = await res.json();
  this.tasks = data;

  this.isLoading = false;
},


  addTask(task) {
    this.tasks.push(task)
  },

  toggleFav(id) {
    const task = this.tasks.find(t => t.id === id)
    if (task) {
      task.isFav = !task.isFav
    }
  },

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id)
  }
  }
})
