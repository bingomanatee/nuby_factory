var _DEBUG = false;
var util = require('util');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ejs = require('ejs');
var wrench = require('wrench');
var support = require('support');
var Gate = support.Gate;
var proper_path = support.proper_path;
var elements = require('./elements');

var View_File = require('./View_File')

var tmplt = fs.readFileSync(__dirname + '/templates/action.js', 'utf8')
var _action_template = ejs.compile(tmplt);
function Action(params, parent) {
    this.CLASS = 'Action';
    this.validate = {on:true};
    this.input = {on:true};
    this.process = {on:true};
    this.config = {};
    this._view_files = [];
    this.comment = true;
    _.extend(this, params);
    if (!this.template) {
        this.template = new View_File({content:'<h1>' + this.name + '</h1>', name:this.name + '_view.html'}, this);
    } else {
        this.template.parent = this;
    }
    this._view_files.push(this.template);
    if (parent) {
        this.parent = parent;
        parent.add_action(this);
    }

}
_.extend(Action.prototype, elements);
_.extend(Action.prototype, {

    path:'',

    add_on:function (route, params) {
        this._add('on', route, params);
    },

    add_get:function (route, params) {
        this._add('get', route, params);
    },

    add_post:function (route, params) {
        this._add('post', route, params);
    },

    add_put:function (route, params) {
        this._add('put', route, params);
    },

    add_delete:function (route, params) {
        this._add('delete', route, params);
    },

    _add:function (method, route, params) {
        if (method == 'on') {
            this.config.route = route;
        } else {
            this.validate.on = false;
            this.input.on = false;
            this.process.on = false;
            this.config[method + '_route'] = route;
        }
        var p = _.extend({input:true, validate:true, process:true}, params);

        this.validate[method] = p.validate;
        this.input[method] = p.input;
        this.process[method] = p.process;
    },

    _action_path:function () {
        return this.get_path() + '/' + this.name + '_action.js';
    },


    _action_file_content:function () {
        var out = _action_template(this);
        var threebreaks = /\n\n\n/g
        while (threebreaks.test(out)) {
            out = out.replace(threebreaks, "\n\n");
        }
        return out;
    },

    render:function (cb) {
        if (this.rendered) {
            return cb();
        }
        this.rendered = true;

        if (!this.name) {
            throw new Error('attempt to render unnamed action');
        }

        var self = this;

        function _render_self() {
            var action_path = self.get_path() + '/' + self.name + '_action.js';
            if (typeof(action_path) == 'undefined' || (action_path == 'undefined')) {
                throw new Error('bad path for action.');
            }
            self.render_config(function () {
                fs.writeFile(action_path, self._action_file_content(), cb);
            })
            if (_DEBUG) console.log('rendering %s (%s) to  %s', self.name, self.path, action_path);
        }

        function _render() {
            self.make_dir();
            self._render_children(_render_self);
        }

        if (this.parent) {
            this.parent.render(_render);
        } else {
            _render();
        }
    }
});

module.exports = Action;