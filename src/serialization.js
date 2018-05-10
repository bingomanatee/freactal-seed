import _ from "lodash";

export default(bottle) => {
  ['SEED_TYPE_STRING',
    'SEED_TYPE_OBJECT',
    'SEED_TYPE_INT',
    'SEED_TYPE_FLOAT',
    'SEED_TYPE_BOOLEAN',
    'SEED_SERIALIZATION_LOCAL_STORAGE',
    'SEED_SERIALIZATION_NONE']
    .forEach((name) => bottle.constant(name, name));
  bottle.factory('deserialize', (container) => (value, type) => {
    if (value === null || _.isUndefined(value)) {
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

      // note - booleans are serialized into '1' or '0';
      case container.SEED_TYPE_BOOLEAN:
        out = out === '1';
        break;

      default:
        const methodName = `deserialize_${type}`
        if (container[methodName] && _.isFunction(container[methodName])) {
          out = container[methodName](value)
        }
    }
    return out;
  });

  bottle.factory('serialize', (container) => (value, type) => {
    if (value === null || _.isUndefined(value)) {
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
        out = isNaN(value) ? '0' : value.toString();
        break;

      case container.SEED_TYPE_BOOLEAN:
        out = value ? '1' : '0';
        break;

      case container.SEED_TYPE_STRING:
        out = _.toString(value);
        break;

      default:
        // allow for extensions:
        const methodName = `serialize_${type}`
        if (container[methodName] && _.isFunction(container[methodName])) {
          out = container[methodName](value)
        }
    }
    return out;
  });
}