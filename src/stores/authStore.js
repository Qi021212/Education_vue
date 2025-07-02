// stores/authStore.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentRole: 'teacher', // 默认角色
    isAuthenticated: false,
    userInfo: null
  }),
  actions: {
    setRole(role) {
      this.currentRole = role
    },
    login(userData) {
      // 这里应该是实际的登录逻辑
      this.isAuthenticated = true
      this.userInfo = userData
    },
    register(userData) {
      // 这里应该是实际的注册逻辑
      this.isAuthenticated = true
      this.userInfo = userData
    },
    logout() {
      this.isAuthenticated = false
      this.userInfo = null
    }
  },
  getters: {
    isAdmin: (state) => state.currentRole === 'admin',
    isTeacher: (state) => state.currentRole === 'teacher',
    isAssistant: (state) => state.currentRole === 'assistant'
  }
})