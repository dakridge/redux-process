import http from 'http';

const server = http.createServer((req, res) => {
    const body = { foo: 'bar' };

    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(body));
    res.end();
});

exports.listen = function () {
    server.listen.apply(server, arguments);
};

exports.close = function (callback) {
    server.close(callback);
};