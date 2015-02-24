# RESTe

## Why?

I build a lot of apps that integrate with APIs. These could be written in cloud services like Parse.com etc, but more often they are custom APIs written by another developer. I was using a basic api.js library to handle the API integration, but this involved implementing the api.js file into a separate library file specific to the project.

In this file, I'd list out a load of methods like this:-

```JS
exports.getPreviousLocations = function(callback) {
    var Rest = new Api(Alloy.CFG.baseURL + "users/" + token + "/previouslocations");

    Rest.get(function(e) {
        processResponse(e, function() {
            callback(e.result);
        });
    });

};
```

or a POST one like this:

```JS
exports.updateUser = function(name, email, password, callback) {
    var Rest = new Api(Alloy.CFG.baseURL + "users/" + token);

    Rest.post(JSON.stringify({
        "name" : name,
        "email" : email,
        "password" : password

    }), function(e) {
       
        processResponse(e, function() {
            callback(e);
        });
    });
};
```

The processResponse function was written to try to parse the data as it came back, check for success / results etc - but even with that I was finding myself duplicating a lot of code.

So the idea behind RESTe was to have a single JS library I could drop in a project, then apply a simple config to it and have *it* generate the methods for me.

The main things I wanted were:-

* Simple to implement in an new project, or replace an existing API layer
* Supports headers, tokens, events
* Minimal code


## Quick Start
* [Download the latest version](https://github.com/jasonkneen/reste).
* Place in your lib folder

Wherever you want to initialise the API interface, put this:-

```javascript
var api = require("reste");

api.config({
    timeout: 4000,
    url: "https://api.parse.com/1/",
    requestHeaders: {
        "X-Parse-Application-Id": "APPID",
        "X-Parse-REST-API-Key": "RESTID",
        "Content-Type": "application/json"
    },
    methods: [{
        name: "courses",
        post: "functions/getCourses"
    }, {
        name: "getVideos",
        get: "classes/videos"
    }, {
        name: "getVideoById",
        get: "classes/videos/<videoId>"
    }, {
        name: "addVideo",
        post: "classes/videos"
    }],
    onError: function(e) {
        alert("There was an error accessing the API");
    },
    onLoad: function(e, callback) {
        callback(e);
    }
});
```

If you pass an **onError** method, you can intercept any error and present whatever UI you want. Likewise the **onLoad** event will intercept after the http request is done but  **before** the callback. You can do what you want with the result, or pass on to the original callback.

_(working on adding these as optional to each method too for special cases, say handling tokens)_

Once you've done all this (and assuming no errors), you'll have new methods available:

```javascript
api.getAllVideos(function(videos) {
    // do stuff with the videos here
});
```

Or call a method with a specific Id:

```javascript
api.getVideoById({
    videoId: "fUAM4ZFj9X"    
}, function(video) {
    // do stuff with the video
});
```

For a post request, you could do the following:

```javascript
api.addVideo({
    body: {
        categoryId: 1,
        name: "My Video"
    }
}, function(video) {
    // do stuff with the video
});
```

## License

<pre>
Copyright 2015 Jason Kneen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
</pre>
