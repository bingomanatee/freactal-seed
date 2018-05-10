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
  bottle.factory('Seed', container => class Seed {
    constructor(initialState = {}, serializationSource = container.SEED_SERIALIZATION_NONE) {
      this.serializationSource = serializationSource;
      this._propsMap = new Map();
      this._middleware = [];
      for (let key in initialState) {
        this._propsMap.set(key, initialState[key]);
      }
      this._effectsMap = new Map();
      this._initializers = [];
      if (this.serializationSource === Seed.SERIALIZATION_LOCAL_STORAGE) {
        this.addLocalStorageMiddleware();
      }
    }
    get initialState() {
      return () => {
        let hash = {};
        this._propsMap.forEach((data, key) => {
          hash[key] = data.value;
          if (container.localStorageHas(key)) {
            hash[key] = container.deserialize(container.localStorage.getItem(key), data.type);
          }
        });
        return hash;
      };
    }
    get effects() {
      let hash = {};
      this._effectsMap.forEach((value, key) => hash[key] = value);
      return hash;
    }

    addArrayAndSetEffect(name, value = []) {
      //@TODO: add type enforcement for values
      this.addStateProp(name, value ? value.slice(0) : [], container.SEED_TYPE_OBJECT);
      this.addEffect(`set${external__lodash__default.a.upperFirst(name)}`, (element, array) => state => {
        let hash = {};
        hash[name] = array.slice(0);
        return Object.assign({}, state, hash);
      });
      this.addEffect(`set${external__lodash__default.a.upperFirst(name)}Element`, (event, key, value) => state => {
        let newArray = state[name] || [];
        newArray[key] = value;
        let hash = {};
        hash[name] = newArray;
        return Object.assign({}, state, hash);
      });
    }

    addLocalStorageMiddleware() {
      if (container.localStorage) {
        this.addMiddleware(freactalCtx => {
          this._propsMap.forEach((data, key) => {
            // note: no way of checking inclusion of key in state ??
            let value = freactalCtx.state[key];
            container.localStorage.setItem(key, container.serialize(value, data.type));
          });
          return freactalCtx;
        });
      } else {
        console.log('no local storage');
      }
    }

    /**
     * note - method can be a function or a name of another effect (string).
     * @param method {string | function}
     * @param order {number}
     */
    addInitializer(method, order = 0) {
      this._initializers.push({ method, order });
    }

    _makeInitializers() {
      return (effects, state) => {
        console.log('initializer: state', state);
        if (!this._initializers.length) {
          return external__lodash__default.a.identity;
        }
        let initializers = external__lodash__default()(this._initializers).sortBy('order').map('method').map(method => external__lodash__default.a.isString ? effects[method] : method).value();

        let initializer = initializers.pop();
        while (initializers.length) {
          initializer = ((next, prev) => prev.then(next))(initializer, initializers.pop());
        }
        return effects => initializer(effects).then(external__lodash__default.a.identity);
      };
    }

    /**
     * add a single effect method to the effects collection
     * @param key {string} the name of the effect
     * @param value {function} the effect
     */
    addEffect(key, value) {
      this._effectsMap.set(key, value);
    }

    /**
     * do an effect that does not mutate state. It affects things besides state,
     * so the side effect executes and the state is unmodified. You don't have to return
     * a state mutator from the method; it's managed for you.
     *
     * @param name {String}
     * @param method {function}
     */
    addSideEffect(name, method) {
      this.addEffect(name, effects => {
        if (external__lodash__default.a.isString(method)) {
          return effects[method](effects).then(external__lodash__default.a.identity);
        }
        let result = method(effects);
        return result.then ? result.then(external__lodash__default.a.identity) : external__lodash__default.a.identity;
      });
    }

    /**
     * adds a middleware pipe to the middleware list.
     * @param method {function}
     */
    addMiddleware(method) {
      this._middleware.push(method);
    }

    addStateProp(key, value, type = container.SEED_TYPE_STRING) {
      this._propsMap.set(key, { value, type });
    }

    addSetEffect(name, type = container.SEED_TYPE_STRING) {
      let effectName = 'set' + external__lodash__default.a.upperFirst(name);
      // @TODO: validation
      this.addEffect(effectName, container.update((state, value) => {
        let hash = {};
        hash[name] = value;
        return hash;
      }));
    }

    addBoolEffect(name) {
      this.addSetEffect(name, container.SEED_TYPE_BOOLEAN);
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
    }

    /**
     * Both creates a default value for a property and a set method.
     *   for example if you want to add an int property called "priority"
     *   addPropAndSetEffect both creates a property
     *
     *
     * @param name
     * @param value
     * @param type
     */
    addPropAndSetEffect(name, value, type = container.SEED_TYPE_STRING) {
      this.addStateProp(name, value, type);
      this.addSetEffect(name, type);
    }

    addBoolPropAndEffects(name, value) {
      this.addStateProp(name, !!value, container.SEED_TYPE_BOOLEAN);
      this.addBoolEffect(name);
    }

    get middleware() {
      return this._middleware.slice(0);
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
        middleware: this.middleware
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
      return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
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

// CONCATENATED MODULE: ./src/init.js







/**
 * returns a bottle with Seed resources
 */
/* harmony default export */ var init = (() => {
  let bottle = new external__bottlejs__default.a();

  src_Seed(bottle);
  src_localStorage(bottle);
  serialization(bottle);

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



/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("bottlejs");

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map