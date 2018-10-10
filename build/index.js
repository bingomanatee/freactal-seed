module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(3);


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: external "bottlejs"
var external__bottlejs_ = __webpack_require__(4);
var external__bottlejs__default = /*#__PURE__*/__webpack_require__.n(external__bottlejs_);

// EXTERNAL MODULE: external "lodash"
var external__lodash_ = __webpack_require__(0);
var external__lodash__default = /*#__PURE__*/__webpack_require__.n(external__lodash_);

// CONCATENATED MODULE: ./src/Seed.js


/* harmony default export */ var src_Seed = (bottle => {
  bottle.constant('noop', a => a);
  bottle.factory('Seed', container => class Seed {

    constructor(initialState = {}, serializationSource = container.SEED_SERIALIZATION_NONE) {
      if (serializationSource === true) {
        serializationSource = container.SEED_SERIALIZATION_LOCAL_STORAGE;
      }
      this._propsMap = new Map();
      this._middleware = [];
      for (let key in initialState) {
        this._propsMap.set(key, initialState[key]);
      }
      this._effectsMap = new Map();
      this._initializers = [];
      this._localStorageAdded = false;
      this._serializationSource = serializationSource;
    }

    get initialState() {
      return () => {
        let hash = {};
        this._propsMap.forEach((data, key) => {
          hash[key] = data.value;
          if (container.localStorageHas(key)) {
            if (data.deserialize) {
              hash[key] = data.deserialize(container.localStorage.getItem(key));
            } else {
              hash[key] = container.deserialize(container.localStorage.getItem(key), data.type);
            }
          }
        });
        if (this.initialStateFilter) {
          return this.initialStateFilter(hash);
        }
        return hash;
      };
    }

    get initialStateFilter() {
      return this._initialStateFilter;
    }

    set initialStateFilter(value) {
      if (value && !external__lodash__default.a.isFunction(value)) {
        throw new Error('initialStateFilter must be function ');
      }

      this._initialStateFilter = value;
    }

    /**
     * Computed seems buggy in freactal; not enabling it here.
     * @returns {{}}
     */
    get computed() {
      return {};
    }

    get effects() {
      let hash = {};
      this._effectsMap.forEach((value, key) => hash[key] = value);
      if (this._initializers.length) {
        hash.initialize = state => this._makeInitializers(hash);
      }
      return hash;
    }

    useLocalStorage(use = true) {
      this.serializationSource = use ? container.SEED_SERIALIZATION_LOCAL_STORAGE : container.SEED_SERIALIZATION_NONE;
    }

    get serializationSource() {
      return this._serializationSource;
    }

    set serializationSource(value) {
      if (value !== this._serializationSource && this._localStorageAdded) {
        throw new Error('attempt to change serialization type after it has been added to the middleware');
      }
      this._serializationSource = value;
    }

    /**
     * add a single effect method to the effects collection
     * @param key {string} the name of the effect
     * @param method {function} the effect
     */
    addEffect(key, method) {
      this._effectsMap.set(key, method);
      return this;
    }

    /**
     * Adds a value to the state collection. The Type is a hint
     * that assists the serializers when syncing to localStorage.
     *
     * @param key {string} prop name
     * @param value {var} initial value of the prop.
     * @param type {string} the type of value to be stored.
     * @param options {Object} extensions
     */
    addStateProp(key, value = null, type = container.SEED_TYPE_STRING, options = {}) {
      if (this._propsMap.has(key)) {
        let data = this._propsMap.get(key);
        data.value = value;
        data.type = type;
        this._propsMap.set(key, data);
      } else {
        this._propsMap.set(key, Object.assign({}, options, { value, type }));
      }
      return this;
    }

    addStateString(key, value, options = {}) {
      this.addStateProp(key, value, container.SEED_TYPE_STRING, options);
      return this;
    }

    addStateInt(key, value, options = {}) {
      this.addStateProp(key, value, container.SEED_TYPE_INT, options);
      return this;
    }

    addStateObject(key, value, options = {}) {
      this.addStateProp(key, value, container.SEED_TYPE_OBJECT, options);
      return this;
    }

    addStateFloat(key, value, options = {}) {
      this.addStateProp(key, value, container.SEED_TYPE_FLOAT, options);
      return this;
    }

    /**
     * Both creates a default value for a property and a set method.
     *   for example if you want to add an int property called "priority"
     *   addPropAndSetEffect both creates a property
     *
     *
     * @param name {String}
     * @param value {var}
     * @param type {String}
     * @param options {Object}
     */
    addPropAndSetEffect(name, value, type = container.SEED_TYPE_STRING, options = {}) {
      this.addStateProp(name, value, type, options);
      this._addSetEffect(name, type, options);
      return this;
    }

    addStringAndSetEffect(name, value, options = {}) {
      this.addPropAndSetEffect(name, value, container.SEED_TYPE_STRING, options);
      return this;
    }

    addIntAndSetEffect(name, value, options = {}) {
      this.addPropAndSetEffect(name, value, container.SEED_TYPE_INT, options);
      return this;
    }

    addFloatAndSetEffect(name, value, options = {}) {
      this.addPropAndSetEffect(name, value, container.SEED_TYPE_FLOAT, options);
      return this;
    }

    addObjectAndSetEffect(name, value, options = {}) {
      this.addPropAndSetEffect(name, value, container.SEED_TYPE_OBJECT, options);
      return this;
    }

    _addSetEffect(name, type = container.SEED_TYPE_STRING, options = {}) {
      let effectName = 'set' + external__lodash__default.a.upperFirst(name);
      const { onSet, filterSet } = options;
      // @TODO: validation ??
      if (onSet) {
        let updateEffectName = 'update' + external__lodash__default.a.upperFirst(name);

        this.addEffect(updateEffectName, (effects, value) => state => {
          if (filterSet) {
            try {
              value = filterSet(value);
            } catch (err) {
              console.log('error setting ', name, 'to', value, err.message);
              return state;
            }
          }
          let hash = {};
          hash[name] = value;
          return Object.assign({}, state, hash);
        });
        this.addEffect(effectName, (effects, value) => state => {
          let onSetAction = external__lodash__default.a.isString(onSet) ? effects[onSet] : state => onSet(effects, state);
          return effects[updateEffectName](value).then(onSetAction);
        });
      } else {
        this.addEffect(effectName, (effects, value) => state => {
          if (filterSet) {
            try {
              value = filterSet(value);
            } catch (err) {
              console.log('error setting ', name, 'to', value, err.message);
              return state;
            }
          }
          let hash = {};
          hash[name] = value;
          return Object.assign({}, state, hash);
        });
      }
    }

    /**
     * do an effect that does not mutate state. It affects things besides state,
     * so the side effect executes and the effect returns state unmodified. .
     *
     * @param name {String}
     * @param method {function}
     */
    addSideEffect(name, method) {
      this.addEffect(name, function (effects, ...args) {
        if (external__lodash__default.a.isString(method)) {
          effects[method](effects, ...args);
          return container.noop;
        }
        method(effects, ...args);
        return container.noop;
      });
      return this;
    }

    /**
     * Allows your method access to state AND effects in one call.
     * @param name {string}
     * @param method {function}
     */
    addStateSideEffect(name, method) {
      this.addEffect(name, (effects, ...args) => state => {
        method(effects, state, ...args);
        return state;
      });
      return this;
    }

    /** adds a series of endpoints for handling array data */
    addArrayPropAndSetEffects(name, value = [], methods = 'push,unshift,map,element') {
      if (methods) {
        if (external__lodash__default.a.isString(methods)) {
          methods = methods.split(',');
        }
      } else {
        methods = false;
      }

      const add = (name, exec) => {
        if (!methods || external__lodash__default.a.includes(methods, name.toLowerCase())) {
          exec();
        } else {
          console.log('addArrayPropAndSetEffects -- skipping ', name);
        }
      };

      const getList = state => (state[name] || []).slice(0);

      const uName = external__lodash__default.a.upperFirst(name);
      //@TODO: add type enforcement for values
      this.addPropAndSetEffect(name, value ? value.slice(0) : [], container.SEED_TYPE_OBJECT);
      add('element', () => {
        this.addEffect(`setElement${uName}`, (effects, key, value) => state => {
          //@TODO: key sanitization
          let list = getList(state);
          list[key] = value;
          effects[`set${uName}`](list);
          return state;
        });
      });

      add('push', () => {
        let pName = `pushTo${uName}`;
        this.addEffect(pName, (effects, value) => state => {
          let list = getList(state);
          list.push(value);
          effects[`set${uName}`](list);
          return state;
        });
      });

      add('unshift', () => {
        this.addEffect(`unshiftTo${uName}`, (effects, value) => state => {
          let list = getList(state);
          list.unshift(value);
          effects[`set${uName}`](list);
          return state;
        });
      });

      add('map', () => {
        this.addEffect(`map${uName}`, (effects, filter) => state => {
          effects[`set${uName}`](getList(state).map(filter));
          return state;
        });
      });
      return this;
    }

    addBoolPropAndEffects(name, value, options) {
      this.addStateProp(name, !!value, container.SEED_TYPE_BOOLEAN, options);
      this._addBoolEffect(name, options);
      return this;
    }

    _addBoolEffect(name, options) {
      this._addSetEffect(name, container.SEED_TYPE_BOOLEAN, options);
      this.addEffect(`${name}On`, container.update(state => {
        let hash = {};
        hash[name] = true;
        return hash;
      }));
      this.addEffect(`${name}Off`, container.update(state => {
        let hash = {};
        hash[name] = false;
        return hash;
      }));
      return this;
    }

    /**
     * adds a middleware pipe to the middleware list.
     * @param method {function}
     */
    addMiddleware(method) {
      this._middleware.push(method);
      return this;
    }

    get middleware() {
      if (container.localStorage && this.serializationSource === container.SEED_SERIALIZATION_LOCAL_STORAGE) {
        this._addLocalStorageMiddleware();
      } // add it at the end of any custom middleware.
      return this._middleware.slice(0);
    }

    _addLocalStorageMiddleware() {
      if (container.localStorage && !this._localStorageAdded) {
        console.log('---- enabling local storage ----');
        this.addMiddleware(freactalCtx => {
          this._propsMap.forEach((data, key) => {
            // note: no way of checking inclusion of key in state ??
            let value = freactalCtx.state[key];
            this._serialize(key, value);
          });
          return freactalCtx;
        });
        this._localStorageAdded = true;
      }
    }

    _serialize(key, value) {
      if (!this._propsMap.has(key)) {
        return;
      }

      const data = this._propsMap.get(key);
      if (data.hasOwnProperty('serialize')) {
        if (data.serialize === false) {
          return;
        }
        container.localStorage.setItem(key, data.serialize(value));
      } else {
        container.localStorage.setItem(key, container.serialize(value, data.type));
      }
    }

    setSerialization(name, serializer, deSerializer) {
      if (this._propsMap.has(name)) {
        let data = this._propsMap.get(name);
        data.serializer = serializer;
        data.deserializer = deSerializer;
      }
      return this;
    }

    /**
     * note - method can be a function or a name of another effect (string).
     * @param method {string | function}
     * @param order {number}
     */
    addInitializer(method, order = 0) {
      this._initializers.push({ method, order });
      return this;
    }

    _makeInitializers() {
      let initializers = external__lodash__default()(this._initializers).sortBy('order').map('method').value();

      if (!initializers.length) {
        return container.noop;
      }

      return state => new Promise(function ($return, $error) {
        var $Loop_4_trampoline, $Loop_4_local;
        function $Loop_4_step() {
          var [init, $iterator_init_3] = $Loop_4_local();return $Loop_4.bind(this, init, $iterator_init_3);
        }
        function $Loop_4(init, $iterator_init_3) {
          $Loop_4_local = function () {
            return [init, $iterator_init_3];
          };
          if (!($iterator_init_3[1] = $iterator_init_3[0].next()).done && ((init = $iterator_init_3[1].value) || true)) {
            let newState;
            return Promise.resolve(init(state)).then(function ($await_6) {
              try {
                newState = $await_6;
                state = newState || state;
                return $Loop_4_step;
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } else return [1];
        }

        return ($Loop_4_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_4_trampoline, $error);try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_4_exit.call(this) : q;else q = $Loop_4_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_4.bind(this, undefined, [initializers[Symbol.iterator]()]));

        function $Loop_4_exit() {
          return $return(state);
        }
      });
    }

    /**
     * This method returns a simple Object with the properties of the seed.
     * Not strictly necessary as Seed will have all the functionality of
     * the returned hash, but for those who prefer "freezing" the signature
     * of the seed, here you go.
     *
     * @returns {{effects, initialState: *, middleware: *}}
     */
    toHash() {
      return {
        effects: this.effects,
        initialState: this.initialState,
        middleware: this.middleware,
        computed: this.computed
      };
    }
  });
});
// CONCATENATED MODULE: ./src/localStorage.js


/* harmony default export */ var src_localStorage = (bottle => {
  /**
   * this is a shim for window to ensure functionality on the server.
   * In the absence of a global window, an empty object is returned.
   */
  bottle.factory('window', container => {
    if (!external__lodash__default.a.isUndefined(window)) {
      return window;
    }
    return {};
  });

  bottle.factory('DOMException', () => {
    if (!external__lodash__default.a.isUndefined(DOMException)) {
      return DOMException;
    } else {
      class NotDomException {}
      return NotDomException;
    }
  });

  bottle.factory('isStorageAvailable', container => function (type) {
    /**
     * this has been extracted from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
     * note, to keep this usable in server / non browser contexts this uses an injected shim for window.
     */
    try {
      var storage = container.window[type],
          x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  });
  bottle.factory('localStorage', container => {
    if (container.isStorageAvailable('localStorage')) {
      return localStorage;
    } else {
      return false;
    }
  });

  bottle.factory('localStorageHas', ({ localStorage }) => {
    if (!localStorage) {
      return () => false;
    }
    return key => {
      let value = localStorage.getItem(key);
      if (value === 'null') {
        // I haven't tracked down how, but in some cases it seems the null value is stringified when serialized in localStorage.
        return false;
      }
      return !!value;
    };
  });
  /**
   * converts a string value to a typed value.
   * @param value
   * @param type {string}
   * @returns {var}
   */
});
// CONCATENATED MODULE: ./src/serialization.js


/* harmony default export */ var serialization = (bottle => {
  ['SEED_TYPE_STRING', 'SEED_TYPE_OBJECT', 'SEED_TYPE_INT', 'SEED_TYPE_FLOAT', 'SEED_TYPE_BOOLEAN', 'SEED_SERIALIZATION_LOCAL_STORAGE', 'SEED_SERIALIZATION_NONE'].forEach(name => bottle.constant(name, name));
  bottle.factory('deserialize', container => (value, type) => {
    if (value === null || external__lodash__default.a.isUndefined(value)) {
      return null;
    }
    let out = value;
    switch (type) {
      case container.SEED_TYPE_OBJECT:
        try {
          return JSON.parse(value);
        } catch (err) {
          // console.log('bad serialization of object ', value, err);
          out = null;
        }
        break;

      case container.SEED_TYPE_INT:
        out = parseInt(value);
        if (isNaN(out)) {
          out = 0;
        }
        break;

      case container.SEED_TYPE_FLOAT:
        out = parseFloat(value);
        if (isNaN(out)) {
          out = 0;
        }
        break;

      // note - booleans are serialized into '1' or '0';
      case container.SEED_TYPE_BOOLEAN:
        out = out === '1';
        break;

      default:
        const methodName = `deserialize_${type}`;
        if (container[methodName] && external__lodash__default.a.isFunction(container[methodName])) {
          out = container[methodName](value);
        }
    }
    return out;
  });

  bottle.factory('serialize', container => (value, type) => {
    if (value === null || external__lodash__default.a.isUndefined(value)) {
      return null;
    }
    if (!type) {
      type = container.SEED_TYPE_STRING;
    }

    let out = value;
    switch (type) {
      case container.SEED_TYPE_OBJECT:
        try {
          out = JSON.stringify(value);
        } catch (err) {
          // console.log('bad serialization of object: ', value, err);
          out = null;
        }
        break;

      case container.SEED_TYPE_INT:
        out = isNaN(value) ? '0' : Math.floor(value).toString();
        break;

      case container.SEED_TYPE_FLOAT:
        out = isNaN(value) ? '0' : value.toString();
        break;

      case container.SEED_TYPE_BOOLEAN:
        out = value ? '1' : '0';
        break;

      case container.SEED_TYPE_STRING:
        out = external__lodash__default.a.toString(value);
        break;

      default:
        // allow for extensions:
        const methodName = `serialize_${type}`;
        if (container[methodName] && external__lodash__default.a.isFunction(container[methodName])) {
          out = container[methodName](value);
        }
    }
    return out;
  });
});
// EXTERNAL MODULE: external "react"
var external__react_ = __webpack_require__(1);
var external__react__default = /*#__PURE__*/__webpack_require__.n(external__react_);

// EXTERNAL MODULE: external "freactal"
var external__freactal_ = __webpack_require__(5);
var external__freactal__default = /*#__PURE__*/__webpack_require__.n(external__freactal_);

// CONCATENATED MODULE: ./src/freactal.js


/* harmony default export */ var freactal = (bottle => {
  /**
   * Note - all definition must be done BEFORE getWrapper is called.
   * Also, this method binds the current version of Freactal to the one bound by this
   * module. To use another version of Freactal, don't use getWrapper --
   * call provideState from your version of freactal.
   */
  bottle.factory('getWrapper', container => seedInstance => container.provideState(seedInstance));
  bottle.factory('injectState', () => external__freactal_["injectState"]);
  bottle.factory('update', () => external__freactal_["update"]);
  bottle.factory('provideState', () => external__freactal_["provideState"]);
});
// CONCATENATED MODULE: ./src/init.js









/**
 * returns a bottle with Seed resources
 */
/* harmony default export */ var init = (() => {
  let bottle = new external__bottlejs__default.a();

  src_Seed(bottle);
  src_localStorage(bottle);
  serialization(bottle);
  freactal(bottle);

  bottle.constant('React', external__react__default.a);
  bottle.constant('Component', external__react_["Component"]);

  return bottle;
});
// CONCATENATED MODULE: ./src/index.js
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bottle", function() { return src_bottle; });
/* concated harmony reexport */__webpack_require__.d(__webpack_exports__, "init", function() { return init; });


const src_bottle = init();
const src_Seed_0 = src_bottle.container.Seed;
/* harmony default export */ var src = __webpack_exports__["default"] = (() => src_bottle.container.Seed);

/**
 * note - you can modify bottle injectables
 * at any point before you call the default method
 * and instantiate your Seed.
 */


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("bottlejs");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("freactal");

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map