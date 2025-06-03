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

  const resPromise = await fetch("http://localhost:3000/tasks/");
  const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));

  const [res] = await Promise.all([resPromise, delayPromise]);

  const data = await res.json();
  this.tasks = data;

  this.isLoading = false;
},


  async addTask(task) {
    this.tasks.push(task)

    const res = await fetch("http://localhost:3000/tasks/",  {
      method: 'POST',
      body: JSON.stringify(task),
      headers: { 'Content-Type': 'application/json' }

    })
    if(res.error) {
      console.log(res.error);
    }
  },

  async toggleFav(id) {
    const task = this.tasks.find(t => t.id === id)
    if (task) {
      task.isFav = !task.isFav
    }

      const res = await fetch("http://localhost:3000/tasks/" + id,  {
      method: 'PATCH',
      body: JSON.stringify({ isFav: task.isFav}),
      headers: { 'Content-Type': 'application/json' }

    })
    if(res.error) {
      console.log(res.error);
    }
  },

  async removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id)

     const res = await fetch("http://localhost:3000/tasks/" + id,  {
      method: 'DELETE',
      headers: {'Contet-Type': 'application/json'}
    })
    if(res.error) {
      console.log(res.error);
    }
  }
  }
})
