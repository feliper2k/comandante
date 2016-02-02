var spawn = require('child_process').spawn;
var duplexer = require('duplexer');

module.exports = function (cmd, args, opts) {

    if (Array.isArray(cmd)) {
        opts = args;
        args = cmd.slice(1);
        cmd = cmd[0];
    }

    var ps = spawn(cmd, args, opts);
    var dup = duplexer(ps.stdin, ps.stdout);

    ps.on('close', function (code) {
        if (code === 0) return;
        dup.emit('error', new Error());
    });

    dup.stdin = ps.stdin;
    dup.stderr = ps.stderr;
    dup.stdout = ps.stdout;
    dup.pid = ps.pid;
    dup.kill = ps.kill.bind(ps);

    [ 'exit', 'close' ].forEach(function (name) {
        ps.on(name, dup.emit.bind(dup, name));
    });

    return dup;
};
