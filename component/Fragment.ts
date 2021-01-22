/**
 * Fragment type is used as a returned type of the fragment function.
 * Fragment function have to end with a 'Fragment' suffix
 * Fragment function should be used in templates only!
 *
 * @example function HeaderFragment(prop: string): Fragment{`
 *              <div xmlns:v="http://github.com/codeplastique/plastique" v:text="${prop}"></div>
 *          `}
 *          ...
 *          @Reactive(function (this: A){`
 *              <div xmlns:v="http://github.com/codeplastique/plastique">
 *                  <div v:include="${HeaderFragment('hello')}"></div>
 *              </div>
 *          `})
 *          class A{}
 */
export type Fragment = void;