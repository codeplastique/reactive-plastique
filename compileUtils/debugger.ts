const bemInspector = new class BemInspector{
    private static readonly APP_CLASS_PATTERN = /^[A-Z][a-z0-9-]*/;
    private static readonly BLOCK_CLASS_PATTERN = /^[A-Z][a-z0-9-]*$/;
    private static readonly BLOCK_MODIFIER_CLASS_PATTERN = /^[A-Z][a-z0-9-]*_[a-z0-9]+$/;
    private static readonly ELEMENT_CLASS_PATTERN = /^[A-Z][a-z0-9-]*__[a-z0-9-]+$/;
    private static readonly ELEMENT_MODIFIER_CLASS_PATTERN = /^[A-Z][a-z0-9-]*__[a-z0-9-]+_[a-z0-9-]+$/;


    public trace(elem: HTMLElement, parentBlockClasses: string[] = []): void{
        let allAppClasses = Array.prototype.slice.call(elem.classList).filter(c => BemInspector.APP_CLASS_PATTERN.test(c));
        let blocksClasses = allAppClasses.filter(c => BemInspector.BLOCK_CLASS_PATTERN.test(c));
        let blocksModifierClasses: string[] = allAppClasses.filter(c => BemInspector.BLOCK_MODIFIER_CLASS_PATTERN.test(c));
        let elementClasses = allAppClasses.filter(c => BemInspector.ELEMENT_CLASS_PATTERN.test(c));
        let elementModifierClasses = allAppClasses.filter(c => BemInspector.ELEMENT_MODIFIER_CLASS_PATTERN.test(c));

        let invalidBlockModifier = this.findInvalidModifier(blocksClasses, blocksModifierClasses);
        if(invalidBlockModifier) {
            console.error(elem)
            throw new Error('Element with block modifier ' + invalidBlockModifier + ' has no corresponding block!')
        }

        let invalidElementModifier = this.findInvalidModifier(elementClasses, elementModifierClasses);
        if(invalidElementModifier) {
            console.error(elem)
            throw new Error('Element with element modifier ' + invalidElementModifier + ' has no corresponding element!')
        }

        let invalidElement = this.findInvalidElement(parentBlockClasses, elementClasses);
        if(invalidElement) {
            console.error(elem)
            throw new Error('Element with element ' + invalidElement + ' has no corresponding block!')
        }

        let children = Array.prototype.slice.call(elem.children);
        for(let child of children) {
            this.trace(child, blocksClasses.length == 0? parentBlockClasses: blocksClasses);
        }
    }

    private findInvalidModifier(typeClasses: string[], typeModifierClasses: string[]): string{
        for(let c of typeModifierClasses){
            let blockClass = c.substring(0, c.lastIndexOf('_'));
            if(!typeClasses.includes(blockClass))
                return c;
        }
    }

    private findInvalidElement(blockClasses: string[], elementClasses: string[]): string{
        for(let c of elementClasses){
            let blockClassOfElement = c.substring(0, c.lastIndexOf('__'));
            if(!blockClasses.includes(blockClassOfElement))
                return c;
        }
    }

    toggleInspector(): void{
        ///@ts-ignore
        let triggers = Vue.options.mounted
        if(triggers == null) {
            ///@ts-ignore
            triggers = Vue.options.mounted = []
        }
        triggers.push(() => console.log('TEST BEM'))
    }
}


const ComponentInspector = new class ComponentInspector{
    private static readonly CAPTURED_COMPONENT_VAR_NAME = '$$'
    private isActive: boolean = false;
    private toolTip: HTMLElement
    private activeElem: HTMLElement
    private showPath: boolean

    constructor() {
        window.addEventListener('keyup', (e) => {
            if(e.shiftKey && e.ctrlKey && e.code == 'KeyQ'){
                this.toggle()
            }
        })
    }

    toggle(): boolean{
        if(this.isActive)
            this.hide()
        else
            this.show()
        return this.isActive = !this.isActive
    }


    hide(): void{
        this.toolTip.remove()
        this.toolTip = null
        this.showPath = false
        if(this.activeElem)
            this.unligthElem()

        window.onmousemove = null;
        window.onmouseover = null;
    }

    private createPathTooltip(): HTMLElement{
        let toolTip = document.createElement('div');
        toolTip.id = 'componentTraceTooltip'
        toolTip.setAttribute('style', 'background: black; color: white; padding: 5px; position: fixed; z-index: 9999999;')
        document.body.append(toolTip)
        return toolTip
    }

    show(): void{
        console.info(`Press 'Alt' while moving the mouse to bind the hover component to a temp variable`)
        console.info(`Press 'Shift' while moving the mouse to show the hover component path`)
        let toolTip = this.toolTip = this.createPathTooltip()

        window.onmousemove =  event =>  {
            let activeElem = this.activeElem
            if(activeElem == null)
                return;

            let x = event.clientX,
                y = event.clientY;
            toolTip.style.top = (y + 20) + 'px';
            toolTip.style.left = (x + 20) + 'px';


            if(event.altKey){
                ///@ts-ignore
                let model = activeElem.__vue__.m;
                if(window[ComponentInspector.CAPTURED_COMPONENT_VAR_NAME] != model){
                    window[ComponentInspector.CAPTURED_COMPONENT_VAR_NAME] = model;
                    console.log(`Component ${this.getActiveComponentName()} is stored in the "${ComponentInspector.CAPTURED_COMPONENT_VAR_NAME}" global variable`)
                }
            }

            if(this.showPath != event.shiftKey){
                this.showPath = event.shiftKey;
                this.refreshTooltipText()
            }
        };


        window.onmouseover = event => {
            let elem = event.target;
            ///@ts-ignore
            let closestComponent = elem.__vue__? elem: elem.closest('[data-cn]')
            if(closestComponent != this.activeElem){
                this.moveLight(closestComponent)
            }
        };
    }

    private getActiveComponentName(): string{
        return this.activeElem.getAttribute('data-cn')
    }

    private getComponentPath(elem: HTMLElement): string{
        ///@ts-ignore
        return window.getComponentPath(elem)
    }

    private refreshTooltipText(){
        let elem = this.activeElem
        this.toolTip.innerText = this.showPath? this.getComponentPath(elem): this.getActiveComponentName();
    }

    private lightElem(): void{
        this.refreshTooltipText()
        let elem = this.activeElem
        elem.style.outline = '3px solid pink'
        elem.style.outlineOffset = '0px';
        elem.style.background = 'rgba(255, 192, 203, 38%)'
    }

    private moveLight(elem: HTMLElement): void{
        this.unligthElem();
        this.activeElem = elem;
        this.lightElem()
    }

    private unligthElem(): void{
        let elem = this.activeElem
        elem.style.outline = ''
        elem.style.outlineOffset = '';
        elem.style.background = ''
    }
}


window['Plastique'] = {
    help: function (){
console.info(
`* use 'Plastique.inspector()' to show/hide components info (or use Ctrl+Shift+Q)
* use 'Plastique.bemTrace()' to validate the element for the correct BEM structure`
)
    },

    inspector: () => ComponentInspector.toggle(),
    bemTrace: (elem?: HTMLElement) => bemInspector.trace(elem || document.body)
}