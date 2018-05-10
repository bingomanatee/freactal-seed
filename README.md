Feactal Seed is an attempt to automate and enhance the creation of the
seed object that defines state for a Freactal project. As it stands,
you have to manually create set and initializing for each property in
Freactal.

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

## Property Definition and Type Validation

### Appendix: the bottling of Seed

Seed uses [Bottle.js](https://github.com/young-steveo/bottlejs) as a
system for linking resources. This makes it easier to test and extend.

### Appendix: bummer dependency

Because Freactal has a dependency to react, its bundled with this
module. Currently at 16.3.2. I'm not sure whether this makes it
version-frozen for React -- but FWIW React and Component are available
as Bottle constants.