'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cursor = undefined;

var _cursor = require('./cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _slate = require('slate');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CursorIndicator = function CursorIndicator(options) {

  var markName = options.markName || 'cursor';
  function addCursorIndicator(change) {
    change.operations.forEach(function (operation) {
      if (operation.type === 'set_selection') {
        console.log('DONENENENENE ################################', markName);
        change.addMark(markName);
      }
    });
  }

  return {
    addCursorIndicator: addCursorIndicator
  };
};

var Cursor = exports.Cursor = _cursor2.default;
exports.default = CursorIndicator;