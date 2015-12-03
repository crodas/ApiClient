var Server = (function API_Client() {
    var url = undefined;
    var ns = {};
    var wait;
    var queue = [];

    function doExecute() {
        var currentQueue = queue;
        var reqBody = currentQueue.map(function(stmt) {
            return [stmt[0], stmt[1]];
        });
        queue = [];

        var xhr = new XMLHttpRequest();
        xhr.onerror = function() {

        };
        xhr.onload = function() {
            if (xhr.getResponseHeader('X-Set-Session-Id')) {
                localStorage.sessionId = xhr.getResponseHeader('X-Set-Session-Id');
            } else if (xhr.getResponseHeader("X-Destroy-Session-Id")) {
                localStorage.sessionId = "";
            }
            var response = typeof this.response === "string" ? JSON.parse(this.response || this.responseText) : this.response;
            if (typeof response === "number") {
                // general error
                // TODO: retry or give up
                return;
            }
            for (var i = 0; i < response.length; ++i) {
                if (typeof response[i] === "object" && response[i].error) {
                    currentQueue[i][3](response[i]);
                } else {
                    currentQueue[i][2](response[i]);
                }
            }
        };

        xhr.open("POST", url, true);
        if (localStorage.sessionId) {
            xhr.setRequestHeader("X-Session-Id", localStorage.sessionId);
        }
        xhr.responseType = 'json';
        xhr.send(JSON.stringify(reqBody));
    }


    ns.setUrl = function(_url) {
        url = _url;
        return this;
    };


    ns.exec = function(method, args, callback) {
        if (typeof args === "function") {
            callback = args;
            args     = {};
        }

        var promise = new Promise(function(resolve, reject) {
            queue.push([method, args, resolve, reject]);
        });

        if (typeof url === "undefined") {
            throw new Error("Please set the server (server.url(<url>)");
        }

        if (typeof callback === "function") {
            promise.then(callback);
        }

        clearTimeout(wait);
        wait = setTimeout(doExecute, 50);

        return promise;
    };

    return ns;
})();
