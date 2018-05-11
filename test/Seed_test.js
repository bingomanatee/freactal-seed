const {init} = require('./../build');
const tap = require('tap');

const _init = () => {
  const bottle = init();
  let Seed = bottle.container.Seed;
  let mySeed = new Seed();
  let wrap = bottle.container.getWrapper(mySeed);

  return {bottle, mySeed, wrap};
}
tap.test('Seed', (suite) => {

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
  });

  suite.test('addArrayPropAndSetEffects',  (aapTest) => {

    aapTest.test('core methods', async (aapcTest) => {

      const {mySeed, bottle, wrap} = _init();
      mySeed.addArrayPropAndSetEffects('hotDudes', [10, 9, 10, 8]);
      const {getState, effects} = wrap();

      aapcTest.same(getState().hotDudes, [10, 9, 10, 8], 'dudes are hot');
      await effects.setElementHotDudes(1, 10);
      aapcTest.same(getState().hotDudes, [10, 10, 10, 8], 'just got a little hotter');
      await effects.setHotDudes([8, 8, 8, 7]);
      aapcTest.same(getState().hotDudes, [8, 8, 8, 7], 'not so hot now');

      aapcTest.end();
    })
    aapTest.test('extended methods', async (aapeTest) => {
      const {mySeed, bottle, wrap} = _init();
      mySeed.addArrayPropAndSetEffects('hotDudes', [10, 9, 10, 8]);
      const {getState, effects} = wrap();

      aapeTest.same(getState().hotDudes, [10, 9, 10, 8], 'dudes are hot');
      await effects.pushToHotDudes(6);
      aapeTest.same(getState().hotDudes, [10, 9, 10, 8, 6], 'pushing a not hot dude');
      await effects.unshiftToHotDudes(3);
      aapeTest.same(getState().hotDudes, [3, 10, 9, 10, 8, 6], 'shifting a not hot dude');
      await effects.mapHotDudes((n) => n/2);
      aapeTest.same(getState().hotDudes, [1.5, 5, 4.5, 5, 4, 3], 'half as hot');

      aapeTest.end();
    });

    aapTest.end();
  });



  suite.test('addSideEffect',  (seTest) => {

    seTest.test('method that returns a promise', async (serTest) => {
      let resolve = null;
      const {mySeed, bottle, wrap} = _init();
      mySeed.addPropAndSetEffect('user', null, bottle.container.SEED_TYPE_OBJECT);
      /**
       * this represents a typical "side effects use case" -- we call an API
       * that is in a codebase outside the Seed/Freactal paradigm
       * When it is satisfied it triggers a "set" method of an effect.
       *
       * however in this case we DO want to wait for the API to return
       *
       * @param effects {object} allows the API to call an effect.
       */
        // simulate a long process that we will satisfy later
      let mockGetUserAPI = (effects) => new Promise((success) => {
          resolve = success;
        })
        // note the promise is returned. so the "then" of the side effect awaits return of data.
      // however we are manually calling resolve to delay satisfaction.

      mySeed.addSideEffect('loadUser', (effects) => mockGetUserAPI(effects)
      .then((user) => effects.setUser(user)));
        // unlike the other side effect test  in this case we are chaining
      // the API's promise to the effect

      const {getState, effects} = wrap();

      effects.loadUser(); // note we are NOT "awaiting" the effect
      // because it is hanging on our manual call of resolve.
      serTest.same(getState().user, null, 'user not loaded yet but life goes on');

      await resolve({id: 1, name: 'fred'}); // triggers the API to pass the user object into the setUser effect.

      await Promise.resolve(); // allow user set effect to kick in.
      serTest.same(getState().user, {id: 1, name: 'fred'}, 'user loaded/promise');
      serTest.end();
    })

    seTest.test('method that does not return a promise', async (senrTest) => {
      let resolve = null;
      const {mySeed, bottle, wrap} = _init();
      mySeed.addPropAndSetEffect('user', null, bottle.container.SEED_TYPE_OBJECT);
      /**
       * this represents a typical "side effects use case" -- we call an API
       * that is in a codebase outside the Seed/Freactal paradigm
       * When it is satisfied it triggers a "set" method of an effect.
       *
       * @param effects {object} allows the API to call an effect.
       */
      let mockGetUserAPI = (effects) => {
        // simulate a long process that we will satisfy later
        new Promise((success) => {
          resolve = success;
        })
          .then((user) => effects.setUser(user));
        // note the promise is NOT returned - we don't pause for the execution of the api.
      }
      mySeed.addSideEffect('loadUser', (effects) => {
        mockGetUserAPI(effects);
        // note -- not returning anything. the concept here, we are calling an API to request information,
        // in a truly async process, then moving on while we wait for the data to come back.
      });
      const {getState, effects} = wrap();

      await effects.loadUser();
      senrTest.same(getState().user, null, 'user not loaded yet but life goes on');

      await resolve({id: 1, name: 'fred'}); // triggers the API to pass the user object into the setUser effect.

      await Promise.resolve(); // allow user set effect to kick in.
      senrTest.same(getState().user, {id: 1, name: 'fred'}, 'user loaded');
    })

    seTest.end();
  });

  suite.end();
})