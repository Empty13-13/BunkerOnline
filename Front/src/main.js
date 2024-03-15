import '@/assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './api.js'


import App from './App.vue'
import router from './router'
import dynamicAdaptiveDirective from "@/directives/dynamicAdaptiveDirective.js";
import spoilerSlide from "@/directives/spoilerSlide.js";

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('adaptive', dynamicAdaptiveDirective)
app.directive('slide', spoilerSlide)

app.mount('#app')
