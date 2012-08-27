var nuby_factory = require('./index');
var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');
var _DEBUG = false;

var _step_view_html_template = _.template("<h2><%= title %></h2>\n<%= content %>");
var _step_view_text_template = _.template("<h2><%= title %></h2>\n<p><%= content %></p>");
var _header_view_template = function (steps) {
    return ['<% steps = ' + JSON.stringify(_.map(steps, function (s) {
        var out = s.toJSON? s.toJSON() : s;
        out = _.clone(out);
        delete out.content;
        delete out.notes;
        return out;
    }), true, 4) + ';' +
        'var current_step = false;' +
        'for (var i = 0; (!current_step) && (i < steps.length); ++i){' +
        'if (steps[i].name == step) current_step = steps[i];' +
        '} %>',
        '<div class="header">',
        '<ul class="clearfix">' +
        '<% steps.forEach(function(header_step){%>',
        '<% if (header_step.order < current_step.order){ %>',
        '<li class="done" id="header_step_<%= step %>">',
        '<% } else if (header_step.order == current_step.order){ %>',
        '<li class="current">',
        '<% } else { %>',
        '<li class="future">',
        '<% } // end step status',
        '%><%= header_step.bc_title %>',
        '</li>',
        '<% }) // end iterator',
        '%>',
        '</ul>' ,
        '</div>'].join("\n");
}
var _footer_view_template = function (steps) {
    if (_DEBUG) console.log('footer view tempate steps: %s', util.inspect(steps));
    var out = _.reduce(steps, function (memo, step, i) {
       if (_DEBUG) console.log('step %s', i);
        //console.log('memo: %s', util.inspect(memo))
        if (i > 0) {
            var prev_step = steps[i - 1];
            // console.log('prev_step: %s', util.inspect(prev_step));
            var prev_title = '<span>to &quot;' + prev_step.title + '&quot;</span>';
            memo = memo.concat([
                '<% if (step == "' + step.name + '"){ %>' ,
                '<button class="prev">Back',
                prev_title ,
                '</button>',
                '<% } %>'
            ]);
        } else {
           if (_DEBUG) console.log('first - skip back')
        }


        if (i < steps.length - 1) {
            var next_step = steps[i + 1];
            //  console.log('next_step: %s', util.inspect(next_step));
            var next_title = '<span>to &quot;' + next_step.title + '&quot;</span>';
            memo = memo.concat([
                '<% if (step == "' + step.name + '"){ %>' ,
                '<button class="next">Next',
                next_title ,
                '</button>',
                '<% } %>'
            ]);
        } else {
          if (_DEBUG)  console.log('last- skip next')
        }
     if (_DEBUG)   console.log('memo: %s', util.inspect(memo))
        return memo
    }, [])

    out.unshift('<div class="footer">');
    out.push('</div>')
    out = out.join("\n")
    return out;
}


module.exports = {

    make_controller:function (wizard, root_dir) {
        if (!(/controllers(\/)?$/.test(root_dir))) {
            root_dir += '/controllers/';
            root_dir = root_dir.replace('//', '/');
        }
        return new nuby_factory.Controller({name:wizard.name, config:{route_prefix:'/' + wizard.name}, file_path:root_dir})
    },

    make_views_folder:function (controller) {
        return new nuby_factory.Views_Folder({name:'views'}, controller);
    },

    make_action:function (wizard, step, controller) {
        var action = new nuby_factory.Action({
            name:step.name
        }, controller);
        action.template.content = module.exports.action_template_content(wizard, step);
        action.add_post('*/' + step.name);
        var get_input = ["var self = this;" +
            "this.models.wizard_state.get_state(function (err, state) {" +
            "self.on_get_process(rs, state);" +
            "}, '" + wizard.name + "', '" + step.name + "');"].join("\n");
        action.add_get('*/' + step.name, {input: get_input} );
        return action;
    },

    make_index_action:function (wizard, first_step, controller) {
       if (_DEBUG) console.log('make_index_action(%s,%s,%s)',
            util.inspect(wizard, false, 1),
            util.inspect(first_step, false, 1),
            util.inspect(controller, false, 1)
        )

        var route_prefix = '/' + controller.name;
        var route = first_step.name;

        var action = new nuby_factory.Action({
            name:'index'
        }, controller);

        action.add_on('*', {
                validate:"rs.go('" + route_prefix + '/' + route + "');"
            }
        );
        action.input.on = false;
        action.process.on = false;
        return action;
    },

    action_template_content:function (wizard, step) {
        if (!step){
            throw new Error('no step');
        } else if (!step.content){
            throw new Error(util.format('no content in step %s', util.inspect(step)));
        }
        switch (step.content_type) {
            case 'html':
                var main = _step_view_html_template(step);
                break;

            default:
                var main = _step_view_text_template(step);
        }
        var content = '<form method="post" class="wizard"><h1>' + wizard.title + '</h1>' + "\n";

        content += '<%- partial("../../views/step_header.html", {step: "' + step.name + '"}) %> <br />' + "\n";
        content += main + "\n";
        content += '<%- partial("../../views/step_footer.html", {step: "' + step.name + '"}) %></form>'

        return content;
    },

    generate_footer: function(steps){
       return _footer_view_template(steps);
    },

    add_view_folder:function (controller, steps) {
        var views_folder = module.exports.make_views_folder(controller);
        var h_content = _header_view_template(steps);
        h_content = h_content.replace(/\n/g, '');
        h_content = h_content.replace(/[\s]+</, '<')
        var header_file = new nuby_factory.View_File({
            name:'step_header.html',
            content:h_content
        }, views_folder);
        views_folder.add_view_file(header_file);
        var f_content = _footer_view_template(steps);
        views_folder.add_view_file(new nuby_factory.View_File({
            name:'step_footer.html',
            content:f_content
        }, views_folder))
    },

    make_wizard:function (root_dir, wizard, steps, overwrite, cb) {
        var controller = module.exports.make_controller(wizard, root_dir);
        if (fs.existsSync(controller.get_path()) && (!overwrite)) {
            throw new Error('process_error', rs, 'there is already a controller at ' + controller.get_path());
        }

        this.add_view_folder(controller, steps);
        module.exports.make_index_action(wizard, steps[0], controller);

        steps.forEach(function (step) {
            module.exports.make_action(wizard, step, controller);
        });

        console.log('rendering controller');

        controller.render(cb);

    }
}