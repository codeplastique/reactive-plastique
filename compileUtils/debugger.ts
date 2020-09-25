window['bem_trace'] = function(elem, blocksClasses){
    blocksClasses = blocksClasses || [];
    var className = typeof elem.className == 'string'? elem.className: "";
    var blocksClasses = (className.match(/(^|\s+)[\w-]+__[\w-]+/gm) || []).map(v => v.trim());
    let successElems = [];
    for(var parentBlock of blocksClasses){
        for(var b of blocksClasses){
            if(b.startsWith(parentBlock))
                successElems.push(b);
        }
    }
    blocksClasses.filter(clazz => !successElems.includes(clazz)).forEach(function(c){
        console.warn(c +' in '+ blocksClasses)
    });
    let newParentBlocks = [].filter.call(elem.classList, c => !c.includes('__') && (c.charAt(0) == c.charAt(0).toUpperCase()));
    for(var child of elem.children) {
        window['trace'](child, newParentBlocks.length == 0? blocksClasses: newParentBlocks)
    }
};