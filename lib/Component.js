var _DEBUG = false;
var util = require('util');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ejs = require('ejs');
var NE = require('nuby-express');
var wrench = require('wrench');
var proper_path = NE.deps.support.proper_path;
var Gate = NE.deps.support.Gate;
var elements = require('./elements');

function Component(params, parent) {
    this.CLASS = 'Component';
    this._controllers = [];
    this._components = [];
    this._actions = [];
    this.config = {};
    _.extend(this, params);
    if (parent) {
        this.parent = parent;
        parent.add_component(this);
    }

    this.render = function (cb) {

        if (this.rendered) {
            return cb();
        }
        this.rendered = true;

        var self = this;

        function _render_self() {
        }

        function _render() {
            self.make_dir();
            self.render_config(function () {
                self._render_children(cb);
            });
        }

        if (this.parent) {
            this.parent.render(_render);
        } else {
            _render();
        }

    }
}
_.extend(Component.prototype, elements);

module.exports = Component;