import glob from 'glob';
import PropertiesReader from'properties-reader'
import './Extension'
import fs from 'fs';

export default class I18nEngine{
    private static readonly I18N_VARIABLE_NAME = '_AppLocale';
    private static readonly GLOBAL_CALL_EXPRESSION = '_app.i18n';

    constructor(propsDirs: string[], private readonly outputDir: string, private readonly outputFileName: string){
        let localeToProps = new Map<string, PropertiesReader>();

        for(let dir of propsDirs) {
            let handledFiles = [];
            let pattern = dir + (dir.endsWith("/")? '': '/') + '**/*.properties';

            glob(pattern, {sync: true}).forEach(filePath => {
                let fileName = this.getFileNameWithoutExt(filePath);
                if(handledFiles.includes(filePath)){
                    handledFiles.push(filePath);
                    let [bundle, locale] = fileName.split('_');
                    if (!localeToProps.has(locale))
                        localeToProps.set(locale, new PropertiesReader());
                    localeToProps.get(locale).append(filePath);
                }
            });
        }

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, {recursive: true});

        let localeToNormalizeProps = localeToProps.mapValues(val => {
            let props = val.__properties;
            return this.normalizePropertiesValues(props);
        })
        this.requireIdenticalLocales(localeToNormalizeProps);
        this.saveLocales(localeToNormalizeProps);
    }

    private saveLocales(localeToProps: Map<string, object>): void{
        localeToProps.forEach((val, key) => this.saveLocale(key, val))
    }

    private saveLocale(locale: string, i18nObj: object): void{
        let regexp = new RegExp('"([^(\")"]+)":', 'g'); //TODO
        let jsonObj = JSON.stringify(i18nObj).replace(regexp,"$1:");

        let outputFilePath = `${this.outputDir}/${this.outputFileName}_${locale}.js`
        let localeFileString = `var ${I18nEngine.I18N_VARIABLE_NAME}={locale:"${locale}",values:${jsonObj}};`;
        fs.writeFileSync(outputFilePath, localeFileString);
    }

    static buildGlobalCallExpression(bundleKey: any, args: any[]): string{
        let result = I18nEngine.GLOBAL_CALL_EXPRESSION+ `(`+ bundleKey;
        if(args.length > 0)
            result += ','+ args.join(',')

        result += ')';
        return result
    }

    private getFileNameWithoutExt(filePath: string): string{
        let nameArray = filePath.split('/');
        let fileName = nameArray[nameArray.length - 1];
        return fileName.split('.')[0]
    }

    private requireIdenticalLocales(nameToProps: Map<string, object>): void{
        let localeToPropsKeys = nameToProps.mapValues(it => Object.keys(it[1]))

        for(let localeToKeys1 of localeToPropsKeys){
            for(let localeToKeys2 of localeToPropsKeys){
                if(localeToKeys1[0] !== localeToKeys2[0]){
                    let missedPropKey = localeToKeys1[1].find(k => !localeToKeys2[1].includes(k))
                    if(missedPropKey) {
                        throw new Error(`There is no bundle key "${missedPropKey}" in the ${localeToKeys2[0].toUpperCase()} properties file`)
                    }
                }
            }
        }
    }

    private convertEscapedAsciiToUtf8(str: string){
        return JSON.parse(`"${str}"`)
    }

    private normalizePropertiesValues(obj: object): object{
        let newObj = {}
        for(let key in obj){
            newObj[key] = this.convertEscapedAsciiToUtf8(obj[key])
        }
        return newObj;
    }
}






