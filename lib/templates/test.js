module.exports = {on_validate:function (rs) {
    var self = this;
    this.on_input(rs);
}, on_input:function (rs) {
    var self = this;
    self.on_process(rs, rs.req_props);
}, on_process:function (rs) {
    var self = this;
    self.on_output(rs, input);
}, on_get_validate:function (rs) {
    foo
}, }
