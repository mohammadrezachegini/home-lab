const fs = require('fs');

function generateRandomId(){
  return Math.floor(Math.random() * 10000);
}

function save(data){
  return new Promise((resolve, reject) => {
    fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


function getUsers(){
    return new Promise((resolve, reject) => {
      fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          const json = JSON.parse(data);
          resolve(json);
        }
      });
    });
  }


  module.exports = {
    getUsers,
  }