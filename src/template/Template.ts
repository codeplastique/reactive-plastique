import Plastique from "../../src/const";

export default class Template{
    private static jsdom = require('jsdom');
    private readonly prefix: string;

    constructor(
        private template: string,
        private componentName: string,
        private usedVariables: Set<string>
    ){
        let dom = Template.jsdom.JSDOM('<html><body><template>'+ template +'</template></body></html>')
        
        let rootTag: Element = dom.window.document.body.firstElementChild.content;
        // let elems = rootTag.querySelectorAll('*');
        if(rootTag.children.length > 1)
            throw new Error('Component '+ componentName +' has multiple root tags!')
        let rootComponent = rootTag.children[0];
    
        let prefixAttr = Array.from(rootComponent.attributes)
                .find(a => a.name.startsWith('xmlns:') && a.value == Plastique.DIALECT_URL);
        if(prefixAttr){
            let prefixAttrName = prefixAttr? prefixAttr.name: null;
            rootComponent.removeAttribute(prefixAttrName);
            this.prefix = prefixAttrName.substr(6)
        }

        rootComponent.setAttribute('data-cn', componentName)
    }


    transform(): string{
        let classAppendAttr = rootComponent.getAttribute('v-bind:class');
        let classPrefix = classAppendAttr? `(${classAppendAttr})+' '+`: ''
        rootComponent.setAttribute('v-bind:class', classPrefix + CLASSAPPEND_COMPONENT_SPECIAL_PROPERTY);
        
        let completeVueTemplate = rootTag.firstElementChild.outerHTML.replace(/___:([a-zA-Z\d]+?)___:/g, 'v-on:[$1]').replace(/__:([a-zA-Z\d]+?)__:/g, 'v-bind:[$1]');
        let vueCompilerResult = vueCompiler.compile(completeVueTemplate);
        if(vueCompilerResult.errors.length != 0)
            throw new Error(`Vue compile error! Template ${componentName}. ` + vueCompilerResult.errors);
        let staticRenders = [];
        for(let staticRender of vueCompilerResult.staticRenderFns){
            staticRenders.push(`function(){${staticRender}}`);
        }
        return {
            template: `{r:function(){${vueCompilerResult.render}},s:[${staticRenders.join(',')}]}`
        };
    }

}