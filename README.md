# sf-workshop
Audience brainstorming software - Multi-user input with live-updating presentation view and a moderator approval queue.

Powered by [Node.js](http://nodejs.org) and [MongoDB](http://www.mongodb.org), using:

* [Express](http://expressjs.com)
* [Cookie](https://github.com/jshttp/cookie)
* [Connect](https://github.com/senchalabs/connect)
* [Connect-Mongo](https://github.com/kcbanner/connect-mongo)
* [Mongoose](http://mongoosejs.com)
* [Socket.IO](http://socket.io)

Icons from [IcoMoon](http://keyamoon.com/icomoon/).

# setup
Change the approval password and session secret in conf.json.

It should look something like this:

    {
        "port": 80,
        "key": "group",
        "db": {
            "db": "workshop",
            "host": "localhost",
            "collection": "sessions"
        },
        "secret": "makemerandom", <- This is the session secret.
        "password": "changeme" <- This is for the approval queue.
    }


# run
Launch MongoDB, then run

    node app.js

You may need to launch MongoDB as

    mongod.exe --dbpath "path\to\db"

# use
This is web-based, so open up your favorite browser.

Let $baseUrl be whatever ip or url your server is hosting on.

## main
This is the audience's page. This is where people get to provide their input.

    $baseUrl

## view
This is the presentation view. People's input will show up here in real-time, color-coded per device.

    $baseUrl/view.html

## approval queue
This is the approval queue. You need to enter the password you set in conf.json to do anything here.

Select the green check to approve. Select the red cross to reject.

    $baseUrl/approval.html

You can enable a touchscreen friendly version with bigger touch targets using:

    $baseUrl/approval.html?m=true