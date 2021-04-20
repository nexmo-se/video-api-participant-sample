OpenTok.js Basic Sample
=======================

This sample application shows how to connect to an OpenTok session, publish a stream,
subscribe to a stream, optimised for the new Participant Pricing.


## Running the App

1. `npm install`
2. Copy the `.env.copy` file to `.env`
3. Run `npm run dev` to run the server in Dev Mode


## Heroku Support

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)



## Connecting to the session

The app calls the `initializeSession()` method to get the APIKey, SessionId and Token.

First, this method initializes a Session object:

```javascript
    // Initialize Session Object
    var session = OT.initSession(apiKey, sessionId);
```

The `OT.initSession()` method takes two parameters -- the OpenTok API key and the session ID. It
initializes and returns an OpenTok Session object.

The `connect()` method of the Session object connects the client application to the OpenTok
session. You must connect before sending or receiving audio-video streams in the session (or before
interacting with the session in any way). The `connect()` method takes two parameters -- a token
and a completion handler function:

```javascript
// Connect to the session
  session.connect(token, function callback(error) {
    if (error) {
      handleError(error);
    } else {
      console.log("Session Connected");
    }
  });
```

An error object is passed into the completion handler of the `Session.connect()` method if the
client fails to connect to the OpenTok session. Otherwise, no error object is passed in, indicating
that the client connected successfully to the session.

The Session object dispatches a `sessionDisconnected` event when your client disconnects from the
session. The application defines an event handler for this event:

```javascript
    session.on('sessionDisconnected', function(event) {
      console.log('You were disconnected from the session.', event.reason);
    });
    
```


## Register Session Events

The Session object emits the `connectionCreated` and `connectionDestroyed` event. The code listens to these events to decide when to publish and unpublish the local stream. Using the new Participant model, the code should publish the stream **only if** there is at least one other user connected to the session. The Connections events are fired also when your own client connects, so we need to filter our own connections on the Session handler.

If the `connectionCount` is equal to 1 and the Publisher is not publishing, the code calls the `session.publish` method to start publishing. On the other hand, when the `connectionCount` is equal to 0, the code will unpublish the stream.

```javascript

function handlePublisher() {
  console.log("[handlePublish]", connectionCount);
  if (!isPublishing && connectionCount === 1) {
    session.publish(publisher, handleError);
  } else if (connectionCount === 0 && publisher) {
    session.unpublish(publisher);
  }
}

session.on("connectionCreated", function (event) {
    console.log("[connectionCreated]", connectionCount);
    if (event.connection.connectionId !== session.connection.connectionId) {
      connectionCount += 1;
      handlePublisher();
    }
  });

  session.on("connectionDestroyed", function (event) {
    console.log("[connectionDestroyed]", connectionCount);
    if (event.connection.connectionId !== session.connection.connectionId) {
      connectionCount -= 1;
      handlePublisher();
    }
  });

```
To keep track of the publisher status, we added the `streamCreated` and `streamDestroyed` events on the Publisher object. Please note on the `streamDestroyed` event, we call the `e.preventDefault` to not destroy the local Publisher object. Therefore, we can reuse the same Publisher object to publish the stream again into the Session

```javascript
// initialize the publisher
  var publisherOptions = {
    insertMode: "append",
    width: "100%",
    height: "100%",
  };
  publisher = OT.initPublisher("publisher", publisherOptions, handleError);
  publisher.on("streamCreated", (event) => {
    console.log("[Publisher] - streamCreated", event.reason);
    isPublishing = true;
  });
  publisher.on("streamDestroyed", (event) => {
    console.log("[Publisher] - streamDestroyed", event.reason);
    event.preventDefault();
    isPublishing = false;
  });

```


## Subscribing to another client's audio-video stream

The Session object dispatches a `streamCreated` event when a new stream (other than your own) is
created in a session. A stream is created when a client publishes to the session. The
`streamCreated` event is also dispatched for each existing stream in the session when you first
connect. This event is defined by the StreamEvent object, which has a `stream` property,
representing stream that was created. The application adds an event listener for the
`streamCreated` event and subscribes to all streams created in the session using the
`Session.subscribe()` method:

```javascript
    // Subscribe to a newly created stream
    session.on('streamCreated', function(event) {
      var subscriberOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      };
      session.subscribe(event.stream, 'subscriber', subscriberOptions, function(error) {
        if (error) {
          console.log('There was an error publishing: ', error.name, error.message);
        }
      });
    });
```

The `Session.subscribe()` method takes four parameters:

* The Stream object to which we are subscribing
* The target DOM element or DOM element ID (optional) for placement of the subscriber video
* A set of properties (optional) that customize the appearance of the subscriber view
* The completion handler function (optional) that is called when the method completes
  successfully or fails
