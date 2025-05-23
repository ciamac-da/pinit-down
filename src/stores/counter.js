import { defineStore } from 'pinia'

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    appName: "Pinit Down",
    tasks: [
      {id:1, title:"one", isFav:true},
      {id:2, title:"two", isFav:false},
    ]
})
})
