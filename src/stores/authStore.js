import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userInfo = ref({});
  const isAuthenticated = ref(false);

  const setToken = (newToken) => {
    token.value = newToken
  }

  const removeToken = () => {
    token.value = ''
  }

  const login = (loginData) => {
    userInfo.value = loginData;
    isAuthenticated.value = true;
  }

  const logout = () => {
    removeToken()
    userInfo.value = {};
    isAuthenticated.value = false;
  }
  return {
    token,
    // username,
    // role,
    isAuthenticated,
    userInfo,
    setToken,
    removeToken,
    login,
    logout
  }
})