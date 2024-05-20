<script setup="">
import { onMounted, ref } from "vue";

const props = defineProps({
  options: Array,
  placeholder: {
    type: String,
  },
  required: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: '',
  },
})

let model = defineModel()

//========================================================================================================================================================
const showDropdown = ref(false)


onMounted(() => {
  if(!props.placeholder && props.options.length) {
    model.value = {value: props.options[0].value,text: props.options[0].text}
  }
})
//========================================================================================================================================================
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function selectItem(value, text) {
  model.value = {value, text}
  toggleDropdown()
}

</script>

<template>
  <div class="select"
       :id="id"
       ref="originalSelect"
       :class="showDropdown?'_open':''"
  >
    <div ref="input" class="select__input" @click="toggleDropdown">
      {{model?model.text:options[0].text}}
    </div>
    <div ref="dropdownSel" :style="showDropdown?`height:${29*options.length}px`:''"
         class="select__dropdown"
    >
      <div class="select__list">
        <div v-for="{text, value} in options"
             :key="value"
             class="select__item"
             @click="selectItem(value,text)"
        >
          <p class="select__text">{{ text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .select {

    &__input {
      padding: 10px;
      transition: background 0.3s ease;
      border-radius: 8px 0;
    }

    &__dropdown {
      border-radius: 0 8px;
      height: 0;
      transition: height 0.2s ease;
      display: block;
    }

    &._open {
      .select__input{
        background: black;
      }

      .select__dropdown {
        max-height: 150px;
      }
    }
  }


</style>