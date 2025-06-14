<template>
    <nav class="filter">
      <button
        :class="{ active: filter === 'All' }"
        @click="$emit('update:filter', 'All')"
      >
        All Items
      </button>
      <button
        :class="{ active: filter === 'Favs' }"
        @click="$emit('update:filter', 'Favs')"
      >
        Fav Items
      </button>
      <button class="delete-all" @click="$emit('delete-all')">
        Delete All Items
      </button>
    </nav>
  </template>
  
  <script>
  export default {
    props: {
      filter: String
    }
  }
  </script>
  
  <style scoped>
.filter {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  margin: auto;
  text-align: center;
  padding-top: 60px;
}

.filter button {
  color: white;
  background: blueviolet;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  padding: 10px;
  transition: 0.2s linear all;
}

.filter button.active {
  background-color: #ecb732;
  color: black;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  scale: 1.05;
}

.filter button:hover {
  scale: 1.04;
}

.filter button.delete-all {
  background: #e63946;
  color: white;
}

.filter button.delete-all:hover {
  background: #d62828;
}
</style>
