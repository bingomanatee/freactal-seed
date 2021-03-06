Feactal Seed is an attempt to automate and enhance the creation of the
seed object that defines state for a Freactal project. As it stands,
you have to manually create set and initializing for each property in
Freactal.

Check out our [demo site](https://flamboyant-keller-9edb9a.netlify.com/#/)

## Advantages

The base state object that Freactal uses is a single object.
If you define it inline, as is the practice in the freactal documentation,
all your method/state definitions are done in one place; this can
get very difficult to read in expanding projects. Whereas with seed,
you can pass your seed object through multiple decorators before
passing it to provideState.

As well, Seed allows you to define initial value, type and effects
with a single line of code. Continually having to write boilerplate effects
just to set a value is tiresome. Some of the methods

Additionally Seed allows for typed properties, in part to allow synchronization
with local storage or other serializers.

## Using the seed

The root object of this module is a factory that returns the Seed class.
This is true because it maximizes the utility of bottle to allow for
injection techniques:

```` javascript
import {provideState, update} from 'freactal';
import SeedFactory from 'freactal-seed';
const Seed = SeedFactory();

const mySeed = new Seed();
mySeed.addStateProp('visibility', 'visible', Seed.TYPE_STRING);
mySeed.addEffect('toggleVisibile', update((state) => {
    if (state.visibility == 'visible') {
        return {visibility: 'hidden'};
    } else {
        return {visiblity: 'visible'};
    }
}));

const wrapComponentWithState = provideState(mySeed);
/* ----------- or ------------ */
const wrapComponentWithState = provideState(mySeed.toHash());

````

## The structure of a Freactal seed

A Freactal seed has these endpoints:

1. `events` - documented in Freactal, these are the "actions" that change
   state.

2. `initialState` - this is a method that returns the initial properties
   that defines state in Freactal. In Freactal Seed it iterates off the
   field definitions, and loads values either from local storage or
   from the defaults set in field creation.

3. `computed` - currently these are problematic; the endpoint is provided
   for completeness but beware. (the alternative is an external function
   that computes a desired value with state as an input).

4. `middleware` - an array of methods that are triggered with every state change.

## Storage Synchronization

As well there is no built-in way to dynamically serialize state.
I've found it useful to keep state in Local Storage -- there are probably
other stores that are desirable; for instance I can see serializing
user state via websockets to the server.

## API

### `constructor(initialState, storageMethod)`
It's reccommended NOT to pass anything to the constructor. State
should be set with the methods below. If you want to turn on(or off)
local storage, call `mySeed.useLocalStorage()`.

### `useLocalStorage(use = true)`
Turns local storage serialization on or off.
```` javascript
mySeed.useLocalStorage(); // turns on
mySeed.useLocalStorage(true); // turns on
mySeed.useLocalStorage(false); // turns off.
````

### `addEffect(key, method)`
Adds a named method to the effects collection.

```` javascript
mySeed.addEffect('doubleCount', (effects) => (state) => {
count = state.count || 0;
return Object.assign({}, state, {count: count * 2});
});
````

### `addStateProp(key, value, type)`: adds a named property to the state collection.

```` javascript
mySeed.addStateProp('count', 0, bottle.container.SEED_TYPE_INT);
````
note: the type does NOT filter/control what values can be put in or out
of the field, just how it is serialized/deserialized from local storage.

### `addPropAndSetEffect(name, value, type, options)`
Calls addEffect (see above) and adds a `set[Name]` method.
```` javascript
mySeed.addPropAndSetEffect('user', 0, bottle.container.SEED_TYPE_OBJECT);
// -- in a component
this.props.effects.setUser({id: 1, name: 'fred'});
````

#### Options

Options have several experimental features:

* `onSet(state, effects)` adds a hook that triggers after a value is set. 
  if it returns a promise its assumed to be a promise from an effect -- i.e.,
  the result is now the current state. (if nothing or a non-promise is returned,
  the state is preserved).
* `serialize(item)` allows for a custom stringification of an item. It must
  return a string. Its only used if the seed's serialization is enabled.
* `deserialize(string)` is the inverse of serialize. It converts a string 
  (from localStorage) into the retrieved value.

### `addSideEffect(name, method)`
this is a bit tricky. It allows creation
of a method that calls effects or waits for an async operation. The
effects *it calls* may in turn trigger state change, but the side effect
itself is assumed to NOT directly change the state.

addSideEffect runs your method and returns a "noop" state modifier -- i.e.,
it doesnt *directly* modify state. (you might however modify state with inside methods.

```` javascript

mySeed.addPropAndSetEffect('user', 0, bottle.container.SEED_TYPE_OBJECT);
mySeed.addSideEffect('loadUser', (effects, id) => {
    fetch('/users/' + id)
    .then((response) => response.json)
    .then((user) => effects.setUser(user));
});

````

### `addStateSideEffect(name, method)`

```` javascript
 mySeed.addArrayPropAndSetEffects('ducks', 'Huey,Louie,Dewey'.split(','));
 mySeed.addStateSideEffect('cloneLastDuck', (effects, state, clone) => {
    let ducks = state.ducks.slice(0);
    let base = ducks.pop();
    ducks.push(base);
    for (let n = 2; n < clone + 1; ++n) ducks.push(`${base} ${n}`)
    effects.setDucks(ducks);
  });
---- in component code ---
effects.cloneLastDuck(4);
// sets ducks to ['Huey','Louie','Dewey','Dewey 2','Dewey 3','Dewey 4']
````
like addSideEffect, except it adds state to the arguments;

### `addArrayPropAndSetEffects(name, value, methods?)`
Calls `addPropAndSetEffect` and adds several methods:
 * `set~Name~Element(key, item)` inserts an item into a place in the array.
 * `push~Name~Element(item)` adds an item to the end of the array.
 * `unshift~Name~Element(item)` adds an item to the start of the array.
 * `change~Name(fn)` filters

this is a lot of "adds"; if you want fewer methods, pass a name string or array of strings
of the methods you want.

```` javascript
mySeed.addArrayPropAndSetEffects('shoppingCart', []);
// -- in a component
this.props.effects.pushToShoppingCart({id: 100, cost, 3.5, count, 2 item: 'spam'});
this.props.effects.unshiftToShoppingCart({id: 150, cost: 1.25, count: 4, item: 'spam'});
this.props.effects.setElementShoppingCart(2, {id: 200, cost: 1, count: 1 item: 'yam'});
this.props.effects.mapShoppingCart((item) => {
if (item.id === 200) item.count += 1;
return item;
});
````

### `addBoolPropAndEffects(key, value, options)`
Calls AddPropAndStateEffect (with type bool). Also adds a pair of methods

* `~name~On` sets the value to true
* `~name~Off` sets the value to false

## Convenience Methods

To obviate the necessity of the type field there are methods that set the type for you:

* `addStateInt(key, value, options)`
* `addStateString(key, value, options)`
* `addStateObject(key, value, options)`
* `addStateFloat(key, value, options)`
* `addIntAndSetEffect(key, value, options)`
* `addStringAndSetEffect(key, value, options)`
* `addObjectAndSetEffect(key, value, options)`
* `addFloatAndSetEffect(key, value, options)`

### Appendix: Serialization

Freactal-Seed comes with "Stock" serializers that read and write
basic types into local storage. Note, serialization itself is *optional*
and only enabled when the constructor flag is called.

### Appendix: the bottling of Seed

Seed uses [Bottle.js](https://github.com/young-steveo/bottlejs) as a
system for linking resources. This makes it easier to test and extend.

For the most part, the only time you'll have to deal with this is when
you pull prop types off of the bottle.container. However if you want
to do some advanced monkeying with Seed components, you should be able
to do it by adding bottle decorators that alter or substitute

### Appendix: bummer dependency

Because Freactal has a dependency to react, its bundled with this
module. Currently at 16.3.2. I'm not sure whether this makes it
version-frozen for React -- but FWIW React and Component are available
as Bottle constants.
