# JsRepeater

Building on the concept of [JqueryRepeater](https://github.com/DubFriend/jquery.repeater?tab=readme-ov-file), JsRepeater is a pure JavaScript form toolkit. It allows you to create and manage repeatable form elements through simple HTML5 configurations, enabling dynamic addition and deletion of items in web forms.

JsRepeater rewrites the 'name' attribute to avoid naming conflicts within the same form. In the following example, the form item names will be redefined with the 'name' attribute as `MyGroup[0][name]` and `MyGroup[0][age]`. Checkboxes will have `[]` added at the end, so in this example, it would be `myGroup[0][course][]`.

### Install

```sh
npm install jsrepeater --save
```

### Initialization

```html
<div id="myRepeater">
  <div data-repeater-list="myGroup">
    <div data-repeater-item>
      <input type="text" name="name">
      <input type="text" name="age">
      <input type="checkbox" name="course" value="math">
      <input type="checkbox" name="course" value="science">
      <button data-repeater-delete>Delete</button>
    </div>
  </div>
  <button data-repeater-create>Add</button>
</div>
<script>
const repeater = JsRepeater.create(document.getElementById('myRepeater'), {
  /**
   * Set default values
   * @type object
   */
  defaultValues: {data: {name: 'john', age: 40}},
  /**
   * Animation effect (ms) when adding/deleting items, 0(default) for no animation
   * @type Integer
   */
  animationMs: 0,
  /**
   *  When deleting an item, specify a form name for a hidden field. This field is automatically created when an item is deleted. Usually used to track deleted items. Must be used in conjunction with `deleteInputField`.
   * @type string
   */
  deleteInputName: '',
  /**
   * When deleting an item, specify a field name as the identifier for the deleted item.
   * Example: Typically, you would specify the item's id. When setting deleteInputName = '_delInputName' and deleteInputField = 'id', if items with ids 12 and 34 are deleted, the form submission will include post._delInputName = [12, 34]. The backend can then delete or process items with ids 12 and 34 accordingly.
   * @type {String}
   * @type {String}
   */
  deleteInputField: '',
  /**
   * Callback function after adding an item
   * @param  object  item       item  Newly added form item (Node list)
   * @param  object  itemConfig data  Object containing data passed when adding the item, including:
   *                            data: Object containing the new item's data
   *                            extra: Object containing additional settings (if any)
   */
  onItemAdded: (item, itemConfig) => {
    // do something after add
  },
  /**
   * Callback function after deleting an item
   * @param  object  item  Deleted form item (Node list)
   */
  onItemRemoved: (item) => {
    // do something after remove
  }
});
</script>script>
```


### HTML

1. `data-repeater-list`: Element group, aimed at preventing form element name collisions
2. `data-repeater-item`: Form element template
3. `data-repeater-create`: Add button, adds `data-repeater-item` to `the data-repeater-list` group
4. `data-repeater-delete`: Delete button, removes `data-repeater-item`

### API

#### 1. Adding Items


##### Add a single item

```js
repeater.addItem({
  data: {name: 'John', age: 30}
});
```

##### Add multiple items

```js
repeater.addItems([
  {data: {name: 'John', age: 30}},
  {data: {name: 'Mary', age: 20}, extra: {}}, // extra will be passed as a parameter to the add callback function
]);
```

#### 2. Get values of all items

```js
const values = repeater.getValues();
console.log(values);
```

#### 3. Reset indexes

Redefines indexes when form items are added or deleted

```js
repeater.setIndexes();
````
