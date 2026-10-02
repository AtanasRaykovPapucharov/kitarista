const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/IndexPage.vue') },
      { path: 'scales', name: 'scales', component: () => import('@/pages/GuitarScalesPage.vue') },
      { path: 'chords', name: 'chords', component: () => import('@/pages/GuitarChordsPage.vue') },
      {
        path: 'flamenco',
        name: 'flamenco',
        component: () => import('@/pages/FlamencoPage.vue'),
      },
      { path: 'about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
