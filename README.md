### Component instance
#### Vue.js
Functional approach
```javascript
Vue.component('PassEditor', {
  data: function () {
    return {
      login: '',
      password: ''
    }
  },
  methods: {
    save: function () {
      //...
    }
  }
  template: 
    `<section>
      <header>{{login}}</header>
      <div>
        <label>Login</label>
        <input v-model="password">
      </div>
      <button v-on:click="save">Save</button>
    </section>
    `
})
```
#### Plastique
Object-oriented approach
```typescript
@Reactive(function(this: PassEditor){
`<section xmlns:v="http://github.com/codeplastique/plastique">
  <header v:text="${this.login}"></header>
  <div>
    <label>Login</label>
    <input v:model="${this.password}">
  </div>
  <button v:onclick="${this.save}">Save</button>
</section>
`})
class PassEditor{
  private password: string;
  constructor(private readonly login: string){
  }
  
  public save(): void{
    // ...
  }
}
```


#### Component inheritance

```typescript
@Reactive(function(this: A){
`<section xmlns:v="http://github.com/codeplastique/plastique">
  <div v:text="${this.getText()}"></div>
</section>
`})
class A{
  public getText(): string{
    return 'text from A'
  }
}

///template automatically expands from A
@Reactive
class B extends A{
  public getText(): string{
    return 'text from B'
  }
}

///Overwrites the А template and getText()
@Reactive(function(this: C){
`<section xmlns:v="http://github.com/codeplastique/plastique">
  <div v:text="${this.getText()}"></div>
  <div v:text="${this.getSecondText()}"></div>
</section>
`})
class C extends A{
  //override
  public getText(): string{
    return supet.getText() +' and text from C'
  }
  public getSecondText(): string{
    return 'Second text from C'
  }
}

///Wrap the А template and overwrite getText()
@Reactive(function(this: D){
`<section xmlns:v="http://github.com/codeplastique/plastique">
  <div class="wrap-block">
    <v:parent/>
  </div>
</section>
`})
class D extends A{
  //override
  public getText(): string{
    return supet.getText() +' and text from D'
  }
}

```

#### Nested components
```typescript
@Reactive(function(this: Popup){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <div v:text="${this.welcomeText}"></div>
</div>
`})
class Popup{
  private welcomeText: string;
  constructor(welcomeText: string){
    this.setWelcomeText(welcomeText);
  }
  
  puclic setWelcomeText(welcomeText: string): void{
    this.welcomeText = welcomeText.toUpperCase();
  }
}

@Reactive(function(this: Page){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <button v:onclick="${this.showPopup}">Show popup</button>
  
  <div v:if="${this.popup != null}" class="popup-block">
  
    <!-- DIV or any tag name, not even real -->
    <div v:component="${this.popup}"></div>
    
    <button v:onclick="${this.changePopupText}">Change popup text</button>
    <button v:onclick="${this.closePopup}">Close popup</button>
  </div>
</div>
`})
class Page{
  private popup: Popup
  private showPopup(): void{
    this.popup = new Popup('Welcome!');
  }
  
  private changePopupText(): void{
    this.popup.setWelcomeText('Welcome text is changed!')
  }
  
  private closePopup(): void{
    this.popup = null;
  }
}

```

#### Template inheritance
```typescript
import Reactive from "@plastique/core/component/Reactive";

@Reactive(function(this: A){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <div>Template of A object</div>
  <div v:text="${this.getNumber()}"></div>
  <div v:text="${this.getName()}"></div>
</div>
`})
abstract class A{
  protected getNumber(): number{
    return 1;
  }
  
  abstract protected getName(): string;
}

// Template of an A class will be inherited
class B extends A{
  // override 
  protected getNumber(): number{
    return 2;
  }
  
  protected getName(): string{
    return 'B name';
  }
}

// Override the class A template
@Reactive(function(this: C){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <span>Template of C object</span>
  <span v:text="${this.getCount()}"></span>
  <span v:text="${this.getName()}"></span>
</div>
`})
class C extends A{
  // override 
  protected getNumber(): number{
    return 3;
  }
  
  protected getName(): string{
    return 'C name';
  }
}


```

#### Events
```typescript
@Reactive(function(this: Popup){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <div v:text="${this.welcomeText}"></div>
  
  <button v:onclick="${this.requestNewText}">Change welcome text</button>
  <button v:onclick="${this.close}">Close popup</button>
</div>
`})
class Popup{
  @InitEvent public static readonly CLOSE_EVENT: AppEvent<string>;
  @InitEvent public static readonly REQUEST_WELCOME_TEXT_EVENT: AppEvent<void>;
    
  private welcomeText: string;
  constructor(welcomeText: string){
    this.welcomeText = welcomeText;
  }
  
  public requestNewText(): void{
    this.fireEventOnParents(Popup.REQUEST_WELCOME_TEXT_EVENT)
        .then(newWelcomeText => this.welcomeText = newWelcomeText);
  }
  
  public close(): void{
    this.fireEventOnParents(Popup.CLOSE_EVENT, 'event argument');
  }
}
interface Popup extends Component{}

@Reactive(function(this: Page){
`<div xmlns:v="http://github.com/codeplastique/plastique">
  <button v:onclick="${this.showPopup}">Show popup</button>
 
  <div v:component="${this.popup}" v:if="${this.popup != null}"></div>
</div>
`})
class Page{
  private popup: Popup
  private showPopup(): void{
    this.popup = new Popup('Welcome!');
  }
  
  @Listener(Popup.REQUEST_WELCOME_TEXT_EVENT)
  private generateWelcomeText(): Promise<string>{
    ///...
    
    return Promise.resolve('Changed welcome text!');
  }
  
  @Listener(Popup.CLOSE_EVENT)
  private closePopup(arg: string): void{
    this.popup = null;
    console.log(arg)
  }
}

```

#### Built-in dependency injection
```typescript
import Bean from "@plastique/core/base/Bean";
import Scope from "@plastique/core/base/Scope";

//...
@Bean
private getFirstInstance(): AnyClassOrInterface{
  return new AnyClassOrInterface();
}

@Bean
@Scope('PROTOTYPE') //SINGLETON by default
private getSecondInstance(): PrototypeClass{
  return new PrototypeClass();
}
//...
```

```typescript
import Autowired from "@plastique/core/base/Autowired";

class A{
  @Autowired 
  private readonly AnyClassOrInterface first;
  @Autowired 
  private readonly PrototypeClass second;
  
  //...
}
```

#### Runtime interface implementation check
```typescript
interface A{}

interface B extends A{}

class C implements A, B{}
```

```typescript
import Type from "@plastique/core/base/Type";
import Types from "@plastique/core/base/Types";

//...
  let c = new C();
  console.log(c instanceof Type<A>()); //true
  let bType = Type<B>();
  console.log(c instanceof bType); //true
  console.log(Types.isObject(c)); //true
  console.log(Types.is(c, btype)); //true
  
  let bType2 = Type<B>();
  console.log(bType === bType2); //true
  console.log(bType === Type<A>()); //false

//...
```

#### Built-in reaction collections
```typescript
import ReactiveMap from "@plastique/core/collection/ReactiveMap";
import SimpleMap from "@plastique/core/collection/SimpleMap";
import SimpleSet from "@plastique/core/collection/SimpleSet";

let mapCollection: ReactiveMap = SimpleMap.of(
  'key1', 'value1',
  'key2', 'value2',
  'key3', 'value1'
);
console.log(mapCollection.keys().join(',')); // key1,key2,key3

let setCollection = SimpleSet.of(...mapCollection.values());
setCollection.add('value3');
console.log(setCollection.values().join(',')); // value1,value2,value3
```

#### Progressive enum realisation
```typescript
import Enum from "@plastique/core/enum/Enum";
import Enumerable from "@plastique/core/enum/Enumerable";

@Enum
class Color extends Enumerable{
  public static readonly RED = new Color('ff0000');
  public static readonly BLUE = new Color('0000ff');
  public static readonly BLACK = new Color('000000');
  
  private constructor(private readonly hex: string){}
  
  public getHex(): string{
    return '#'+ this.hex;
  }
}
```

```typescript
console.log(Color.RED.name()); // RED
console.log(Color.BLACK.getHex()); // #000000
console.log(Color.values().length); // 3
console.log(Color.valueOf('BLUE').getHex()); // #0000ff
```

#### Powerful JSON ORM
```typescript
import ToJson from "@plastique/core/hash/ToJson";
import JsonMerge from "@plastique/core/hash/JsonMerge";

class SymbolEditor {
  @ToJson 
  private a: string = 'a';
  @ToJson('b') 
  private uglyB: string = 'b';
  private c: string = 'c';
  private d: string = 'd';
  @ToJson
  private numbers: NumberEditor = new NumberEditor();
  @JsonMerge
  private punctuation: PunctuationMarksEditor = new PunctuationMarksEditor();
  
  @ToJson
  public getCd(): string{
    return this.c + this.d;
  }
}

class NumberEditor{
  private negative: number = -1;
  @ToJson 
  private one: number = 1;
  @ToJson 
  private two: number = 2;
}

class PunctuationMarksEditor{
  @ToJson 
  private dot: string = '.';
  @ToJson 
  private comma: string = ',';
}
```

```typescript
import Serializator from "@plastique/core/hash/Serializator";

let editor = new SymbolEditor();
let json = new Serializator().toJson(editor);
console.log(json); 
/*
{
  "a": "a",
  "b": "b",
  "numbers": {
    "one": 1,
    "two": 2
  },
  "dot": ".",
  "comma": ",",
  "cd": "cd"
}
*/
```

### Vue analogues
#### References 
##### Vue refs
```html
<base-input ref="usernameInput"></base-input>
```
```javascript
methods: {
  any: function () {
    this.$refs.usernameInput
  }
}
```

##### Plastique refs
```html
<base-input v:ref="${this.usernameInput}"></base-input>
```
```typescript
import Inject from "@plastique/core/component/Inject";
...
@Inject
private usernameInput: HTMLElement;
...
public any() {
  this.usernameInput
}
```

#### Slots
##### Vue slots
```html
<div class="container">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <!-- default slot -->
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>
...
<base-layout>
  <template v-slot:header>
    <h1>Title</h1>
  </template>

  <p>For default slot</p>
  <p>For default slot</p>

  <template v-slot:footer>
    <p>Footer</p>
  </template>
</base-layout>
```

##### Plastique slots
```html
<div xmlns:v="http://github.com/codeplastique/plastique" class="container">
  <header>
    <v:slot v:name.header></v:slot>
    <!-- or -->
    <!-- <v:slot v:name="'header'"></v:slot> -->
  </header>
  <main>
    <!-- default slot -->
    <v:slot></v:slot>
  </main>
  <footer>
    <v:slot v:name="${this.footerSlotName}"></v:slot>
    <!-- where footerSlotName is 'footer' -->
  </footer>
</div>
...
<div xmlns:v="http://github.com/codeplastique/plastique" v:component="...">
  <!-- DIV or any tag name, not even real -->
  <div v:slot.header>
    <!-- or -->
    <!-- <div v:slot="'header'"> -->
    ...
  </div>
  <any-tag-name v:slot>
    <!-- default slot -->
    ...
  </any-tag-name>
  <any-tag-name v:slot="${this.footerSlotName}">
    <!-- where footerSlotName is 'footer' -->
    ...
  </any-tag-name>
</div>
```
