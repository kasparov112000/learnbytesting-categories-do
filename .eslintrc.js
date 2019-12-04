module.exports = {
  extends: 'airbnb-base',
  rules: {
    'comma-dangle': ['error', 'never'],
    "linebreak-style": ["error", (require("os").EOL === "\r\n" ? "windows" : "unix")]
  }
};
