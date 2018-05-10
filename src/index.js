import init from './init';

const bottle = init();
const Seed = bottle.container.Seed;
export default () => bottle.container.Seed;

/**
 * note - you can modify bottle injectables
 * at any point before you call the default method
 * and instantiate your Seed.
 */
export {init, bottle};

