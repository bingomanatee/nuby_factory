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
var elements = require('./lib/elements');


var Action = require('./lib/Action');
var Controller = require('./lib/Controller');
var Component = require('./lib/Component');
var Views_Folder = require("./lib/Views_Folder");
var View_File = require("./lib/View_File");

/* *********************** CONTROLLER ****************** */


/* *************************** COMPONENT ******************** */

/* **************************** ACTION ********************** */


/* ***************************** VIEWS FOLDER ********************** */


/* **************************** VIEW FILE ************************ */


module.exports = {
    Action:Action,
    Component:Component,
    Controller:Controller,
    Views_Folder:Views_Folder,
    View_File:View_File
}