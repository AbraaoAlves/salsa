import * as flowJsDoc from 'flow-jsdoc';

export function translate(content: string){
  var result = flowJsDoc(content,{});
  result = result.toString().replace(/\: \?/g, '\?: ');
  return result;
}