import Plastique from "../../src/const";
import {JSDOM} from "jsdom"
import VueCompiler from 'vue-template-compiler'
import TemplateAttribute from "./TemplateAttribute";

export default class Template{
    private readonly prefix: string;
    private readonly root: Element;

    constructor(
        private template: string,
        private componentName: string,
        private usedVariables: Set<string>
    ){
        let dom = JSDOM('<html><body><template>'+ template +'</template></body></html>')
        
        let rootTag: Element = dom.window.document.body.firstElementChild.content;
        // let elems = rootTag.querySelectorAll('*');
        if(rootTag.children.length > 1)
            throw new Error('Component '+ componentName +' has multiple root tags!')
        let rootComponent = this.root = rootTag.children[0];
    
        let prefixAttr = Array.from(rootComponent.attributes)
                .find(a => a.name.startsWith('xmlns:') && a.value == Plastique.DIALECT_URL);
        if(prefixAttr){
            let prefixAttrName = prefixAttr? prefixAttr.name: null;
            rootComponent.removeAttribute(prefixAttrName);
            this.prefix = prefixAttrName.substr(6)
        }

        rootComponent.setAttribute('data-cn', componentName)
    }


    private transform(): void{
        try {
            let elems = this.root.querySelectorAll('*');
            for (let elem of elems) {
                if (!elem.hasAttributes())
                    continue;

                let attributesForDelete = [];
                for (var attr of elem.attributes) {
                    if (TemplateAttribute.isTemplateAttribute(attr, this.prefix)) {
                        let templateAttr = new TemplateAttribute();
                    }
                    if (handleAttr(elem, attr))
                        attributesForDelete.push(attr.name);
                }
                for (var attr of attributesForDelete) {
                    elem.removeAttribute(attr);
                }
            }
        }catch (e) {
            throw new Error(`Component ${this.componentName}. `+ e.message)
        }
    }

    generate(): string{
        if(this.prefix)
            this.transform();
        this.addDynamicClassAttr();

        // rootTag.firstElementChild
        let completeVueTemplate = this.root.outerHTML.replace(/___:([a-zA-Z\d]+?)___:/g, 'v-on:[$1]').replace(/__:([a-zA-Z\d]+?)__:/g, 'v-bind:[$1]');
        let vueCompilerResult = VueCompiler.compile(completeVueTemplate);
        if(vueCompilerResult.errors.length != 0)
            throw new Error(`Vue compile error! Template ${this.componentName}. ` + vueCompilerResult.errors);
        let staticRenders = vueCompilerResult.staticRenderFns.map(r => `function(){${r}}`);
        return `{r:function(){${vueCompilerResult.render}},s:[${staticRenders.join(',')}]}`;
    }

    private addDynamicClassAttr(): void{
        let root = this.root;
        let classAppendAttr = root.getAttribute('v-bind:class');
        let classPrefix = classAppendAttr? `(${classAppendAttr})+' '+`: ''
        root.setAttribute('v-bind:class', classPrefix + Plastique.CLASSAPPEND_COMPONENT_SPECIAL_PROPERTY);
    }

}