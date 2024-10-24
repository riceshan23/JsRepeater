const JsRepeater = (function()
{
  const isObject = item => typeof item === 'object' && !Array.isArray(item) && item !== null;
  const isFunction = item => typeof item === 'function';
  const isNumeric = item => !isNaN(parseFloat(item)) && isFinite(item);
  const addCSSRule = (selector, rules) => {
    if (!window._repeaterAnimationSheet) {
      window._repeaterAnimationSheet = document.createElement('style');
      document.head.appendChild(window._repeaterAnimationSheet);
    }
    const sheet = window._repeaterAnimationSheet.sheet;
    sheet.insertRule(`${selector} { ${rules} }`, sheet.cssRules.length);
  }

  // Repeater main
  function create(mainElement, options = {})
  {
    const {
      defaultValues:      _defaultValues = {},
      animationMs:        _animationMs = -1,
      deleteInputName:    _deleteInputName = '',
      deleteInputField:   _deleteInputField = '',
      onItemAdded:        _onItemAdded = null,
      afterItemAdded:     _afterItemAdded = null,
      onItemRemoved:      _onItemRemoved = null,
    } = options;

    const {
      repeaterInit = undefined
    } = mainElement.dataset

    if (repeaterInit) {
      console.error('Cant not create instance twice');
      return;
    }

    if (!isObject(_defaultValues)) throw new Error('Parameter [defaultValues] type error (object)');
    if (_onItemAdded !== null && !isFunction(_onItemAdded)) throw new Error('Parameter [onItemAdded] type error (function)');
    if (_afterItemAdded !== null && !isFunction(_afterItemAdded)) throw new Error('Parameter [afterItemAdded] type error (function)');
    if (_onItemRemoved !== null && !isFunction(_onItemRemoved)) throw new Error('Parameter [onItemRemoved] type error (function)');
    if (!isNumeric(_animationMs)) throw new Error('Parameter animationMs [animationMs] type error (Number)');

    const listEl = mainElement.querySelector('[data-repeater-list]');
    if (!listEl) throw new Error('data-repeater-list not found');

    const groupName = listEl.dataset?.repeaterList;
    if (!groupName) throw new Error('data-repeater-list is required');

    const itemTemplate = listEl.querySelector('[data-repeater-item]').cloneNode(true);
    listEl.innerHTML = '';
    const createBtn = mainElement.querySelector('[data-repeater-create]');

    mainElement.dataset.repeaterInit = true

    if (_animationMs > 0) initializeAnimationCSS();

    function setIndexes()
    {
      Array.from(listEl.querySelectorAll('[data-repeater-item]')).forEach((item, index) => {
        item.dataset.itemName = `${groupName}[${index}]`;
        item.querySelectorAll('[name]').forEach(input => {
          let name = input.getAttribute('name');
          // handle array (checkbox, multiple select ..)
          const matches = name.endsWith('[]');

          name = parseFormName(name)

          if (!name.match(/\[.*\]$/)) name = `[${name}]`

          const newName = `${groupName}[${index}]${name}`;

          input.setAttribute('name', newName);
        });
      });
    }

    function addItems(array)
    {
      if (!Array.isArray(array)) throw new Error('Function addItems Parameter type error (array)');

      array.forEach(fig => addItem(fig))
    }

    function addItem(fig = {})
    {
      if (!isObject(fig.data)) {
        if (!fig.data) {
          fig.data = fig
        } else {
          throw new Error('Function addItem Parameter type error (object)');
        }
      }

      const newItem = itemTemplate.cloneNode(true);

      if (_animationMs <= 0) {

        listEl.appendChild(newItem);

        _addItemAction(newItem, fig)
      } else {

        newItem.style.maxHeight = '0';
        newItem.style.transition = `max-height ${_animationMs/1000}s`;
        
        listEl.appendChild(newItem);
        
        requestAnimationFrame(() => {
          const height = newItem.scrollHeight;
          newItem.style.maxHeight = `${height}px`;
        });
        
        setTimeout(() => {
          newItem.style.maxHeight = '';
          newItem.style.transition = '';

          _addItemAction(newItem, fig)

        }, _animationMs);

      }
    }

    function _addItemAction(newItem, fig)
    {
      setItemValues(newItem, fig);

      setIndexes();

      if (_onItemAdded) {
        _onItemAdded(newItem, fig);

        setIndexes();
      }

      if (_afterItemAdded) {
        _afterItemAdded(newItem, fig)
      }
    }

    function setItemValues(newItem, fig)
    {
      const {
        data = {},
        extra = {},
      } = fig;

      Object.keys(data).forEach(key => {
        const input = getItemInput(newItem, key);

        if (input) {
          const inputObj = FormInput.create(input)
          inputObj.set(data[key])


          /*****************
           * extra setting *
           *****************/
          const extraFig = fig.extra?.[key] ?? undefined;

          // handle readonly
          if (extraFig?.readonly === true) {
            inputObj.readonly()
          }
          // handle add class
          if (Array.isArray(extraFig?.addClass)) {
            input.classList.add(...extraFig?.addClass)
          }
        }
      });
    }

    function getItemInput(newItem, key)
    {
      return Array.from(newItem.querySelectorAll('[name]')).find(input => {
        const name = input.getAttribute('name');

        const parseName = parseFormName(name)

        if (parseName == key) return true;

        // handle [xxx] = xxx
        const matches = parseName.match(/^\[(.+)\]$/);
        if (matches?.[1] && matches[1] == key) return true;
      });
    }

    function parseFormName(input)
    {
      return input.replace(groupName, '').replace(/^\[\d+\]/, '')
    }

    function removeItem(item)
    {
      if (_animationMs <= 0) {

        listEl.removeChild(item);
        setIndexes();
        if (_onItemRemoved) {
          _onItemRemoved(item);
          setIndexes();
        }
      } else {

        item.style.overflow = 'hidden';
        item.style.transition = `max-height ${_animationMs/1000}s ease`;
        item.style.maxHeight = `${item.scrollHeight}px`;

        item.offsetHeight;

        item.style.maxHeight = '0';

        setTimeout(() => {
          listEl.removeChild(item);
          setIndexes();
          if (_onItemRemoved) {
            _onItemRemoved(item);
            setIndexes();
          }
        }, _animationMs);
      }
    }

    function genHiddenDeleteInput(itemEl)
    {
      if (_deleteInputName == '' || _deleteInputField == '') return false;

      const delFieldInput = getItemInput(itemEl, _deleteInputField)

      if (delFieldInput && delFieldInput.value != '')  {
        const hiddenInput = document.createElement('input');
        hiddenInput.setAttribute('type', 'hidden');
        hiddenInput.setAttribute('name', _deleteInputName + '[]');
        hiddenInput.value = delFieldInput.value

        return hiddenInput
      }

      return false;
    }

    function clear()
    {
      listEl.innerHTML = '';
    }

    function disable()
    {
      mainElement.querySelectorAll('input, select, textarea').forEach(input => input.disabled = true);
      createBtn.disabled = true;
    }

    function enable()
    {
      mainElement.querySelectorAll('input, select, textarea').forEach(input => input.disabled = false);
      createBtn.disabled = false;
    }

    // Binding event
    createBtn?.addEventListener('click', function(e) {
      addItem({data: _defaultValues});
    })
    mainElement.addEventListener('click', function(e) {
      const target = e.target;
      if (
        target.matches('[data-repeater-delete]') ||
        target.closest('[data-repeater-delete]')
      ) {
        const itemEl = target.closest('[data-repeater-item]');

        const hiddenInput = genHiddenDeleteInput(itemEl)

        if (hiddenInput) {
          listEl.appendChild(hiddenInput)
        }

        removeItem(itemEl);
      }
    });

    // CSS
    function initializeAnimationCSS() {
      addCSSRule('.animated-row', `
        transition: all ${_animationMs/1000}s ease;
      `);
      addCSSRule('.animated-row.collapsed td > div', `
        max-height: 0;
        transition: all ${_animationMs/1000}s ease;
      `);
      addCSSRule('.animated-row.expanded td > div', `
        max-height: 100px;
        transition: all ${_animationMs/1000}s ease;
      `);
    }


    return {
      addItem,
      addItems,
      removeItem,
      clear,
      disable,
      enable,
      setIndexes,
    };
  }

  const FormInput = {
    createBaseInput: function(element)
    {
      const self = {};
      
      self.getType = () => element.type || 'text';
      self.get = () => element.value;
      self.set = newValue => element.value = newValue;
      self.clear = () => self.set('');
      self.readonly = () => element.readOnly = true;
      self.disable = () => element.disabled = true;
      self.enable = () => element.disabled = false;

      return self;
    },

    createInputCheckbox: function(element)
    {
      const self = this.createBaseInput(element);
      const form = element.form || document
      const inputName = `input[type="checkbox"][name="${element.name}"]`

      self.get = () => Array.from(form.querySelectorAll(`${inputName}:checked`)).map(el => el.value)

      self.set = (newValues) => {
        newValues = Array.isArray(newValues) ? newValues : [newValues];

        form.querySelectorAll(inputName)?.forEach(el => el.checked = newValues.includes(el.value))
      };

      return self;
    },

    createInputRadio: function(element)
    {
      const self = this.createBaseInput(element);
      const form = element.form || document
      const inputName = `input[type="radio"][name="${element.name}"]`

      const radios = form.querySelectorAll(`input[name="${element.name}"]`)

      self.get = () => form.querySelector(`${inputName}:checked`)?.value || null;

      self.set = (newValue) => {
        if (newValue) {
          const target = Array.from(radios).find(radio => radio.value === newValue)

          if (target) target.checked = true
        }
      };

      return self;
    },

    createSelect: function(element)
    {
      const self = this.createBaseInput(element);
      const form = element.form || document
      const isMultiple = element.hasAttribute('multiple')

      self.get = () => {
        if (isMultiple) {
          return Array.from(element.selectedOptions).map(options => options.value)
        }

        return element.value;
      }

      self.set = (newValue) => {
        if (isMultiple) {
          if (!Array.isArray(newValue)) throw new Error('Multiple select value must be an array')

          for (let i = 0; i < element.options.length; i++) {
            element.options[i].selected = newValue.includes(element.options[i].value);
          }
          return;
        }
        
        element.value = newValue
      }

      self.readonly = (newValue) => {
        Array.from(element.options).map(op => {
          self.get() != op.value ? op.remove(): null
        })
      }

      return self;
    },

    create: function(element)
    {
      switch (element.tagName) {

        case 'SELECT': return this.createSelect(element);
        default:
          switch(element.type) {
            case 'checkbox': return this.createInputCheckbox(element);
            case 'radio': return this.createInputRadio(element);
            default: return this.createBaseInput(element);
          }
      }
    }
  }

  return {
    create
  };
})();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = JsRepeater;
}