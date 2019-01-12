const uniqeRandomArray = require('unique-random-array')
const nameList = require('./starwars-names.json');
module.exports = {
  all: nameList,
  random: uniqeRandomArray(nameList)
}