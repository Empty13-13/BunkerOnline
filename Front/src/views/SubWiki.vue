<script setup="">
import { onBeforeMount, onMounted, ref } from "vue";
import axiosInstance from "@/api.js";
import router from "@/router/index.js";
import { usePreloaderStore } from "@/stores/preloader.js";

const globalPreloader = usePreloaderStore()

const pageHTML = ref('<h2>Идет загрузка страницы...</h2>')

onMounted(async () => {
  globalPreloader.activate()
  console.log(router.currentRoute.value.params.page)
  try {
    let dataPage = await axiosInstance.get(`/staticPage/${router.currentRoute.value.params.page}`)
    pageHTML.value = dataPage.data.html
    // console.log(dataPage)
  } catch(e) {
    await router.replace({name:'NotFound'})
  } finally {
    globalPreloader.deactivate()
  }

})

</script>

<template>
  <main class="subWiki paddingTop">
    <div class="subWiki__container">
<!--      <h1 class="subWiki__title titleH1">Название всей страницы (Заголовок H1. Он может быть только один на всей-->
<!--                                         странице для оптимизации SEO)</h1>-->
      <div class="subWiki__body" v-html="pageHTML"></div>
    </div>
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/style";

.subWiki {
  &__container {
  }

  &__title {
  }

  &__body {
    table {
      width: 100%;
      background-color: #00000080;
      padding: 15px;
      border-collapse: collapse;
      border: 1px solid #181818;
      border-radius: 8px;

      caption {
        font-size: 20px;
        margin-bottom: 15px;
        font-weight: 700;
      }

      tbody {
        tr {
          border-bottom: 1px solid #181818;
        }

        td {
          text-align: center;
          padding: 12px;
          border-right: 1px solid #181818;
        }
      }


      thead {
        th {
          border-bottom: 3px solid #181818;
          border-right: 1px solid #181818;
          padding: 13px;
          font-weight: 700;
          font-size: 13px;
        }
      }
    }

    h1 {
      font-size: 30px;
      font-weight: 700;
      margin-bottom: 20px;

      background: linear-gradient(90deg, rgb(249, 211, 91), rgb(217, 102, 19) 25%);
      background-clip: border-box;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    h2 {
      font-size: 20px;
      line-height: 1.5;
      margin-top: 30px;
      margin-bottom: 15px;
      font-weight: 700;
    }

    h3 {
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 10px;
    }

    h4 {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 10px;
    }

    h5 {
      font-weight: 700;
      margin-bottom: 10px;
    }

    ul {
      li {
        &::before {
          content: '- ';
        }
      }
    }

    ol {
      list-style-type: none; /* Убираем исходные маркеры */
      counter-reset: num;

      & > li {
        counter-increment: num;

        &::before {
          content: counter(num);
        }
      }

      ol {
        counter-reset: num2;

        & > li {
          counter-increment: num2;

          &::before {
            content: counter(num) '.' counter(num2);
          }
        }

        ol {
          counter-reset: num3;

          & > li {
            counter-increment: num3;

            &::before {
              content: counter(num) '.' counter(num2) '.' counter(num3);
            }
          }
        }
      }


      li {
        &::before {
          margin-right: 7px;
        }
      }
    }

    li {
      margin-bottom: 5px;

      li {
        margin-left: 10px;

        li {
          margin-left: 20px;
        }
      }
    }

    ol, ul {
      padding: 5px 0;
    }

    p {
      line-height: 1.5;
      margin-bottom: 7px;
    }

    a {
      color: #d7b14b;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 1px;
        top: calc(100% + 0px);
        left: 0;
        background-color: #d7b14b;
        transition: scale 0.15s ease;
      }

      //&:visited {
      //  &::after {
      //    background-color: #e88d49;
      //  }
      //}

      @media (any-hover: hover) {
        &:hover {
          &::after {
            display: none;
          }
        }
      }


    }

    b {
      font-weight: 700;
    }
  }
}

</style>