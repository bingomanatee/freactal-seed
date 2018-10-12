import _ from 'lodash';

export default (bottle) => {
  bottle.constant('noop', (a) => a);
  bottle.factory('Seed', (container) => class Seed {

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
              }
              else {
                hash[key] = container.deserialize(container.localStorage.getItem(key),
                  data.type);
              }
            }
          });
          if (this.initialStateFilter) {
            return this.initialStateFilter(hash);
          }
          return hash;
        }
      }

      get initialStateFilter() {
        return this._initialStateFilter;
      }

      set initialStateFilter(value) {
        if (value && (!_.isFunction(value))) {
          throw new Error('initialStateFilter must be function ');
        }

        this._initialStateFilter = value;
      }

      /**
       * Computed seems buggy in freactal; not enabling it here.
       * @returns {{}}
       */
      get computed() {
        return ({});
      }

      get effects() {
        let hash = {};
        this._effectsMap.forEach((value, key) => hash[key] = value);
        if (this._initializers.length) {
          hash.initialize = (state) => this._makeInitializers(hash);
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
        if ((value !== this._serializationSource) && this._localStorageAdded) {
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
        }
        else {
          this._propsMap.set(key, Object.assign({}, options, {value, type}));
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
        let effectName = 'set' + _.upperFirst(name);
        const {onSet, filterSet} = options;
        // @TODO: validation ??
        if (onSet) {
          let updateEffectName = 'update' + _.upperFirst(name);

          this.addEffect(updateEffectName, (effects, value) => (state) => {
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
          this.addEffect(effectName, (effects, value) => () => {
            let onSetAction = _.isString(onSet) ? effects[onSet] : onSet;
            return effects[updateEffectName](value)
              .then((state) => {
                let oss = onSetAction(effects, state);
                if (oss && oss.then) return oss.then;
                return state
              });
          });
        }
        else {
          this.addEffect(effectName, (effects, value) => (state) => {
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
          if (_.isString(method)) {
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
        this.addEffect(name, (effects, ...args) => {
          return (state) => {
            method(effects, state, ...args);
            return state;
          }
        });
        return this;
      }

      /** adds a series of endpoints for handling array data */
      addArrayPropAndSetEffects(name, value = [], methods = 'push,unshift,map,element') {
        if (methods) {
          if (_.isString(methods)) {
            methods = methods.split(',');
          }
        }
        else {
          methods = false;
        }

        const add = (name, exec) => {
          if (!methods || _.includes(methods, name.toLowerCase())) {
            exec();
          }
          else {
            console.log('addArrayPropAndSetEffects -- skipping ', name);
          }
        };

        const getList = (state) => (state[name] || []).slice(0);

        const uName = _.upperFirst(name);
        //@TODO: add type enforcement for values
        this.addPropAndSetEffect(name, value ? value.slice(0) : [], container.SEED_TYPE_OBJECT);
        add('element', () => {
          this.addEffect(`setElement${uName}`, (effects, key, value) => (state) => {
            //@TODO: key sanitization
            let list = getList(state);
            list[key] = value;
            effects[`set${uName}`](list);
            return state;
          });
        });

        add('push', () => {
          let pName = `pushTo${uName}`;
          this.addEffect(pName, (effects, value) => (state) => {
            let list = getList(state);
            list.push(value);
            effects[`set${uName}`](list);
            return state;
          });
        });

        add('unshift', () => {
          this.addEffect(`unshiftTo${uName}`, (effects, value) => (state) => {
            let list = getList(state);
            list.unshift(value);
            effects[`set${uName}`](list);
            return state;
          });
        });

        add('map', () => {
          this.addEffect(`map${uName}`, (effects, filter) => (state) => {
            effects[`set${uName}`](getList(state)
              .map(filter));
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
        this.addEffect(`${name}On`, container.update((state) => {
          let hash = {};
          hash[name] = true;
          return hash;
        }))
        this.addEffect(`${name}Off`, container.update((state) => {
          let hash = {};
          hash[name] = false;
          return hash;
        }))
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
        return this;
      }

      _addLocalStorageMiddleware() {
        if (container.localStorage && !this._localStorageAdded) {
          console.log('---- enabling local storage ----')
          this.addMiddleware((freactalCtx) => {
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
        }
        else {
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
        this._initializers.push({method, order});
        return this;
      }

      _makeInitializers() {
        let initializers = _(this._initializers)
          .sortBy('order')
          .map('method')
          .value();

        if (!initializers.length) {
          return container.noop;
        }

        return async (state) => {
          for (let init of initializers) {
            let newState = await init(state);
            state = newState || state;
          }
          return state;
        }
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
        }
      }
    }
  )


}
