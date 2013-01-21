var glob = require('glob')
  , path = require('path');

glob(path.join(__dirname, '**', '*.spec.js'), function(err, files) {
  if(err) console.error(err);
  else files.map(path.resolve).forEach(require);
});
