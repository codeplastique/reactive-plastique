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
      <button v-on:click="save"></button>
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
  <button v:onclick="${this.save}"></button>
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
