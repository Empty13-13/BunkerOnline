require('dotenv').config()


class systemFunction {
  objIsEmpty(obj) {
    for (let key in obj) { 
      return false;
    }
    return true;
  }
  
}

module.exports = new systemFunction()