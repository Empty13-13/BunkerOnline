const getTemplate = (data = [], placeholder, classList = "") => {
  let resultElement = document.createElement('div')
  resultElement.classList.add('select')
  
  placeholder ??= ''
  
  const items = data.map(item => {
    return `<li class="select__item" data-type="item" data-id="${item.id}">${item.value}</li>`
  })
  
  resultElement.innerHTML = `
  <div data-type="input" class="select__input">
    <span>
      ${placeholder}
    </span>
  </div>
      <div class="select__dropdown">
        <ul class="select__list">
          ${items.join('')}
        </ul>
      </div>
  `
  return resultElement
}

class Select {
  constructor(nodeItem, options) {
    this.$originalEl = nodeItem
    this.$el = null
    this.options = options
    this.selectedId = options.selectedId || null
    this.id = options.itemId
    this.selectedIndex = null
    this.error = false
    this.isRequired = options.isRequired
    this.$selectBlock = null
    
    this.__render()
    this.__setup()
  }
  
  __render() {
    //Работа с оригинальным select-ом
    const {placeholder, data} = this.options
    // Скрываем оригинальный селект
    this.$originalEl.hidden = true
    
    //Создаем структуру нового select-а
    let selectItem = document.createElement('div')
    
    selectItem.classList.add('selectBlock')
    
    if (this.$originalEl.classList.length) {
      let classList = this.$originalEl.classList.toString().split(' ')
      for (let index in classList) {
        selectItem.classList.add(classList[index])
        
      }
    }
    // Выводим оболочку перед оригинальным селектом
    this.$originalEl.parentNode.insertBefore(selectItem, this.$originalEl);
    // Помещаем созданный селект в оболочку
    selectItem.appendChild(getTemplate(data, placeholder))
    // Помещаем оригинальный селект в оболочку
    selectItem.prepend(this.$originalEl)
    this.$selectBlock = selectItem
    
    //Назначение и работа с созданным select-ом
    this.$el = this.$originalEl.parentNode.querySelector('.select')
    this.$el.classList.add('select')
  }
  
  __setup() {
    const {placeholder, data} = this.options
    
    this.$value = this.$el.querySelector('[data-type="input"] span')
    
    this.clickHandler = this.clickHandler.bind(this)
    this.$el.addEventListener('click', this.clickHandler)
    
    //Устанавливаем первый элемент, если нет placeholder
    if (!placeholder) {
      this.selectedId = data[0].id
    }
    //Если элемент выбрали в html, то выбираем его
    if (this.selectedId) {
      this.select(this.selectedId)
    }
  }
  
  // region Handlers
  
  clickHandler(event) {
    const {type} = event.target.dataset
    if (type==='input') {
      this.toggle()
    }
    else if (type==='item') {
      const id = event.target.dataset.id
      this.select(id)
    }
  }
  
  // endregion
  
  get current() {
    return this.options.data.find(item => item.id===this.selectedId)
  }
  
  get isOpen() {
    return this.$el.classList.contains('_open')
  }
  
  // region Functions
  select(id) {
    //Убираем активный класс с предыдущего активного элемента
    this.$el.querySelector(`[data-id="${this.selectedId}"]`)?.classList.remove('_selected')
    
    this.selectedId = id
    this.selectedIndex = this.current.index
    this.$value.textContent = this.current.value
    this.close()
    
    //Добавляем активный класс на нынешний активный элемент
    this.$el.querySelector(`[data-id="${this.selectedId}"]`).classList.add('_selected')
    
    this.$originalEl.selectedIndex = this.selectedIndex
    this.options.onSelect? this.options.onSelect(this.current):null
  }
  
  toggle() {
    if (this.isOpen) {
      this.close()
    }
    else {
      this.open()
    }
  }
  
  open() {
    this.removeError()
    this.$el.classList.add('_open', '_focus')
  }
  
  close() {
    this.$el.classList.remove('_open', '_focus')
    this.validate()
  }
  
  removeError() {
    this.$el.classList.remove("_error")
  }
  
  addError() {
    this.error = true
    this.$el.classList.add("_error")
  }
  
  validate() {
    //Если поле обязательное
    if (this.isRequired && !this.current) {
      this.addError()
      return true
    }
    
    return false
  }
  
  clear() {
    this.removeError()
    this.$el.querySelector(`[data-id="${this.selectedId}"]`)?.classList.remove('_selected')
    if (this.options.placeholder) {
      this.$value.textContent = this.options.placeholder
      this.selectedId = null
      this.selectedIndex = null
    }
    else {
      this.select(this.options.data[0].id)
    }
  }
  
  destroy() {
    console.log(this.$selectBlock)
    this.$selectBlock.parentNode.append(this.$originalEl)
    this.$originalEl.hidden = false
    
    this.$el.removeEventListener('click', this.clickHandler)
    this.$selectBlock.parentNode.removeChild(this.$selectBlock)
  }
  
  // endregion
}

export let
  selectsList = []

export function

fieldsInit() {
  let selects = document.querySelectorAll('select')
  
  //Инициализация select-ов
  if (selects.length) {
    selects.forEach(select => {
      let placeholder = select.dataset.placeholder;
      let {data, selectedId, itemId} = createDataSelect(select)
      
      selectsList.push(
        new Select(select, {
          placeholder: placeholder || '',
          data,
          selectedId,
          // onSelect: (current) => {
          //   console.log(current)
          // },
          itemId: itemId,
          isRequired: select.hasAttribute('required'),
        })
      )
    })
  }
  
  //Закрытие при клике Не на select
  if (selectsList.length) {
    document.body.addEventListener('click', (e) => {
      if (!e.target.closest('.select')) {
        selectsList.forEach(select => {
          if (select.isOpen) {
            select.close()
          }
        })
      }
    })
  }
  
  //Функция сбора данных с select
  function createDataSelect(selectItem) {
    let options = selectItem.querySelectorAll('option')
    let data = []
    let selectedId = null
    let itemId = selectItem.getAttribute('id') || null
    
    if (options.length) {
      options.forEach((option, index) => {
        let id = String(index)
        let value = ""
        
        if (option.value) {
          id = option.value
        }
        else {
          option.value = id
        }
        
        if (option.getAttribute('selected')==="" ||
          option.getAttribute('selected')) {
          selectedId = id
        }
        value = option.textContent
        
        
        data.push({id, value, index,})
      })
    }
    
    return {data, selectedId, itemId}
  }
}

export function

findAllErrors() {
  let error = 0
  
  if (selectsList.length) {
    selectsList.forEach(select => {
      error += select.validate()
    })
  }
  
  return error
}

export function

clearAllError() {
  if (selectsList.length) {
    selectsList.forEach(select => {
      select.clear()
    })
  }
}

export function

destroyAll() {
  selectsList.forEach(item => {
    item.destroy()
  })
  selectsList = []
}