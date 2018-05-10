import init from './init';

const bottle = init();
const Seed = bottle.container.Seed;
export default () => bottle.container.Seed;

export {init, bottle};

