var _ = require('underscore');
var nconf = require('nconf');
var polyline = require('polyline');
var postgres = require('./postgres');
var util = require('util');

nconf.argv().file({file: './config.json'}).env();


function downsamplePath(decodedPath) {
  return _.reduce(decodedPath, function(memo, point, idx) {
    // use first, last and every 10th point
    if (idx === 1 || idx % 10 === 0 || idx === (decodedPath.length - 1)) {
      memo.push(point);
    }
    return memo;
  }, []);
}


function encodedPathsToLineString(encodedPaths) {
  var decodedPaths = encodedPaths.map(function(encodedPath) {
    // Decode encoded polyline
    var decodedPath = polyline.decode(encodedPath);

    // Downsample points to speed up query
    var sampledPath = downsamplePath(decodedPath);

    // If no points, skip
    if(sampledPath.length === 0) {
      return;
    }

    // If only one point, duplicate it to make a line
    if(sampledPath.length === 1) {
      sampledPath.push(sampledPath[0]);
    }

    var linestring = _.compact(sampledPath.map(function(point) {
      return point[1] + ' ' + point[0];
    })).join(',');

    return '(' + linestring + ')';
  }).join(',');

  return 'SRID=4269;MULTILINESTRING(' + decodedPaths + ')';
}


exports.handler = function(event, context) {
  var encodedPaths = event;

  if (!encodedPaths || !encodedPaths.length) {
    return context.fail(new Error('Invalid Input'));
  }

  var multilinestring = encodedPathsToLineString(encodedPaths);

  postgres('counties', [multilinestring], function(e, results) {
    if (e) {
      console.error(e);
      return context.fail(e);
    }

    if (results && results.rows) {
      context.succeed(results.rows);
    } else {
      return context.fail(e);
    }
  });
};
