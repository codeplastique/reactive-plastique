/**
 * Ограничивает частоту вызовов метода до delay.
 * Метод возвращает undefined если метод вызывается до 
 */
function Debounce(delayInMilliseconds: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let originalMethod = descriptor.value;
        let isCooldown = false;
        descriptor.value = function () {
            if (isCooldown) return;
            originalMethod.apply(this, arguments);
            isCooldown = true;
            setTimeout(() => isCooldown = false, delayInMilliseconds);
        }
    }
}

export default Debounce;