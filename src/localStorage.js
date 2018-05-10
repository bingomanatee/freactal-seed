import _ from "lodash";

export default (bottle) => {
  /**
   * this is a shim for window to ensure functionality on the server.
   * In the absence of a global window, an empty object is returned.
   */
  bottle.factory('window', (container) => {
    if (!_.isUndefined(window)) {
      return window;
    }
    return {};
  })

  bottle.factory('isStorageAvailable', (container) => function (type) {
    /**
     * this has been extracted from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
     * note, to keep this usable in server / non browser contexts this uses an injected shim for window.
     */
    try {
      var storage = container.window[type],
        x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    }
    catch (e) {
      return e instanceof DOMException && (
          // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage.length !== 0;
    }
  })
  bottle.factory('localStorage', (container) => {
    if (container.isStorageAvailable('localStorage')) {
      return localStorage;
    } else {
      return false;
    }
  });

  bottle.factory('localStorageHas', ({localStorage}) => {
    if (!localStorage) {
      return () => false;
    }
    return (key) => {
      let value = localStorage.getItem(key);
      if (value === 'null') { // I haven't tracked down how, but in some cases it seems the null value is stringified when serialized in localStorage.
        return false;
      }
      return !!value;
    }
  });
  /**
   * converts a string value to a typed value.
   * @param value
   * @param type {string}
   * @returns {var}
   */
}