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

function View_File(params, parent) {
    this.CLASS = 'View_File';
    this.name = 'view.html';
    this.content = '';
    this.files = {};
    _.extend(this, params);
    if (parent) {
        this.parent = parent;
        parent.add_view_file(this);
    }
}
_.extend(View_File.prototype, elements);
_.extend(View_File.prototype, {
    render:function (cb) {

        if (this.rendered) {
            return cb();
        }
        this.rendered = true;

        //   console.log('---------- MAKING VIEW FILE %s -----------', this.name);
//        var self = this;

        fs.writeFile(this.get_path(), this.content, cb);

    }
});

module.exports = View_File;