var spawn = require('child_process').spawn;
var duplexer = require('duplexer');
var Q = require('q');

module.exports = function (cmd, args, opts) {

    if (Array.isArray(cmd)) {
        opts = args;
        args = cmd.slice(1);
        cmd = cmd[0];
    }

    var ps = spawn(cmd, args, opts);
    var dup = duplexer(ps.stdin, ps.stdout);
    var deferred = Q.defer();
    var err = '';
    if (ps.stderr) {
        ps.stderr.on('data', function (buf) { err += buf });
    }

    ps.on('close', function (code) {
        if (code === 0) {
            deferred.resolve(err);
        }
        else {
            deferred.reject(err);
        }
    });

    dup.stdin = ps.stdin;
    dup.stderr = ps.stderr;
    dup.stdout = ps.stdout;
    dup.pid = ps.pid;
    dup.kill = ps.kill.bind(ps);
    dup.done = deferred.promise;

    [ 'exit', 'close' ].forEach(function (name) {
        ps.on(name, dup.emit.bind(dup, name));
    });

    return dup;
};
