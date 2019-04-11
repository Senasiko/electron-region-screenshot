const { screenshot } = require('../index');


document.getElementById('screenshot__button').addEventListener('click', () => {
  screenshot().then(({ base64 }) => {
    document.getElementById('screenshot__result').src = base64;
  })
})
