/**
 * to class methods only!
 * Binding 'this' of the class to the method. Useful if you use the method as a lambda
 * Remember that using call, apply and bind methods won't matter
 */
export default function BindThis(target, propertyKey, descriptor) {
    return {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: function(){
            const bound = descriptor.value.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: bound,
                configurable: descriptor.configurable,
                writable: descriptor.writable,
                enumerable: descriptor.enumerable,
            });
            return bound;
        }
    };
}