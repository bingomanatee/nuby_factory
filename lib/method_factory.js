var _ = require('underscore');
var util = require('util');

function Function_Def(name, content, params) {
    if (!params) {
        params = [];
    }
    if (_.isString(content)) {
        content = content.split("\n");
    }
    if (content) {
        content = _.map(content, function (c) {
            if (_.isString(c)) {
                return c.replace(/^[\s]+/, '');
            } else {
                return c;
            }
        })
    } else {
        content = [];
    }

    this.name = name ? name : '';
    this.params = params;
    this.content = content;

}

function _r(item, c) {
    var out = '';
    for (var i = 0; i < c; ++i) {
        out += item;
    }
    return item;
}

function _body(data, indent) {
    var out = [];

    _.each(data, function (item) {
        if (_.isArray(item)) {
            out = out.concat(_body(item, indent + 1));
        } else if (item instanceof Function_Def) {
            out.push(_r("\t", indent) + item.toString());
        } else if (_.isObject(item)) {
            out.push(JSON.stringify(item));
        } else if (_.isString(item)) {
            out.push(_r("\t", indent) + item);
        }
    })
    return out;
}
_md_template = _.template('<%= name %>: function (<%= params.join(",") %>){\n<%= body %>\n}');

_fd_template = _.template('function <%= name %>(<%= params.join(",") %>){\n<%= body %>\n}');

Function_Def.prototype = {
    method:false,
    semicolons:true,

    asObject:function () {
        var self = this;
        var body_map = _.map(this.body(), function (line) {
            if (/[\({}]$/.test(line)) {
                return line;
            } else if (self.semicolons) {
                return line + ";\n";
            } else {
                return line + "\n"
            }
        });
        return {
            name:this.name,
            params:this.params.slice(0),
            body:body_map.join('').replace(/;[\s]*$/, '')
        }
    },

    toString:function () {
        return  this.method ? _md_template(this.asObject()) : _fd_template(this.asObject());
    },

    body:function () {
        return _body(this.content, 1, this.semicolons);
    }
}

function _rsp(params) {

    if (params) {
        if (params[0] == 'rs') {
            return params.slice(0);
        } else {
            return ['rs'].concat(params);
        }
    } else {
        params = ['rs']
    }
    return params;
}

function _m(name, method) {
    if (method && (method != 'on')) {
        return util.format('on_%s_%s', method, name);
    } else {
        return util.format('on_%s', name);
    }
}

module.exports = {
    Function_Def:Function_Def,

    on_validate:function (content, params, method) {
        if (!content) {
            content = ['var self = this', util.format('self.%s(rs)', _m('input', method))]
        }
        var out = new Function_Def(_m('validate', method), content, _rsp(params));
        out.method = true;
        return out;
    },

    on_input:function (content, params, method) {
        if (!content) {
            content = ['var self = this', 'var input = rs.req_props', util.format('self.%s(rs, input)', _m('process', method))]
        }
        var out = new Function_Def(_m('input', method), content, _rsp(params));
        out.method = true;
        return out;
    },

    on_process:function (content, params, method) {
        if (!content) {
            content = ['var self = this'];

            switch (method){
                case 'get':
                    content.push( 'self.on_output(rs,input)');
                    break;

                case 'on':
                    content.push( 'self.on_output(rs,input)');
                    break;

                default:
                    content.push('rs.send(input)');
            };
        }
        if (!params) {
            params = ['rs', 'input']
        }
        var out = new Function_Def(_m('process', method), content, _rsp(params));
        out.method = true;
        return out;
    },

    on_output:function (content, params) {
        var out = new Function_Def(_m('output', method), content, _rsp(params));
        out.method = true;
        return out;
    },

    actions:function (method) {
        return {
            validate:module.exports.on_validate(false, false, method),
            input:module.exports.on_input(false, false, method),
            process:module.exports.on_process(false, false, method)
        }
    }
}