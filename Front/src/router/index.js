import { createRouter, createWebHistory } from 'vue-router'
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Profile from "@/views/Profile.vue";
import Rules from "@/views/Rules.vue";
import Updates from "@/views/Updates.vue";
import Contacts from "@/views/Contacts.vue";
import { useMyProfileStore } from "@/stores/profile.js";

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
      component: () => import('../views/Game.vue')
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
      component: () => import('../views/Wiki.vue')
    },
    {
      path: '/wiki/professional-abilities',
      name: 'profAbilities',
      component: () => import('../views/ProfAbilities.vue')
    },
    {
      path: '/wiki/:page',
      name: 'subWiki',
      component: () => import('../views/SubWiki.vue')
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
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestAfterGame.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue')
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        left: 0,
        top: document.querySelector('header').offsetHeight,
      }
    }
    // if (savedPosition) {
    //   return savedPosition
    // } else {
    //   return { top: 0 }
    // }
    return {left: 0,top: 0}
  }
})

router.beforeEach((to, from) => {
  const myProfile = useMyProfileStore()
  
  if (to.name==="login" && !myProfile.isNoReg) {
    return 'profile='+myProfile.id
  }
})

export default router
