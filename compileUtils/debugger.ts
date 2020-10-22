class BemInspector{
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

        for(let child of elem.children) {
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
}

const inspector = new BemInspector();
window['bem_trace'] = inspector.trace.bind(inspector);