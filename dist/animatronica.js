//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      // The 2-parameter case has been omitted only because no current consumers
      // made use of it.
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };

  // An external wrapper for the internal callback generator.
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
  // This accumulates the arguments passed into an array, after a given index.
  var restArgs = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0);
      var rest = Array(length);
      for (var index = 0; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function(dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArgs(function(obj, method, args) {
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  _.shuffle = function(obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = restArgs(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArgs(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArgs(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArgs(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions.
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test.
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions.
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Split an **array** into several arrays containing **count** or less elements
  // of initial array.
  _.chunk = function(array, count) {
    if (count == null || count < 1) return [];

    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArgs(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArgs(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArgs(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArgs(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = restArgs(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function(args) {
      var callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      if (callNow) {
        timeout = setTimeout(later, wait);
        result = func.apply(this, args);
      } else if (!immediate) {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArgs = restArgs;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test.
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = restArgs(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

   // Return a copy of the object without the blacklisted properties.
  _.omit = restArgs(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, prop, fallback) {
    var value = object == null ? void 0 : object[prop];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());

/**
 * Include a class or object with functions into another class.
 * @param  {Object} mixin               [description]
 * @param  {Boolean} wrapOldFunction  [description]
 */

(function() {
  var _, exports;

  exports = {
    bootstrap: function() {
      return Function.prototype.include = function(mixin) {
        var funct, methodName, ref, tmpSuper;
        if (!mixin) {
          throw 'Supplied mixin was not found';
        }
        if (!_) {
          throw 'Underscore was not found';
        }
        if (_.isFunction(mixin)) {
          mixin = mixin.prototype;
        }
        if (this.__super__) {
          tmpSuper = _.extend({}, this.__super__);
          tmpSuper.constructor = this.__super__.constructor;
        }
        this.__super__ = tmpSuper || {};
        for (methodName in mixin) {
          funct = mixin[methodName];
          if (!(methodName !== 'included')) {
            continue;
          }
          this.__super__[methodName] = funct;
          if (!this.prototype.hasOwnProperty(methodName)) {
            this.prototype[methodName] = funct;
          }
        }
        if ((ref = mixin.included) != null) {
          ref.apply(this);
        }
        return this;
      };
    }
  };

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    if (typeof require !== "undefined" && require !== null) {
      _ = require('underscore');
    }
    module.exports = exports;
  } else {
    _ = window._;
    window.CoffeeScriptMixins = exports;
  }

}).call(this);
(function() {
  window.CoffeeScriptMixins.bootstrap();

  window.AnimatronicaSettings = {
    renderEach: 4
  };

}).call(this);
(function() {
  var ActorManipulation;

  ActorManipulation = (function() {
    function ActorManipulation() {}

    ActorManipulation.prototype.pullStateFrom = function(actor) {
      return this.state = {
        x: actor.x,
        y: actor.y
      };
    };

    return ActorManipulation;

  })();

  window.ActorManipulation = ActorManipulation;

}).call(this);
(function() {
  var onlyChangedAttributes, paddedRange, uniqueId, uploadFileFrom;

  onlyChangedAttributes = function(nuw, old) {
    var diff, i, key, len, ref;
    diff = {};
    ref = Object.keys(old);
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      if (nuw[key] !== old[key]) {
        diff[key] = nuw[key];
      }
    }
    return diff;
  };

  uploadFileFrom = function(event, callback) {
    var file, imageSrc, reader;
    if (event.dataTransfer.files.length) {
      file = event.dataTransfer.files[0];
      reader = new FileReader();
      reader.onload = function(event) {
        var img;
        img = new Image();
        img.src = event.target.result;
        return img.onload = function(event) {
          return callback(this);
        };
      };
      return reader.readAsDataURL(file);
    } else {
      imageSrc = event.dataTransfer.getData('url');
      return callback({
        src: imageSrc
      });
    }
  };

  uniqueId = function() {
    var s4;
    s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return s4() + s4();
  };

  paddedRange = function(start, end, step) {
    var array, chunksToAdd, neededNumberOfChunks, numberOfChunks;
    neededNumberOfChunks = Math.ceil((end - start) / step) + 1;
    numberOfChunks = (end - start) / step;
    chunksToAdd = neededNumberOfChunks - numberOfChunks;
    return array = _.range(start, end + chunksToAdd * step, step);
  };

  window.onlyChangedAttributes = onlyChangedAttributes;

  window.uploadFileFrom = uploadFileFrom;

  window.uniqueId = uniqueId;

  window.paddedRange = paddedRange;

}).call(this);
(function() {
  var Interpolation;

  Interpolation = (function() {
    function Interpolation() {}

    Interpolation.prototype.nearestChangesByAxis = function(axis) {
      var frames, i, j, len, len1, n, next, prev, ref, ref1, value;
      frames = Keyframe.storage[this.actor];
      ref = Object.keys(frames);
      for (i = 0, len = ref.length; i < len; i++) {
        n = ref[i];
        value = frames[n][axis];
        if (value === void 0 || n > this.frame) {
          break;
        }
        prev = {
          frame: n,
          value: value
        };
      }
      ref1 = Object.keys(frames).reverse();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        n = ref1[j];
        value = frames[n][axis];
        if (value === void 0 || n < this.frame) {
          break;
        }
        next = {
          frame: n,
          value: value
        };
      }
      return [prev, next];
    };

    Interpolation.prototype.interpolateBetween = function(first, last, frame) {
      if (last == null) {
        return first.value;
      }
      if (first == null) {
        return last.value;
      }
      if (first.frame === last.frame) {
        return first.value;
      }
      return first.value + (last.value - first.value) * (frame - first.frame) / (last.frame - first.frame);
    };

    return Interpolation;

  })();

  window.Interpolation = Interpolation;

}).call(this);
(function() {
  var Keyframe;

  Keyframe = (function() {
    Keyframe.include(Interpolation);

    Keyframe.include(ActorManipulation);

    Keyframe.storage = {};

    Keyframe.interpolateFor = function(frame, actor) {
      var axis, keyframe, next, prev, ref;
      keyframe = new Keyframe(frame, actor);
      for (axis in keyframe.state) {
        ref = keyframe.nearestChangesByAxis(axis), prev = ref[0], next = ref[1];
        keyframe.state[axis] = keyframe.interpolateBetween(prev, next, frame);
      }
      return keyframe;
    };

    Keyframe.rangeOfFrames = function() {
      var actor, frames, framesAccumulator, framesFlattened, ref;
      framesAccumulator = {};
      ref = Keyframe.storage;
      for (actor in ref) {
        frames = ref[actor];
        _.extend(framesAccumulator, frames);
      }
      framesFlattened = Object.keys(framesAccumulator).map(function(n) {
        return parseInt(n);
      });
      return paddedRange(_.min(framesFlattened), _.max(framesFlattened), AnimatronicaSettings.renderEach);
    };

    Keyframe.allActors = function() {
      var actorName, i, len, ref, results;
      ref = Object.keys(Keyframe.storage);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        actorName = ref[i];
        results.push({
          name: actorName
        });
      }
      return results;
    };

    function Keyframe(frame1, actor1) {
      this.frame = frame1;
      this.actor = actor1;
      this.state = {
        x: void 0,
        y: void 0
      };
    }

    Keyframe.prototype.persist = function() {
      var axis, results;
      if (Keyframe.storage[this.actor] == null) {
        Keyframe.storage[this.actor] = {};
      }
      if (Keyframe.storage[this.actor][this.frame] == null) {
        Keyframe.storage[this.actor][this.frame] = {};
      }
      results = [];
      for (axis in this.state) {
        results.push(Keyframe.storage[this.actor][this.frame][axis] = this.state[axis]);
      }
      return results;
    };

    return Keyframe;

  })();

  window.Keyframe = Keyframe;

}).call(this);
(function() {
  var Engine;

  Engine = (function() {
    function Engine() {}

    Engine.prototype.updateOrCreateKeyframe = function(actor, frame) {
      var keyframe;
      keyframe = new Keyframe(frame, actor.name);
      keyframe.pullStateFrom(actor);
      return keyframe.persist();
    };

    Engine.prototype.interpolate = function(actor, frame) {
      return Keyframe.interpolateFor(frame, actor.name);
    };

    return Engine;

  })();

  window.Engine = Engine;

}).call(this);
(function() {
  var CropToPaper;

  CropToPaper = (function() {
    function CropToPaper() {}

    CropToPaper.prototype.paperDimensions = function() {
      var shoulderSize;
      shoulderSize = (this.canvas.width - this.canvas.height - 50) / 2;
      return {
        x: shoulderSize,
        width: this.canvas.width - shoulderSize * 2,
        y: 0,
        height: this.canvas.height
      };
    };

    CropToPaper.prototype.drawThePaper = function() {
      return $(this.canvas).drawRect(_.extend({
        fillStyle: '#fff',
        fromCenter: false,
        layer: true
      }, this.paperDimensions()));
    };

    return CropToPaper;

  })();

  window.CropToPaper = CropToPaper;

}).call(this);
(function(c){function a(b,d){if({}.hasOwnProperty.call(a.cache,b))return a.cache[b];var e=a.resolve(b);if(!e)throw new Error('Failed to resolve module '+b);var c={id:b,require:a,filename:b,exports:{},loaded:!1,parent:d,children:[]};d&&d.children.push(c);var f=b.slice(0,b.lastIndexOf('/')+1);return a.cache[b]=c.exports,e.call(c.exports,c,c.exports,f,b),c.loaded=!0,a.cache[b]=c.exports}a.modules={},a.cache={},a.resolve=function(b){return{}.hasOwnProperty.call(a.modules,b)?a.modules[b]:void 0},a.define=function(b,c){a.modules[b]=c};var b=function(a){return a='/',{title:'browser',version:'v0.10.26',browser:!0,env:{},argv:[],nextTick:c.setImmediate||function(a){setTimeout(a,0)},cwd:function(){return a},chdir:function(b){a=b}}}();a.define('/gif.coffee',function(d,m,l,k){function g(a,b){return{}.hasOwnProperty.call(a,b)}function j(d,b){for(var a=0,c=b.length;a<c;++a)if(a in b&&b[a]===d)return!0;return!1}function i(a,b){function d(){this.constructor=a}for(var c in b)g(b,c)&&(a[c]=b[c]);return d.prototype=b.prototype,a.prototype=new d,a.__super__=b.prototype,a}var h,c,f,b,e;f=a('events',d).EventEmitter,h=a('/browser.coffee',d),e=function(d){function a(d){var a,b;this.running=!1,this.options={},this.frames=[],this.freeWorkers=[],this.activeWorkers=[],this.setOptions(d);for(a in c)b=c[a],null!=this.options[a]?this.options[a]:this.options[a]=b}return i(a,d),c={workerScript:'vendor/gif.worker.js',workers:2,repeat:0,background:'#fff',quality:10,width:null,height:null,transparent:null},b={delay:500,copy:!1},a.prototype.setOption=function(a,b){return this.options[a]=b,null!=this._canvas&&(a==='width'||a==='height')?this._canvas[a]=b:void 0},a.prototype.setOptions=function(b){var a,c;return function(d){for(a in b){if(!g(b,a))continue;c=b[a],d.push(this.setOption(a,c))}return d}.call(this,[])},a.prototype.addFrame=function(a,d){var c,e;null==d&&(d={}),c={},c.transparent=this.options.transparent;for(e in b)c[e]=d[e]||b[e];if(null!=this.options.width||this.setOption('width',a.width),null!=this.options.height||this.setOption('height',a.height),'undefined'!==typeof ImageData&&null!=ImageData&&a instanceof ImageData)c.data=a.data;else if('undefined'!==typeof CanvasRenderingContext2D&&null!=CanvasRenderingContext2D&&a instanceof CanvasRenderingContext2D||'undefined'!==typeof WebGLRenderingContext&&null!=WebGLRenderingContext&&a instanceof WebGLRenderingContext)d.copy?c.data=this.getContextData(a):c.context=a;else if(null!=a.childNodes)d.copy?c.data=this.getImageData(a):c.image=a;else throw new Error('Invalid image');return this.frames.push(c)},a.prototype.render=function(){var d,a;if(this.running)throw new Error('Already running');if(!(null!=this.options.width&&null!=this.options.height))throw new Error('Width and height must be set prior to rendering');this.running=!0,this.nextFrame=0,this.finishedFrames=0,this.imageParts=function(c){for(var b=function(){var b;b=[];for(var a=0;0<=this.frames.length?a<this.frames.length:a>this.frames.length;0<=this.frames.length?++a:--a)b.push(a);return b}.apply(this,arguments),a=0,e=b.length;a<e;++a)d=b[a],c.push(null);return c}.call(this,[]),a=this.spawnWorkers();for(var c=function(){var c;c=[];for(var b=0;0<=a?b<a:b>a;0<=a?++b:--b)c.push(b);return c}.apply(this,arguments),b=0,e=c.length;b<e;++b)d=c[b],this.renderNextFrame();return this.emit('start'),this.emit('progress',0)},a.prototype.abort=function(){var a;while(!0){if(a=this.activeWorkers.shift(),!(null!=a))break;console.log('killing active worker'),a.terminate()}return this.running=!1,this.emit('abort')},a.prototype.spawnWorkers=function(){var a;return a=Math.min(this.options.workers,this.frames.length),function(){var c;c=[];for(var b=this.freeWorkers.length;this.freeWorkers.length<=a?b<a:b>a;this.freeWorkers.length<=a?++b:--b)c.push(b);return c}.apply(this,arguments).forEach(function(a){return function(c){var b;return console.log('spawning worker '+c),b=new Worker(a.options.workerScript),b.onmessage=function(a){return function(c){return a.activeWorkers.splice(a.activeWorkers.indexOf(b),1),a.freeWorkers.push(b),a.frameFinished(c.data)}}(a),a.freeWorkers.push(b)}}(this)),a},a.prototype.frameFinished=function(a){return console.log('frame '+a.index+' finished - '+this.activeWorkers.length+' active'),this.finishedFrames++,this.emit('progress',this.finishedFrames/this.frames.length),this.imageParts[a.index]=a,j(null,this.imageParts)?this.renderNextFrame():this.finishRendering()},a.prototype.finishRendering=function(){var e,a,k,m,b,d,h;b=0;for(var f=0,j=this.imageParts.length;f<j;++f)a=this.imageParts[f],b+=(a.data.length-1)*a.pageSize+a.cursor;b+=a.pageSize-a.cursor,console.log('rendering finished - filesize '+Math.round(b/1e3)+'kb'),e=new Uint8Array(b),d=0;for(var g=0,l=this.imageParts.length;g<l;++g){a=this.imageParts[g];for(var c=0,i=a.data.length;c<i;++c)h=a.data[c],k=c,e.set(h,d),k===a.data.length-1?d+=a.cursor:d+=a.pageSize}return m=new Blob([e],{type:'image/gif'}),this.emit('finished',m,e)},a.prototype.renderNextFrame=function(){var c,a,b;if(this.freeWorkers.length===0)throw new Error('No free workers');return this.nextFrame>=this.frames.length?void 0:(c=this.frames[this.nextFrame++],b=this.freeWorkers.shift(),a=this.getTask(c),console.log('starting frame '+(a.index+1)+' of '+this.frames.length),this.activeWorkers.push(b),b.postMessage(a))},a.prototype.getContextData=function(a){return a.getImageData(0,0,this.options.width,this.options.height).data},a.prototype.getImageData=function(b){var a;return null!=this._canvas||(this._canvas=document.createElement('canvas'),this._canvas.width=this.options.width,this._canvas.height=this.options.height),a=this._canvas.getContext('2d'),a.setFill=this.options.background,a.fillRect(0,0,this.options.width,this.options.height),a.drawImage(b,0,0),this.getContextData(a)},a.prototype.getTask=function(a){var c,b;if(c=this.frames.indexOf(a),b={index:c,last:c===this.frames.length-1,delay:a.delay,transparent:a.transparent,width:this.options.width,height:this.options.height,quality:this.options.quality,repeat:this.options.repeat,canTransfer:h.name==='chrome'},null!=a.data)b.data=a.data;else if(null!=a.context)b.data=this.getContextData(a.context);else if(null!=a.image)b.data=this.getImageData(a.image);else throw new Error('Invalid frame');return b},a}(f),d.exports=e}),a.define('/browser.coffee',function(f,g,h,i){var a,d,e,c,b;c=navigator.userAgent.toLowerCase(),e=navigator.platform.toLowerCase(),b=c.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/)||[null,'unknown',0],d=b[1]==='ie'&&document.documentMode,a={name:b[1]==='version'?b[3]:b[1],version:d||parseFloat(b[1]==='opera'&&b[4]?b[4]:b[2]),platform:{name:c.match(/ip(?:ad|od|hone)/)?'ios':(c.match(/(?:webos|android)/)||e.match(/mac|win|linux/)||['other'])[0]}},a[a.name]=!0,a[a.name+parseInt(a.version,10)]=!0,a.platform[a.platform.name]=!0,f.exports=a}),a.define('events',function(f,e,g,h){b.EventEmitter||(b.EventEmitter=function(){});var a=e.EventEmitter=b.EventEmitter,c=typeof Array.isArray==='function'?Array.isArray:function(a){return Object.prototype.toString.call(a)==='[object Array]'},d=10;a.prototype.setMaxListeners=function(a){this._events||(this._events={}),this._events.maxListeners=a},a.prototype.emit=function(f){if(f==='error'&&(!(this._events&&this._events.error)||c(this._events.error)&&!this._events.error.length))throw arguments[1]instanceof Error?arguments[1]:new Error("Uncaught, unspecified 'error' event.");if(!this._events)return!1;var a=this._events[f];if(!a)return!1;if(!(typeof a=='function'))if(c(a)){var b=Array.prototype.slice.call(arguments,1),e=a.slice();for(var d=0,g=e.length;d<g;d++)e[d].apply(this,b);return!0}else return!1;switch(arguments.length){case 1:a.call(this);break;case 2:a.call(this,arguments[1]);break;case 3:a.call(this,arguments[1],arguments[2]);break;default:var b=Array.prototype.slice.call(arguments,1);a.apply(this,b)}return!0},a.prototype.addListener=function(a,b){if('function'!==typeof b)throw new Error('addListener only takes instances of Function');if(this._events||(this._events={}),this.emit('newListener',a,b),!this._events[a])this._events[a]=b;else if(c(this._events[a])){if(!this._events[a].warned){var e;this._events.maxListeners!==undefined?e=this._events.maxListeners:e=d,e&&e>0&&this._events[a].length>e&&(this._events[a].warned=!0,console.error('(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.',this._events[a].length),console.trace())}this._events[a].push(b)}else this._events[a]=[this._events[a],b];return this},a.prototype.on=a.prototype.addListener,a.prototype.once=function(b,c){var a=this;return a.on(b,function d(){a.removeListener(b,d),c.apply(this,arguments)}),this},a.prototype.removeListener=function(a,d){if('function'!==typeof d)throw new Error('removeListener only takes instances of Function');if(!(this._events&&this._events[a]))return this;var b=this._events[a];if(c(b)){var e=b.indexOf(d);if(e<0)return this;b.splice(e,1),b.length==0&&delete this._events[a]}else this._events[a]===d&&delete this._events[a];return this},a.prototype.removeAllListeners=function(a){return a&&this._events&&this._events[a]&&(this._events[a]=null),this},a.prototype.listeners=function(a){return this._events||(this._events={}),this._events[a]||(this._events[a]=[]),c(this._events[a])||(this._events[a]=[this._events[a]]),this._events[a]}}),c.GIF=a('/gif.coffee')}.call(this,this))
//# sourceMappingURL=gif.js.map
// gif.js 0.1.6 - https://github.com/jnordberg/gif.js
;
(function() {
  var ImageExport;

  ImageExport = (function() {
    function ImageExport() {}

    ImageExport.prototype.generateGif = function(callback) {
      var frameDelay, gif, self;
      gif = new GIF({
        workers: 2
      });
      self = this;
      frameDelay = 20 * (AnimatronicaSettings.renderEach - 1);
      this.eachFrameOfAutoCroppedSequence(function(frame) {
        self.drawFrame(frame);
        return gif.addFrame(self.canvas, {
          copy: true,
          delay: frameDelay
        });
      });
      gif.on('finished', function(blob) {
        return callback(URL.createObjectURL(blob));
      });
      return gif.render();
    };

    return ImageExport;

  })();

  window.ImageExport = ImageExport;

}).call(this);
/*! jQuery v3.1.0 | (c) jQuery Foundation | jquery.org/license */

!function(a,b){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){"use strict";var c=[],d=a.document,e=Object.getPrototypeOf,f=c.slice,g=c.concat,h=c.push,i=c.indexOf,j={},k=j.toString,l=j.hasOwnProperty,m=l.toString,n=m.call(Object),o={};function p(a,b){b=b||d;var c=b.createElement("script");c.text=a,b.head.appendChild(c).parentNode.removeChild(c)}var q="3.1.0",r=function(a,b){return new r.fn.init(a,b)},s=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,t=/^-ms-/,u=/-([a-z])/g,v=function(a,b){return b.toUpperCase()};r.fn=r.prototype={jquery:q,constructor:r,length:0,toArray:function(){return f.call(this)},get:function(a){return null!=a?a<0?this[a+this.length]:this[a]:f.call(this)},pushStack:function(a){var b=r.merge(this.constructor(),a);return b.prevObject=this,b},each:function(a){return r.each(this,a)},map:function(a){return this.pushStack(r.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(f.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(a<0?b:0);return this.pushStack(c>=0&&c<b?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:h,sort:c.sort,splice:c.splice},r.extend=r.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||r.isFunction(g)||(g={}),h===i&&(g=this,h--);h<i;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(r.isPlainObject(d)||(e=r.isArray(d)))?(e?(e=!1,f=c&&r.isArray(c)?c:[]):f=c&&r.isPlainObject(c)?c:{},g[b]=r.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},r.extend({expando:"jQuery"+(q+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===r.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){var b=r.type(a);return("number"===b||"string"===b)&&!isNaN(a-parseFloat(a))},isPlainObject:function(a){var b,c;return!(!a||"[object Object]"!==k.call(a))&&(!(b=e(a))||(c=l.call(b,"constructor")&&b.constructor,"function"==typeof c&&m.call(c)===n))},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?j[k.call(a)]||"object":typeof a},globalEval:function(a){p(a)},camelCase:function(a){return a.replace(t,"ms-").replace(u,v)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(w(a)){for(c=a.length;d<c;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(s,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(w(Object(a))?r.merge(c,"string"==typeof a?[a]:a):h.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:i.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;d<c;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;f<g;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,f=0,h=[];if(w(a))for(d=a.length;f<d;f++)e=b(a[f],f,c),null!=e&&h.push(e);else for(f in a)e=b(a[f],f,c),null!=e&&h.push(e);return g.apply([],h)},guid:1,proxy:function(a,b){var c,d,e;if("string"==typeof b&&(c=a[b],b=a,a=c),r.isFunction(a))return d=f.call(arguments,2),e=function(){return a.apply(b||this,d.concat(f.call(arguments)))},e.guid=a.guid=a.guid||r.guid++,e},now:Date.now,support:o}),"function"==typeof Symbol&&(r.fn[Symbol.iterator]=c[Symbol.iterator]),r.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){j["[object "+b+"]"]=b.toLowerCase()});function w(a){var b=!!a&&"length"in a&&a.length,c=r.type(a);return"function"!==c&&!r.isWindow(a)&&("array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a)}var x=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C={}.hasOwnProperty,D=[],E=D.pop,F=D.push,G=D.push,H=D.slice,I=function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},J="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",K="[\\x20\\t\\r\\n\\f]",L="(?:\\\\.|[\\w-]|[^\0-\\xa0])+",M="\\["+K+"*("+L+")(?:"+K+"*([*^$|!~]?=)"+K+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+L+"))|)"+K+"*\\]",N=":("+L+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+M+")*)|.*)\\)|)",O=new RegExp(K+"+","g"),P=new RegExp("^"+K+"+|((?:^|[^\\\\])(?:\\\\.)*)"+K+"+$","g"),Q=new RegExp("^"+K+"*,"+K+"*"),R=new RegExp("^"+K+"*([>+~]|"+K+")"+K+"*"),S=new RegExp("="+K+"*([^\\]'\"]*?)"+K+"*\\]","g"),T=new RegExp(N),U=new RegExp("^"+L+"$"),V={ID:new RegExp("^#("+L+")"),CLASS:new RegExp("^\\.("+L+")"),TAG:new RegExp("^("+L+"|[*])"),ATTR:new RegExp("^"+M),PSEUDO:new RegExp("^"+N),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+K+"*(even|odd|(([+-]|)(\\d*)n|)"+K+"*(?:([+-]|)"+K+"*(\\d+)|))"+K+"*\\)|)","i"),bool:new RegExp("^(?:"+J+")$","i"),needsContext:new RegExp("^"+K+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+K+"*((?:-\\d)?\\d*)"+K+"*\\)|)(?=[^-]|$)","i")},W=/^(?:input|select|textarea|button)$/i,X=/^h\d$/i,Y=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,$=/[+~]/,_=new RegExp("\\\\([\\da-f]{1,6}"+K+"?|("+K+")|.)","ig"),aa=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:d<0?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ba=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g,ca=function(a,b){return b?"\0"===a?"\ufffd":a.slice(0,-1)+"\\"+a.charCodeAt(a.length-1).toString(16)+" ":"\\"+a},da=function(){m()},ea=ta(function(a){return a.disabled===!0},{dir:"parentNode",next:"legend"});try{G.apply(D=H.call(v.childNodes),v.childNodes),D[v.childNodes.length].nodeType}catch(fa){G={apply:D.length?function(a,b){F.apply(a,H.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s=b&&b.ownerDocument,w=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==w&&9!==w&&11!==w)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==w&&(l=Z.exec(a)))if(f=l[1]){if(9===w){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(s&&(j=s.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(l[2])return G.apply(d,b.getElementsByTagName(a)),d;if((f=l[3])&&c.getElementsByClassName&&b.getElementsByClassName)return G.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==w)s=b,r=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(ba,ca):b.setAttribute("id",k=u),o=g(a),h=o.length;while(h--)o[h]="#"+k+" "+sa(o[h]);r=o.join(","),s=$.test(a)&&qa(b.parentNode)||b}if(r)try{return G.apply(d,s.querySelectorAll(r)),d}catch(x){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(P,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("fieldset");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&a.sourceIndex-b.sourceIndex;if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return function(b){return"label"in b&&b.disabled===a||"form"in b&&b.disabled===a||"form"in b&&b.disabled===!1&&(b.isDisabled===a||b.isDisabled!==!a&&("label"in b||!ea(b))!==a)}}function pa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function qa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return!!b&&"HTML"!==b.nodeName},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),v!==n&&(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Y.test(n.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){if("undefined"!=typeof b.getElementsByClassName&&p)return b.getElementsByClassName(a)},r=[],q=[],(c.qsa=Y.test(n.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+K+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+K+"*(?:value|"+J+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){a.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+K+"*[*^$|!~]?="),2!==a.querySelectorAll(":enabled").length&&q.push(":enabled",":disabled"),o.appendChild(a).disabled=!0,2!==a.querySelectorAll(":disabled").length&&q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Y.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"*"),s.call(a,"[s!='']:x"),r.push("!=",N)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Y.test(o.compareDocumentPosition),t=b||Y.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?I(k,a)-I(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?I(k,a)-I(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?la(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(S,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&C.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.escape=function(a){return(a+"").replace(ba,ca)},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:V,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(_,aa),a[3]=(a[3]||a[4]||a[5]||"").replace(_,aa),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return V.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&T.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(_,aa).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+K+")"+a+"("+K+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:!b||(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(O," ")+" ").indexOf(c)>-1:"|="===b&&(e===c||e.slice(0,c.length+1)===c+"-"))}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=I(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(P,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(_,aa),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return U.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(_,aa).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:oa(!1),disabled:oa(!0),checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return X.test(a.nodeName)},input:function(a){return W.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:pa(function(){return[0]}),last:pa(function(a,b){return[b-1]}),eq:pa(function(a,b,c){return[c<0?c+b:c]}),even:pa(function(a,b){for(var c=0;c<b;c+=2)a.push(c);return a}),odd:pa(function(a,b){for(var c=1;c<b;c+=2)a.push(c);return a}),lt:pa(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:pa(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function ra(){}ra.prototype=d.filters=d.pseudos,d.setFilters=new ra,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=Q.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=R.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(P," ")}),h=h.slice(c.length));for(g in d.filter)!(e=V[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function sa(a){for(var b=0,c=a.length,d="";b<c;b++)d+=a[b].value;return d}function ta(a,b,c){var d=b.dir,e=b.next,f=e||d,g=c&&"parentNode"===f,h=x++;return b.first?function(b,c,e){while(b=b[d])if(1===b.nodeType||g)return a(b,c,e)}:function(b,c,i){var j,k,l,m=[w,h];if(i){while(b=b[d])if((1===b.nodeType||g)&&a(b,c,i))return!0}else while(b=b[d])if(1===b.nodeType||g)if(l=b[u]||(b[u]={}),k=l[b.uniqueID]||(l[b.uniqueID]={}),e&&e===b.nodeName.toLowerCase())b=b[d]||b;else{if((j=k[f])&&j[0]===w&&j[1]===h)return m[2]=j[2];if(k[f]=m,m[2]=a(b,c,i))return!0}}}function ua(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function va(a,b,c){for(var d=0,e=b.length;d<e;d++)ga(a,b[d],c);return c}function wa(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;h<i;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function xa(a,b,c,d,e,f){return d&&!d[u]&&(d=xa(d)),e&&!e[u]&&(e=xa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||va(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:wa(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=wa(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?I(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=wa(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function ya(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ta(function(a){return a===b},h,!0),l=ta(function(a){return I(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];i<f;i++)if(c=d.relative[a[i].type])m=[ta(ua(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;e<f;e++)if(d.relative[a[e].type])break;return xa(i>1&&ua(m),i>1&&sa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(P,"$1"),c,i<e&&ya(a.slice(i,e)),e<f&&ya(a=a.slice(e)),e<f&&sa(a))}m.push(c)}return ua(m)}function za(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=E.call(i));u=wa(u)}G.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&ga.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=ya(b[c]),f[u]?d.push(f):e.push(f);f=A(a,za(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(_,aa),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=V.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(_,aa),$.test(j[0].type)&&qa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&sa(j),!a)return G.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||$.test(a)&&qa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("fieldset"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){if(!c)return a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){if(!c&&"input"===a.nodeName.toLowerCase())return a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(J,function(a,b,c){var d;if(!c)return a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);r.find=x,r.expr=x.selectors,r.expr[":"]=r.expr.pseudos,r.uniqueSort=r.unique=x.uniqueSort,r.text=x.getText,r.isXMLDoc=x.isXML,r.contains=x.contains,r.escapeSelector=x.escape;var y=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&r(a).is(c))break;d.push(a)}return d},z=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},A=r.expr.match.needsContext,B=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i,C=/^.[^:#\[\.,]*$/;function D(a,b,c){if(r.isFunction(b))return r.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return r.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(C.test(b))return r.filter(b,a,c);b=r.filter(b,a)}return r.grep(a,function(a){return i.call(b,a)>-1!==c&&1===a.nodeType})}r.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?r.find.matchesSelector(d,a)?[d]:[]:r.find.matches(a,r.grep(b,function(a){return 1===a.nodeType}))},r.fn.extend({find:function(a){var b,c,d=this.length,e=this;if("string"!=typeof a)return this.pushStack(r(a).filter(function(){for(b=0;b<d;b++)if(r.contains(e[b],this))return!0}));for(c=this.pushStack([]),b=0;b<d;b++)r.find(a,e[b],c);return d>1?r.uniqueSort(c):c},filter:function(a){return this.pushStack(D(this,a||[],!1))},not:function(a){return this.pushStack(D(this,a||[],!0))},is:function(a){return!!D(this,"string"==typeof a&&A.test(a)?r(a):a||[],!1).length}});var E,F=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,G=r.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||E,"string"==typeof a){if(e="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:F.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof r?b[0]:b,r.merge(this,r.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),B.test(e[1])&&r.isPlainObject(b))for(e in b)r.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}return f=d.getElementById(e[2]),f&&(this[0]=f,this.length=1),this}return a.nodeType?(this[0]=a,this.length=1,this):r.isFunction(a)?void 0!==c.ready?c.ready(a):a(r):r.makeArray(a,this)};G.prototype=r.fn,E=r(d);var H=/^(?:parents|prev(?:Until|All))/,I={children:!0,contents:!0,next:!0,prev:!0};r.fn.extend({has:function(a){var b=r(a,this),c=b.length;return this.filter(function(){for(var a=0;a<c;a++)if(r.contains(this,b[a]))return!0})},closest:function(a,b){var c,d=0,e=this.length,f=[],g="string"!=typeof a&&r(a);if(!A.test(a))for(;d<e;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&r.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?r.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?i.call(r(a),this[0]):i.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(r.uniqueSort(r.merge(this.get(),r(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function J(a,b){while((a=a[b])&&1!==a.nodeType);return a}r.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return y(a,"parentNode")},parentsUntil:function(a,b,c){return y(a,"parentNode",c)},next:function(a){return J(a,"nextSibling")},prev:function(a){return J(a,"previousSibling")},nextAll:function(a){return y(a,"nextSibling")},prevAll:function(a){return y(a,"previousSibling")},nextUntil:function(a,b,c){return y(a,"nextSibling",c)},prevUntil:function(a,b,c){return y(a,"previousSibling",c)},siblings:function(a){return z((a.parentNode||{}).firstChild,a)},children:function(a){return z(a.firstChild)},contents:function(a){return a.contentDocument||r.merge([],a.childNodes)}},function(a,b){r.fn[a]=function(c,d){var e=r.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=r.filter(d,e)),this.length>1&&(I[a]||r.uniqueSort(e),H.test(a)&&e.reverse()),this.pushStack(e)}});var K=/\S+/g;function L(a){var b={};return r.each(a.match(K)||[],function(a,c){b[c]=!0}),b}r.Callbacks=function(a){a="string"==typeof a?L(a):r.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){r.each(b,function(b,c){r.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==r.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return r.each(arguments,function(a,b){var c;while((c=r.inArray(b,f,c))>-1)f.splice(c,1),c<=h&&h--}),this},has:function(a){return a?r.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=g=[],c||b||(f=c=""),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j};function M(a){return a}function N(a){throw a}function O(a,b,c){var d;try{a&&r.isFunction(d=a.promise)?d.call(a).done(b).fail(c):a&&r.isFunction(d=a.then)?d.call(a,b,c):b.call(void 0,a)}catch(a){c.call(void 0,a)}}r.extend({Deferred:function(b){var c=[["notify","progress",r.Callbacks("memory"),r.Callbacks("memory"),2],["resolve","done",r.Callbacks("once memory"),r.Callbacks("once memory"),0,"resolved"],["reject","fail",r.Callbacks("once memory"),r.Callbacks("once memory"),1,"rejected"]],d="pending",e={state:function(){return d},always:function(){return f.done(arguments).fail(arguments),this},"catch":function(a){return e.then(null,a)},pipe:function(){var a=arguments;return r.Deferred(function(b){r.each(c,function(c,d){var e=r.isFunction(a[d[4]])&&a[d[4]];f[d[1]](function(){var a=e&&e.apply(this,arguments);a&&r.isFunction(a.promise)?a.promise().progress(b.notify).done(b.resolve).fail(b.reject):b[d[0]+"With"](this,e?[a]:arguments)})}),a=null}).promise()},then:function(b,d,e){var f=0;function g(b,c,d,e){return function(){var h=this,i=arguments,j=function(){var a,j;if(!(b<f)){if(a=d.apply(h,i),a===c.promise())throw new TypeError("Thenable self-resolution");j=a&&("object"==typeof a||"function"==typeof a)&&a.then,r.isFunction(j)?e?j.call(a,g(f,c,M,e),g(f,c,N,e)):(f++,j.call(a,g(f,c,M,e),g(f,c,N,e),g(f,c,M,c.notifyWith))):(d!==M&&(h=void 0,i=[a]),(e||c.resolveWith)(h,i))}},k=e?j:function(){try{j()}catch(a){r.Deferred.exceptionHook&&r.Deferred.exceptionHook(a,k.stackTrace),b+1>=f&&(d!==N&&(h=void 0,i=[a]),c.rejectWith(h,i))}};b?k():(r.Deferred.getStackHook&&(k.stackTrace=r.Deferred.getStackHook()),a.setTimeout(k))}}return r.Deferred(function(a){c[0][3].add(g(0,a,r.isFunction(e)?e:M,a.notifyWith)),c[1][3].add(g(0,a,r.isFunction(b)?b:M)),c[2][3].add(g(0,a,r.isFunction(d)?d:N))}).promise()},promise:function(a){return null!=a?r.extend(a,e):e}},f={};return r.each(c,function(a,b){var g=b[2],h=b[5];e[b[1]]=g.add,h&&g.add(function(){d=h},c[3-a][2].disable,c[0][2].lock),g.add(b[3].fire),f[b[0]]=function(){return f[b[0]+"With"](this===f?void 0:this,arguments),this},f[b[0]+"With"]=g.fireWith}),e.promise(f),b&&b.call(f,f),f},when:function(a){var b=arguments.length,c=b,d=Array(c),e=f.call(arguments),g=r.Deferred(),h=function(a){return function(c){d[a]=this,e[a]=arguments.length>1?f.call(arguments):c,--b||g.resolveWith(d,e)}};if(b<=1&&(O(a,g.done(h(c)).resolve,g.reject),"pending"===g.state()||r.isFunction(e[c]&&e[c].then)))return g.then();while(c--)O(e[c],h(c),g.reject);return g.promise()}});var P=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;r.Deferred.exceptionHook=function(b,c){a.console&&a.console.warn&&b&&P.test(b.name)&&a.console.warn("jQuery.Deferred exception: "+b.message,b.stack,c)},r.readyException=function(b){a.setTimeout(function(){throw b})};var Q=r.Deferred();r.fn.ready=function(a){return Q.then(a)["catch"](function(a){r.readyException(a)}),this},r.extend({isReady:!1,readyWait:1,holdReady:function(a){a?r.readyWait++:r.ready(!0)},ready:function(a){(a===!0?--r.readyWait:r.isReady)||(r.isReady=!0,a!==!0&&--r.readyWait>0||Q.resolveWith(d,[r]))}}),r.ready.then=Q.then;function R(){d.removeEventListener("DOMContentLoaded",R),a.removeEventListener("load",R),r.ready()}"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?a.setTimeout(r.ready):(d.addEventListener("DOMContentLoaded",R),a.addEventListener("load",R));var S=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===r.type(c)){e=!0;for(h in c)S(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,
r.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(r(a),c)})),b))for(;h<i;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},T=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function U(){this.expando=r.expando+U.uid++}U.uid=1,U.prototype={cache:function(a){var b=a[this.expando];return b||(b={},T(a)&&(a.nodeType?a[this.expando]=b:Object.defineProperty(a,this.expando,{value:b,configurable:!0}))),b},set:function(a,b,c){var d,e=this.cache(a);if("string"==typeof b)e[r.camelCase(b)]=c;else for(d in b)e[r.camelCase(d)]=b[d];return e},get:function(a,b){return void 0===b?this.cache(a):a[this.expando]&&a[this.expando][r.camelCase(b)]},access:function(a,b,c){return void 0===b||b&&"string"==typeof b&&void 0===c?this.get(a,b):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d=a[this.expando];if(void 0!==d){if(void 0!==b){r.isArray(b)?b=b.map(r.camelCase):(b=r.camelCase(b),b=b in d?[b]:b.match(K)||[]),c=b.length;while(c--)delete d[b[c]]}(void 0===b||r.isEmptyObject(d))&&(a.nodeType?a[this.expando]=void 0:delete a[this.expando])}},hasData:function(a){var b=a[this.expando];return void 0!==b&&!r.isEmptyObject(b)}};var V=new U,W=new U,X=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Y=/[A-Z]/g;function Z(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(Y,"-$&").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c||"false"!==c&&("null"===c?null:+c+""===c?+c:X.test(c)?JSON.parse(c):c)}catch(e){}W.set(a,b,c)}else c=void 0;return c}r.extend({hasData:function(a){return W.hasData(a)||V.hasData(a)},data:function(a,b,c){return W.access(a,b,c)},removeData:function(a,b){W.remove(a,b)},_data:function(a,b,c){return V.access(a,b,c)},_removeData:function(a,b){V.remove(a,b)}}),r.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=W.get(f),1===f.nodeType&&!V.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=r.camelCase(d.slice(5)),Z(f,d,e[d])));V.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){W.set(this,a)}):S(this,function(b){var c;if(f&&void 0===b){if(c=W.get(f,a),void 0!==c)return c;if(c=Z(f,a),void 0!==c)return c}else this.each(function(){W.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){W.remove(this,a)})}}),r.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=V.get(a,b),c&&(!d||r.isArray(c)?d=V.access(a,b,r.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=r.queue(a,b),d=c.length,e=c.shift(),f=r._queueHooks(a,b),g=function(){r.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return V.get(a,c)||V.access(a,c,{empty:r.Callbacks("once memory").add(function(){V.remove(a,[b+"queue",c])})})}}),r.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?r.queue(this[0],a):void 0===b?this:this.each(function(){var c=r.queue(this,a,b);r._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&r.dequeue(this,a)})},dequeue:function(a){return this.each(function(){r.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=r.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=V.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var $=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,_=new RegExp("^(?:([+-])=|)("+$+")([a-z%]*)$","i"),aa=["Top","Right","Bottom","Left"],ba=function(a,b){return a=b||a,"none"===a.style.display||""===a.style.display&&r.contains(a.ownerDocument,a)&&"none"===r.css(a,"display")},ca=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};function da(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return r.css(a,b,"")},i=h(),j=c&&c[3]||(r.cssNumber[b]?"":"px"),k=(r.cssNumber[b]||"px"!==j&&+i)&&_.exec(r.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,r.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var ea={};function fa(a){var b,c=a.ownerDocument,d=a.nodeName,e=ea[d];return e?e:(b=c.body.appendChild(c.createElement(d)),e=r.css(b,"display"),b.parentNode.removeChild(b),"none"===e&&(e="block"),ea[d]=e,e)}function ga(a,b){for(var c,d,e=[],f=0,g=a.length;f<g;f++)d=a[f],d.style&&(c=d.style.display,b?("none"===c&&(e[f]=V.get(d,"display")||null,e[f]||(d.style.display="")),""===d.style.display&&ba(d)&&(e[f]=fa(d))):"none"!==c&&(e[f]="none",V.set(d,"display",c)));for(f=0;f<g;f++)null!=e[f]&&(a[f].style.display=e[f]);return a}r.fn.extend({show:function(){return ga(this,!0)},hide:function(){return ga(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){ba(this)?r(this).show():r(this).hide()})}});var ha=/^(?:checkbox|radio)$/i,ia=/<([a-z][^\/\0>\x20\t\r\n\f]+)/i,ja=/^$|\/(?:java|ecma)script/i,ka={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ka.optgroup=ka.option,ka.tbody=ka.tfoot=ka.colgroup=ka.caption=ka.thead,ka.th=ka.td;function la(a,b){var c="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&r.nodeName(a,b)?r.merge([a],c):c}function ma(a,b){for(var c=0,d=a.length;c<d;c++)V.set(a[c],"globalEval",!b||V.get(b[c],"globalEval"))}var na=/<|&#?\w+;/;function oa(a,b,c,d,e){for(var f,g,h,i,j,k,l=b.createDocumentFragment(),m=[],n=0,o=a.length;n<o;n++)if(f=a[n],f||0===f)if("object"===r.type(f))r.merge(m,f.nodeType?[f]:f);else if(na.test(f)){g=g||l.appendChild(b.createElement("div")),h=(ia.exec(f)||["",""])[1].toLowerCase(),i=ka[h]||ka._default,g.innerHTML=i[1]+r.htmlPrefilter(f)+i[2],k=i[0];while(k--)g=g.lastChild;r.merge(m,g.childNodes),g=l.firstChild,g.textContent=""}else m.push(b.createTextNode(f));l.textContent="",n=0;while(f=m[n++])if(d&&r.inArray(f,d)>-1)e&&e.push(f);else if(j=r.contains(f.ownerDocument,f),g=la(l.appendChild(f),"script"),j&&ma(g),c){k=0;while(f=g[k++])ja.test(f.type||"")&&c.push(f)}return l}!function(){var a=d.createDocumentFragment(),b=a.appendChild(d.createElement("div")),c=d.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),o.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",o.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var pa=d.documentElement,qa=/^key/,ra=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,sa=/^([^.]*)(?:\.(.+)|)/;function ta(){return!0}function ua(){return!1}function va(){try{return d.activeElement}catch(a){}}function wa(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)wa(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=ua;else if(!e)return a;return 1===f&&(g=e,e=function(a){return r().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=r.guid++)),a.each(function(){r.event.add(this,b,e,d,c)})}r.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.get(a);if(q){c.handler&&(f=c,c=f.handler,e=f.selector),e&&r.find.matchesSelector(pa,e),c.guid||(c.guid=r.guid++),(i=q.events)||(i=q.events={}),(g=q.handle)||(g=q.handle=function(b){return"undefined"!=typeof r&&r.event.triggered!==b.type?r.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(K)||[""],j=b.length;while(j--)h=sa.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n&&(l=r.event.special[n]||{},n=(e?l.delegateType:l.bindType)||n,l=r.event.special[n]||{},k=r.extend({type:n,origType:p,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&r.expr.match.needsContext.test(e),namespace:o.join(".")},f),(m=i[n])||(m=i[n]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,o,g)!==!1||a.addEventListener&&a.addEventListener(n,g)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),r.event.global[n]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.hasData(a)&&V.get(a);if(q&&(i=q.events)){b=(b||"").match(K)||[""],j=b.length;while(j--)if(h=sa.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n){l=r.event.special[n]||{},n=(d?l.delegateType:l.bindType)||n,m=i[n]||[],h=h[2]&&new RegExp("(^|\\.)"+o.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&p!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,o,q.handle)!==!1||r.removeEvent(a,n,q.handle),delete i[n])}else for(n in i)r.event.remove(a,n+b[j],c,d,!0);r.isEmptyObject(i)&&V.remove(a,"handle events")}},dispatch:function(a){var b=r.event.fix(a),c,d,e,f,g,h,i=new Array(arguments.length),j=(V.get(this,"events")||{})[b.type]||[],k=r.event.special[b.type]||{};for(i[0]=b,c=1;c<arguments.length;c++)i[c]=arguments[c];if(b.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,b)!==!1){h=r.event.handlers.call(this,b,j),c=0;while((f=h[c++])&&!b.isPropagationStopped()){b.currentTarget=f.elem,d=0;while((g=f.handlers[d++])&&!b.isImmediatePropagationStopped())b.rnamespace&&!b.rnamespace.test(g.namespace)||(b.handleObj=g,b.data=g.data,e=((r.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(b.result=e)===!1&&(b.preventDefault(),b.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,b),b.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!==this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(d=[],c=0;c<h;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?r(e,this).index(i)>-1:r.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},addProp:function(a,b){Object.defineProperty(r.Event.prototype,a,{enumerable:!0,configurable:!0,get:r.isFunction(b)?function(){if(this.originalEvent)return b(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[a]},set:function(b){Object.defineProperty(this,a,{enumerable:!0,configurable:!0,writable:!0,value:b})}})},fix:function(a){return a[r.expando]?a:new r.Event(a)},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==va()&&this.focus)return this.focus(),!1},delegateType:"focusin"},blur:{trigger:function(){if(this===va()&&this.blur)return this.blur(),!1},delegateType:"focusout"},click:{trigger:function(){if("checkbox"===this.type&&this.click&&r.nodeName(this,"input"))return this.click(),!1},_default:function(a){return r.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}}},r.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)},r.Event=function(a,b){return this instanceof r.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ta:ua,this.target=a.target&&3===a.target.nodeType?a.target.parentNode:a.target,this.currentTarget=a.currentTarget,this.relatedTarget=a.relatedTarget):this.type=a,b&&r.extend(this,b),this.timeStamp=a&&a.timeStamp||r.now(),void(this[r.expando]=!0)):new r.Event(a,b)},r.Event.prototype={constructor:r.Event,isDefaultPrevented:ua,isPropagationStopped:ua,isImmediatePropagationStopped:ua,isSimulated:!1,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ta,a&&!this.isSimulated&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ta,a&&!this.isSimulated&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ta,a&&!this.isSimulated&&a.stopImmediatePropagation(),this.stopPropagation()}},r.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:function(a){var b=a.button;return null==a.which&&qa.test(a.type)?null!=a.charCode?a.charCode:a.keyCode:!a.which&&void 0!==b&&ra.test(a.type)?1&b?1:2&b?3:4&b?2:0:a.which}},r.event.addProp),r.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){r.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||r.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),r.fn.extend({on:function(a,b,c,d){return wa(this,a,b,c,d)},one:function(a,b,c,d){return wa(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,r(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return b!==!1&&"function"!=typeof b||(c=b,b=void 0),c===!1&&(c=ua),this.each(function(){r.event.remove(this,a,c,b)})}});var xa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,ya=/<script|<style|<link/i,za=/checked\s*(?:[^=]|=\s*.checked.)/i,Aa=/^true\/(.*)/,Ba=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function Ca(a,b){return r.nodeName(a,"table")&&r.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a:a}function Da(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function Ea(a){var b=Aa.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Fa(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(V.hasData(a)&&(f=V.access(a),g=V.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;c<d;c++)r.event.add(b,e,j[e][c])}W.hasData(a)&&(h=W.access(a),i=r.extend({},h),W.set(b,i))}}function Ga(a,b){var c=b.nodeName.toLowerCase();"input"===c&&ha.test(a.type)?b.checked=a.checked:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue)}function Ha(a,b,c,d){b=g.apply([],b);var e,f,h,i,j,k,l=0,m=a.length,n=m-1,q=b[0],s=r.isFunction(q);if(s||m>1&&"string"==typeof q&&!o.checkClone&&za.test(q))return a.each(function(e){var f=a.eq(e);s&&(b[0]=q.call(this,e,f.html())),Ha(f,b,c,d)});if(m&&(e=oa(b,a[0].ownerDocument,!1,a,d),f=e.firstChild,1===e.childNodes.length&&(e=f),f||d)){for(h=r.map(la(e,"script"),Da),i=h.length;l<m;l++)j=e,l!==n&&(j=r.clone(j,!0,!0),i&&r.merge(h,la(j,"script"))),c.call(a[l],j,l);if(i)for(k=h[h.length-1].ownerDocument,r.map(h,Ea),l=0;l<i;l++)j=h[l],ja.test(j.type||"")&&!V.access(j,"globalEval")&&r.contains(k,j)&&(j.src?r._evalUrl&&r._evalUrl(j.src):p(j.textContent.replace(Ba,""),k))}return a}function Ia(a,b,c){for(var d,e=b?r.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||r.cleanData(la(d)),d.parentNode&&(c&&r.contains(d.ownerDocument,d)&&ma(la(d,"script")),d.parentNode.removeChild(d));return a}r.extend({htmlPrefilter:function(a){return a.replace(xa,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=r.contains(a.ownerDocument,a);if(!(o.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||r.isXMLDoc(a)))for(g=la(h),f=la(a),d=0,e=f.length;d<e;d++)Ga(f[d],g[d]);if(b)if(c)for(f=f||la(a),g=g||la(h),d=0,e=f.length;d<e;d++)Fa(f[d],g[d]);else Fa(a,h);return g=la(h,"script"),g.length>0&&ma(g,!i&&la(a,"script")),h},cleanData:function(a){for(var b,c,d,e=r.event.special,f=0;void 0!==(c=a[f]);f++)if(T(c)){if(b=c[V.expando]){if(b.events)for(d in b.events)e[d]?r.event.remove(c,d):r.removeEvent(c,d,b.handle);c[V.expando]=void 0}c[W.expando]&&(c[W.expando]=void 0)}}}),r.fn.extend({detach:function(a){return Ia(this,a,!0)},remove:function(a){return Ia(this,a)},text:function(a){return S(this,function(a){return void 0===a?r.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=a)})},null,a,arguments.length)},append:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.appendChild(a)}})},prepend:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(r.cleanData(la(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null!=a&&a,b=null==b?a:b,this.map(function(){return r.clone(this,a,b)})},html:function(a){return S(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!ya.test(a)&&!ka[(ia.exec(a)||["",""])[1].toLowerCase()]){a=r.htmlPrefilter(a);try{for(;c<d;c++)b=this[c]||{},1===b.nodeType&&(r.cleanData(la(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return Ha(this,arguments,function(b){var c=this.parentNode;r.inArray(this,a)<0&&(r.cleanData(la(this)),c&&c.replaceChild(b,this))},a)}}),r.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){r.fn[a]=function(a){for(var c,d=[],e=r(a),f=e.length-1,g=0;g<=f;g++)c=g===f?this:this.clone(!0),r(e[g])[b](c),h.apply(d,c.get());return this.pushStack(d)}});var Ja=/^margin/,Ka=new RegExp("^("+$+")(?!px)[a-z%]+$","i"),La=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)};!function(){function b(){if(i){i.style.cssText="box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",i.innerHTML="",pa.appendChild(h);var b=a.getComputedStyle(i);c="1%"!==b.top,g="2px"===b.marginLeft,e="4px"===b.width,i.style.marginRight="50%",f="4px"===b.marginRight,pa.removeChild(h),i=null}}var c,e,f,g,h=d.createElement("div"),i=d.createElement("div");i.style&&(i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",o.clearCloneStyle="content-box"===i.style.backgroundClip,h.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",h.appendChild(i),r.extend(o,{pixelPosition:function(){return b(),c},boxSizingReliable:function(){return b(),e},pixelMarginRight:function(){return b(),f},reliableMarginLeft:function(){return b(),g}}))}();function Ma(a,b,c){var d,e,f,g,h=a.style;return c=c||La(a),c&&(g=c.getPropertyValue(b)||c[b],""!==g||r.contains(a.ownerDocument,a)||(g=r.style(a,b)),!o.pixelMarginRight()&&Ka.test(g)&&Ja.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function Na(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Oa=/^(none|table(?!-c[ea]).+)/,Pa={position:"absolute",visibility:"hidden",display:"block"},Qa={letterSpacing:"0",fontWeight:"400"},Ra=["Webkit","Moz","ms"],Sa=d.createElement("div").style;function Ta(a){if(a in Sa)return a;var b=a[0].toUpperCase()+a.slice(1),c=Ra.length;while(c--)if(a=Ra[c]+b,a in Sa)return a}function Ua(a,b,c){var d=_.exec(b);return d?Math.max(0,d[2]-(c||0))+(d[3]||"px"):b}function Va(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;f<4;f+=2)"margin"===c&&(g+=r.css(a,c+aa[f],!0,e)),d?("content"===c&&(g-=r.css(a,"padding"+aa[f],!0,e)),"margin"!==c&&(g-=r.css(a,"border"+aa[f]+"Width",!0,e))):(g+=r.css(a,"padding"+aa[f],!0,e),"padding"!==c&&(g+=r.css(a,"border"+aa[f]+"Width",!0,e)));return g}function Wa(a,b,c){var d,e=!0,f=La(a),g="border-box"===r.css(a,"boxSizing",!1,f);if(a.getClientRects().length&&(d=a.getBoundingClientRect()[b]),d<=0||null==d){if(d=Ma(a,b,f),(d<0||null==d)&&(d=a.style[b]),Ka.test(d))return d;e=g&&(o.boxSizingReliable()||d===a.style[b]),d=parseFloat(d)||0}return d+Va(a,b,c||(g?"border":"content"),e,f)+"px"}r.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Ma(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=r.camelCase(b),i=a.style;return b=r.cssProps[h]||(r.cssProps[h]=Ta(h)||h),g=r.cssHooks[b]||r.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=_.exec(c))&&e[1]&&(c=da(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(r.cssNumber[h]?"":"px")),o.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=r.camelCase(b);return b=r.cssProps[h]||(r.cssProps[h]=Ta(h)||h),g=r.cssHooks[b]||r.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=Ma(a,b,d)),"normal"===e&&b in Qa&&(e=Qa[b]),""===c||c?(f=parseFloat(e),c===!0||isFinite(f)?f||0:e):e}}),r.each(["height","width"],function(a,b){r.cssHooks[b]={get:function(a,c,d){if(c)return!Oa.test(r.css(a,"display"))||a.getClientRects().length&&a.getBoundingClientRect().width?Wa(a,b,d):ca(a,Pa,function(){return Wa(a,b,d)})},set:function(a,c,d){var e,f=d&&La(a),g=d&&Va(a,b,d,"border-box"===r.css(a,"boxSizing",!1,f),f);return g&&(e=_.exec(c))&&"px"!==(e[3]||"px")&&(a.style[b]=c,c=r.css(a,b)),Ua(a,c,g)}}}),r.cssHooks.marginLeft=Na(o.reliableMarginLeft,function(a,b){if(b)return(parseFloat(Ma(a,"marginLeft"))||a.getBoundingClientRect().left-ca(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}))+"px"}),r.each({margin:"",padding:"",border:"Width"},function(a,b){r.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];d<4;d++)e[a+aa[d]+b]=f[d]||f[d-2]||f[0];return e}},Ja.test(a)||(r.cssHooks[a+b].set=Ua)}),r.fn.extend({css:function(a,b){return S(this,function(a,b,c){var d,e,f={},g=0;if(r.isArray(b)){for(d=La(a),e=b.length;g<e;g++)f[b[g]]=r.css(a,b[g],!1,d);return f}return void 0!==c?r.style(a,b,c):r.css(a,b)},a,b,arguments.length>1)}});function Xa(a,b,c,d,e){return new Xa.prototype.init(a,b,c,d,e)}r.Tween=Xa,Xa.prototype={constructor:Xa,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||r.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(r.cssNumber[c]?"":"px")},cur:function(){var a=Xa.propHooks[this.prop];return a&&a.get?a.get(this):Xa.propHooks._default.get(this)},run:function(a){var b,c=Xa.propHooks[this.prop];return this.options.duration?this.pos=b=r.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Xa.propHooks._default.set(this),this}},Xa.prototype.init.prototype=Xa.prototype,Xa.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=r.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){r.fx.step[a.prop]?r.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[r.cssProps[a.prop]]&&!r.cssHooks[a.prop]?a.elem[a.prop]=a.now:r.style(a.elem,a.prop,a.now+a.unit)}}},Xa.propHooks.scrollTop=Xa.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},r.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},r.fx=Xa.prototype.init,r.fx.step={};var Ya,Za,$a=/^(?:toggle|show|hide)$/,_a=/queueHooks$/;function ab(){Za&&(a.requestAnimationFrame(ab),r.fx.tick())}function bb(){return a.setTimeout(function(){Ya=void 0}),Ya=r.now()}function cb(a,b){var c,d=0,e={height:a};for(b=b?1:0;d<4;d+=2-b)c=aa[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function db(a,b,c){for(var d,e=(gb.tweeners[b]||[]).concat(gb.tweeners["*"]),f=0,g=e.length;f<g;f++)if(d=e[f].call(c,b,a))return d}function eb(a,b,c){var d,e,f,g,h,i,j,k,l="width"in b||"height"in b,m=this,n={},o=a.style,p=a.nodeType&&ba(a),q=V.get(a,"fxshow");c.queue||(g=r._queueHooks(a,"fx"),null==g.unqueued&&(g.unqueued=0,h=g.empty.fire,g.empty.fire=function(){g.unqueued||h()}),g.unqueued++,m.always(function(){m.always(function(){g.unqueued--,r.queue(a,"fx").length||g.empty.fire()})}));for(d in b)if(e=b[d],$a.test(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}n[d]=q&&q[d]||r.style(a,d)}if(i=!r.isEmptyObject(b),i||!r.isEmptyObject(n)){l&&1===a.nodeType&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=q&&q.display,null==j&&(j=V.get(a,"display")),k=r.css(a,"display"),"none"===k&&(j?k=j:(ga([a],!0),j=a.style.display||j,k=r.css(a,"display"),ga([a]))),("inline"===k||"inline-block"===k&&null!=j)&&"none"===r.css(a,"float")&&(i||(m.done(function(){o.display=j}),null==j&&(k=o.display,j="none"===k?"":k)),o.display="inline-block")),c.overflow&&(o.overflow="hidden",m.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]})),i=!1;for(d in n)i||(q?"hidden"in q&&(p=q.hidden):q=V.access(a,"fxshow",{display:j}),f&&(q.hidden=!p),p&&ga([a],!0),m.done(function(){p||ga([a]),V.remove(a,"fxshow");for(d in n)r.style(a,d,n[d])})),i=db(p?q[d]:0,d,m),d in q||(q[d]=i.start,p&&(i.end=i.start,i.start=0))}}function fb(a,b){var c,d,e,f,g;for(c in a)if(d=r.camelCase(c),e=b[d],f=a[c],r.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=r.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function gb(a,b,c){var d,e,f=0,g=gb.prefilters.length,h=r.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Ya||bb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;g<i;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),f<1&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:r.extend({},b),opts:r.extend(!0,{specialEasing:{},easing:r.easing._default},c),originalProperties:b,originalOptions:c,startTime:Ya||bb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=r.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;c<d;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for(fb(k,j.opts.specialEasing);f<g;f++)if(d=gb.prefilters[f].call(j,a,k,j.opts))return r.isFunction(d.stop)&&(r._queueHooks(j.elem,j.opts.queue).stop=r.proxy(d.stop,d)),d;return r.map(k,db,j),r.isFunction(j.opts.start)&&j.opts.start.call(a,j),r.fx.timer(r.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}r.Animation=r.extend(gb,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return da(c.elem,a,_.exec(b),c),c}]},tweener:function(a,b){r.isFunction(a)?(b=a,a=["*"]):a=a.match(K);for(var c,d=0,e=a.length;d<e;d++)c=a[d],gb.tweeners[c]=gb.tweeners[c]||[],gb.tweeners[c].unshift(b)},prefilters:[eb],prefilter:function(a,b){b?gb.prefilters.unshift(a):gb.prefilters.push(a)}}),r.speed=function(a,b,c){var e=a&&"object"==typeof a?r.extend({},a):{complete:c||!c&&b||r.isFunction(a)&&a,duration:a,easing:c&&b||b&&!r.isFunction(b)&&b};return r.fx.off||d.hidden?e.duration=0:e.duration="number"==typeof e.duration?e.duration:e.duration in r.fx.speeds?r.fx.speeds[e.duration]:r.fx.speeds._default,null!=e.queue&&e.queue!==!0||(e.queue="fx"),e.old=e.complete,e.complete=function(){r.isFunction(e.old)&&e.old.call(this),e.queue&&r.dequeue(this,e.queue)},e},r.fn.extend({fadeTo:function(a,b,c,d){return this.filter(ba).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=r.isEmptyObject(a),f=r.speed(b,c,d),g=function(){var b=gb(this,r.extend({},a),f);(e||V.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=r.timers,g=V.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&_a.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||r.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=V.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=r.timers,g=d?d.length:0;for(c.finish=!0,r.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;b<g;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),r.each(["toggle","show","hide"],function(a,b){var c=r.fn[b];r.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(cb(b,!0),a,d,e)}}),r.each({slideDown:cb("show"),slideUp:cb("hide"),slideToggle:cb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){r.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),r.timers=[],r.fx.tick=function(){var a,b=0,c=r.timers;for(Ya=r.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||r.fx.stop(),Ya=void 0},r.fx.timer=function(a){r.timers.push(a),a()?r.fx.start():r.timers.pop()},r.fx.interval=13,r.fx.start=function(){Za||(Za=a.requestAnimationFrame?a.requestAnimationFrame(ab):a.setInterval(r.fx.tick,r.fx.interval))},r.fx.stop=function(){a.cancelAnimationFrame?a.cancelAnimationFrame(Za):a.clearInterval(Za),Za=null},r.fx.speeds={slow:600,fast:200,_default:400},r.fn.delay=function(b,c){return b=r.fx?r.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a=d.createElement("input"),b=d.createElement("select"),c=b.appendChild(d.createElement("option"));a.type="checkbox",o.checkOn=""!==a.value,o.optSelected=c.selected,a=d.createElement("input"),a.value="t",a.type="radio",o.radioValue="t"===a.value}();var hb,ib=r.expr.attrHandle;r.fn.extend({attr:function(a,b){return S(this,r.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){r.removeAttr(this,a)})}}),r.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?r.prop(a,b,c):(1===f&&r.isXMLDoc(a)||(e=r.attrHooks[b.toLowerCase()]||(r.expr.match.bool.test(b)?hb:void 0)),void 0!==c?null===c?void r.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=r.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!o.radioValue&&"radio"===b&&r.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d=0,e=b&&b.match(K);
if(e&&1===a.nodeType)while(c=e[d++])a.removeAttribute(c)}}),hb={set:function(a,b,c){return b===!1?r.removeAttr(a,c):a.setAttribute(c,c),c}},r.each(r.expr.match.bool.source.match(/\w+/g),function(a,b){var c=ib[b]||r.find.attr;ib[b]=function(a,b,d){var e,f,g=b.toLowerCase();return d||(f=ib[g],ib[g]=e,e=null!=c(a,b,d)?g:null,ib[g]=f),e}});var jb=/^(?:input|select|textarea|button)$/i,kb=/^(?:a|area)$/i;r.fn.extend({prop:function(a,b){return S(this,r.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[r.propFix[a]||a]})}}),r.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&r.isXMLDoc(a)||(b=r.propFix[b]||b,e=r.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=r.find.attr(a,"tabindex");return b?parseInt(b,10):jb.test(a.nodeName)||kb.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),o.optSelected||(r.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex)}}),r.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){r.propFix[this.toLowerCase()]=this});var lb=/[\t\r\n\f]/g;function mb(a){return a.getAttribute&&a.getAttribute("class")||""}r.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).addClass(a.call(this,b,mb(this)))});if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=mb(c),d=1===c.nodeType&&(" "+e+" ").replace(lb," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=r.trim(d),e!==h&&c.setAttribute("class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).removeClass(a.call(this,b,mb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=mb(c),d=1===c.nodeType&&(" "+e+" ").replace(lb," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=r.trim(d),e!==h&&c.setAttribute("class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):r.isFunction(a)?this.each(function(c){r(this).toggleClass(a.call(this,c,mb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=r(this),f=a.match(K)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else void 0!==a&&"boolean"!==c||(b=mb(this),b&&V.set(this,"__className__",b),this.setAttribute&&this.setAttribute("class",b||a===!1?"":V.get(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+mb(c)+" ").replace(lb," ").indexOf(b)>-1)return!0;return!1}});var nb=/\r/g,ob=/[\x20\t\r\n\f]+/g;r.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=r.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,r(this).val()):a,null==e?e="":"number"==typeof e?e+="":r.isArray(e)&&(e=r.map(e,function(a){return null==a?"":a+""})),b=r.valHooks[this.type]||r.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=r.valHooks[e.type]||r.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(nb,""):null==c?"":c)}}}),r.extend({valHooks:{option:{get:function(a){var b=r.find.attr(a,"value");return null!=b?b:r.trim(r.text(a)).replace(ob," ")}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type,g=f?null:[],h=f?e+1:d.length,i=e<0?h:f?e:0;i<h;i++)if(c=d[i],(c.selected||i===e)&&!c.disabled&&(!c.parentNode.disabled||!r.nodeName(c.parentNode,"optgroup"))){if(b=r(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=r.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=r.inArray(r.valHooks.option.get(d),f)>-1)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),r.each(["radio","checkbox"],function(){r.valHooks[this]={set:function(a,b){if(r.isArray(b))return a.checked=r.inArray(r(a).val(),b)>-1}},o.checkOn||(r.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var pb=/^(?:focusinfocus|focusoutblur)$/;r.extend(r.event,{trigger:function(b,c,e,f){var g,h,i,j,k,m,n,o=[e||d],p=l.call(b,"type")?b.type:b,q=l.call(b,"namespace")?b.namespace.split("."):[];if(h=i=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!pb.test(p+r.event.triggered)&&(p.indexOf(".")>-1&&(q=p.split("."),p=q.shift(),q.sort()),k=p.indexOf(":")<0&&"on"+p,b=b[r.expando]?b:new r.Event(p,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=q.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:r.makeArray(c,[b]),n=r.event.special[p]||{},f||!n.trigger||n.trigger.apply(e,c)!==!1)){if(!f&&!n.noBubble&&!r.isWindow(e)){for(j=n.delegateType||p,pb.test(j+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),i=h;i===(e.ownerDocument||d)&&o.push(i.defaultView||i.parentWindow||a)}g=0;while((h=o[g++])&&!b.isPropagationStopped())b.type=g>1?j:n.bindType||p,m=(V.get(h,"events")||{})[b.type]&&V.get(h,"handle"),m&&m.apply(h,c),m=k&&h[k],m&&m.apply&&T(h)&&(b.result=m.apply(h,c),b.result===!1&&b.preventDefault());return b.type=p,f||b.isDefaultPrevented()||n._default&&n._default.apply(o.pop(),c)!==!1||!T(e)||k&&r.isFunction(e[p])&&!r.isWindow(e)&&(i=e[k],i&&(e[k]=null),r.event.triggered=p,e[p](),r.event.triggered=void 0,i&&(e[k]=i)),b.result}},simulate:function(a,b,c){var d=r.extend(new r.Event,c,{type:a,isSimulated:!0});r.event.trigger(d,null,b)}}),r.fn.extend({trigger:function(a,b){return this.each(function(){r.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];if(c)return r.event.trigger(a,b,c,!0)}}),r.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(a,b){r.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),r.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),o.focusin="onfocusin"in a,o.focusin||r.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){r.event.simulate(b,a.target,r.event.fix(a))};r.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=V.access(d,b);e||d.addEventListener(a,c,!0),V.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=V.access(d,b)-1;e?V.access(d,b,e):(d.removeEventListener(a,c,!0),V.remove(d,b))}}});var qb=a.location,rb=r.now(),sb=/\?/;r.parseXML=function(b){var c;if(!b||"string"!=typeof b)return null;try{c=(new a.DOMParser).parseFromString(b,"text/xml")}catch(d){c=void 0}return c&&!c.getElementsByTagName("parsererror").length||r.error("Invalid XML: "+b),c};var tb=/\[\]$/,ub=/\r?\n/g,vb=/^(?:submit|button|image|reset|file)$/i,wb=/^(?:input|select|textarea|keygen)/i;function xb(a,b,c,d){var e;if(r.isArray(b))r.each(b,function(b,e){c||tb.test(a)?d(a,e):xb(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==r.type(b))d(a,b);else for(e in b)xb(a+"["+e+"]",b[e],c,d)}r.param=function(a,b){var c,d=[],e=function(a,b){var c=r.isFunction(b)?b():b;d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(null==c?"":c)};if(r.isArray(a)||a.jquery&&!r.isPlainObject(a))r.each(a,function(){e(this.name,this.value)});else for(c in a)xb(c,a[c],b,e);return d.join("&")},r.fn.extend({serialize:function(){return r.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=r.prop(this,"elements");return a?r.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!r(this).is(":disabled")&&wb.test(this.nodeName)&&!vb.test(a)&&(this.checked||!ha.test(a))}).map(function(a,b){var c=r(this).val();return null==c?null:r.isArray(c)?r.map(c,function(a){return{name:b.name,value:a.replace(ub,"\r\n")}}):{name:b.name,value:c.replace(ub,"\r\n")}}).get()}});var yb=/%20/g,zb=/#.*$/,Ab=/([?&])_=[^&]*/,Bb=/^(.*?):[ \t]*([^\r\n]*)$/gm,Cb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Db=/^(?:GET|HEAD)$/,Eb=/^\/\//,Fb={},Gb={},Hb="*/".concat("*"),Ib=d.createElement("a");Ib.href=qb.href;function Jb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(K)||[];if(r.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Kb(a,b,c,d){var e={},f=a===Gb;function g(h){var i;return e[h]=!0,r.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Lb(a,b){var c,d,e=r.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&r.extend(!0,a,d),a}function Mb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}if(f)return f!==i[0]&&i.unshift(f),c[f]}function Nb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}r.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:qb.href,type:"GET",isLocal:Cb.test(qb.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Hb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":r.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Lb(Lb(a,r.ajaxSettings),b):Lb(r.ajaxSettings,a)},ajaxPrefilter:Jb(Fb),ajaxTransport:Jb(Gb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var e,f,g,h,i,j,k,l,m,n,o=r.ajaxSetup({},c),p=o.context||o,q=o.context&&(p.nodeType||p.jquery)?r(p):r.event,s=r.Deferred(),t=r.Callbacks("once memory"),u=o.statusCode||{},v={},w={},x="canceled",y={readyState:0,getResponseHeader:function(a){var b;if(k){if(!h){h={};while(b=Bb.exec(g))h[b[1].toLowerCase()]=b[2]}b=h[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return k?g:null},setRequestHeader:function(a,b){return null==k&&(a=w[a.toLowerCase()]=w[a.toLowerCase()]||a,v[a]=b),this},overrideMimeType:function(a){return null==k&&(o.mimeType=a),this},statusCode:function(a){var b;if(a)if(k)y.always(a[y.status]);else for(b in a)u[b]=[u[b],a[b]];return this},abort:function(a){var b=a||x;return e&&e.abort(b),A(0,b),this}};if(s.promise(y),o.url=((b||o.url||qb.href)+"").replace(Eb,qb.protocol+"//"),o.type=c.method||c.type||o.method||o.type,o.dataTypes=(o.dataType||"*").toLowerCase().match(K)||[""],null==o.crossDomain){j=d.createElement("a");try{j.href=o.url,j.href=j.href,o.crossDomain=Ib.protocol+"//"+Ib.host!=j.protocol+"//"+j.host}catch(z){o.crossDomain=!0}}if(o.data&&o.processData&&"string"!=typeof o.data&&(o.data=r.param(o.data,o.traditional)),Kb(Fb,o,c,y),k)return y;l=r.event&&o.global,l&&0===r.active++&&r.event.trigger("ajaxStart"),o.type=o.type.toUpperCase(),o.hasContent=!Db.test(o.type),f=o.url.replace(zb,""),o.hasContent?o.data&&o.processData&&0===(o.contentType||"").indexOf("application/x-www-form-urlencoded")&&(o.data=o.data.replace(yb,"+")):(n=o.url.slice(f.length),o.data&&(f+=(sb.test(f)?"&":"?")+o.data,delete o.data),o.cache===!1&&(f=f.replace(Ab,""),n=(sb.test(f)?"&":"?")+"_="+rb++ +n),o.url=f+n),o.ifModified&&(r.lastModified[f]&&y.setRequestHeader("If-Modified-Since",r.lastModified[f]),r.etag[f]&&y.setRequestHeader("If-None-Match",r.etag[f])),(o.data&&o.hasContent&&o.contentType!==!1||c.contentType)&&y.setRequestHeader("Content-Type",o.contentType),y.setRequestHeader("Accept",o.dataTypes[0]&&o.accepts[o.dataTypes[0]]?o.accepts[o.dataTypes[0]]+("*"!==o.dataTypes[0]?", "+Hb+"; q=0.01":""):o.accepts["*"]);for(m in o.headers)y.setRequestHeader(m,o.headers[m]);if(o.beforeSend&&(o.beforeSend.call(p,y,o)===!1||k))return y.abort();if(x="abort",t.add(o.complete),y.done(o.success),y.fail(o.error),e=Kb(Gb,o,c,y)){if(y.readyState=1,l&&q.trigger("ajaxSend",[y,o]),k)return y;o.async&&o.timeout>0&&(i=a.setTimeout(function(){y.abort("timeout")},o.timeout));try{k=!1,e.send(v,A)}catch(z){if(k)throw z;A(-1,z)}}else A(-1,"No Transport");function A(b,c,d,h){var j,m,n,v,w,x=c;k||(k=!0,i&&a.clearTimeout(i),e=void 0,g=h||"",y.readyState=b>0?4:0,j=b>=200&&b<300||304===b,d&&(v=Mb(o,y,d)),v=Nb(o,v,y,j),j?(o.ifModified&&(w=y.getResponseHeader("Last-Modified"),w&&(r.lastModified[f]=w),w=y.getResponseHeader("etag"),w&&(r.etag[f]=w)),204===b||"HEAD"===o.type?x="nocontent":304===b?x="notmodified":(x=v.state,m=v.data,n=v.error,j=!n)):(n=x,!b&&x||(x="error",b<0&&(b=0))),y.status=b,y.statusText=(c||x)+"",j?s.resolveWith(p,[m,x,y]):s.rejectWith(p,[y,x,n]),y.statusCode(u),u=void 0,l&&q.trigger(j?"ajaxSuccess":"ajaxError",[y,o,j?m:n]),t.fireWith(p,[y,x]),l&&(q.trigger("ajaxComplete",[y,o]),--r.active||r.event.trigger("ajaxStop")))}return y},getJSON:function(a,b,c){return r.get(a,b,c,"json")},getScript:function(a,b){return r.get(a,void 0,b,"script")}}),r.each(["get","post"],function(a,b){r[b]=function(a,c,d,e){return r.isFunction(c)&&(e=e||d,d=c,c=void 0),r.ajax(r.extend({url:a,type:b,dataType:e,data:c,success:d},r.isPlainObject(a)&&a))}}),r._evalUrl=function(a){return r.ajax({url:a,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,"throws":!0})},r.fn.extend({wrapAll:function(a){var b;return this[0]&&(r.isFunction(a)&&(a=a.call(this[0])),b=r(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this},wrapInner:function(a){return r.isFunction(a)?this.each(function(b){r(this).wrapInner(a.call(this,b))}):this.each(function(){var b=r(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=r.isFunction(a);return this.each(function(c){r(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(a){return this.parent(a).not("body").each(function(){r(this).replaceWith(this.childNodes)}),this}}),r.expr.pseudos.hidden=function(a){return!r.expr.pseudos.visible(a)},r.expr.pseudos.visible=function(a){return!!(a.offsetWidth||a.offsetHeight||a.getClientRects().length)},r.ajaxSettings.xhr=function(){try{return new a.XMLHttpRequest}catch(b){}};var Ob={0:200,1223:204},Pb=r.ajaxSettings.xhr();o.cors=!!Pb&&"withCredentials"in Pb,o.ajax=Pb=!!Pb,r.ajaxTransport(function(b){var c,d;if(o.cors||Pb&&!b.crossDomain)return{send:function(e,f){var g,h=b.xhr();if(h.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(g in b.xhrFields)h[g]=b.xhrFields[g];b.mimeType&&h.overrideMimeType&&h.overrideMimeType(b.mimeType),b.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");for(g in e)h.setRequestHeader(g,e[g]);c=function(a){return function(){c&&(c=d=h.onload=h.onerror=h.onabort=h.onreadystatechange=null,"abort"===a?h.abort():"error"===a?"number"!=typeof h.status?f(0,"error"):f(h.status,h.statusText):f(Ob[h.status]||h.status,h.statusText,"text"!==(h.responseType||"text")||"string"!=typeof h.responseText?{binary:h.response}:{text:h.responseText},h.getAllResponseHeaders()))}},h.onload=c(),d=h.onerror=c("error"),void 0!==h.onabort?h.onabort=d:h.onreadystatechange=function(){4===h.readyState&&a.setTimeout(function(){c&&d()})},c=c("abort");try{h.send(b.hasContent&&b.data||null)}catch(i){if(c)throw i}},abort:function(){c&&c()}}}),r.ajaxPrefilter(function(a){a.crossDomain&&(a.contents.script=!1)}),r.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return r.globalEval(a),a}}}),r.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),r.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(e,f){b=r("<script>").prop({charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&f("error"===a.type?404:200,a.type)}),d.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Qb=[],Rb=/(=)\?(?=&|$)|\?\?/;r.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Qb.pop()||r.expando+"_"+rb++;return this[a]=!0,a}}),r.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Rb.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Rb.test(b.data)&&"data");if(h||"jsonp"===b.dataTypes[0])return e=b.jsonpCallback=r.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Rb,"$1"+e):b.jsonp!==!1&&(b.url+=(sb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||r.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?r(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Qb.push(e)),g&&r.isFunction(f)&&f(g[0]),g=f=void 0}),"script"}),o.createHTMLDocument=function(){var a=d.implementation.createHTMLDocument("").body;return a.innerHTML="<form></form><form></form>",2===a.childNodes.length}(),r.parseHTML=function(a,b,c){if("string"!=typeof a)return[];"boolean"==typeof b&&(c=b,b=!1);var e,f,g;return b||(o.createHTMLDocument?(b=d.implementation.createHTMLDocument(""),e=b.createElement("base"),e.href=d.location.href,b.head.appendChild(e)):b=d),f=B.exec(a),g=!c&&[],f?[b.createElement(f[1])]:(f=oa([a],b,g),g&&g.length&&r(g).remove(),r.merge([],f.childNodes))},r.fn.load=function(a,b,c){var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=r.trim(a.slice(h)),a=a.slice(0,h)),r.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&r.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?r("<div>").append(r.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(this,f||[a.responseText,b,a])})}),this},r.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){r.fn[b]=function(a){return this.on(b,a)}}),r.expr.pseudos.animated=function(a){return r.grep(r.timers,function(b){return a===b.elem}).length};function Sb(a){return r.isWindow(a)?a:9===a.nodeType&&a.defaultView}r.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=r.css(a,"position"),l=r(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=r.css(a,"top"),i=r.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),r.isFunction(b)&&(b=b.call(a,c,r.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},r.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){r.offset.setOffset(this,a,b)});var b,c,d,e,f=this[0];if(f)return f.getClientRects().length?(d=f.getBoundingClientRect(),d.width||d.height?(e=f.ownerDocument,c=Sb(e),b=e.documentElement,{top:d.top+c.pageYOffset-b.clientTop,left:d.left+c.pageXOffset-b.clientLeft}):d):{top:0,left:0}},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===r.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),r.nodeName(a[0],"html")||(d=a.offset()),d={top:d.top+r.css(a[0],"borderTopWidth",!0),left:d.left+r.css(a[0],"borderLeftWidth",!0)}),{top:b.top-d.top-r.css(c,"marginTop",!0),left:b.left-d.left-r.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&"static"===r.css(a,"position"))a=a.offsetParent;return a||pa})}}),r.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c="pageYOffset"===b;r.fn[a]=function(d){return S(this,function(a,d,e){var f=Sb(a);return void 0===e?f?f[b]:a[d]:void(f?f.scrollTo(c?f.pageXOffset:e,c?e:f.pageYOffset):a[d]=e)},a,d,arguments.length)}}),r.each(["top","left"],function(a,b){r.cssHooks[b]=Na(o.pixelPosition,function(a,c){if(c)return c=Ma(a,b),Ka.test(c)?r(a).position()[b]+"px":c})}),r.each({Height:"height",Width:"width"},function(a,b){r.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){r.fn[d]=function(e,f){var g=arguments.length&&(c||"boolean"!=typeof e),h=c||(e===!0||f===!0?"margin":"border");return S(this,function(b,c,e){var f;return r.isWindow(b)?0===d.indexOf("outer")?b["inner"+a]:b.document.documentElement["client"+a]:9===b.nodeType?(f=b.documentElement,Math.max(b.body["scroll"+a],f["scroll"+a],b.body["offset"+a],f["offset"+a],f["client"+a])):void 0===e?r.css(b,c,h):r.style(b,c,e,h)},b,g?e:void 0,g)}})}),r.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}}),r.parseJSON=JSON.parse,"function"==typeof define&&define.amd&&define("jquery",[],function(){return r});var Tb=a.jQuery,Ub=a.$;return r.noConflict=function(b){return a.$===r&&(a.$=Ub),b&&a.jQuery===r&&(a.jQuery=Tb),r},b||(a.jQuery=a.$=r),r});
/**
 * @license jCanvas v16.06.06
 * Copyright 2016 Caleb Evans
 * Released under the MIT license
 */

(function( jQuery, global, factory ) {

	if ( typeof module === 'object' && typeof module.exports === 'object' ) {
		module.exports = function( jQuery, w ) {
			return factory( jQuery, w );
		};
	} else {
		factory( jQuery, global );
	}

// Pass this if window is not defined yet
}( typeof window !== 'undefined' ? window.jQuery : {}, typeof window !== 'undefined' ? window : this, function( $, window ) {

var document = window.document,
    Image = window.Image,
    Array = window.Array,
    getComputedStyle = window.getComputedStyle,
    Math = window.Math,
	Number = window.Number,
    parseFloat = window.parseFloat,
    TRUE = true,
    FALSE = false,
    NULL = null,
	// jshint -W080
    UNDEFINED = undefined;

// Define local aliases to frequently used properties
var defaults,
	// Aliases to jQuery methods
	extendObject = $.extend,
	inArray = $.inArray,
	typeOf = function ( operand ) {
		return Object.prototype.toString.call( operand )
			.slice( 8, -1 ).toLowerCase();
	},
	isFunction = $.isFunction,
	isPlainObject = $.isPlainObject,
	// Math constants and functions
	PI = Math.PI,
	round = Math.round,
	abs = Math.abs,
	sin = Math.sin,
	cos = Math.cos,
	atan2 = Math.atan2,
	// The Array slice() method
	arraySlice = Array.prototype.slice,
	// jQuery's internal event normalization function
	jQueryEventFix = $.event.fix,
	// Object for storing a number of internal property maps
	maps = {},
	// jQuery internal caches
	caches = {
		dataCache: {},
		propCache: {},
		imageCache: {}
	},
	// Base transformations
	baseTransforms = {
		rotate: 0,
		scaleX: 1,
		scaleY: 1,
		translateX: 0,
		translateY: 0,
		// Store all previous masks
		masks: []
	},
	// Object for storing CSS-related properties
	css = {},
	tangibleEvents = [
		'mousedown',
		'mousemove',
		'mouseup',
		'mouseover',
		'mouseout',
		'touchstart',
		'touchmove',
		'touchend'
	];

// Constructor for creating objects that inherit from jCanvas preferences and defaults
function jCanvasObject( args ) {
	var params = this,
		propName;
	// Copy the given parameters into new object
	for ( propName in args ) {
		// Do not merge defaults into parameters
		if ( args.hasOwnProperty( propName ) ) {
			params[ propName ] = args[ propName ];
		}
	}
	return params;
}

// jCanvas object in which global settings are other data are stored
var jCanvas = {
	// Events object for storing jCanvas event initiation functions
	events: {},
	// Object containing all jCanvas event hooks
	eventHooks: {},
	// Settings for enabling future jCanvas features
	future: {}
};

// jCanvas default property values
function jCanvasDefaults() {
	extendObject( this, jCanvasDefaults.baseDefaults );
}
jCanvasDefaults.baseDefaults = {
	align: 'center',
	arrowAngle: 90,
	arrowRadius: 0,
	autosave: TRUE,
	baseline: 'middle',
	bringToFront: FALSE,
	ccw: FALSE,
	closed: FALSE,
	compositing: 'source-over',
	concavity: 0,
	cornerRadius: 0,
	count: 1,
	cropFromCenter: TRUE,
	crossOrigin: NULL,
	cursors: NULL,
	disableEvents: FALSE,
	draggable: FALSE,
	dragGroups: NULL,
	groups: NULL,
	data: NULL,
	dx: NULL,
	dy: NULL,
	end: 360,
	eventX: NULL,
	eventY: NULL,
	fillStyle: 'transparent',
	fontStyle: 'normal',
	fontSize: '12pt',
	fontFamily: 'sans-serif',
	fromCenter: TRUE,
	height: NULL,
	imageSmoothing: TRUE,
	inDegrees: TRUE,
	intangible: FALSE,
	index: NULL,
	letterSpacing: NULL,
	lineHeight: 1,
	layer: FALSE,
	mask: FALSE,
	maxWidth: NULL,
	miterLimit: 10,
	name: NULL,
	opacity: 1,
	r1: NULL,
	r2: NULL,
	radius: 0,
	repeat: 'repeat',
	respectAlign: FALSE,
	restrictDragToAxis: null,
	rotate: 0,
	rounded: FALSE,
	scale: 1,
	scaleX: 1,
	scaleY: 1,
	shadowBlur: 0,
	shadowColor: 'transparent',
	shadowStroke: FALSE,
	shadowX: 0,
	shadowY: 0,
	sHeight: NULL,
	sides: 0,
	source: '',
	spread: 0,
	start: 0,
	strokeCap: 'butt',
	strokeDash: NULL,
	strokeDashOffset: 0,
	strokeJoin: 'miter',
	strokeStyle: 'transparent',
	strokeWidth: 1,
	sWidth: NULL,
	sx: NULL,
	sy: NULL,
	text: '',
	translate: 0,
	translateX: 0,
	translateY: 0,
	type: NULL,
	visible: TRUE,
	width: NULL,
	x: 0,
	y: 0
};
defaults = new jCanvasDefaults();
jCanvasObject.prototype = defaults;

/* Internal helper methods */

// Determines if the given operand is a string
function isString( operand ) {
	return ( typeOf( operand ) === 'string' );
}

// Determines if the given operand is numeric
function isNumeric( operand ) {
	return !isNaN( Number( operand ) ) && !isNaN( parseFloat( operand ) );
}

// Get 2D context for the given canvas
function _getContext( canvas ) {
	return ( canvas && canvas.getContext ? canvas.getContext( '2d' ) : NULL );
}

// Coerce designated number properties from strings to numbers
function _coerceNumericProps( props ) {
	var propName, propType, propValue;
	// Loop through all properties in given property map
	for ( propName in props ) {
		if ( props.hasOwnProperty( propName ) ) {
			propValue = props[ propName ];
			propType = typeOf( propValue );
			// If property is non-empty string and value is numeric
			if ( propType === 'string' && isNumeric( propValue ) && propName !== 'text' ) {
				// Convert value to number
				props[ propName ] = parseFloat( propValue );
			}
		}
	}
	// Ensure value of text property is always a string
	if ( props.text !== undefined ) {
		props.text = String(props.text);
	}
}

// Clone the given transformations object
function _cloneTransforms( transforms ) {
	// Clone the object itself
	transforms = extendObject( {}, transforms );
	// Clone the object's masks array
	transforms.masks = transforms.masks.slice( 0 );
	return transforms;
}

// Save canvas context and update transformation stack
function _saveCanvas( ctx, data ) {
	var transforms;
	ctx.save();
	transforms = _cloneTransforms( data.transforms );
	data.savedTransforms.push( transforms );
}

// Restore canvas context update transformation stack
function _restoreCanvas( ctx, data ) {
	if ( data.savedTransforms.length === 0 ) {
		// Reset transformation state if it can't be restored any more
		data.transforms = _cloneTransforms( baseTransforms );
	} else {
		// Restore canvas context
		ctx.restore();
		// Restore current transform state to the last saved state
		data.transforms = data.savedTransforms.pop();
	}
}

// Set the style with the given name
function _setStyle( canvas, ctx, params, styleName ) {
	if ( params[ styleName ] ) {
		if ( isFunction( params[ styleName ] ) ) {
			// Handle functions
			ctx[ styleName ] = params[ styleName ].call( canvas, params );
		} else {
			// Handle string values
			ctx[ styleName ] = params[ styleName ];
		}
	}
}

// Set canvas context properties
function _setGlobalProps( canvas, ctx, params ) {
	_setStyle( canvas, ctx, params, 'fillStyle' );
	_setStyle( canvas, ctx, params, 'strokeStyle' );
	ctx.lineWidth = params.strokeWidth;
	// Optionally round corners for paths
	if ( params.rounded ) {
		ctx.lineCap = ctx.lineJoin = 'round';
	} else {
		ctx.lineCap = params.strokeCap;
		ctx.lineJoin = params.strokeJoin;
		ctx.miterLimit = params.miterLimit;
	}
	// Reset strokeDash if null
	if ( !params.strokeDash ) {
		params.strokeDash = [];
	}
	// Dashed lines
	if ( ctx.setLineDash ) {
		ctx.setLineDash( params.strokeDash );
	}
	ctx.webkitLineDash = params.strokeDash;
	ctx.lineDashOffset = ctx.webkitLineDashOffset = ctx.mozDashOffset = params.strokeDashOffset;
	// Drop shadow
	ctx.shadowOffsetX = params.shadowX;
	ctx.shadowOffsetY = params.shadowY;
	ctx.shadowBlur = params.shadowBlur;
	ctx.shadowColor = params.shadowColor;
	// Opacity and composite operation
	ctx.globalAlpha = params.opacity;
	ctx.globalCompositeOperation = params.compositing;
	// Support cross-browser toggling of image smoothing
	if ( params.imageSmoothing ) {
		ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = params.imageSmoothingEnabled;
	}
}

// Optionally enable masking support for this path
function _enableMasking( ctx, data, params ) {
	if ( params.mask ) {
		// If jCanvas autosave is enabled
		if ( params.autosave ) {
			// Automatically save transformation state by default
			_saveCanvas( ctx, data );
		}
		// Clip the current path
		ctx.clip();
		// Keep track of current masks
		data.transforms.masks.push( params._args );
	}
}

// Restore individual shape transformation
function _restoreTransform( ctx, params ) {
	// If shape has been transformed by jCanvas
	if ( params._transformed ) {
		// Restore canvas context
		ctx.restore();
	}
}

// Close current canvas path
function _closePath( canvas, ctx, params ) {
	var data;

	// Optionally close path
	if ( params.closed ) {
		ctx.closePath();
	}

	if ( params.shadowStroke && params.strokeWidth !== 0 ) {
		// Extend the shadow to include the stroke of a drawing

		// Add a stroke shadow by stroking before filling
		ctx.stroke();
		ctx.fill();
		// Ensure the below stroking does not inherit a shadow
		ctx.shadowColor = 'transparent';
		ctx.shadowBlur = 0;
		// Stroke over fill as usual
		ctx.stroke();

	} else {
		// If shadowStroke is not enabled, stroke & fill as usual

		ctx.fill();
		// Prevent extra shadow created by stroke ( but only when fill is present )
		if ( params.fillStyle !== 'transparent' ) {
			ctx.shadowColor = 'transparent';
		}
		if ( params.strokeWidth !== 0 ) {
			// Only stroke if the stroke is not 0
			ctx.stroke();
		}

	}

	// Optionally close path
	if ( !params.closed ) {
		ctx.closePath();
	}

	// Restore individual shape transformation
	_restoreTransform( ctx, params );

	// Mask shape if chosen
	if ( params.mask ) {
		// Retrieve canvas data
		data = _getCanvasData( canvas );
		_enableMasking( ctx, data, params );
	}

}

// Transform ( translate, scale, or rotate ) shape
function _transformShape( canvas, ctx, params, width, height ) {

	// Get conversion factor for radians
	params._toRad = ( params.inDegrees ? ( PI / 180 ) : 1 );

	params._transformed = TRUE;
	ctx.save();

	// Optionally measure ( x, y ) position from top-left corner
	if ( !params.fromCenter && !params._centered && width !== UNDEFINED ) {
		// Always draw from center unless otherwise specified
		if ( height === UNDEFINED ) {
			height = width;
		}
		params.x += width / 2;
		params.y += height / 2;
		params._centered = TRUE;
	}
	// Optionally rotate shape
	if ( params.rotate ) {
		_rotateCanvas( ctx, params, NULL );
	}
	// Optionally scale shape
	if ( params.scale !== 1 || params.scaleX !== 1 || params.scaleY !== 1 ) {
		_scaleCanvas( ctx, params, NULL );
	}
	// Optionally translate shape
	if ( params.translate || params.translateX || params.translateY ) {
		_translateCanvas( ctx, params, NULL );
	}

}

/* Plugin API */

// Extend jCanvas with a user-defined method
jCanvas.extend = function extend( plugin ) {

	// Create plugin
	if ( plugin.name ) {
		// Merge properties with defaults
		if ( plugin.props ) {
			extendObject( defaults, plugin.props );
		}
		// Define plugin method
		$.fn[ plugin.name ] = function self( args ) {
			var $canvases = this, canvas, e, ctx,
				params, layer;

			for ( e = 0; e < $canvases.length; e += 1 ) {
				canvas = $canvases[ e ];
				ctx = _getContext( canvas );
				if ( ctx ) {

					params = new jCanvasObject( args );
					layer = _addLayer( canvas, params, args, self );

					_setGlobalProps( canvas, ctx, params );
					plugin.fn.call( canvas, ctx, params );

				}
			}
			return $canvases;
		};
		// Add drawing type to drawing map
		if ( plugin.type ) {
			maps.drawings[ plugin.type ] = plugin.name;
		}
	}
	return $.fn[ plugin.name ];
};

/* Layer API */

// Retrieved the stored jCanvas data for a canvas element
function _getCanvasData( canvas ) {
	var dataCache = caches.dataCache, data;
	if ( dataCache._canvas === canvas && dataCache._data ) {

		// Retrieve canvas data from cache if possible
		data = dataCache._data;

	} else {

		// Retrieve canvas data from jQuery's internal data storage
		data = $.data( canvas, 'jCanvas' );
		if ( !data ) {

			// Create canvas data object if it does not already exist
			data = {
				// The associated canvas element
				canvas: canvas,
				// Layers array
				layers: [],
				// Layer maps
				layer: {
					names: {},
					groups: {}
				},
				eventHooks: {},
				// All layers that intersect with the event coordinates ( regardless of visibility )
				intersecting: [],
				// The topmost layer whose area contains the event coordinates
				lastIntersected: NULL,
				cursor: $( canvas ).css( 'cursor' ),
				// Properties for the current drag event
				drag: {
					layer: NULL,
					dragging: FALSE
				},
				// Data for the current event
				event: {
					type: NULL,
					x: NULL,
					y: NULL
				},
				// Events which already have been bound to the canvas
				events: {},
				// The canvas's current transformation state
				transforms: _cloneTransforms( baseTransforms ),
				savedTransforms: [],
				// Whether a layer is being animated or not
				animating: FALSE,
				// The layer currently being animated
				animated: NULL,
				// The device pixel ratio
				pixelRatio: 1,
				// Whether pixel ratio transformations have been applied
				scaled: FALSE
			};
			// Use jQuery to store canvas data
			$.data( canvas, 'jCanvas', data );

		}
		// Cache canvas data for faster retrieval
		dataCache._canvas = canvas;
		dataCache._data = data;

	}
	return data;
}

// Initialize all of a layer's associated jCanvas events
function _addLayerEvents( $canvas, data, layer ) {
	var eventName;
	// Determine which jCanvas events need to be bound to this layer
	for ( eventName in jCanvas.events ) {
		if ( jCanvas.events.hasOwnProperty( eventName ) ) {
			// If layer has callback function to complement it
			if ( layer[ eventName ] || ( layer.cursors && layer.cursors[ eventName ] ) ) {
				// Bind event to layer
				_addLayerEvent( $canvas, data, layer, eventName );
			}
		}
	}
	if ( !data.events.mouseout ) {
		$canvas.bind( 'mouseout.jCanvas', function () {
			// Retrieve the layer whose drag event was canceled
			var layer = data.drag.layer, l;
			// If cursor mouses out of canvas while dragging
			if ( layer ) {
				// Cancel drag
				data.drag = {};
				_triggerLayerEvent( $canvas, data, layer, 'dragcancel' );
			}
			// Loop through all layers
			for (l = 0; l < data.layers.length; l += 1) {
				layer = data.layers[l];
				// If layer thinks it's still being moused over
				if ( layer._hovered ) {
					// Trigger mouseout on layer
					$canvas.triggerLayerEvent( data.layers[l], 'mouseout' );
				}
			}
			// Redraw layers
			$canvas.drawLayers();
		} );
		// Indicate that an event handler has been bound
		data.events.mouseout = TRUE;
	}
}

// Initialize the given event on the given layer
function _addLayerEvent( $canvas, data, layer, eventName ) {
	// Use touch events if appropriate
	// eventName = _getMouseEventName( eventName );
	// Bind event to layer
	jCanvas.events[ eventName ]( $canvas, data );
	layer._event = TRUE;
}

// Enable drag support for this layer
function _enableDrag( $canvas, data, layer ) {
	var dragHelperEvents, eventName, i;
	// Only make layer draggable if necessary
	if ( layer.draggable || layer.cursors ) {

		// Organize helper events which enable drag support
		dragHelperEvents = [ 'mousedown', 'mousemove', 'mouseup' ];

		// Bind each helper event to the canvas
		for ( i = 0; i < dragHelperEvents.length; i += 1 ) {
			// Use touch events if appropriate
			eventName = dragHelperEvents[ i ];
			// Bind event
			_addLayerEvent( $canvas, data, layer, eventName );
		}
		// Indicate that this layer has events bound to it
		layer._event = TRUE;

	}
}

// Update a layer property map if property is changed
function _updateLayerName( $canvas, data, layer, props ) {
	var nameMap = data.layer.names;

	// If layer name is being added, not changed
	if ( !props ) {

		props = layer;

	} else {

		// Remove old layer name entry because layer name has changed
		if ( props.name !== UNDEFINED && isString( layer.name ) && layer.name !== props.name ) {
			delete nameMap[ layer.name ];
		}

	}

	// Add new entry to layer name map with new name
	if ( isString( props.name ) ) {
		nameMap[ props.name ] = layer;
	}
}

// Create or update the data map for the given layer and group type
function _updateLayerGroups( $canvas, data, layer, props ) {
	var groupMap = data.layer.groups,
		group, groupName, g,
		index, l;

	// If group name is not changing
	if ( !props ) {

		props = layer;

	} else {

		// Remove layer from all of its associated groups
		if ( props.groups !== UNDEFINED && layer.groups !== NULL ) {
			for ( g = 0; g < layer.groups.length; g += 1 ) {
				groupName = layer.groups[ g ];
				group = groupMap[ groupName ];
				if ( group ) {
					// Remove layer from its old layer group entry
					for ( l = 0; l < group.length; l += 1 ) {
						if ( group[ l ] === layer ) {
							// Keep track of the layer's initial index
							index = l;
							// Remove layer once found
							group.splice( l, 1 );
							break;
						}
					}
					// Remove layer group entry if group is empty
					if ( group.length === 0 ) {
						delete groupMap[ groupName ];
					}
				}
			}
		}

	}

	// Add layer to new group if a new group name is given
	if ( props.groups !== UNDEFINED && props.groups !== NULL ) {

		for ( g = 0; g < props.groups.length; g += 1 ) {

			groupName = props.groups[ g ];

			group = groupMap[ groupName ];
			if ( !group ) {
				// Create new group entry if it doesn't exist
				group = groupMap[ groupName ] = [];
				group.name = groupName;
			}
			if ( index === UNDEFINED ) {
				// Add layer to end of group unless otherwise stated
				index = group.length;
			}
			// Add layer to its new layer group
			group.splice( index, 0, layer );

		}

	}
}

// Get event hooks object for the first selected canvas
$.fn.getEventHooks = function getEventHooks() {
	var $canvases = this, canvas, data,
		eventHooks = {};

	if ( $canvases.length !== 0 ) {
		canvas = $canvases[ 0 ];
		data = _getCanvasData( canvas );
		eventHooks = data.eventHooks;
	}
	return eventHooks;
};

// Set event hooks for the selected canvases
$.fn.setEventHooks = function setEventHooks( eventHooks ) {
	var $canvases = this, $canvas, e,
		data;
	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );
		extendObject( data.eventHooks, eventHooks );
	}
	return $canvases;
};

// Get jCanvas layers array
$.fn.getLayers = function getLayers( callback ) {
	var $canvases = this, canvas, data,
		layers, layer, l,
		matching = [];

	if ( $canvases.length !== 0 ) {

		canvas = $canvases[ 0 ];
		data = _getCanvasData( canvas );
		// Retrieve layers array for this canvas
		layers = data.layers;

		// If a callback function is given
		if ( isFunction( callback ) ) {

			// Filter the layers array using the callback
			for ( l = 0; l < layers.length; l += 1 ) {
				layer = layers[ l ];
				if ( callback.call( canvas, layer ) ) {
					// Add layer to array of matching layers if test passes
					matching.push( layer );
				}
			}

		} else {
			// Otherwise, get all layers

			matching = layers;

		}

	}
	return matching;
};

// Get a single jCanvas layer object
$.fn.getLayer = function getLayer( layerId ) {
	var $canvases = this, canvas,
		data, layers, layer, l,
		idType;

	if ( $canvases.length !== 0 ) {

		canvas = $canvases[ 0 ];
		data = _getCanvasData( canvas );
		layers = data.layers;
		idType = typeOf( layerId );

		if ( layerId && layerId.layer ) {

			// Return the actual layer object if given
			layer = layerId;

		} else if ( idType === 'number' ) {

			// Retrieve the layer using the given index

			// Allow for negative indices
			if ( layerId < 0 ) {
				layerId = layers.length + layerId;
			}
			// Get layer with the given index
			layer = layers[ layerId ];

		} else if ( idType === 'regexp' ) {

			// Get layer with the name that matches the given regex
			for ( l = 0; l < layers.length; l += 1 ) {
				// Check if layer matches name
				if ( isString( layers[ l ].name ) && layers[ l ].name.match( layerId ) ) {
					layer = layers[ l ];
					break;
				}
			}

		} else {

			// Get layer with the given name
			layer = data.layer.names[ layerId ];

		}

	}
	return layer;
};

// Get all layers in the given group
$.fn.getLayerGroup = function getLayerGroup( groupId ) {
	var $canvases = this, canvas, data,
		groups, groupName, group,
		idType = typeOf( groupId );

	if ( $canvases.length !== 0 ) {

		canvas = $canvases[ 0 ];

		if ( idType === 'array' ) {

			// Return layer group if given
			group = groupId;

		} else if ( idType === 'regexp' ) {

			// Get canvas data
			data = _getCanvasData( canvas );
			groups = data.layer.groups;
			// Loop through all layers groups for this canvas
			for ( groupName in groups ) {
				// Find a group whose name matches the given regex
				if ( groupName.match( groupId ) ) {
					group = groups[ groupName ];
					// Stop after finding the first matching group
					break;
				}
			}

		} else {

			// Find layer group with the given group name
			data = _getCanvasData( canvas );
			group = data.layer.groups[ groupId ];
		}

	}
	return group;
};

// Get index of layer in layers array
$.fn.getLayerIndex = function getLayerIndex( layerId ) {
	var $canvases = this,
		layers = $canvases.getLayers(),
		layer = $canvases.getLayer( layerId );

	return inArray( layer, layers );
};

// Set properties of a layer
$.fn.setLayer = function setLayer( layerId, props ) {
	var $canvases = this, $canvas, e,
		data, layer,
		propName, propValue, propType;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );

		layer = $( $canvases[ e ] ).getLayer( layerId );
		if ( layer ) {

			// Update layer property maps
			_updateLayerName( $canvas, data, layer, props );
			_updateLayerGroups( $canvas, data, layer, props );

			_coerceNumericProps( props );

			// Merge properties with layer
			for ( propName in props ) {
				if ( props.hasOwnProperty( propName ) ) {
					propValue = props[ propName ];
					propType = typeOf( propValue );
					if ( propType === 'object' && isPlainObject( propValue ) ) {
						// Clone objects
						layer[ propName ] = extendObject( {}, propValue );
						_coerceNumericProps( layer[ propName ] );
					} else if ( propType === 'array' ) {
						// Clone arrays
						layer[ propName ] = propValue.slice( 0 );
					} else if ( propType === 'string' ) {
						if ( propValue.indexOf( '+=' ) === 0 ) {
							// Increment numbers prefixed with +=
							layer[ propName ] += parseFloat( propValue.substr( 2 ) );
						} else if ( propValue.indexOf( '-=' ) === 0 ) {
							// Decrement numbers prefixed with -=
							layer[ propName ] -= parseFloat( propValue.substr( 2 ) );
						} else if ( !isNaN( propValue ) && isNumeric( propValue ) && propName !== 'text' ) {
							// Convert numeric values as strings to numbers
							layer[ propName ] = parseFloat( propValue );
						} else {
							// Otherwise, set given string value
							layer[ propName ] = propValue;
						}
					} else {
						// Otherwise, set given value
						layer[ propName ] = propValue;
					}
				}
			}

			// Update layer events
			_addLayerEvents( $canvas, data, layer );
			_enableDrag( $canvas, data, layer );

			// If layer's properties were changed
			if ( $.isEmptyObject( props ) === FALSE ) {
				_triggerLayerEvent( $canvas, data, layer, 'change', props );
			}

		}
	}
	return $canvases;
};

// Set properties of all layers ( optionally filtered by a callback )
$.fn.setLayers = function setLayers( props, callback ) {
	var $canvases = this, $canvas, e,
		layers, l;
	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );

		layers = $canvas.getLayers( callback );
		// Loop through all layers
		for ( l = 0; l < layers.length; l += 1 ) {
			// Set properties of each layer
			$canvas.setLayer( layers[ l ], props );
		}
	}
	return $canvases;
};

// Set properties of all layers in the given group
$.fn.setLayerGroup = function setLayerGroup( groupId, props ) {
	var $canvases = this, $canvas, e,
		group, l;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		// Get layer group
		$canvas = $( $canvases[ e ] );

		group = $canvas.getLayerGroup( groupId );
		// If group exists
		if ( group ) {

			// Loop through layers in group
			for ( l = 0; l < group.length; l += 1 ) {
				// Merge given properties with layer
				$canvas.setLayer( group[ l ], props );
			}

		}
	}
	return $canvases;
};

// Move a layer to the given index in the layers array
$.fn.moveLayer = function moveLayer( layerId, index ) {
	var $canvases = this, $canvas, e,
		data, layers, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );

		// Retrieve layers array and desired layer
		layers = data.layers;
		layer = $canvas.getLayer( layerId );
		if ( layer ) {

			// Ensure layer index is accurate
			layer.index = inArray( layer, layers );

			// Remove layer from its current placement
			layers.splice( layer.index, 1 );
			// Add layer in its new placement
			layers.splice( index, 0, layer );

			// Handle negative indices
			if ( index < 0 ) {
				index = layers.length + index;
			}
			// Update layer's stored index
			layer.index = index;

			_triggerLayerEvent( $canvas, data, layer, 'move' );

		}
	}
	return $canvases;
};

// Remove a jCanvas layer
$.fn.removeLayer = function removeLayer( layerId ) {
	var $canvases = this, $canvas, e, data,
		layers, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );

		// Retrieve layers array and desired layer
		layers = $canvas.getLayers();
		layer = $canvas.getLayer( layerId );
		// Remove layer if found
		if ( layer ) {

			// Ensure layer index is accurate
			layer.index = inArray( layer, layers );
			// Remove layer and allow it to be re-added later
			layers.splice( layer.index, 1 );
			delete layer._layer;

			// Update layer name map
			_updateLayerName( $canvas, data, layer, {
				name: NULL
			} );
			// Update layer group map
			_updateLayerGroups( $canvas, data, layer, {
				groups: NULL
			} );

			// Trigger 'remove' event
			_triggerLayerEvent( $canvas, data, layer, 'remove' );

		}
	}
	return $canvases;
};

// Remove all layers
$.fn.removeLayers = function removeLayers( callback ) {
	var $canvases = this, $canvas, e,
		data, layers, layer, l;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );
		layers = $canvas.getLayers( callback );
		// Remove all layers individually
		for ( l = 0; l < layers.length; l += 1 ) {
			layer = layers[ l ];
			$canvas.removeLayer( layer );
			// Ensure no layer is skipped over
			l -= 1;
		}
		// Update layer maps
		data.layer.names = {};
		data.layer.groups = {};
	}
	return $canvases;
};

// Remove all layers in the group with the given ID
$.fn.removeLayerGroup = function removeLayerGroup( groupId ) {
	var $canvases = this, $canvas, e, data,
		layers, group, l;

	if ( groupId !== UNDEFINED ) {
		for ( e = 0; e < $canvases.length; e += 1 ) {
			$canvas = $( $canvases[ e ] );
			data = _getCanvasData( $canvases[ e ] );

			layers = $canvas.getLayers();
			group = $canvas.getLayerGroup( groupId );
			// Remove layer group using given group name
			if ( group ) {

				// Clone groups array
				group = group.slice( 0 );

				// Loop through layers in group
				for ( l = 0; l < group.length; l += 1 ) {
					$canvas.removeLayer( group[ l ] );
				}

			}
		}
	}
	return $canvases;
};

// Add an existing layer to a layer group
$.fn.addLayerToGroup = function addLayerToGroup( layerId, groupName ) {
	var $canvases = this, $canvas, e,
		layer, groups = [ groupName ];

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		layer = $canvas.getLayer( layerId );

		// If layer is not already in group
		if ( layer.groups ) {
			// Clone groups list
			groups = layer.groups.slice( 0 );
			// If layer is not already in group
			if ( inArray( groupName, layer.groups ) === -1 ) {
				// Add layer to group
				groups.push( groupName );
			}
		}
		// Update layer group maps
		$canvas.setLayer( layer, {
			groups: groups
		} );

	}
	return $canvases;
};

// Remove an existing layer from a layer group
$.fn.removeLayerFromGroup = function removeLayerFromGroup( layerId, groupName ) {
	var $canvases = this, $canvas, e,
		layer, groups = [],
		index;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		layer = $canvas.getLayer( layerId );

		if ( layer.groups ) {

			// Find index of layer in group
			index = inArray( groupName, layer.groups );

			// If layer is in group
			if ( index !== -1 ) {

				// Clone groups list
				groups = layer.groups.slice( 0 );

				// Remove layer from group
				groups.splice( index, 1 );

				// Update layer group maps
				$canvas.setLayer( layer, {
					groups: groups
				} );

			}

		}

	}
	return $canvases;
};

// Get topmost layer that intersects with event coordinates
function _getIntersectingLayer( data ) {
	var layer, i,
		mask, m;

	// Store the topmost layer
	layer = NULL;

	// Get the topmost layer whose visible area intersects event coordinates
	for ( i = data.intersecting.length - 1; i >= 0; i -= 1 ) {

		// Get current layer
		layer = data.intersecting[ i ];

		// If layer has previous masks
		if ( layer._masks ) {

			// Search previous masks to ensure
			// layer is visible at event coordinates
			for ( m = layer._masks.length - 1; m >= 0; m -= 1 ) {
				mask = layer._masks[ m ];
				// If mask does not intersect event coordinates
				if ( !mask.intersects ) {
					// Indicate that the mask does not
					// intersect event coordinates
					layer.intersects = FALSE;
					// Stop searching previous masks
					break;
				}

			}

			// If event coordinates intersect all previous masks
			// and layer is not intangible
			if ( layer.intersects && !layer.intangible ) {
				// Stop searching for topmost layer
				break;
			}

		}

	}
	// If resulting layer is intangible
	if ( layer && layer.intangible ) {
		// Cursor does not intersect this layer
		layer = NULL;
	}
	return layer;
}

// Draw individual layer (internal)
function _drawLayer( $canvas, ctx, layer, nextLayerIndex ) {
	if ( layer && layer.visible && layer._method ) {
		if ( nextLayerIndex ) {
			layer._next = nextLayerIndex;
		} else {
			layer._next = NULL;
		}
		// If layer is an object, call its respective method
		layer._method.call( $canvas, layer );
	}
}

// Handle dragging of the currently-dragged layer
function _handleLayerDrag( $canvas, data, eventType ) {
	var layers, layer, l,
		drag, dragGroups,
		group, groupName, g,
		newX, newY;

	drag = data.drag;
	layer = drag.layer;
	dragGroups = ( layer && layer.dragGroups ) || [];
	layers = data.layers;

	if ( eventType === 'mousemove' || eventType === 'touchmove' ) {
		// Detect when user is currently dragging layer

		if ( !drag.dragging ) {
			// Detect when user starts dragging layer

			// Signify that a layer on the canvas is being dragged
			drag.dragging = TRUE;
			layer.dragging = TRUE;

			// Optionally bring layer to front when drag starts
			if ( layer.bringToFront ) {
				// Remove layer from its original position
				layers.splice( layer.index, 1 );
				// Bring layer to front
				// push() returns the new array length
				layer.index = layers.push( layer );
			}

			// Set drag properties for this layer
			layer._startX = layer.x;
			layer._startY = layer.y;
			layer._endX = layer._eventX;
			layer._endY = layer._eventY;

			// Trigger dragstart event
			_triggerLayerEvent( $canvas, data, layer, 'dragstart' );

		}

		if ( drag.dragging ) {

			// Calculate position after drag
			newX = layer._eventX - ( layer._endX - layer._startX );
			newY = layer._eventY - ( layer._endY - layer._startY );
			layer.dx = newX - layer.x;
			layer.dy = newY - layer.y;
			if ( layer.restrictDragToAxis !== 'y' ) {
				layer.x = newX;
			}
			if ( layer.restrictDragToAxis !== 'x' ) {
				layer.y = newY;
			}

			// Trigger drag event
			_triggerLayerEvent( $canvas, data, layer, 'drag' );

			// Move groups with layer on drag
			for ( g = 0; g < dragGroups.length; g += 1 ) {

				groupName = dragGroups[ g ];
				group = data.layer.groups[ groupName ];
				if ( layer.groups && group ) {

					for ( l = 0; l < group.length; l += 1 ) {
						if ( group[ l ] !== layer ) {
							if ( layer.restrictDragToAxis !== 'y' && group[ l ].restrictDragToAxis !== 'y' ) {
								group[ l ].x += layer.dx;
							}
							if ( layer.restrictDragToAxis !== 'x' && group[ l ].restrictDragToAxis !== 'x' ) {
								group[ l ].y += layer.dy;
							}
						}
					}

				}

			}

		}

	} else if ( eventType === 'mouseup' || eventType === 'touchend' ) {
		// Detect when user stops dragging layer

		if ( drag.dragging ) {
			layer.dragging = FALSE;
			drag.dragging = FALSE;
			// Trigger dragstop event
			_triggerLayerEvent( $canvas, data, layer, 'dragstop' );
		}

		// Cancel dragging
		data.drag = {};

	}
}


// List of CSS3 cursors that need to be prefixed
css.cursors = [ 'grab', 'grabbing', 'zoom-in', 'zoom-out' ];

// Function to detect vendor prefix
// Modified version of David Walsh's implementation
// http://davidwalsh.name/vendor-prefix
css.prefix = ( function () {
	var styles = getComputedStyle( document.documentElement, '' ),
		pre = ( arraySlice
			.call( styles )
			.join( '' )
			.match( /-(moz|webkit|ms)-/ ) || ( styles.OLink === '' && [ '', 'o' ] )
		)[ 1 ];
	return '-' + pre + '-';
} )();

// Set cursor on canvas
function _setCursor( $canvas, layer, eventType ) {
	var cursor;
	if ( layer.cursors ) {
		// Retrieve cursor from cursors object if it exists
		cursor = layer.cursors[ eventType ];
	}
	// Prefix any CSS3 cursor
	if ( $.inArray( cursor, css.cursors ) !== -1 ) {
		cursor = css.prefix + cursor;
	}
	// If cursor is defined
	if ( cursor ) {
		// Set canvas cursor
		$canvas.css( {
			cursor: cursor
		} );
	}
}

// Reset cursor on canvas
function _resetCursor( $canvas, data ) {
	$canvas.css( {
		cursor: data.cursor
	} );
}

// Run the given event callback with the given arguments
function _runEventCallback( $canvas, layer, eventType, callbacks, arg ) {
	// Prevent callback from firing recursively
	if ( callbacks[ eventType ] && layer._running && !layer._running[ eventType ] ) {
		// Signify the start of callback execution for this event
		layer._running[ eventType ] = TRUE;
		// Run event callback with the given arguments
		callbacks[ eventType ].call( $canvas[ 0 ], layer, arg );
		// Signify the end of callback execution for this event
		layer._running[ eventType ] = FALSE;
	}
}

// Determine if the given layer can "legally" fire the given event
function _layerCanFireEvent( layer, eventType ) {
	// If events are disable and if
	// layer is tangible or event is not tangible
	return ( !layer.disableEvents &&
		( !layer.intangible || $.inArray( eventType, tangibleEvents ) === -1 ) );
}

// Trigger the given event on the given layer
function _triggerLayerEvent( $canvas, data, layer, eventType, arg ) {
	// If layer can legally fire this event type
	if ( _layerCanFireEvent( layer, eventType ) ) {

		// Do not set a custom cursor on layer mouseout
		if ( eventType !== 'mouseout' ) {
			// Update cursor if one is defined for this event
			_setCursor( $canvas, layer, eventType );
		}

		// Trigger the user-defined event callback
		_runEventCallback( $canvas, layer, eventType, layer, arg );
		// Trigger the canvas-bound event hook
		_runEventCallback( $canvas, layer, eventType, data.eventHooks, arg );
		// Trigger the global event hook
		_runEventCallback( $canvas, layer, eventType, jCanvas.eventHooks, arg );

	}
}

// Manually trigger a layer event
$.fn.triggerLayerEvent = function ( layer, eventType ) {
	var $canvases = this, $canvas, e,
		data;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );
		layer = $canvas.getLayer( layer );
		if ( layer ) {
			_triggerLayerEvent( $canvas, data, layer, eventType );
		}
	}
	return $canvases;
};

// Draw layer with the given ID
$.fn.drawLayer = function drawLayer( layerId ) {
	var $canvases = this, e, ctx,
		$canvas, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( $canvases[ e ] );
		if (ctx) {
			layer = $canvas.getLayer( layerId );
			_drawLayer( $canvas, ctx, layer );
		}
	}
	return $canvases;
};

// Draw all layers ( or, if given, only layers starting at an index )
$.fn.drawLayers = function drawLayers( args ) {
	var $canvases = this, $canvas, e, ctx,
		// Internal parameters for redrawing the canvas
		params = args || {},
		// Other variables
		layers, layer, lastLayer, l, index, lastIndex,
		data, eventCache, eventType, isImageLayer;

	// The layer index from which to start redrawing the canvas
	index = params.index;
	if ( !index ) {
		index = 0;
	}

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			// Clear canvas first unless otherwise directed
			if ( params.clear !== FALSE ) {
				$canvas.clearCanvas();
			}

			// Cache the layers array
			layers = data.layers;

			// Draw layers from first to last ( bottom to top )
			for ( l = index; l < layers.length; l += 1 ) {
				layer = layers[ l ];

				// Ensure layer index is up-to-date
				layer.index = l;

				// Prevent any one event from firing excessively
				if ( params.resetFire ) {
					layer._fired = FALSE;
				}
				// Draw layer
				_drawLayer( $canvas, ctx, layer, l + 1 );
				// Store list of previous masks for each layer
				layer._masks = data.transforms.masks.slice( 0 );

				// Allow image layers to load before drawing successive layers
				if ( layer._method === $.fn.drawImage && layer.visible ) {
					isImageLayer = true;
					break;
				}

			}

			// If layer is an image layer
			if ( isImageLayer ) {
				// Stop and wait for drawImage() to resume drawLayers()
				break;
			}

			// Store the latest
			lastIndex = l;

			// Get first layer that intersects with event coordinates
			layer = _getIntersectingLayer( data );

			eventCache = data.event;
			eventType = eventCache.type;

			// If jCanvas has detected a dragstart
			if ( data.drag.layer ) {
				// Handle dragging of layer
				_handleLayerDrag( $canvas, data, eventType );
			}

			// Manage mouseout event
			lastLayer = data.lastIntersected;
			if ( lastLayer !== NULL && layer !== lastLayer && lastLayer._hovered && !lastLayer._fired && !data.drag.dragging ) {

				data.lastIntersected = NULL;
				lastLayer._fired = TRUE;
				lastLayer._hovered = FALSE;
				_triggerLayerEvent( $canvas, data, lastLayer, 'mouseout' );
				_resetCursor( $canvas, data );

			}

			if ( layer ) {

				// Use mouse event callbacks if no touch event callbacks are given
				if ( !layer[ eventType ] ) {
					eventType = _getMouseEventName( eventType );
				}

				// Check events for intersecting layer
				if ( layer._event && layer.intersects ) {

					data.lastIntersected = layer;

					// Detect mouseover events
					if ( ( layer.mouseover || layer.mouseout || layer.cursors ) && !data.drag.dragging ) {

						if ( !layer._hovered && !layer._fired ) {

							// Prevent events from firing excessively
							layer._fired = TRUE;
							layer._hovered = TRUE;
							_triggerLayerEvent( $canvas, data, layer, 'mouseover' );

						}

					}

					// Detect any other mouse event
					if ( !layer._fired ) {

						// Prevent event from firing twice unintentionally
						layer._fired = TRUE;
						eventCache.type = NULL;

						_triggerLayerEvent( $canvas, data, layer, eventType );

					}

					// Use the mousedown event to start drag
					if ( layer.draggable && !layer.disableEvents && ( eventType === 'mousedown' || eventType === 'touchstart' ) ) {

						// Keep track of drag state
						data.drag.layer = layer;

					}

				}

			}

			// If cursor is not intersecting with any layer
			if ( layer === NULL && !data.drag.dragging ) {
				// Reset cursor to previous state
				_resetCursor( $canvas, data );
			}

			// If the last layer has been drawn
			if ( lastIndex === layers.length ) {

				// Reset list of intersecting layers
				data.intersecting.length = 0;
				// Reset transformation stack
				data.transforms = _cloneTransforms( baseTransforms );
				data.savedTransforms.length = 0;

			}

		}
	}
	return $canvases;
};

// Add a jCanvas layer (internal)
function _addLayer( canvas, params, args, method ) {
	var $canvas, data,
		layers, layer = ( params._layer ? args : params );

	// Store arguments object for later use
	params._args = args;

	// Convert all draggable drawings into jCanvas layers
	if ( params.draggable || params.dragGroups ) {
		params.layer = TRUE;
		params.draggable = TRUE;
	}

	// Determine the layer's type using the available information
	if ( !params._method ) {
		if ( method ) {
			params._method = method;
		} else if ( params.method ) {
			params._method = $.fn[ params.method ];
		} else if ( params.type ) {
			params._method = $.fn[ maps.drawings[ params.type ] ];
		} else {
			params._method = function () {};
		}
	}

	// If layer hasn't been added yet
	if ( params.layer && !params._layer ) {
		// Add layer to canvas

		$canvas = $( canvas );

		data = _getCanvasData( canvas );
		layers = data.layers;

		// Do not add duplicate layers of same name
		if ( layer.name === NULL || ( isString( layer.name ) && data.layer.names[ layer.name ] === UNDEFINED ) ) {

			// Convert number properties to numbers
			_coerceNumericProps( params );

			// Ensure layers are unique across canvases by cloning them
			layer = new jCanvasObject( params );
			layer.canvas = canvas;
			// Indicate that this is a layer for future checks
			layer.layer = TRUE;
			layer._layer = TRUE;
			layer._running = {};
			// If layer stores user-defined data
			if ( layer.data !== NULL ) {
				// Clone object
				layer.data = extendObject( {}, layer.data );
			} else {
				// Otherwise, create data object
				layer.data = {};
			}
			// If layer stores a list of associated groups
			if ( layer.groups !== NULL ) {
				// Clone list
				layer.groups = layer.groups.slice( 0 );
			} else {
				// Otherwise, create empty list
				layer.groups = [];
			}

			// Update layer group maps
			_updateLayerName( $canvas, data, layer );
			_updateLayerGroups( $canvas, data, layer );

			// Check for any associated jCanvas events and enable them
			_addLayerEvents( $canvas, data, layer );

			// Optionally enable drag-and-drop support and cursor support
			_enableDrag( $canvas, data, layer );

			// Copy _event property to parameters object
			params._event = layer._event;

			// Calculate width/height for text layers
			if ( layer._method === $.fn.drawText ) {
				$canvas.measureText( layer );
			}

			// Add layer to end of array if no index is specified
			if ( layer.index === NULL ) {
				layer.index = layers.length;
			}

			// Add layer to layers array at specified index
			layers.splice( layer.index, 0, layer );

			// Store layer on parameters object
			params._args = layer;

			// Trigger an 'add' event
			_triggerLayerEvent( $canvas, data, layer, 'add' );

		}

	} else if ( !params.layer ) {
		_coerceNumericProps( params );
	}

	return layer;
}

// Add a jCanvas layer
$.fn.addLayer = function addLayer( args ) {
	var $canvases = this, e, ctx,
		params;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			params.layer = TRUE;
			_addLayer( $canvases[ e ], params, args );

		}
	}
	return $canvases;
};

/* Animation API */

// Define properties used in both CSS and jCanvas
css.props = [
	'width',
	'height',
	'opacity',
	'lineHeight'
];
css.propsObj = {};

// Hide/show jCanvas/CSS properties so they can be animated using jQuery
function _showProps( obj ) {
	var cssProp, p;
	for ( p = 0; p < css.props.length; p += 1 ) {
		cssProp = css.props[ p ];
		obj[ cssProp ] = obj[ '_' + cssProp ];
	}
}
function _hideProps( obj, reset ) {
	var cssProp, p;
	for ( p = 0; p < css.props.length; p += 1 ) {
		cssProp = css.props[ p ];
		// Hide property using same name with leading underscore
		if ( obj[ cssProp ] !== UNDEFINED ) {
			obj[ '_' + cssProp ] = obj[ cssProp ];
			css.propsObj[ cssProp ] = TRUE;
			if ( reset ) {
				delete obj[ cssProp ];
			}
		}
	}
}

// Evaluate property values that are functions
function _parseEndValues( canvas, layer, endValues ) {
	var propName, propValue,
		subPropName, subPropValue;
	// Loop through all properties in map of end values
	for ( propName in endValues ) {
		if ( endValues.hasOwnProperty( propName ) ) {
			propValue = endValues[ propName ];
			// If end value is function
			if ( isFunction( propValue ) ) {
				// Call function and use its value as the end value
				endValues[ propName ] = propValue.call( canvas, layer, propName );
			}
			// If end value is an object
			if ( typeOf( propValue ) === 'object' && isPlainObject( propValue ) ) {
				// Prepare to animate properties in object
				for ( subPropName in propValue ) {
					if ( propValue.hasOwnProperty( subPropName ) ) {
						subPropValue = propValue[ subPropName ];
						// Store property's start value at top-level of layer
						if ( layer[ propName ] !== UNDEFINED ) {
							layer[ propName + '.' + subPropName ] = layer[ propName ][ subPropName ];
							// Store property's end value at top-level of end values map
							endValues[ propName + '.' + subPropName ] = subPropValue;
						}
					}
				}
				// Delete sub-property of object as it's no longer needed
				delete endValues[ propName ];
			}
		}
	}
	return endValues;
}

// Remove sub-property aliases from layer object
function _removeSubPropAliases( layer ) {
	var propName;
	for ( propName in layer ) {
		if ( layer.hasOwnProperty( propName ) ) {
			if ( propName.indexOf( '.' ) !== -1 ) {
				delete layer[ propName ];
			}
		}
	}
}

// Convert a color value to an array of RGB values
function _colorToRgbArray( color ) {
	var originalColor, elem,
		rgb = [],
		multiple = 1;

	// Deal with complete transparency
	if ( color === 'transparent' ) {
		color = 'rgba(0, 0, 0, 0)';
	} else if ( color.match( /^([a-z]+|#[0-9a-f]+)$/gi ) ) {
		// Deal with hexadecimal colors and color names
		elem = document.head;
		originalColor = elem.style.color;
		elem.style.color = color;
		color = $.css( elem, 'color' );
		elem.style.color = originalColor;
	}
	// Parse RGB string
	if ( color.match( /^rgb/gi ) ) {
		rgb = color.match( /(\d+(\.\d+)?)/gi );
		// Deal with RGB percentages
		if ( color.match( /%/gi ) ) {
			multiple = 2.55;
		}
		rgb[ 0 ] *= multiple;
		rgb[ 1 ] *= multiple;
		rgb[ 2 ] *= multiple;
		// Ad alpha channel if given
		if ( rgb[ 3 ] !== UNDEFINED ) {
			rgb[ 3 ] = parseFloat( rgb[ 3 ] );
		} else {
			rgb[ 3 ] = 1;
		}
	}
	return rgb;
}

// Animate a hex or RGB color
function _animateColor( fx ) {
	var n = 3,
		i;
	// Only parse start and end colors once
	if ( typeOf( fx.start ) !== 'array' ) {
		var orig = fx.start.slice(0);
		fx.start = _colorToRgbArray( fx.start );
		console.log(orig, '=>', fx.start);
		fx.end = _colorToRgbArray( fx.end );
	}
	fx.now = [];

	// If colors are RGBA, animate transparency
	if ( fx.start[ 3 ] !== 1 || fx.end[ 3 ] !== 1 ) {
		n = 4;
	}

	// Calculate current frame for red, green, blue, and alpha
	for ( i = 0; i < n; i += 1 ) {
		fx.now[ i ] = fx.start[ i ] + ( fx.end[ i ] - fx.start[ i ] ) * fx.pos;
		// Only the red, green, and blue values must be integers
		if ( i < 3 ) {
			fx.now[ i ] = round( fx.now[ i ] );
		}
	}
	if ( fx.start[ 3 ] !== 1 || fx.end[ 3 ] !== 1 ) {
		// Only use RGBA if RGBA colors are given
		fx.now = 'rgba( ' + fx.now.join( ',' ) + ' )';
	} else {
		// Otherwise, animate as solid colors
		fx.now.slice( 0, 3 );
		fx.now = 'rgb( ' + fx.now.join( ',' ) + ' )';
	}
	// Animate colors for both canvas layers and DOM elements
	if ( fx.elem.nodeName ) {
		fx.elem.style[ fx.prop ] = fx.now;
	} else {
		fx.elem[ fx.prop ] = fx.now;
	}
}

// Animate jCanvas layer
$.fn.animateLayer = function animateLayer() {
	var $canvases = this, $canvas, e, ctx,
		args = arraySlice.call( arguments, 0 ),
		data, layer, props;

	// Deal with all cases of argument placement
	/*
		0. layer name/index
		1. properties
		2. duration/options
		3. easing
		4. complete function
		5. step function
	*/

	if ( typeOf( args[ 2 ] ) === 'object' ) {

		// Accept an options object for animation
		args.splice( 2, 0, args[ 2 ].duration || NULL );
		args.splice( 3, 0, args[ 3 ].easing || NULL );
		args.splice( 4, 0, args[ 4 ].complete || NULL );
		args.splice( 5, 0, args[ 5 ].step || NULL );

	} else {

		if ( args[ 2 ] === UNDEFINED ) {
			// If object is the last argument
			args.splice( 2, 0, NULL );
			args.splice( 3, 0, NULL );
			args.splice( 4, 0, NULL );
		} else if ( isFunction( args[ 2 ] ) ) {
			// If callback comes after object
			args.splice( 2, 0, NULL );
			args.splice( 3, 0, NULL );
		}
		if ( args[ 3 ] === UNDEFINED ) {
			// If duration is the last argument
			args[ 3 ] = NULL;
			args.splice( 4, 0, NULL );
		} else if ( isFunction( args[ 3 ] ) ) {
			// If callback comes after duration
			args.splice( 3, 0, NULL );
		}

	}

	// Run callback function when animation completes
	function complete( $canvas, data, layer ) {

		return function () {

			_showProps( layer );
			_removeSubPropAliases( layer );

			// Prevent multiple redraw loops
			if ( !data.animating || data.animated === layer ) {
				// Redraw layers on last frame
				$canvas.drawLayers();
			}

			// Signify the end of an animation loop
			layer._animating = FALSE;
			data.animating = FALSE;
			data.animated = NULL;

			// If callback is defined
			if ( args[ 4 ] ) {
				// Run callback at the end of the animation
				args[ 4 ].call( $canvas[ 0 ], layer );
			}

			_triggerLayerEvent( $canvas, data, layer, 'animateend' );

		};

	}

	// Redraw layers on every frame of the animation
	function step( $canvas, data, layer ) {

		return function ( now, fx ) {
			var parts, propName, subPropName,
				hidden = false;

			// If animated property has been hidden
			if ( fx.prop[ 0 ] === '_' ) {
				hidden = true;
				// Unhide property temporarily
				fx.prop = fx.prop.replace( '_', '' );
				layer[ fx.prop ] = layer[ '_' + fx.prop ];
			}

			// If animating property of sub-object
			if ( fx.prop.indexOf( '.' ) !== -1 ) {
				parts = fx.prop.split( '.' );
				propName = parts[ 0 ];
				subPropName = parts[ 1 ];
				if ( layer[ propName ] ) {
					layer[ propName ][ subPropName ] = fx.now;
				}
			}

			// Throttle animation to improve efficiency
			if ( layer._pos !== fx.pos ) {

				layer._pos = fx.pos;

				// Signify the start of an animation loop
				if ( !layer._animating && !data.animating ) {
					layer._animating = TRUE;
					data.animating = TRUE;
					data.animated = layer;
				}

				// Prevent multiple redraw loops
				if ( !data.animating || data.animated === layer ) {
					// Redraw layers for every frame
					$canvas.drawLayers();
				}

			}

			// If callback is defined
			if ( args[ 5 ] ) {
				// Run callback for each step of animation
				args[ 5 ].call( $canvas[ 0 ], now, fx, layer );
			}

			_triggerLayerEvent( $canvas, data, layer, 'animate', fx );

			// If property should be hidden during animation
			if ( hidden ) {
				// Hide property again
				fx.prop = '_' + fx.prop;
			}

		};

	}

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			// If a layer object was passed, use it the layer to be animated
			layer = $canvas.getLayer( args[ 0 ] );

			// Ignore layers that are functions
			if ( layer && layer._method !== $.fn.draw ) {

				// Do not modify original object
				props = extendObject( {}, args[ 1 ] );

				props = _parseEndValues( $canvases[ e ], layer, props );

				// Bypass jQuery CSS Hooks for CSS properties ( width, opacity, etc. )
				_hideProps( props, TRUE );
				_hideProps( layer );

				// Fix for jQuery's vendor prefixing support, which affects how width/height/opacity are animated
				layer.style = css.propsObj;

				// Animate layer
				$( layer ).animate( props, {
					duration: args[ 2 ],
					easing: ( $.easing[ args[ 3 ] ] ? args[ 3 ] : NULL ),
					// When animation completes
					complete: complete( $canvas, data, layer ),
					// Redraw canvas for every animation frame
					step: step( $canvas, data, layer )
				} );
				_triggerLayerEvent( $canvas, data, layer, 'animatestart' );
			}

		}
	}
	return $canvases;
};

// Animate all layers in a layer group
$.fn.animateLayerGroup = function animateLayerGroup( groupId ) {
	var $canvases = this, $canvas, e,
		args = arraySlice.call( arguments, 0 ),
		group, l;
	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		group = $canvas.getLayerGroup( groupId );
		if ( group ) {

			// Animate all layers in the group
			for ( l = 0; l < group.length; l += 1 ) {

				// Replace first argument with layer
				args[ 0 ] = group[ l ];
				$canvas.animateLayer.apply( $canvas, args );

			}

		}
	}
	return $canvases;
};

// Delay layer animation by a given number of milliseconds
$.fn.delayLayer = function delayLayer( layerId, duration ) {
	var $canvases = this, $canvas, e,
		data, layer;
	duration = duration || 0;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );
		layer = $canvas.getLayer( layerId );
		// If layer exists
		if ( layer ) {
			// Delay animation
			$( layer ).delay( duration );
			_triggerLayerEvent( $canvas, data, layer, 'delay' );
		}
	}
	return $canvases;
};

// Delay animation all layers in a layer group
$.fn.delayLayerGroup = function delayLayerGroup( groupId, duration ) {
	var $canvases = this, $canvas, e,
		group, layer, l;
	duration = duration || 0;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );

		group = $canvas.getLayerGroup( groupId );
		// Delay all layers in the group
		if ( group ) {

			for ( l = 0; l < group.length; l += 1 ) {
				// Delay each layer in the group
				layer = group[ l ];
				$canvas.delayLayer( layer, duration );
			}

		}
	}
	return $canvases;
};

// Stop layer animation
$.fn.stopLayer = function stopLayer( layerId, clearQueue ) {
	var $canvases = this, $canvas, e,
		data, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		data = _getCanvasData( $canvases[ e ] );
		layer = $canvas.getLayer( layerId );
		// If layer exists
		if ( layer ) {
			// Stop animation
			$( layer ).stop( clearQueue );
			_triggerLayerEvent( $canvas, data, layer, 'stop' );
		}
	}
	return $canvases;
};

// Stop animation of all layers in a layer group
$.fn.stopLayerGroup = function stopLayerGroup( groupId, clearQueue ) {
	var $canvases = this, $canvas, e,
		group, layer, l;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );

		group = $canvas.getLayerGroup( groupId );
		// Stop all layers in the group
		if ( group ) {

			for ( l = 0; l < group.length; l += 1 ) {
				// Stop each layer in the group
				layer = group[ l ];
				$canvas.stopLayer( layer, clearQueue );
			}

		}
	}
	return $canvases;
};

// Enable animation for color properties
function _supportColorProps( props ) {
	var p;
	for ( p = 0; p < props.length; p += 1 ) {
		$.fx.step[ props[ p ] ] = _animateColor;
	}
}

// Enable animation for color properties
_supportColorProps( [
	'color',
	'backgroundColor',
	'borderColor',
	'borderTopColor',
	'borderRightColor',
	'borderBottomColor',
	'borderLeftColor',
	'fillStyle',
	'outlineColor',
	'strokeStyle',
	'shadowColor'
] );

/* Event API */

// Map standard mouse events to touch events
maps.touchEvents = {
	'mousedown': 'touchstart',
	'mouseup': 'touchend',
	'mousemove': 'touchmove'
};
// Map standard touch events to mouse events
maps.mouseEvents = {
	'touchstart': 'mousedown',
	'touchend': 'mouseup',
	'touchmove': 'mousemove'
};

// Convert mouse event name to a corresponding touch event name ( if possible )
function _getTouchEventName( eventName ) {
	// Detect touch event support
	if ( maps.touchEvents[ eventName ] ) {
		eventName = maps.touchEvents[ eventName ];
	}
	return eventName;
}
// Convert touch event name to a corresponding mouse event name
function _getMouseEventName( eventName ) {
	if ( maps.mouseEvents[ eventName ] ) {
		eventName = maps.mouseEvents[ eventName ];
	}
	return eventName;
}

// Bind event to jCanvas layer using standard jQuery events
function _createEvent( eventName ) {

	jCanvas.events[ eventName ] = function ( $canvas, data ) {
		var helperEventName, touchEventName, eventCache;

		// Retrieve canvas's event cache
		eventCache = data.event;

		// Both mouseover/mouseout events will be managed by a single mousemove event
		helperEventName = ( eventName === 'mouseover' || eventName === 'mouseout' ) ? 'mousemove' : eventName;
		touchEventName = _getTouchEventName( helperEventName );

		function eventCallback( event ) {
			// Cache current mouse position and redraw layers
			eventCache.x = event.offsetX;
			eventCache.y = event.offsetY;
			eventCache.type = helperEventName;
			eventCache.event = event;
			// Redraw layers on every trigger of the event
			$canvas.drawLayers( {
				resetFire: TRUE
			} );
			// Prevent default event behavior
			event.preventDefault();
		}

		// Ensure the event is not bound more than once
		if ( !data.events[ helperEventName ] ) {
			// Bind one canvas event which handles all layer events of that type
			if ( touchEventName !== helperEventName ) {
				$canvas.bind( helperEventName + '.jCanvas ' + touchEventName + '.jCanvas', eventCallback );
			} else {
				$canvas.bind( helperEventName + '.jCanvas', eventCallback );
			}
			// Prevent this event from being bound twice
			data.events[ helperEventName ] = TRUE;
		}
	};
}
function _createEvents( eventNames ) {
	var n;
	for ( n = 0; n < eventNames.length; n += 1 ) {
		_createEvent( eventNames[ n ] );
	}
}
// Populate jCanvas events object with some standard events
_createEvents( [
	'click',
	'dblclick',
	'mousedown',
	'mouseup',
	'mousemove',
	'mouseover',
	'mouseout',
	'touchstart',
	'touchmove',
	'touchend',
	'contextmenu'
] );

// Check if event fires when a drawing is drawn
function _detectEvents( canvas, ctx, params ) {
	var layer, data, eventCache, intersects,
		transforms, x, y, angle;

	// Use the layer object stored by the given parameters object
	layer = params._args;
	// Canvas must have event bindings
	if ( layer ) {

		data = _getCanvasData( canvas );
		eventCache = data.event;
		if ( eventCache.x !== NULL && eventCache.y !== NULL ) {
			// Respect user-defined pixel ratio
			x = eventCache.x * data.pixelRatio;
			y = eventCache.y * data.pixelRatio;
			// Determine if the given coordinates are in the current path
			intersects = ctx.isPointInPath( x, y ) || ( ctx.isPointInStroke && ctx.isPointInStroke( x, y ) );
		}
		transforms = data.transforms;

		// Allow callback functions to retrieve the mouse coordinates
		layer.eventX = eventCache.x;
		layer.eventY = eventCache.y;
		layer.event = eventCache.event;

		// Adjust coordinates to match current canvas transformation

		// Keep track of some transformation values
		angle = data.transforms.rotate;
		x = layer.eventX;
		y = layer.eventY;

		if ( angle !== 0 ) {
			// Rotate coordinates if coordinate space has been rotated
			layer._eventX = ( x * cos( -angle ) ) - ( y * sin( -angle ) );
			layer._eventY = ( y * cos( -angle ) ) + ( x * sin( -angle ) );
		} else {
			// Otherwise, no calculations need to be made
			layer._eventX = x;
			layer._eventY = y;
		}

		// Scale coordinates
		layer._eventX /= transforms.scaleX;
		layer._eventY /= transforms.scaleY;

		// If layer intersects with cursor
		if ( intersects ) {
			// Add it to a list of layers that intersect with cursor
			data.intersecting.push( layer );
		}
		layer.intersects = !!intersects;
	}
}

// Normalize offsetX and offsetY for all browsers
$.event.fix = function ( event ) {
	var offset, originalEvent, touches;

	event = jQueryEventFix.call( $.event, event );
	originalEvent = event.originalEvent;

	// originalEvent does not exist for manually-triggered events
	if ( originalEvent ) {

		touches = originalEvent.changedTouches;

		// If offsetX and offsetY are not supported, define them
		if ( event.pageX !== UNDEFINED && event.offsetX === UNDEFINED ) {
			offset = $( event.currentTarget ).offset();
			if ( offset ) {
				event.offsetX = event.pageX - offset.left;
				event.offsetY = event.pageY - offset.top;
			}
		} else if ( touches ) {
			// Enable offsetX and offsetY for mobile devices
			offset = $( event.currentTarget ).offset();
			if ( offset ) {
				event.offsetX = touches[ 0 ].pageX - offset.left;
				event.offsetY = touches[ 0 ].pageY - offset.top;
			}
		}

	}
	return event;
};

/* Drawing API */

// Map drawing names with their respective method names
maps.drawings = {
	'arc': 'drawArc',
	'bezier': 'drawBezier',
	'ellipse': 'drawEllipse',
	'function': 'draw',
	'image': 'drawImage',
	'line': 'drawLine',
	'path': 'drawPath',
	'polygon': 'drawPolygon',
	'slice': 'drawSlice',
	'quadratic': 'drawQuadratic',
	'rectangle': 'drawRect',
	'text': 'drawText',
	'vector': 'drawVector',
	'save': 'saveCanvas',
	'restore': 'restoreCanvas',
	'rotate': 'rotateCanvas',
	'scale': 'scaleCanvas',
	'translate': 'translateCanvas'
};

// Draws on canvas using a function
$.fn.draw = function draw( args ) {
	var $canvases = this, $canvas, e, ctx,
		params = new jCanvasObject( args ),
		layer;

	// Draw using any other method
	if ( maps.drawings[ params.type ] && params.type !== 'function' ) {

		$canvases[ maps.drawings[ params.type ] ]( args );

	} else {

		for ( e = 0; e < $canvases.length; e += 1 ) {
			$canvas = $( $canvases[ e ] );
			ctx = _getContext( $canvases[ e ] );
			if ( ctx ) {

				params = new jCanvasObject( args );
				layer = _addLayer( $canvases[ e ], params, args, draw );
				if ( params.visible ) {

					if ( params.fn ) {
						// Call the given user-defined function
						params.fn.call( $canvases[ e ], ctx, params );
					}

				}

			}
		}

	}
	return $canvases;
};

// Clears canvas
$.fn.clearCanvas = function clearCanvas( args ) {
	var $canvases = this, e, ctx,
		params = new jCanvasObject( args ),
		layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			if ( params.width === NULL || params.height === NULL ) {
				// Clear entire canvas if width/height is not given

				// Reset current transformation temporarily to ensure that the entire canvas is cleared
				ctx.save();
				ctx.setTransform( 1, 0, 0, 1, 0, 0 );
				ctx.clearRect( 0, 0, $canvases[ e ].width, $canvases[ e ].height );
				ctx.restore();

			} else {
				// Otherwise, clear the defined section of the canvas

				// Transform clear rectangle
				layer = _addLayer( $canvases[ e ], params, args, clearCanvas );
				_transformShape( $canvases[ e ], ctx, params, params.width, params.height );
				ctx.clearRect( params.x - ( params.width / 2 ), params.y - ( params.height / 2 ), params.width, params.height );
				// Restore previous transformation
				_restoreTransform( ctx, params );

			}

		}
	}
	return $canvases;
};

/* Transformation API */

// Restores canvas
$.fn.saveCanvas = function saveCanvas( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		data, i;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, saveCanvas );

			// Restore a number of times using the given count
			for ( i = 0; i < params.count; i += 1 ) {
				_saveCanvas( ctx, data );
			}

		}
	}
	return $canvases;
};

// Restores canvas
$.fn.restoreCanvas = function restoreCanvas( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		data, i;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, restoreCanvas );

			// Restore a number of times using the given count
			for ( i = 0; i < params.count; i += 1 ) {
				_restoreCanvas( ctx, data );
			}

		}
	}
	return $canvases;
};

// Rotates canvas (internal)
function _rotateCanvas( ctx, params, transforms ) {

	// Get conversion factor for radians
	params._toRad = ( params.inDegrees ? ( PI / 180 ) : 1 );

	// Rotate canvas using shape as center of rotation
	ctx.translate( params.x, params.y );
	ctx.rotate( params.rotate * params._toRad );
	ctx.translate( -params.x, -params.y );

	// If transformation data was given
	if ( transforms ) {
		// Update transformation data
		transforms.rotate += ( params.rotate * params._toRad );
	}
}

// Scales canvas (internal)
function _scaleCanvas( ctx, params, transforms ) {

	// Scale both the x- and y- axis using the 'scale' property
	if ( params.scale !== 1 ) {
		params.scaleX = params.scaleY = params.scale;
	}

	// Scale canvas using shape as center of rotation
	ctx.translate( params.x, params.y );
	ctx.scale( params.scaleX, params.scaleY );
	ctx.translate( -params.x, -params.y );

	// If transformation data was given
	if ( transforms ) {
		// Update transformation data
		transforms.scaleX *= params.scaleX;
		transforms.scaleY *= params.scaleY;
	}
}

// Translates canvas (internal)
function _translateCanvas( ctx, params, transforms ) {

	// Translate both the x- and y-axis using the 'translate' property
	if ( params.translate ) {
		params.translateX = params.translateY = params.translate;
	}

	// Translate canvas
	ctx.translate( params.translateX, params.translateY );

	// If transformation data was given
	if ( transforms ) {
		// Update transformation data
		transforms.translateX += params.translateX;
		transforms.translateY += params.translateY;
	}
}

// Rotates canvas
$.fn.rotateCanvas = function rotateCanvas( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		data;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, rotateCanvas );

			// Autosave transformation state by default
			if ( params.autosave ) {
				// Automatically save transformation state by default
				_saveCanvas( ctx, data );
			}
			_rotateCanvas( ctx, params, data.transforms );
		}

	}
	return $canvases;
};

// Scales canvas
$.fn.scaleCanvas = function scaleCanvas( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		data;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, scaleCanvas );

			// Autosave transformation state by default
			if ( params.autosave ) {
				// Automatically save transformation state by default
				_saveCanvas( ctx, data );
			}
			_scaleCanvas( ctx, params, data.transforms );

		}
	}
	return $canvases;
};

// Translates canvas
$.fn.translateCanvas = function translateCanvas( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		data;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, translateCanvas );

			// Autosave transformation state by default
			if ( params.autosave ) {
				// Automatically save transformation state by default
				_saveCanvas( ctx, data );
			}
			_translateCanvas( ctx, params, data.transforms );

		}
	}
	return $canvases;
};

/* Shape API */

// Draws rectangle
$.fn.drawRect = function drawRect( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		x1, y1,
		x2, y2,
		r, temp;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawRect );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params, params.width, params.height );
				_setGlobalProps( $canvases[ e ], ctx, params );

				ctx.beginPath();
				if ( params.width && params.height ) {
					x1 = params.x - ( params.width / 2 );
					y1 = params.y - ( params.height / 2 );
					r = abs( params.cornerRadius );
					// If corner radius is defined and is not zero
					if ( r ) {
						// Draw rectangle with rounded corners if cornerRadius is defined

						x2 = params.x + ( params.width / 2 );
						y2 = params.y + ( params.height / 2 );

						// Handle negative width
						if ( params.width < 0 ) {
							temp = x1;
							x1 = x2;
							x2 = temp;
						}
						// Handle negative height
						if ( params.height < 0 ) {
							temp = y1;
							y1 = y2;
							y2 = temp;
						}

						// Prevent over-rounded corners
						if ( ( x2 - x1 ) - ( 2 * r ) < 0 ) {
							r = ( x2 - x1 ) / 2;
						}
						if ( ( y2 - y1 ) - ( 2 * r ) < 0 ) {
							r = ( y2 - y1 ) / 2;
						}

						// Draw rectangle
						ctx.moveTo( x1 + r, y1 );
						ctx.lineTo( x2 - r, y1 );
						ctx.arc( x2 - r, y1 + r, r, 3 * PI / 2, PI * 2, FALSE );
						ctx.lineTo( x2, y2 - r );
						ctx.arc( x2 - r, y2 - r, r, 0, PI / 2, FALSE );
						ctx.lineTo( x1 + r, y2 );
						ctx.arc( x1 + r, y2 - r, r, PI / 2, PI, FALSE );
						ctx.lineTo( x1, y1 + r );
						ctx.arc( x1 + r, y1 + r, r, PI, 3 * PI / 2, FALSE );
						// Always close path
						params.closed = TRUE;

					} else {

						// Otherwise, draw rectangle with square corners
						ctx.rect( x1, y1, params.width, params.height );

					}
				}
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Close rectangle path
				_closePath( $canvases[ e ], ctx, params );
			}
		}
	}
	return $canvases;
};

// Retrieves a coterminal angle between 0 and 2pi for the given angle
function _getCoterminal( angle ) {
	while ( angle < 0 ) {
		angle += ( 2 * PI );
	}
	return angle;
}

// Retrieves the x-coordinate for the given angle in a circle
function _getArcX( params, angle ) {
	return params.x + ( params.radius * cos( angle ) );
}
// Retrieves the y-coordinate for the given angle in a circle
function _getArcY( params, angle ) {
	return params.y + ( params.radius * sin( angle ) );
}

// Draws arc (internal)
function _drawArc( canvas, ctx, params, path ) {
	var x1, y1, x2, y2,
		x3, y3, x4, y4,
		offsetX, offsetY,
		diff;

	// Determine offset from dragging
	if ( params === path ) {
		offsetX = 0;
		offsetY = 0;
	} else {
		offsetX = params.x;
		offsetY = params.y;
	}

	// Convert default end angle to radians
	if ( !path.inDegrees && path.end === 360 ) {
		path.end = PI * 2;
	}

	// Convert angles to radians
	path.start *= params._toRad;
	path.end *= params._toRad;
	// Consider 0deg due north of arc
	path.start -= ( PI / 2 );
	path.end -= ( PI / 2 );

	// Ensure arrows are pointed correctly for CCW arcs
	diff = PI / 180;
	if ( path.ccw ) {
		diff *= -1;
	}

	// Calculate coordinates for start arrow
	x1 = _getArcX( path, path.start + diff );
	y1 = _getArcY( path, path.start + diff );
	x2 = _getArcX( path, path.start );
	y2 = _getArcY( path, path.start );

	_addStartArrow(
		canvas, ctx,
		params, path,
		x1, y1,
		x2, y2
	);

	// Draw arc
	ctx.arc( path.x + offsetX, path.y + offsetY, path.radius, path.start, path.end, path.ccw );

	// Calculate coordinates for end arrow
	x3 = _getArcX( path, path.end + diff );
	y3 = _getArcY( path, path.end + diff );
	x4 = _getArcX( path, path.end );
	y4 = _getArcY( path, path.end );

	_addEndArrow(
		canvas, ctx,
		params, path,
		x4, y4,
		x3, y3
	);
}

// Draws arc or circle
$.fn.drawArc = function drawArc( args ) {
	var $canvases = this, e, ctx,
		params, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawArc );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params, params.radius * 2 );
				_setGlobalProps( $canvases[ e ], ctx, params );

				ctx.beginPath();
				_drawArc( $canvases[ e ], ctx, params, params );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}

		}
	}
	return $canvases;
};

// Draws ellipse
$.fn.drawEllipse = function drawEllipse( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		controlW,
		controlH;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawEllipse );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params, params.width, params.height );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Calculate control width and height
				controlW = params.width * ( 4 / 3 );
				controlH = params.height;

				// Create ellipse using curves
				ctx.beginPath();
				ctx.moveTo( params.x, params.y - ( controlH / 2 ) );
				// Left side
				ctx.bezierCurveTo( params.x - ( controlW / 2 ), params.y - ( controlH / 2 ), params.x - ( controlW / 2 ), params.y + ( controlH / 2 ), params.x, params.y + ( controlH / 2 ) );
				// Right side
				ctx.bezierCurveTo( params.x + ( controlW / 2 ), params.y + ( controlH / 2 ), params.x + ( controlW / 2 ), params.y - ( controlH / 2 ), params.x, params.y - ( controlH / 2 ) );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Always close path
				params.closed = TRUE;
				_closePath( $canvases[ e ], ctx, params );

			}
		}
	}
	return $canvases;
};

// Draws a regular ( equal-angled ) polygon
$.fn.drawPolygon = function drawPolygon( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		theta, dtheta, hdtheta,
		apothem,
		x, y, i;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawPolygon );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params, params.radius * 2 );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Polygon's central angle
				dtheta = ( 2 * PI ) / params.sides;
				// Half of dtheta
				hdtheta = dtheta / 2;
				// Polygon's starting angle
				theta = hdtheta + ( PI / 2 );
				// Distance from polygon's center to the middle of its side
				apothem = params.radius * cos( hdtheta );

				// Calculate path and draw
				ctx.beginPath();
				for ( i = 0; i < params.sides; i += 1 ) {

					// Draw side of polygon
					x = params.x + ( params.radius * cos( theta ) );
					y = params.y + ( params.radius * sin( theta ) );

					// Plot point on polygon
					ctx.lineTo( x, y );

					// Project side if chosen
					if ( params.concavity ) {
						// Sides are projected from the polygon's apothem
						x = params.x + ( ( apothem + ( -apothem * params.concavity ) ) * cos( theta + hdtheta ) );
						y = params.y + ( ( apothem + ( -apothem * params.concavity ) ) * sin( theta + hdtheta ) );
						ctx.lineTo( x, y );
					}

					// Increment theta by delta theta
					theta += dtheta;

				}
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Always close path
				params.closed = TRUE;
				_closePath( $canvases[ e ], ctx, params );

			}
		}
	}
	return $canvases;
};

// Draws pie-shaped slice
$.fn.drawSlice = function drawSlice( args ) {
	var $canvases = this, $canvas, e, ctx,
		params, layer,
		angle, dx, dy;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawSlice );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params, params.radius * 2 );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Perform extra calculations

				// Convert angles to radians
				params.start *= params._toRad;
				params.end *= params._toRad;
				// Consider 0deg at north of arc
				params.start -= ( PI / 2 );
				params.end -= ( PI / 2 );

				// Find positive equivalents of angles
				params.start = _getCoterminal( params.start );
				params.end = _getCoterminal( params.end );
				// Ensure start angle is less than end angle
				if ( params.end < params.start ) {
					params.end += ( 2 * PI );
				}

				// Calculate angular position of slice
				angle = ( ( params.start + params.end ) / 2 );

				// Calculate ratios for slice's angle
				dx = ( params.radius * params.spread * cos( angle ) );
				dy = ( params.radius * params.spread * sin( angle ) );

				// Adjust position of slice
				params.x += dx;
				params.y += dy;

				// Draw slice
				ctx.beginPath();
				ctx.arc( params.x, params.y, params.radius, params.start, params.end, params.ccw );
				ctx.lineTo( params.x, params.y );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Always close path
				params.closed = TRUE;
				_closePath( $canvases[ e ], ctx, params );

			}

		}
	}
	return $canvases;
};

/* Path API */

// Adds arrow to path using the given properties
function _addArrow( canvas, ctx, params, path, x1, y1, x2, y2 ) {
	var leftX, leftY,
		rightX, rightY,
		offsetX, offsetY,
		angle;

	// If arrow radius is given and path is not closed
	if ( path.arrowRadius && !params.closed ) {

		// Calculate angle
		angle = atan2( ( y2 - y1 ), ( x2 - x1 ) );
		// Adjust angle correctly
		angle -= PI;
		// Calculate offset to place arrow at edge of path
		offsetX = ( params.strokeWidth * cos( angle ) );
		offsetY = ( params.strokeWidth * sin( angle ) );

		// Calculate coordinates for left half of arrow
		leftX = x2 + ( path.arrowRadius * cos( angle + ( path.arrowAngle / 2 ) ) );
		leftY = y2 + ( path.arrowRadius * sin( angle + ( path.arrowAngle / 2 ) ) );
		// Calculate coordinates for right half of arrow
		rightX = x2 + ( path.arrowRadius * cos( angle - ( path.arrowAngle / 2 ) ) );
		rightY = y2 + ( path.arrowRadius * sin( angle - ( path.arrowAngle / 2 ) ) );

		// Draw left half of arrow
		ctx.moveTo( leftX - offsetX, leftY - offsetY );
		ctx.lineTo( x2 - offsetX, y2 - offsetY );
		// Draw right half of arrow
		ctx.lineTo( rightX - offsetX, rightY - offsetY );

		// Visually connect arrow to path
		ctx.moveTo( x2 - offsetX, y2 - offsetY );
		ctx.lineTo( x2 + offsetX, y2 + offsetY );
		// Move back to end of path
		ctx.moveTo( x2, y2 );

	}
}

// Optionally adds arrow to start of path
function _addStartArrow( canvas, ctx, params, path, x1, y1, x2, y2 ) {
	if ( !path._arrowAngleConverted ) {
		path.arrowAngle *= params._toRad;
		path._arrowAngleConverted = TRUE;
	}
	if ( path.startArrow ) {
		_addArrow( canvas, ctx, params, path, x1, y1, x2, y2 );
	}
}

// Optionally adds arrow to end of path
function _addEndArrow( canvas, ctx, params, path, x1, y1, x2, y2 ) {
	if ( !path._arrowAngleConverted ) {
		path.arrowAngle *= params._toRad;
		path._arrowAngleConverted = TRUE;
	}
	if ( path.endArrow ) {
		_addArrow( canvas, ctx, params, path, x1, y1, x2, y2 );
	}
}

// Draws line (internal)
function _drawLine( canvas, ctx, params, path ) {
	var l,
		lx, ly;
	l = 2;
	_addStartArrow(
		canvas, ctx,
		params, path,
		path.x2 + params.x,
		path.y2 + params.y,
		path.x1 + params.x,
		path.y1 + params.y
	);
	if ( path.x1 !== UNDEFINED && path.y1 !== UNDEFINED ) {
		ctx.moveTo( path.x1 + params.x, path.y1 + params.y );
	}
	while ( TRUE ) {
		// Calculate next coordinates
		lx = path[ 'x' + l ];
		ly = path[ 'y' + l ];
		// If coordinates are given
		if ( lx !== UNDEFINED && ly !== UNDEFINED ) {
			// Draw next line
			ctx.lineTo( lx + params.x, ly + params.y );
			l += 1;
		} else {
			// Otherwise, stop drawing
			break;
		}
	}
	l -= 1;
	// Optionally add arrows to path
	_addEndArrow(
		canvas, ctx,
		params,
		path,
		path[ 'x' + ( l - 1 ) ] + params.x,
		path[ 'y' + ( l - 1 ) ] + params.y,
		path[ 'x' + l ] + params.x,
		path[ 'y' + l ] + params.y
	);
}

// Draws line
$.fn.drawLine = function drawLine( args ) {
	var $canvases = this, e, ctx,
		params, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawLine );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Draw each point
				ctx.beginPath();
				_drawLine( $canvases[ e ], ctx, params, params );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}

		}
	}
	return $canvases;
};

// Draws quadratic curve (internal)
function _drawQuadratic( canvas, ctx, params, path ) {
	var l,
		lx, ly,
		lcx, lcy;

	l = 2;

	_addStartArrow(
		canvas,
		ctx,
		params,
		path,
		path.cx1 + params.x,
		path.cy1 + params.y,
		path.x1 + params.x,
		path.y1 + params.y
	);

	if ( path.x1 !== UNDEFINED && path.y1 !== UNDEFINED ) {
		ctx.moveTo( path.x1 + params.x, path.y1 + params.y );
	}
	while ( TRUE ) {
		// Calculate next coordinates
		lx = path[ 'x' + l ];
		ly = path[ 'y' + l ];
		lcx = path[ 'cx' + ( l - 1 ) ];
		lcy = path[ 'cy' + ( l - 1 ) ];
		// If coordinates are given
		if ( lx !== UNDEFINED && ly !== UNDEFINED && lcx !== UNDEFINED && lcy !== UNDEFINED ) {
			// Draw next curve
			ctx.quadraticCurveTo( lcx + params.x, lcy + params.y, lx + params.x, ly + params.y );
			l += 1;
		} else {
			// Otherwise, stop drawing
			break;
		}
	}
	l -= 1;
	_addEndArrow(
		canvas,
		ctx,
		params,
		path,
		path[ 'cx' + ( l - 1 ) ] + params.x,
		path[ 'cy' + ( l - 1 ) ] + params.y,
		path[ 'x' + l ] + params.x,
		path[ 'y' + l ] + params.y
	);
}

// Draws quadratic curve
$.fn.drawQuadratic = function drawQuadratic( args ) {
	var $canvases = this, e, ctx,
		params, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawQuadratic );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Draw each point
				ctx.beginPath();
				_drawQuadratic( $canvases[ e ], ctx, params, params );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}
		}
	}
	return $canvases;
};

// Draws Bezier curve (internal)
function _drawBezier( canvas, ctx, params, path ) {
	var l, lc,
		lx, ly,
		lcx1, lcy1,
		lcx2, lcy2;

	l = 2;
	lc = 1;

	_addStartArrow(
		canvas,
		ctx,
		params,
		path,
		path.cx1 + params.x,
		path.cy1 + params.y,
		path.x1 + params.x,
		path.y1 + params.y
	);

	if ( path.x1 !== UNDEFINED && path.y1 !== UNDEFINED ) {
		ctx.moveTo( path.x1 + params.x, path.y1 + params.y );
	}
	while ( TRUE ) {
		// Calculate next coordinates
		lx = path[ 'x' + l ];
		ly = path[ 'y' + l ];
		lcx1 = path[ 'cx' + lc ];
		lcy1 = path[ 'cy' + lc ];
		lcx2 = path[ 'cx' + ( lc + 1 ) ];
		lcy2 = path[ 'cy' + ( lc + 1 ) ];
		// If next coordinates are given
		if ( lx !== UNDEFINED && ly !== UNDEFINED && lcx1 !== UNDEFINED && lcy1 !== UNDEFINED && lcx2 !== UNDEFINED && lcy2 !== UNDEFINED ) {
			// Draw next curve
			ctx.bezierCurveTo( lcx1 + params.x, lcy1 + params.y, lcx2 + params.x, lcy2 + params.y, lx + params.x, ly + params.y );
			l += 1;
			lc += 2;
		} else {
			// Otherwise, stop drawing
			break;
		}
	}
	l -= 1;
	lc -= 2;
	_addEndArrow(
		canvas,
		ctx,
		params,
		path,
		path[ 'cx' + ( lc + 1 ) ] + params.x,
		path[ 'cy' + ( lc + 1 ) ] + params.y,
		path[ 'x' + l ] + params.x,
		path[ 'y' + l ] + params.y
	);
}

// Draws Bezier curve
$.fn.drawBezier = function drawBezier( args ) {
	var $canvases = this, e, ctx,
		params, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawBezier );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Draw each point
				ctx.beginPath();
				_drawBezier( $canvases[ e ], ctx, params, params );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}
		}
	}
	return $canvases;
};

// Retrieves the x-coordinate for the given vector angle and length
function _getVectorX( params, angle, length ) {
	angle *= params._toRad;
	angle -= ( PI / 2 );
	return ( length * cos( angle ) );
}
// Retrieves the y-coordinate for the given vector angle and length
function _getVectorY( params, angle, length ) {
	angle *= params._toRad;
	angle -= ( PI / 2 );
	return ( length * sin( angle ) );
}

// Draws vector (internal) #2
function _drawVector( canvas, ctx, params, path ) {
	var l, angle, length,
		offsetX, offsetY,
		x, y,
		x2, y2,
		x3, y3,
		x4, y4;

	// Determine offset from dragging
	if ( params === path ) {
		offsetX = 0;
		offsetY = 0;
	} else {
		offsetX = params.x;
		offsetY = params.y;
	}

	l = 1;
	x = x2 = x3 = x4 = path.x + offsetX;
	y = y2 = y3 = y4 = path.y + offsetY;

	_addStartArrow(
		canvas, ctx,
		params, path,
		x + _getVectorX( params, path.a1, path.l1 ),
		y + _getVectorY( params, path.a1, path.l1 ),
		x,
		y
	);

	// The vector starts at the given ( x, y ) coordinates
	if ( path.x !== UNDEFINED && path.y !== UNDEFINED ) {
		ctx.moveTo( x, y );
	}
	while ( TRUE ) {

		angle = path[ 'a' + l ];
		length = path[ 'l' + l ];

		if ( angle !== UNDEFINED && length !== UNDEFINED ) {
			// Convert the angle to radians with 0 degrees starting at north
			// Keep track of last two coordinates
			x3 = x4;
			y3 = y4;
			// Compute ( x, y ) coordinates from angle and length
			x4 += _getVectorX( params, angle, length );
			y4 += _getVectorY( params, angle, length );
			// Store the second point
			if ( l === 1 ) {
				x2 = x4;
				y2 = y4;
			}
			ctx.lineTo( x4, y4 );
			l += 1;
		} else {
			// Otherwise, stop drawing
			break;
		}

	}
	_addEndArrow(
		canvas, ctx,
		params, path,
		x3, y3,
		x4, y4
	);
}

// Draws vector
$.fn.drawVector = function drawVector( args ) {
	var $canvases = this, e, ctx,
		params, layer;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawVector );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Draw each point
				ctx.beginPath();
				_drawVector( $canvases[ e ], ctx, params, params );
				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}
		}
	}
	return $canvases;
};

// Draws a path consisting of one or more subpaths
$.fn.drawPath = function drawPath( args ) {
	var $canvases = this, e, ctx,
		params, layer,
		l, lp;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawPath );
			if ( params.visible ) {

				_transformShape( $canvases[ e ], ctx, params );
				_setGlobalProps( $canvases[ e ], ctx, params );

				ctx.beginPath();
				l = 1;
				while ( TRUE ) {
					lp = params[ 'p' + l ];
					if ( lp !== UNDEFINED ) {
						lp = new jCanvasObject( lp );
						if ( lp.type === 'line' ) {
							_drawLine( $canvases[ e ], ctx, params, lp );
						} else if ( lp.type === 'quadratic' ) {
							_drawQuadratic( $canvases[ e ], ctx, params, lp );
						} else if ( lp.type === 'bezier' ) {
							_drawBezier( $canvases[ e ], ctx, params, lp );
						} else if ( lp.type === 'vector' ) {
							_drawVector( $canvases[ e ], ctx, params, lp );
						} else if ( lp.type === 'arc' ) {
							_drawArc( $canvases[ e ], ctx, params, lp );
						}
						l += 1;
					} else {
						break;
					}
				}

				// Check for jCanvas events
				_detectEvents( $canvases[ e ], ctx, params );
				// Optionally close path
				_closePath( $canvases[ e ], ctx, params );

			}

		}
	}
	return $canvases;
};

/* Text API */

// Calculates font string and set it as the canvas font
function _setCanvasFont( canvas, ctx, params ) {
	// Otherwise, use the given font attributes
	if ( !isNaN( Number( params.fontSize ) ) ) {
		// Give font size units if it doesn't have any
		params.fontSize += 'px';
	}
	// Set font using given font properties
	ctx.font = params.fontStyle + ' ' + params.fontSize + ' ' + params.fontFamily;
}

// Measures canvas text
function _measureText( canvas, ctx, params, lines ) {
	var originalSize, curWidth, l,
		propCache = caches.propCache;

	// Used cached width/height if possible
	if ( propCache.text === params.text && propCache.fontStyle === params.fontStyle && propCache.fontSize === params. fontSize && propCache.fontFamily === params.fontFamily && propCache.maxWidth === params.maxWidth && propCache.lineHeight === params.lineHeight ) {

		params.width = propCache.width;
		params.height = propCache.height;

	} else {
		// Calculate text dimensions only once

		// Calculate width of first line ( for comparison )
		params.width = ctx.measureText( lines[ 0 ] ).width;

		// Get width of longest line
		for ( l = 1; l < lines.length; l += 1 ) {

			curWidth = ctx.measureText( lines[ l ] ).width;
			// Ensure text's width is the width of its longest line
			if ( curWidth > params.width ) {
				params.width = curWidth;
			}

		}

		// Save original font size
		originalSize = canvas.style.fontSize;
		// Temporarily set canvas font size to retrieve size in pixels
		canvas.style.fontSize = params.fontSize;
		// Save text width and height in parameters object
		params.height = parseFloat( $.css( canvas, 'fontSize' ) ) * lines.length * params.lineHeight;
		// Reset font size to original size
		canvas.style.fontSize = originalSize;
	}
}

// Wraps a string of text within a defined width
function _wrapText( ctx, params ) {
	var allText = String(params.text),
		// Maximum line width ( optional )
		maxWidth = params.maxWidth,
		// Lines created by manual line breaks ( \n )
		manualLines = allText.split( '\n' ),
		// All lines created manually and by wrapping
		allLines = [],
		// Other variables
		lines, line, l,
		text, words, w;

	// Loop through manually-broken lines
	for ( l = 0; l < manualLines.length; l += 1 ) {

		text = manualLines[ l ];
		// Split line into list of words
		words = text.split( ' ' );
		lines = [];
		line = '';

		// If text is short enough initially
		// Or, if the text consists of only one word
		if ( words.length === 1 || ctx.measureText( text ).width < maxWidth ) {

			// No need to wrap text
			lines = [ text ];

		} else {

			// Wrap lines
			for ( w = 0; w < words.length; w += 1 ) {

				// Once line gets too wide, push word to next line
				if ( ctx.measureText( line + words[ w ] ).width > maxWidth ) {
					// This check prevents empty lines from being created
					if ( line !== '' ) {
						lines.push( line );
					}
					// Start new line and repeat process
					line = '';
				}
				// Add words to line until the line is too wide
				line += words[ w ];
				// Do not add a space after the last word
				if ( w !== ( words.length - 1 ) ) {
					line += ' ';
				}
			}
			// The last word should always be pushed
			lines.push( line );

		}
		// Remove extra space at the end of each line
		allLines = allLines.concat(
			lines
			.join( '\n' )
			.replace( /( (\n))|( $)/gi, '$2' )
			.split( '\n' )
		);

	}

	return allLines;
}

// Draws text on canvas
$.fn.drawText = function drawText( args ) {
	var $canvases = this, $canvas, e, ctx,
		params, layer,
		lines, line, l,
		fontSize, constantCloseness = 500,
		nchars, chars, ch, c,
		x, y;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawText );
			if ( params.visible ) {

				// Set text-specific properties
				ctx.textBaseline = params.baseline;
				ctx.textAlign = params.align;

				// Set canvas font using given properties
				_setCanvasFont( $canvases[ e ], ctx, params );

				if ( params.maxWidth !== NULL ) {
					// Wrap text using an internal function
					lines = _wrapText( ctx, params );
				} else {
					// Convert string of text to list of lines
					lines = params.text
					.toString()
					.split( '\n' );
				}

				// Calculate text's width and height
				_measureText( $canvases[ e ], ctx, params, lines );

				// If text is a layer
				if ( layer ) {
					// Copy calculated width/height to layer object
					layer.width = params.width;
					layer.height = params.height;
				}

				_transformShape( $canvases[ e ], ctx, params, params.width, params.height );
				_setGlobalProps( $canvases[ e ], ctx, params );

				// Adjust text position to accomodate different horizontal alignments
				x = params.x;
				if ( params.align === 'left' ) {
					if ( params.respectAlign ) {
						// Realign text to the left if chosen
						params.x += params.width / 2;
					} else {
						// Center text block by default
						x -= params.width / 2;
					}
				} else if ( params.align === 'right' ) {
					if ( params.respectAlign ) {
						// Realign text to the right if chosen
						params.x -= params.width / 2;
					} else {
						// Center text block by default
						x += params.width / 2;
					}
				}

				if ( params.radius ) {

					fontSize = parseFloat( params.fontSize );

					// Greater values move clockwise
					if ( params.letterSpacing === NULL ) {
						params.letterSpacing = fontSize / constantCloseness;
					}

					// Loop through each line of text
					for ( l = 0; l < lines.length; l += 1 ) {
						ctx.save();
						ctx.translate( params.x, params.y );
						line = lines[ l ];
						if ( params.flipArcText ) {
							chars = line.split( '' );
							chars.reverse();
							line = chars.join( '' );
						}
						nchars = line.length;
						ctx.rotate( -( PI * params.letterSpacing * ( nchars - 1 ) ) / 2 );
						// Loop through characters on each line
						for ( c = 0; c < nchars; c += 1 ) {
							ch = line[ c ];
							// If character is not the first character
							if ( c !== 0 ) {
								// Rotate character onto arc
								ctx.rotate( PI * params.letterSpacing );
							}
							ctx.save();
							ctx.translate( 0, -params.radius );
							if ( params.flipArcText ) {
								ctx.scale( -1, -1 );
							}
							ctx.fillText( ch, 0, 0 );
							// Prevent extra shadow created by stroke ( but only when fill is present )
							if ( params.fillStyle !== 'transparent' ) {
								ctx.shadowColor = 'transparent';
							}
							if ( params.strokeWidth !== 0 ) {
								// Only stroke if the stroke is not 0
								ctx.strokeText( ch, 0, 0 );
							}
							ctx.restore();
						}
						params.radius -= fontSize;
						params.letterSpacing += fontSize / ( constantCloseness * 2 * PI );
						ctx.restore();
					}

				} else {

					// Draw each line of text separately
					for ( l = 0; l < lines.length; l += 1 ) {
						line = lines[ l ];
						// Add line offset to center point, but subtract some to center everything
						y = params.y + ( l * params.height / lines.length ) - ( ( lines.length - 1 ) * params.height / lines.length ) / 2;

						ctx.shadowColor = params.shadowColor;

						// Fill & stroke text
						ctx.fillText( line, x, y );
						// Prevent extra shadow created by stroke ( but only when fill is present )
						if ( params.fillStyle !== 'transparent' ) {
							ctx.shadowColor = 'transparent';
						}
						if ( params.strokeWidth !== 0 ) {
							// Only stroke if the stroke is not 0
							ctx.strokeText( line, x, y );
						}

					}

				}

				// Adjust bounding box according to text baseline
				y = 0;
				if ( params.baseline === 'top' ) {
					y += params.height / 2;
				} else if ( params.baseline === 'bottom' ) {
					y -= params.height / 2;
				}

				// Detect jCanvas events
				if ( params._event ) {
					ctx.beginPath();
					ctx.rect(
						params.x - params.width / 2,
						params.y - params.height / 2 + y,
						params.width,
						params.height
					);
					_detectEvents( $canvases[ e ], ctx, params );
					// Close path and configure masking
					ctx.closePath();
				}
				_restoreTransform( ctx, params );

			}
		}
	}
	// Cache jCanvas parameters object for efficiency
	caches.propCache = params;
	return $canvases;
};

// Measures text width/height using the given parameters
$.fn.measureText = function measureText( args ) {
	var $canvases = this, ctx,
		params, lines;

	// Attempt to retrieve layer
	params = $canvases.getLayer( args );
	// If layer does not exist or if returned object is not a jCanvas layer
	if ( !params || ( params && !params._layer ) ) {
		params = new jCanvasObject( args );
	}

	ctx = _getContext( $canvases[ 0 ] );
	if ( ctx ) {

		// Set canvas font using given properties
		_setCanvasFont( $canvases[ 0 ], ctx, params );
		// Calculate width and height of text
		lines = _wrapText( ctx, params );
		_measureText( $canvases[ 0 ], ctx, params, lines );


	}

	return params;
};

/* Image API */

// Draws image on canvas
$.fn.drawImage = function drawImage( args ) {
	var $canvases = this, canvas, e, ctx, data,
		params, layer,
		img, imgCtx, source,
		imageCache = caches.imageCache;

	// Draw image function
	function draw( canvas, ctx, data, params, layer ) {

		// If width and sWidth are not defined, use image width
		if ( params.width === NULL && params.sWidth === NULL ) {
			params.width = params.sWidth = img.width;
		}
		// If width and sHeight are not defined, use image height
		if ( params.height === NULL && params.sHeight === NULL ) {
			params.height = params.sHeight = img.height;
		}

		// Ensure image layer's width and height are accurate
		if ( layer ) {
			layer.width = params.width;
			layer.height = params.height;
		}

		// Only crop image if all cropping properties are given
		if ( params.sWidth !== NULL && params.sHeight !== NULL && params.sx !== NULL && params.sy !== NULL ) {

			// If width is not defined, use the given sWidth
			if ( params.width === NULL ) {
				params.width = params.sWidth;
			}
			// If height is not defined, use the given sHeight
			if ( params.height === NULL ) {
				params.height = params.sHeight;
			}

			// Optionally crop from top-left corner of region
			if ( params.cropFromCenter ) {
				params.sx += params.sWidth / 2;
				params.sy += params.sHeight / 2;
			}

			// Ensure cropped region does not escape image boundaries

			// Top
			if ( ( params.sy - ( params.sHeight / 2 ) ) < 0 ) {
				params.sy = ( params.sHeight / 2 );
			}
			// Bottom
			if ( ( params.sy + ( params.sHeight / 2 ) ) > img.height ) {
				params.sy = img.height - ( params.sHeight / 2 );
			}
			// Left
			if ( ( params.sx - ( params.sWidth / 2 ) ) < 0 ) {
				params.sx = ( params.sWidth / 2 );
			}
			// Right
			if ( ( params.sx + ( params.sWidth / 2 ) ) > img.width ) {
				params.sx = img.width - ( params.sWidth / 2 );
			}

			_transformShape( canvas, ctx, params, params.width, params.height );
			_setGlobalProps( canvas, ctx, params );

			// Draw image
			ctx.drawImage(
				img,
				params.sx - params.sWidth / 2,
				params.sy - params.sHeight / 2,
				params.sWidth,
				params.sHeight,
				params.x - params.width / 2,
				params.y - params.height / 2,
				params.width,
				params.height
			);

		} else {
			// Show entire image if no crop region is defined

			_transformShape( canvas, ctx, params, params.width, params.height );
			_setGlobalProps( canvas, ctx, params );

			// Draw image on canvas
			ctx.drawImage(
				img,
				params.x - params.width / 2,
				params.y - params.height / 2,
				params.width,
				params.height
			);

		}

		// Draw invisible rectangle to allow for events and masking
		ctx.beginPath();
		ctx.rect(
			params.x - params.width / 2,
			params.y - params.height / 2,
			params.width,
			params.height
		);
		// Check for jCanvas events
		_detectEvents( canvas, ctx, params );
		// Close path and configure masking
		ctx.closePath();
		_restoreTransform( ctx, params );
		_enableMasking( ctx, data, params );
	}
	// On load function
	function onload( canvas, ctx, data, params, layer ) {
		return function () {
			var $canvas = $( canvas );
			draw( canvas, ctx, data, params, layer );
			if ( params.layer ) {
				// Trigger 'load' event for layers
				_triggerLayerEvent( $canvas, data, layer, 'load' );
			} else if ( params.load ) {
				// Run 'load' callback for non-layers
				params.load.call( $canvas[ 0 ], layer );
			}
			// Continue drawing successive layers after this image layer has loaded
			if ( params.layer ) {
				// Store list of previous masks for each layer
				layer._masks = data.transforms.masks.slice( 0 );
				if ( params._next ) {
					// Draw successive layers
					$canvas.drawLayers( {
						clear: FALSE,
						resetFire: TRUE,
						index: params._next
					} );
				}
			}
		};
	}
	for ( e = 0; e < $canvases.length; e += 1 ) {
		canvas = $canvases[ e ];
		ctx = _getContext( $canvases[ e ] );
		if ( ctx ) {

			data = _getCanvasData( $canvases[ e ] );
			params = new jCanvasObject( args );
			layer = _addLayer( $canvases[ e ], params, args, drawImage );
			if ( params.visible ) {

				// Cache the given source
				source = params.source;

				imgCtx = source.getContext;
				if ( source.src || imgCtx ) {
					// Use image or canvas element if given
					img = source;
				} else if ( source ) {
					if ( imageCache[ source ] && imageCache[ source ].complete ) {
						// Get the image element from the cache if possible
						img = imageCache[ source ];
					} else {
						// Otherwise, get the image from the given source URL
						img = new Image();
						// If source URL is not a data URL
						if ( ! source.match( /^data:/i ) ) {
							// Set crossOrigin for this image
							img.crossOrigin = params.crossOrigin;
						}
						img.src = source;
						// Save image in cache for improved performance
						imageCache[ source ] = img;
					}
				}

				if ( img ) {
					if ( img.complete || imgCtx ) {
						// Draw image if already loaded
						onload( canvas, ctx, data, params, layer )();
					} else {
						// Otherwise, draw image when it loads
						img.onload = onload( canvas, ctx, data, params, layer );
						// Fix onload() bug in IE9
						img.src = img.src;
					}
				}

			}
		}
	}
	return $canvases;
};

// Creates a canvas pattern object
$.fn.createPattern = function createPattern( args ) {
	var $canvases = this, ctx,
		params,
		img, imgCtx,
		pattern, source;

	// Function to be called when pattern loads
	function onload() {
		// Create pattern
		pattern = ctx.createPattern( img, params.repeat );
		// Run callback function if defined
		if ( params.load ) {
			params.load.call( $canvases[ 0 ], pattern );
		}
	}

	ctx = _getContext( $canvases[ 0 ] );
	if ( ctx ) {

		params = new jCanvasObject( args );

		// Cache the given source
		source = params.source;

		// Draw when image is loaded ( if load() callback function is defined )

		if ( isFunction( source ) ) {
			// Draw pattern using function if given

			img = $( '<canvas />' )[ 0 ];
			img.width = params.width;
			img.height = params.height;
			imgCtx = _getContext( img );
			source.call( img, imgCtx );
			onload();

		} else {
			// Otherwise, draw pattern using source image

			imgCtx = source.getContext;
			if ( source.src || imgCtx ) {
				// Use image element if given
				img = source;
			} else {
				// Use URL if given to get the image
				img = new Image();
				// If source URL is not a data URL
				if ( ! source.match( /^data:/i ) ) {
					// Set crossOrigin for this image
					img.crossOrigin = params.crossOrigin;
				}
				img.src = source;
			}

			// Create pattern if already loaded
			if ( img.complete || imgCtx ) {
				onload();
			} else {
				img.onload = onload;
				// Fix onload() bug in IE9
				img.src = img.src;
			}

		}

	} else {

		pattern = NULL;

	}
	return pattern;
};

// Creates a canvas gradient object
$.fn.createGradient = function createGradient( args ) {
	var $canvases = this, ctx,
		params,
		gradient,
		stops = [], nstops,
		start, end,
		i, a, n, p;

	params = new jCanvasObject( args );
	ctx = _getContext( $canvases[ 0 ] );
	if ( ctx ) {

		// Gradient coordinates must be defined
		params.x1 = params.x1 || 0;
		params.y1 = params.y1 || 0;
		params.x2 = params.x2 || 0;
		params.y2 = params.y2 || 0;

		if ( params.r1 !== NULL && params.r2 !== NULL ) {
			// Create radial gradient if chosen
			gradient = ctx.createRadialGradient( params.x1, params.y1, params.r1, params.x2, params.y2, params.r2 );
		} else {
			// Otherwise, create a linear gradient by default
			gradient = ctx.createLinearGradient( params.x1, params.y1, params.x2, params.y2 );
		}

		// Count number of color stops
		for ( i = 1; params[ 'c' + i ] !== UNDEFINED; i += 1 ) {
			if ( params[ 's' + i ] !== UNDEFINED ) {
				stops.push( params[ 's' + i ] );
			} else {
				stops.push( NULL );
			}
		}
		nstops = stops.length;

		// Define start stop if not already defined
		if ( stops[ 0 ] === NULL ) {
			stops[ 0 ] = 0;
		}
		// Define end stop if not already defined
		if ( stops[ nstops - 1 ] === NULL ) {
			stops[ nstops - 1 ] = 1;
		}

		// Loop through color stops to fill in the blanks
		for ( i = 0; i < nstops; i += 1 ) {
			// A progression, in this context, is defined as all of the color stops between and including two known color stops

			if ( stops[ i ] !== NULL ) {
				// Start a new progression if stop is a number

				// Number of stops in current progression
				n = 1;
				// Current iteration in current progression
				p = 0;
				start = stops[ i ];

				// Look ahead to find end stop
				for ( a = ( i + 1 ); a < nstops; a += 1 ) {
					if ( stops[ a ] !== NULL ) {
						// If this future stop is a number, make it the end stop for this progression
						end = stops[ a ];
						break;
					} else {
						// Otherwise, keep looking ahead
						n += 1;
					}
				}

				// Ensure start stop is not greater than end stop
				if ( start > end ) {
					stops[ a ] = stops[ i ];
				}

			} else if ( stops[ i ] === NULL ) {
				// Calculate stop if not initially given
				p += 1;
				stops[ i ] = start + ( p * ( ( end - start ) / n ) );
			}
			// Add color stop to gradient object
			gradient.addColorStop( stops[ i ], params[ 'c' + ( i + 1 ) ] );
		}

	} else {
		gradient = NULL;
	}
	return gradient;
};

// Manipulates pixels on the canvas
$.fn.setPixels = function setPixels( args ) {
	var $canvases = this,
		canvas, e, ctx,
		params, layer,
		px,
		imgData, data, i, len;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		canvas = $canvases[ e ];
		ctx = _getContext( canvas );
		if ( ctx ) {

			params = new jCanvasObject( args );
			layer = _addLayer( canvas, params, args, setPixels );
			_transformShape( $canvases[ e ], ctx, params, params.width, params.height );

			// Use entire canvas of x, y, width, or height is not defined
			if ( params.width === NULL || params.height === NULL ) {
				params.width = canvas.width;
				params.height = canvas.height;
				params.x = params.width / 2;
				params.y = params.height / 2;
			}

			if ( params.width !== 0 && params.height !== 0 ) {
				// Only set pixels if width and height are not zero

				imgData = ctx.getImageData( params.x - ( params.width / 2 ), params.y - ( params.height / 2 ), params.width, params.height );
				data = imgData.data;
				len = data.length;

				// Loop through pixels with the "each" callback function
				if ( params.each ) {
					for ( i = 0; i < len; i += 4 ) {
						px = {
							r: data[ i ],
							g: data[ i + 1 ],
							b: data[ i + 2 ],
							a: data[ i + 3 ]
						};
						params.each.call( canvas, px, params );
						data[ i ] = px.r;
						data[ i + 1 ] = px.g;
						data[ i + 2 ] = px.b;
						data[ i + 3 ] = px.a;
					}
				}
				// Put pixels on canvas
				ctx.putImageData( imgData, params.x - ( params.width / 2 ), params.y - ( params.height / 2 ) );
				// Restore transformation
				ctx.restore();

			}

		}
	}
	return $canvases;
};

// Retrieves canvas image as data URL
$.fn.getCanvasImage = function getCanvasImage( type, quality ) {
	var $canvases = this, canvas,
		dataURL = NULL;
	if ( $canvases.length !== 0 ) {
		canvas = $canvases[ 0 ];
		if ( canvas.toDataURL ) {
			// JPEG quality defaults to 1
			if ( quality === UNDEFINED ) {
				quality = 1;
			}
			dataURL = canvas.toDataURL( 'image/' + type, quality );
		}
	}
	return dataURL;
};

// Scales canvas based on the device's pixel ratio
$.fn.detectPixelRatio = function detectPixelRatio( callback ) {
	var $canvases = this,
		$canvas, canvas, e, ctx,
		devicePixelRatio, backingStoreRatio, ratio,
		oldWidth, oldHeight,
		data;

	for ( e = 0; e < $canvases.length; e += 1 ) {
		// Get canvas and its associated data
		canvas = $canvases[ e ];
		$canvas = $( $canvases[ e ] );
		ctx = _getContext( canvas );
		data = _getCanvasData( $canvases[ e ] );

		// If canvas has not already been scaled with this method
		if ( !data.scaled ) {

			// Determine device pixel ratios
			devicePixelRatio = window.devicePixelRatio || 1;
			backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
				ctx.mozBackingStorePixelRatio ||
				ctx.msBackingStorePixelRatio ||
				ctx.oBackingStorePixelRatio ||
				ctx.backingStorePixelRatio || 1;

			// Calculate general ratio based on the two given ratios
			ratio = devicePixelRatio / backingStoreRatio;

			if ( ratio !== 1 ) {
				// Scale canvas relative to ratio

				// Get the current canvas dimensions for future use
				oldWidth = canvas.width;
				oldHeight = canvas.height;

				// Resize canvas relative to the determined ratio
				canvas.width = oldWidth * ratio;
				canvas.height = oldHeight * ratio;

				// Scale canvas back to original dimensions via CSS
				canvas.style.width = oldWidth + 'px';
				canvas.style.height = oldHeight + 'px';

				// Scale context to counter the manual scaling of canvas
				ctx.scale( ratio, ratio );

			}

			// Set pixel ratio on canvas data object
			data.pixelRatio = ratio;
			// Ensure that this method can only be called once for any given canvas
			data.scaled = TRUE;

			// Call the given callback function with the ratio as its only argument
			if ( callback ) {
				callback.call( canvas, ratio );
			}

		}

	}
	return $canvases;
};

// Clears the jCanvas cache
jCanvas.clearCache = function clearCache() {
	var cacheName;
	for ( cacheName in caches ) {
		if ( caches.hasOwnProperty( cacheName ) ) {
			caches[ cacheName ] = {};
		}
	}
};

// Enable canvas feature detection with $.support
$.support.canvas = ( $( '<canvas />' )[ 0 ].getContext !== UNDEFINED );

// Export jCanvas functions
extendObject( jCanvas, {
	defaults: defaults,
	setGlobalProps: _setGlobalProps,
	transformShape: _transformShape,
	detectEvents: _detectEvents,
	closePath: _closePath,
	setCanvasFont: _setCanvasFont,
	measureText: _measureText
} );
$.jCanvas = jCanvas;
$.jCanvasObject = jCanvasObject;

}));
(function() {
  var PresentationLayer;

  PresentationLayer = (function() {
    PresentationLayer.include(ImageExport);

    PresentationLayer.include(CropToPaper);

    function PresentationLayer(canvas1, seeker1) {
      this.canvas = canvas1;
      this.seeker = seeker1;
      this.engine = new Engine();
      this.drawThePaper();
      this.attachInputHandlersTo(this.canvas, this.seeker);
    }

    PresentationLayer.prototype.attachInputHandlersTo = function(canvas, seeker) {
      var Engine, self;
      Engine = this.engine;
      self = this;
      canvas.ondrop = function(event) {
        event.preventDefault();
        return uploadFileFrom(event, function(image) {
          var actorId;
          actorId = uniqueId();
          return $(canvas).drawImage({
            name: actorId,
            source: image.src,
            draggable: true,
            x: event.layerX,
            y: event.layerY,
            scale: 0.3,
            add: function(actor) {
              return Engine.updateOrCreateKeyframe(actor, self.currentFrame());
            },
            dragstop: function(actor) {
              return Engine.updateOrCreateKeyframe(actor, self.currentFrame());
            }
          });
        });
      };
      seeker.oninput = function(event) {
        return self.drawFrame(parseInt(event.target.value));
      };
      return canvas.ondragover = function(event) {
        return event.preventDefault();
      };
    };

    PresentationLayer.prototype.currentFrame = function() {
      return parseInt(this.seeker.value);
    };

    PresentationLayer.prototype.drawFrame = function(frame) {
      var actor, i, len, ref;
      ref = Keyframe.allActors();
      for (i = 0, len = ref.length; i < len; i++) {
        actor = ref[i];
        $(this.canvas).setLayer(actor.name, this.engine.interpolate(actor, frame).state);
      }
      return $(this.canvas).drawLayers();
    };

    PresentationLayer.prototype.eachFrameOfAutoCroppedSequence = function(callback) {
      var frameNum, i, len, ref, results;
      ref = Keyframe.rangeOfFrames();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        frameNum = ref[i];
        results.push(callback(frameNum));
      }
      return results;
    };

    return PresentationLayer;

  })();

  window.PresentationLayer = PresentationLayer;

}).call(this);
