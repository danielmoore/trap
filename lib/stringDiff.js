var diff = require('diff').diffChars;
var colors = require('ansicolors');

function colorize(segment) {
  var value = JSON.stringify(segment.value);
  value = value.slice(1, value.length - 1);

  if(segment.removed)
    return colors.bgGreen(value);

  if(segment.added)
    return colors.bgRed(value);

  return value;
}

module.exports = function(expected, actual) {
  return diff(expected, actual)
    .map(colorize)
    .join('')
    .replace(/ /g, colors.brightBlack('·'));
};