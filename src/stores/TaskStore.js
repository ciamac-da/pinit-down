import { defineStore } from 'pinia'

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: [
      {id:1, title:"one", isFav:true},
      {id:2, title:"two", isFav:false},
    ]
}),
getters: {
  favs() {
    return this.tasks.filter(t => t.isFav)
  }
}
})
