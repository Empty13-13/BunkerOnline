<script setup="">
import AppButton from "@/components/AppButton.vue";
import { computed, ref } from "vue";
import { useMyProfileStore, useActionsProfileStore } from "@/stores/profile.js";
import { getId } from "@/plugins/functions.js";

defineProps({
  color: String,
  blockEdit: Boolean
})

let href = defineModel('href')

const myProfile = useMyProfileStore()
const actionsProfile = useActionsProfileStore()

let fileInput = ref()
let ownImage = ref()
let defaultAvatar = ref(false)

function editAvatar(e) {
  fileInput.value.click()
}

async function changeFileInput(e) {
  let file = e.target.files[0]

  // проверяем тип файла
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    alert('Разрешены только изображения.');
    e.target.value = '';
    return
  }
  // проверим размер файла   (<4 Мб)
  if (file.size>4 * 1024 * 1024) {
    alert('Файл должен быть менее 4 МБ.');
    return
  }

  let reader = new FileReader()
  reader.onload = async (e) => {
    const formData = new FormData()
    formData.append('file', file)
    let response = await actionsProfile.uploadAvatar(getId.value, formData)
    console.log(href.value, response.data.link)
    href.value = response.data.link

    if (getId.value===myProfile.id) {
      myProfile.avatarName = response.data.link
    }
  }
  reader.onerror = () => {
    alert('Произошла ошибка')
  }
  reader.readAsDataURL(file)
  defaultAvatar.value = false
}

async function deleteAvatar() {
  await actionsProfile.deleteAvatar(getId.value)
  href.value = ''

  if (getId.value===myProfile.id) {
    myProfile.avatarName = ""
  }
}

</script>

<template>
  <div class="avatar" :class="color">
    <div class="avatar__img" :class="color">
      <img v-if="color!=='noreg' && !href" src="/img/icons/defaultPhoto.png" alt="">
      <img v-else-if="color==='noreg'" src="/img/icons/noregPhoto.svg" alt="">
      <img ref="ownImage" v-else :src="'http://5.75.177.255:3000/'+href" alt="">

      <div v-if="!blockEdit && (myProfile.isAdmin || myProfile.id === getId)" class="profileEdit-avatar">
        <div @click="editAvatar" class="profileEdit-avatar__img _edit">
          <img src="/img/icons/pencil.png" alt="">
          <input accept=".jpg, .png, .gif, .jpeg" @change="changeFileInput" ref="fileInput" hidden style="display: none"
                 type="file" name="photo">
        </div>
        <div @click="deleteAvatar" class="profileEdit-avatar__img _delete">
          <img src="/img/icons/trash.png" alt="">
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/style";
@import "@/assets/scss/base";

.avatar {
  position: relative;
  border-radius: 50%;

  max-width: 150px;
  max-height: 150px;

  &::before {
    content: '';
    border-radius: 50%;
    overflow: hidden;
    position: absolute;
    left: -3px;
    top: -3px;
    width: calc(100% + 6px);
    height: calc(100% + 6px);
    background: transparent;
    z-index: 1;
  }

  &__img {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    width: 100%;
    height: 100%;

    & > img {
      border-radius: 50%;
      overflow: hidden;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 3;
    }
  }

  &.vip {
    &::before {
      background: linear-gradient(135deg, #696969, rgba(0, 0, 0, 0), #C9C9C9);
      box-shadow: 0px 4px 25px #646464;
    }
  }

  &.mvp {
    &::before {
      background: $goldColor;
      box-shadow: 0 5px 30px 0 rgba(217, 102, 19, 0.7);
    }
  }

  &.admin {
    &::before {
      background: $redColor;
      box-shadow: 0 4px 20px 0 rgba(255, 0, 0, 0.65);
    }
  }

  &.default {
    &::before {
      background: #3B3B3B;
    }
  }

  &.noreg {
    &::before {
      background: #3B3B3B;
    }

    .avatar__img {
      width: 30%;
      height: 38%;
    }


    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: $bodyColor;
      border-radius: 50%;
      overflow: hidden;
      z-index: 2;
    }
  }

  &.default, &.noreg {
    .avatar__img {
      display: flex;
      justify-content: center;
      align-items: center;

      & > img {
        position: relative;
        display: flex;
      }
    }
  }

}

.profileEdit-avatar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 15;

  &__img {
    flex: 1 1 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    opacity: 0;
    overflow: hidden;

    img {
      width: 25px;
      height: 25px;
    }

    &:hover {
      background: #00000050;
      opacity: 1;
    }

    &._edit {
      &:hover {
        border-right: 1px solid white;
      }
    }

    &._delete {
      &:hover {
        border-left: 1px solid white;
      }
    }
  }

  //&__choose {
  //  position: absolute !important;
  //  top: calc(100% + 20px);
  //  left: 50%;
  //  transform: translate(-50%, 0);
  //  display: flex;
  //  gap: 20px;
  //  font-size: 14px;
  //  padding: 10px;
  //  visibility: hidden;
  //  pointer-events: none;
  //
  //  button {
  //    padding: 8px 12px;
  //  }
  //}
}

</style>