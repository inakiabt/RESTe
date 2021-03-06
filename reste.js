var Q = require('q');

exports.Q = Q;

// setup vars
var config = {},
    requestHeaders = [];

// generic log handler in DEV mode
function log(message) {
    if (ENV_DEV) {
        console.log(message);
    }
}

// sets up the config, headers, adds methods
exports.config = function(args) {

    config.baseUrl = args.url;
    config.timeout = args.timeout;
    config.onError = args.onError;
    config.onLoad = args.onLoad;

    exports.setRequestHeaders(args.requestHeaders);

    args.methods.forEach(function(method) {
        exports.addMethod(method);
    });
};

// makes an http request to a URL, as a POST / GET / currently, 
// passing params and callback
function makeHttpRequest(url, method, params, onLoad, onError) {

    // debug the url
    log("::RESTE:: " + (config.baseUrl ? config.baseUrl + url : url));

    var deferred = Q.defer();

    // create a client
    var http = Ti.Network.createHTTPClient();

    //set some defaults
    http.setTimeout(config.timeout || 10000);

    // open the url
    http.open(method, (config.baseUrl ? config.baseUrl + url : url));

    // load up any request headers
    requestHeaders.forEach(function(header) {
        http.setRequestHeader(header.name, header.value);
    });

    // events
    http.onload = function(e) {
        try {
            deferred.resolve(JSON.parse(http.responseText));
        } catch (ex) {
            deferred.reject(new Error("Received an error with invalid JSON: " + http.responseText));
        }
    };

    http.onerror = function(e) {
        e.url = url;
        try {
            deferred.reject(JSON.parse(http.responseText));
        } catch (ex) {
            deferred.reject(new Error("Received an error with invalid JSON: " + http.responseText));
        }
    };

    // go
    if (params && method == "POST") {
        http.send(JSON.stringify(params));
    } else {
        http.send();
    }

    return deferred.promise
        .then(function(response){
            if (config.onLoad) {
                config.onLoad(response, onLoad);
            } else if (onLoad) {
                onLoad(response);
            }

            return Q(response);
        }, function(error){
            if (onError) {
                // if we have an onError method, use it
                onError(error);
            } else if (config.onError) {
                // otherwise fallback to the one specified in config
                config.onError(error);
            } else if (onLoad) {
                // otherwise revert to the onLoad callback
                onLoad(error);
            }
            return Q.reject(error);
        });
}

// set Requestheaders
exports.setRequestHeaders = function(headers) {
    requestHeaders = [];
    for (var header in headers) {
        requestHeaders.push({
            name: header,
            value: headers[header]
        });
    }
};

// add a new method
exports.addMethod = function(args) {
    exports[args.name] = function(params, onLoad) {

        var promise = Q();
        var body, url = args.post || args.get,
            onError;

        if (!onLoad && typeof(params) == "function") {
            onLoad = params;
        } else {
            for (var param in params) {

                if (param === "body") {
                    body = params[param];
                } else {
                    url = url.replace("<" + param + ">", params[param]);
                }
            }
        }

        if (args.post) method = "POST";
        if (args.get) method = "GET";
        if (args.put) method = "PUT";
        if (args.delete) method = "DELETE";

        if (args.onLoad) {
            // save the original callback
            var originalOnLoad = onLoad;

            // change the callback to be the one specified
            onLoad = function(e) {
                args.onLoad(e, originalOnLoad);
            };
        }

        if (args.onError) {
            // change the callback to be the one specified
            onError = function(e) {
                args.onError(e, onLoad);
            };
        }

        if (args.expects) {
            // look for explicityly required parameters
            args.expects.forEach(function(expectedParam) {
                if (!params[expectedParam]) {
                    throw "RESTe :: missing parameter " + expectedParam + " for method " + args.name;
                }
            });

            promise = makeHttpRequest(url, method, body, onLoad, onError);

        } else {
            //work out which parameters are required
            var m, missing = [],
                re = /(\<\w*\>)/g;

            while ((m = re.exec(url)) != null) {
                if (m.index === re.lastIndex) {
                    re.lastIndex++;
                }

                missing.push(m[0]);
            }

            if (missing.length > 0) {
                throw "RESTe :: missing parameter/s " + missing + " for method " + args.name;
            } else {
                promise = makeHttpRequest(url, method, body, onLoad, onError);
            }
        }

        return promise;
    };
};
