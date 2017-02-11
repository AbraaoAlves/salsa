import { Child } from './dep2';
import { Person } from './dep1';

const john = new Person('john', 33, [new Child(), new Child(), new Child()]);
declare var console;
john.goToSchooll().then( _ => console.log('ok!'));