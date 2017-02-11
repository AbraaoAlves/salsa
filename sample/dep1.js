import {Child} from './dep2'; 

class Person {

  /**
   * Creates an instance of Person.
   * 
   * @param {string} name
   * @param {number} age
   * @param {Child[]} children
   * 
   * @prop {string} name
   * @prop {number} age
   * @prop {Child[]} children
   */
  constructor(name, age, children){
    this.name = name;
    this.age = age;
    this.children = children;
  }

  goToSchooll(){
    let promises = this.children
      .map(child => child.goToSchool123());
    
    return Promise.all(promises);  
  }
}

exports.Person = Person;