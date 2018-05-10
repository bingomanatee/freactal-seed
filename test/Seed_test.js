const {init} = require('./../build');
const tap = require('tap');

const _init = () => {
  const bottle = init();
  let Seed = bottle.container.Seed;
  let mySeed = new Seed();
  let wrap = bottle.container.getWrapper(mySeed);

  return {bottle, mySeed, wrap};
}
tap.test('Seed', (suite)=> {

  suite.test('addStateProp', async (apTest) => {
    const {mySeed, bottle, wrap} = _init();
    mySeed.addStateProp('jeremy', 'foo', bottle.container.SEED_TYPE_STRING);
    const {getState, effects} = wrap();
    apTest.equal(getState().jeremy, 'foo', 'state has proper initial value');
    await Promise.resolve();

    apTest.end();
  });

  suite.test('addPropAndSetEffect', async (apeTest) => {
    const {mySeed, bottle, wrap} = _init();
    mySeed.addPropAndSetEffect('jeremy', 'foo', bottle.container.SEED_TYPE_STRING);
    const {getState, effects} = wrap();
    apeTest.equal(getState().jeremy, 'foo', 'state has proper initial value');
    await effects.setJeremy('piven');
    apeTest.equal(getState().jeremy, 'piven', 'jeremy is now piven');

    apeTest.end();
  })

  suite.end();
})