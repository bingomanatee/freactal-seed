const {init} = require('./../build');
const tap = require('tap');

tap.test('serialize', (serSuite) => {
  const bottle = init();
  const {serialize, SEED_TYPE_STRING, SEED_TYPE_OBJECT, SEED_TYPE_INT, SEED_TYPE_FLOAT, SEED_TYPE_BOOLEAN} = bottle.container;

  serSuite.test('object', (objectTest) => {
    let obj = {foo: 1, bar: 'two'};

    let ser = serialize(obj, SEED_TYPE_OBJECT);
    objectTest.equal(ser, '{"foo":1,"bar":"two"}');

    objectTest.test('bad Object', (objectBadTest) => {
      let obj = {foo: 1, bar: 'two'};

      obj.obj = obj; // ugly recursion

      let ser = serialize(obj, SEED_TYPE_OBJECT);
      objectTest.equal(ser, null);

      objectBadTest.end();
    });

    objectTest.end();
  });

  serSuite.test('int', (intTest) => {

    const int = 42;
    let intSer = serialize(int, SEED_TYPE_INT);

    intTest.equal(intSer, '42');

    intTest.test('badInt', (badIntTest) => {

      const badInt = 'forty two';
      let badIntSer = serialize(badInt, SEED_TYPE_INT);
      badIntTest.equal(badIntSer, '0');

      badIntTest.end();
    });
    intTest.end();
  });

  serSuite.test('string', (stringTest) => {

    let foo = 'foo';

    let fooSer = serialize(foo, SEED_TYPE_STRING);
    stringTest.equal(fooSer, 'foo');

    stringTest.end();
  });
  serSuite.end();
});
tap.test('deserialize', (dsSuite) => {
  const bottle = init();
  const {deserialize, SEED_TYPE_STRING, SEED_TYPE_OBJECT, SEED_TYPE_INT, SEED_TYPE_FLOAT, SEED_TYPE_BOOLEAN} = bottle.container;

 dsSuite.test('object', (objectTest) => {
    let obj = {foo: 1, bar: 'two'};
    let str = '{"foo":1,"bar":"two"}';
    let ser = deserialize(str, SEED_TYPE_OBJECT);
    objectTest.same(ser, obj);

    objectTest.end();
  });

  dsSuite.test('int', (intTest) => {

    const int = 42;
    let intSer = deserialize('42', SEED_TYPE_INT);

    intTest.equal(intSer, int);

    intTest.test('badInt', (badIntTest) => {
      const badInt = 'forty two';
      let badIntSer = deserialize(badInt, SEED_TYPE_INT);
      badIntTest.equal(badIntSer, 0);

      badIntTest.end();
    });
    intTest.end();
  });

  dsSuite.test('string', (stringTest) => {

    let foo = 'foo';

    let fooSer = deserialize(foo, SEED_TYPE_STRING);
    stringTest.equal(fooSer, 'foo');

    stringTest.end();
  });
  dsSuite.end();
});
