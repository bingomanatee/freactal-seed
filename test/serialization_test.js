const {init} = require('./../build');
const tap = require('tap');

tap.test('serialize', (serSuite) => {
  const bottle = init();
  const {serialize, SEED_TYPE_STRING, SEED_TYPE_OBJECT, SEED_TYPE_INT, SEED_TYPE_FLOAT, SEED_TYPE_BOOLEAN} = bottle.container;

  serSuite.test('object', (objectTest) => {
    let obj = {foo: 1, bar: 'two'};
    objectTest.equal(serialize(obj, SEED_TYPE_OBJECT), '{"foo":1,"bar":"two"}');

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
    intTest.equal(serialize(42, SEED_TYPE_INT), '42');

    intTest.test('badInt', (badIntTest) => {
      badIntTest.equal(serialize( 'forty two', SEED_TYPE_INT), '0');
      badIntTest.end();
    });
    intTest.end();
  });

  serSuite.test('string', (stringTest) => {
    let foo = 'foo';
    stringTest.equal( serialize(foo, SEED_TYPE_STRING), 'foo');

    stringTest.end();
  });

  serSuite.test('bool', (boolTest) => {

    boolTest.equal(serialize(true, SEED_TYPE_BOOLEAN), '1');
    boolTest.equal(serialize('truthy string', SEED_TYPE_BOOLEAN), '1');
    boolTest.equal(serialize(false, SEED_TYPE_BOOLEAN), '0');

    boolTest.end();
  });

  serSuite.test('float', (floatTest) => {
    floatTest.equal(serialize(Math.PI, SEED_TYPE_FLOAT), '3.141592653589793');
    floatTest.end();
  })

  serSuite.end();
});
tap.test('deserialize', (dsSuite) => {
  const bottle = init();
  const {deserialize, SEED_TYPE_STRING, SEED_TYPE_OBJECT, SEED_TYPE_INT, SEED_TYPE_FLOAT, SEED_TYPE_BOOLEAN} = bottle.container;

 dsSuite.test('object', (objectTest) => {
    let obj = {foo: 1, bar: 'two'};
    let str = '{"foo":1,"bar":"two"}';
    objectTest.same( deserialize(str, SEED_TYPE_OBJECT), obj);

    objectTest.end();
  });

  dsSuite.test('int', (intTest) => {

    const int = 42;
    intTest.equal(deserialize('42', SEED_TYPE_INT), int, 'int deserialized');
    intTest.equal(deserialize('1.5', SEED_TYPE_INT), 1, 'float deserialized to int');

    intTest.test('badInt', (badIntTest) => {
      const badInt = 'forty two';
      badIntTest.equal(deserialize(badInt, SEED_TYPE_INT), 0, 'string deserialized to zero');

      badIntTest.end();
    });
    intTest.end();
  });

  dsSuite.test('float', (floatTest)=> {
    floatTest.equal(deserialize('1.23', SEED_TYPE_FLOAT), 1.23, 'float deserialized');
    floatTest.end();
  });

  dsSuite.test('string', (stringTest) => {
    let foo = 'foo';
    stringTest.equal(deserialize(foo, SEED_TYPE_STRING), 'foo');

    stringTest.end();
  });
  dsSuite.end();
});
