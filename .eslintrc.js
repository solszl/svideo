module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2015,
    "sourceType": "module"
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
<<<<<<< HEAD
    "no-useless-constructor": 0,
    // "sort-imports": 1,
=======
    "no-useless-constructor": 'off',
    "no-console": 'off'
>>>>>>> *
  }
};