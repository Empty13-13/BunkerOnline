import '@/assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import('@/assets/main.css')

import App from './App.vue'
import router from './router'
import dynamicAdaptiveDirective from "@/directives/dynamicAdaptiveDirective.js";

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('adaptive', dynamicAdaptiveDirective)

app.mount('#app')
