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
  },
  favCount() {
    return this.tasks.reduce((previous, current) => {
      return current.isFav ? previous +1 : previous
    }, 0)
  },
   totalCount: (state) => {
    return state.tasks.length
  },
}
})
