import _ from 'lodash';

export default (bottle) => {
  bottle.constant('noop', (a) => a);
  bottle.factory('Seed', (container) => class Seed {
      constructor (initialState = {}, serializationSource = container.SEED_SERIALIZATION_NONE) {
        if (serializationSource === true) {
          serializationSource = container.SEED_SERIALIZATION_LOCAL_STORAGE;
        }
        this.serializationSource = serializationSource;
        this._propsMap = new Map();
        this._middleware = [];
        for (let key in initialState) {
          this._propsMap.set(key, initialState[key]);
        }
        this._effectsMap = new Map();
        this._initializers = [];
        if (this.serializationSource === container.SEED_SERIALIZATION_LOCAL_STORAGE) {
          this.addLocalStorageMiddleware();
        }
      }

      get initialState () {
        return () => {
          let hash = {};
          this._propsMap.forEach((data, key) => {
            hash[key] = data.value;
            if (container.localStorageHas(key)) {
              if (data.deserialize) {
                hash[key] = data.deserialize(container.localStorage.getItem(key));
              } else {
                hash[key] = container.deserialize(container.localStorage.getItem(key),
                  data.type);
              }
            }
          });
          return hash;
        }
      }

      get computed () {
        return ({});
      }

      get effects () {
        let hash = {};
        this._effectsMap.forEach((value, key) => hash[key] = value);
        return hash;
      }

      useLocalStorage (use = true) {
        this.serializationSource = use ? container.SEED_SERIALIZATION_LOCAL_STORAGE : container.SEED_SERIALIZATION_NONE;
      }

      /**
       * add a single effect method to the effects collection
       * @param key {string} the name of the effect
       * @param method {function} the effect
       */
      addEffect (key, method) {
        this._effectsMap.set(key, method);
      }

      /**
       * Adds a value to the state collection. The Type is a hint
       * that assists the serializers when syncing to localStorage.
       *
       * @param key {string} prop name
       * @param value {var} initial value of the prop.
       * @param type {string} the type of value to be stored.
       */
      addStateProp (key, value = null, type = container.SEED_TYPE_STRING) {
        if (this._propsMap.has(key)) {
          let data = this._propsMap.get(key);
          data.value = value;
          data.type = type;
          this._propsMap.set(key, data);
        }
        else {
          this._propsMap.set(key, {value, type});
        }
      }

      addStateString (key, value) {
        this.addStateProp(key, value, container.SEED_TYPE_STRING);
      }

      addStateInt (key, value) {
        this.addStateProp(key, value, container.SEED_TYPE_INT);
      }

      addStateObject (key, value) {
        this.addStateProp(key, value, container.SEED_TYPE_OBJECT);
      }

      addStateFloat (key, value) {
        this.addStateProp(key, value, container.SEED_TYPE_FLOAT);
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
      addPropAndSetEffect (name, value, type = container.SEED_TYPE_STRING) {
        this.addStateProp(name, value, type);
        this._addSetEffect(name, type);
      }

      addStringAndSetEffect (name, value) {
        this.addPropAndSetEffect(name, value, container.SEED_TYPE_STRING);
      }

      addIntAndSetEffect (name, value) {
        this.addPropAndSetEffect(name, value, container.SEED_TYPE_INT);
      }

      addFloatAndSetEffect (name, value) {
        this.addPropAndSetEffect(name, value, container.SEED_TYPE_FLOAT);
      }

      addObjectAndSetEffect (name, value) {
        this.addPropAndSetEffect(name, value, container.SEED_TYPE_OBJECT);
      }

      _addSetEffect (name, type = container.SEED_TYPE_STRING) {
        let effectName = 'set' + _.upperFirst(name);
        // @TODO: validation ??
        this.addEffect(effectName, container.update((state, value) => {
          let hash = {};
          hash[name] = value;
          return hash;
        }));
      }

      /**
       * do an effect that does not mutate state. It affects things besides state,
       * so the side effect executes and the effect returns state unmodified. .
       *
       * @param name {String}
       * @param method {function}
       */
      addSideEffect (name, method) {
        this.addEffect(name, function (effects, ...args) {
          if (_.isString(method)) {
            effects[method](effects, ...args);
            return container.noop;
          }
          method(effects, ...args);
          return container.noop;
        });
      }

    /**
     * Allows your method access to state AND effects in one call.
     * @param name {string}
     * @param method {function}
     */
      addStateSideEffect (name, method) {
        this.addEffect(name, (effects, ...args) => {
          return (state) => {
            method(effects, state, ...args);
            return state;
          }
        });
      }

      /** adds a series of endpoints for handling array data */
      addArrayPropAndSetEffects (name, value = [], methods = 'push,unshift,map,element') {
        if (methods) {
          if (_.isString(methods)) {
            methods = methods.split(',');
          }
        } else {
          methods = false;
        }

        const add = (name, exec) => {
          if (!methods || _.includes(methods, name.toLowerCase())) {
            exec();
          } else {
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
      }

      addBoolPropAndEffects (name, value) {
        this.addStateProp(name, !!value, container.SEED_TYPE_BOOLEAN);
        this._addBoolEffect(name);
      }

      _addBoolEffect (name) {
        this._addSetEffect(name, container.SEED_TYPE_BOOLEAN);
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
      }

      /**
       * adds a middleware pipe to the middleware list.
       * @param method {function}
       */
      addMiddleware (method) {
        this._middleware.push(method);
      }

      get middleware () {
        return this._middleware.slice(0);
      }

      addLocalStorageMiddleware () {
        if (container.localStorage) {
          console.log('---- enabling local storage ----')
          this.addMiddleware((freactalCtx) => {
            this._propsMap.forEach((data, key) => {
              // note: no way of checking inclusion of key in state ??
              let value = freactalCtx.state[key];
              this._serialize(key, value);
            });
            return freactalCtx;
          })
        }
      }

      _serialize (key, value) {
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

      setSerialization (name, serializer, deSerializer) {
        if (this._propsMap.has(name)) {
          let data = this._propsMap.get(name);
          data.serializer = serializer;
          data.deserializer = deSerializer;
        }
      }

      /**
       * note - method can be a function or a name of another effect (string).
       * @param method {string | function}
       * @param order {number}
       */
      addInitializer (method, order = 0) {
        this._initializers.push({method, order});
      }

      _makeInitializers () {
        return (effects, state) => {
          console.log('initializer: state', state);
          if (!this._initializers.length) {
            return container.noop;
          }
          let initializers = _(this._initializers)
            .sortBy('order')
            .map('method')
            .map((method) => _.isString ? effects[method] : method)
            .value();

          let initializer = initializers.pop();
          while (initializers.length) {
            initializer = ((next, prev) => prev.then(next))(initializer, initializers.pop());
          }
          return (effects) => initializer(effects)
            .then(container.noop);
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
      toHash () {
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