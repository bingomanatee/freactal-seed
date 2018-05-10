import Bottle from 'bottlejs';

import StateConfig from './Seed';
import localStorage from './localStorage';
import serialization from './serialization';
import {Component} from 'react';
import React from 'react';
import freactal from './freactal';

/**
 * returns a bottle with Seed resources
 */
export default () => {
  let bottle = new Bottle();

  StateConfig(bottle);
  localStorage(bottle);
  serialization(bottle);
  freactal(bottle);

  bottle.constant('React', React);
  bottle.constant('Component', Component);

  return bottle;
}