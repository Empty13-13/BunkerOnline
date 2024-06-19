<script setup="">

</script>

<template>
  <main class="subWiki paddingTop">
    <div class="subWiki__container">
      <h1 class="subWiki__title titleH1">Название всей страницы (Заголовок H1. Он может быть только один на всей
                                         странице для оптимизации SEO)</h1>
      <div class="subWiki__body">
        <h2>Список с черточками</h2>
        <ul>
          <li>Пункт 1</li>
          <li>Пункт 2</li>
          <li>Пункт 3</li>
          <li>Вложенный список
            <ul>
              <li>Пункт 1</li>
              <li>Пункт 2</li>
              <li>Пункт 3</li>
            </ul>
          </li>
        </ul>
        <h2>Список с цифрами</h2>
        <ol>
          <li>Пункт 1</li>
          <li>Пункт 2</li>
          <li>Подпункты
            <ol>
              <li>Подпункт 1</li>
              <li>Подпункт 2</li>
              <li>Третий уровень вложенности
                <ol>
                  <li>Подпункт 1</li>
                  <li>Подпункт 2</li>
                  <li>Подпункт 3</li>
                </ol>
              </li>
            </ol>
          </li>
        </ol>

        <h2>Заголовок H2</h2>
        <h3>Заголовок H3</h3>
        <h4>Заголовок H4</h4>
        <h5>Заголовок H5</h5>

        <p>Обычный параграф. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquid aut culpa ea,
           ex facere facilis fugiat hic ipsam magni, mollitia nobis nulla odit optio qui quibusdam repellat repudiandae,
           saepe sunt veritatis. Doloremque inventore natus porro sapiente voluptates! Autem beatae debitis doloremque
           eligendi, eos illum minus obcaecati ratione totam vero.</p>
        <p>Тут есть <b>жирный</b>, <i>italic</i>, <u>подчеркнутый</u> текст. Или <b><i><u>Всё вместе!</u></i></b></p>
        <p>Чтобы специально сделать отступ, нужно написать < br></p>
        <br>
        <br>
        <br>
        <p>Здесь расположена <a href="">ссылка на другую вложенную страницу</a></p>
        <p>Здесь расположена <a href="/asddfgfdgdf">ссылка на другую вложенную страницу</a></p>
        <p>Маркированный текст
          <mark>расположен здесь</mark>
        </p>
        <table>
          <caption>
            Заголовок всей таблицы таблицы (необязательно)
          </caption>
          <thead>
          <tr>
            <th>Название столбца 1 (необязательно)</th>
            <th>Название столбца 2 (необязательно)</th>
            <th>Название столбца 3 (необязательно)</th>
            <th>Название столбца 4 (необязательно)</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Chris</td>
            <td>HTML tables</td>
            <td>22</td>
            <td>22</td>
          </tr>
          <tr>
            <td>Dennis</td>
            <td>Web accessibility</td>
            <td>45</td>
            <td>45</td>
          </tr>
          <tr>
            <td>Sarah</td>
            <td>JavaScript frameworks</td>
            <td>29</td>
            <td>29</td>
          </tr>
          <tr>
            <td>Karen</td>
            <td>Web performance</td>
            <td>36</td>
            <td>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium alias aliquam aut blanditiis,
                culpa delectus distinctio eos error harum in laborum minus, nemo nihil nisi odio possimus quis repellat
                reprehenderit soluta unde ut velit, voluptas? Beatae doloremque dolores inventore laborum magni!
                Deserunt dolorem expedita iste iusto laboriosam, numquam, odit praesentium quo rem similique tempora
                tenetur ullam veritatis? Ab distinctio enim error praesentium sapiente sequi? Ad doloremque ea eius
                reiciendis. Ad aliquid asperiores corporis dolorum expedita labore odio vitae. Accusantium adipisci
                aliquam autem beatae cumque debitis dicta dignissimos eaque facilis, fugiat illum ipsam, officia omnis
                possimus praesentium quo quos recusandae repudiandae.
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
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