/**
 * Откладывает вызов метода на delay. Последующие вызовы метода будут сбрасывать счетчик и запускать заново
 * Метод возвращает всегда undefined
 */
function Lazy(delayInMilliseconds: number) {
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

export default Lazy;