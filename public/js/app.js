/* global OT, apiKey, sessionId, token */

var connectionCount = 0;
var session = null;
var publisher = null;
var isPublishing = false;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function handlePublisher() {
  console.log("[handlePublish]", connectionCount);
  if (!isPublishing && connectionCount === 1) {
    // publish twice the same stream explode everything
    session.publish(publisher, handleError);
  } else if (connectionCount === 0 && publisher) {
    session.unpublish(publisher);
  }
}

function initializeSession() {
  session = OT.initSession(apiKey, sessionId);

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

  // Subscribe to a newly created stream
  session.on("streamCreated", function streamCreated(event) {
    var subscriberOptions = {
      insertMode: "append",
      width: "100%",
      height: "100%",
    };
    session.subscribe(
      event.stream,
      "subscriber",
      subscriberOptions,
      handleError
    );
  });

  session.on("sessionDisconnected", function sessionDisconnected(event) {
    console.log("You were disconnected from the session.", event.reason);
  });

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

  // Connect to the session
  session.connect(token, function callback(error) {
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      // todo session.publish(publisher, handleError);
      console.log("Session Connected");
    }
  });
}

initializeSession();
