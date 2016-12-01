'use strict';
const path = require('path');
const FlowControl = require('cta-flowcontrol');
const Cement = FlowControl.Cement;
const config = require('./config');
const cement = new Cement(config, path.join(__dirname, '..'));