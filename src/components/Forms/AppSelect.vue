<script setup="">
import { onMounted, ref } from "vue";

const model = defineModel()
const originalSelect = ref()
const dropdownSel = ref()
const inputSel = ref()
const {
  options,
  selectedIndex,
  required
} = defineProps({
  options: Object,
  selectedIndex: {
    type: Number,
    default: 0,
  },
  required: {
    type: Boolean,
    default: false,
  }
})

onMounted(() => {
  originalSelect.value.selectedIndex = selectedIndex
  console.log(originalSelect.value.value)
  inputSel.value.innerText = originalSelect.value.value
})

</script>

<template>
  <div class="select__wrapper">
    <select
        id="city"
        v-model="model"
        ref="originalSelect"
        :required="required"
    >
      <option
          v-for="(option,index) in options"
          :key="option"
          :value="option"
      >
        {{ option }}
      </option>
    </select>

    <div class="select">
      <div class="select__input" ref="inputSel">

      </div>
      <div class="select__dropdown" ref="dropdownSel">

      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>