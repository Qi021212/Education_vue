import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const username = ref('');
  const role = ref('');
  const isAuthenticated = ref(false);

  const setToken = (newToken) => {
    token.value = newToken
  }

  const removeToken = () => {
    token.value = ''
  }

  const login = (loginData) => {
    username.value = loginData.username;
    role.value = loginData.role;
    isAuthenticated.value = true;
  }

  const logout = () => {
    removeToken()
    username.value = '';
    role.value = '';
    isAuthenticated.value = false;
  }
  return {
    token,
    username,
    role,
    isAuthenticated,
    setToken,
    removeToken,
    login,
    logout
  }
})