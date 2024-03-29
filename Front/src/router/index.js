import { createRouter, createWebHistory } from 'vue-router'
import Home from "@/views/Home.vue";
import Example from "@/views/Example.vue";
import Game from "@/views/Game.vue";
import Login from "@/views/Login.vue";
import Profile from "@/views/Profile.vue";
import Rules from "@/views/Rules.vue";
import Wiki from "@/views/Wiki.vue";
import Updates from "@/views/Updates.vue";
import Contacts from "@/views/Contacts.vue";
import Pagination from "@/views/Pagination.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useMyProfileStore } from "@/stores/profile.js";
import { getId, getLinkParams } from "@/plugins/functions.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'pagination',
    //   component: Pagination
    // },
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/game=:id',
      name: 'game',
      component: Game
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/profile=:id',
      name: 'profile',
      component: Profile
    },
    {
      path: '/rules',
      name: 'rules',
      component: Rules
    },
    {
      path: '/wiki',
      name: 'wiki',
      component: Wiki
    },
    {
      path: '/updates',
      name: 'updates',
      component: Updates
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: Contacts
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

router.beforeEach((to, from) => {
  const myProfile = useMyProfileStore()
  
  if (to.name==="login" && myProfile.token) {
    return {name:'profile'}
  }
})

// router.beforeResolve(async (to) => {
//   console.log(to.name,to.name==='profile',to.query.account==='connected')
//   if (to.name==='profile' && to.query.account==='connected') {
//     console.log('start beforeEach')
//     const authStore = useAuthStore()
//     const myProfile = useMyProfileStore()
//     await authStore.refreshToken()
//
//     console.log('refresh token ROUTER')
//     if (!localStorage.getItem('userId')) {
//       myProfile.id = getId.value
//       localStorage.setItem('userId', myProfile.id.toString())
//     }
//   }
// })

export default router
