import {provideState, injectState, update} from 'freactal';

export default (bottle) => {
  /**
   * Note - all definition must be done BEFORE getWrapper is called.
   * Also, this method binds the current version of Freactal to the one bound by this
   * module. To use another version of Freactal, don't use getWrapper --
   * call provideState from your version of freactal.
   */
  bottle.factory('getWrapper', (container) => (seedInstance) => container.provideState(seedInstance));
  bottle.factory('injectState', () => injectState);
  bottle.factory('update', () => update);
  bottle.factory('provideState', () => provideState)
}