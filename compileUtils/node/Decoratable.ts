import DecoratorNode from "./DecoratorNode";

export default interface Decoratable {
    getDecorators(): DecoratorNode[]

    hasDecorator(name: string): boolean
}