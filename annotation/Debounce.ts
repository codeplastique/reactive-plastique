/**
 * Ограничивает частоту вызовов метода до delay.
 * Метод возвращает undefined если метод вызывается до 
 */
function Debounce(delayInMilliseconds: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let originalMethod = descriptor.value;
        let lastTimeoutId = null;
        descriptor.value = function () {
            if (lastTimeoutId)
                clearTimeout(lastTimeoutId);
            let args = arguments;
            lastTimeoutId = setTimeout(
                () => {
                    lastTimeoutId = null;
                    originalMethod.apply(this, args);
                },
                delayInMilliseconds
            );
        }
    }
}

export default Debounce;