import _ from 'lodash';

export default (bottle) => {
  bottle.factory('Seed', (container) => class Seed {
      constructor (initialState = {}, serializationSource = container.SEED_SERIALIZATION_NONE) {
        this.serializationSource = serializationSource;
        this._propsMap = new Map();
        this._middleware = [];
        for (let key in initialState) {
          this._propsMap.set(key, initialState[key]);
        }
        this._effectsMap = new Map();
        this._initializers = [];
        if (this.serializationSource === Seed.SERIALIZATION_LOCAL_STORAGE) {
          this.addLocalStorageMiddleware()
        }
      }
      get initialState () {
        return () => {
          let hash = {};
          this._propsMap.forEach((data, key) => {
            hash[key] = data.value;
            if (container.localStorageHas(key)) {
              hash[key] = container.deserialize(container.localStorage.getItem(key),
                data.type);
            }
          });
          return hash;
        }
      }
      get effects () {
        let hash = {};
        this._effectsMap.forEach((value, key) => hash[key] = value);
        return hash;
      }

      addArrayAndSetEffect (name, value = []) {
        //@TODO: add type enforcement for values
        this.addStateProp(name, value ? value.slice(0) : [], container.SEED_TYPE_OBJECT);
        this.addEffect(`set${_.upperFirst(name)}`, (element, array) => (state) => {
          let hash = {};
          hash[name] = array.slice(0);
          return Object.assign({}, state, hash);
        });
        this.addEffect(`set${_.upperFirst(name)}Element`, (event, key, value) => (state) => {
          let newArray = state[name] || [];
          newArray[key] = value;
          let hash = {};
          hash[name] = newArray;
          return Object.assign({}, state, hash);
        });
      }

      addLocalStorageMiddleware () {
        if (container.localStorage) {
          this.addMiddleware((freactalCtx) => {
            this._propsMap.forEach((data, key) => {
              // note: no way of checking inclusion of key in state ??
              let value = freactalCtx.state[key];
              container.localStorage.setItem(key, container.serialize(value, data.type));
            });
            return freactalCtx;
          })
        } else {
          console.log('no local storage');
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
            return _.identity;
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
            .then(_.identity);
        }
      }

      /**
       * add a single effect method to the effects collection
       * @param key {string} the name of the effect
       * @param value {function} the effect
       */
      addEffect (key, value) {
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
      addSideEffect (name, method) {
        this.addEffect(name, (effects) => {
          if (_.isString(method)) {
            return effects[method](effects)
              .then(_.identity);
          }
          let result = method(effects);
          return result.then ? result.then(_.identity) : _.identity;
        });
      }

      /**
       * adds a middleware pipe to the middleware list.
       * @param method {function}
       */
      addMiddleware (method) {
        this._middleware.push(method);
      }

      addStateProp (key, value, type = container.SEED_TYPE_STRING) {
        this._propsMap.set(key, {value, type});
      }

      addSetEffect (name, type = container.SEED_TYPE_STRING) {
        let effectName = 'set' + _.upperFirst(name);
        // @TODO: validation
        this.addEffect(effectName, container.update((state, value) => {
          let hash = {};
          hash[name] = value;
          return hash;
        }));
      }

      addBoolEffect (name) {
        this.addSetEffect(name, container.SEED_TYPE_BOOLEAN);
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
        this.addSetEffect(name, type);
      }

      addBoolPropAndEffects (name, value) {
        this.addStateProp(name, !!value, container.SEED_TYPE_BOOLEAN);
        this.addBoolEffect(name);
      }

      get middleware () {
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
      toHash () {
        return {
          effects: this.effects,
          initialState: this.initialState,
          middleware: this.middleware
        }
      }
    }
  )


}