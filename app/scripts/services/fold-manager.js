'use strict';

/*
  Manage fold status of the paths and operations
*/
PhonicsApp.service('FoldManager', ['Editor', 'FoldPointFinder', FoldManager]);

function FoldManager(Editor, FoldPointFinder) {
  var buffer = Object.create(null);
  var changeListeners = [];

  Editor.ready(renewBuffer);

  function refreshBuffer() {
    _.extend(buffer, FoldPointFinder.findFolds(Editor.getValue()));
    emitChanges();
  }

  function renewBuffer() {
    buffer = FoldPointFinder.findFolds(Editor.getValue());
    emitChanges();
  }

  function emitChanges() {
    changeListeners.forEach(function (fn) {
      fn();
    });
  }

  function walk(keys) {
    var current = buffer;

    if (!Array.isArray(keys) || !keys.length) {
      throw new Error('Need path for fold in fold buffer');
    }

    while (keys.length) {
      current = current.subFolds[keys.shift()];
    }

    return current;
  }

  Editor.onFoldChanged(function (change) {
    var key = Editor.getLine(change.data.start.row).trim().replace(':', '');
    var folded = change.action !== 'remove';

    if (buffer[key]) {
      buffer[key].folded = folded;
    }

    emitChanges();
  });

  this.toggleFold = function () {
    var keys = [].slice.call(arguments, 0);
    var fold = walk(keys);

    if (fold.folded) {
      Editor.removeFold(fold.start + 1);
      fold.folded = false;
    } else {
      Editor.addFold(fold.start, fold.end);
      fold.folded = true;
    }
  };

  this.isFolded = function () {
    var keys = [].slice.call(arguments, 0);
    var fold = walk(keys);

    return fold && fold.folded;
  };

  this.onFoldStatusChanged = function (fn) {
    changeListeners.push(fn);
  };

  this.reset = renewBuffer;
  this.refresh = refreshBuffer;
}