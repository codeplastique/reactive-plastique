### Component instance
#### Vue.js
Declarative approach
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
  constructor(privare readonly login: string){
  }
  
  public save(): void{
    // ...
  }
}
```


### Component Inheritance

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

///Overwrites the А template
@Reactive(function(this: C){
`<section xmlns:v="http://github.com/codeplastique/plastique">
  <div v:text="${this.getText()}"></div>
  <div v:text="${this.getSecondText()}"></div>
</section>
`})
class C extends A{
  public getText(): string{
    return supet.getText() +' and text from C'
  }
  public getSecondText(): string{
    return 'Second text from C'
  }
}
```

### Nested components
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

### Events
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
