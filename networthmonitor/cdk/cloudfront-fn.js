function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  // Redirect non-www to www
  if (host === "networthmonitor.com") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://www.networthmonitor.com" + request.uri },
      },
    };
  }

  return request;
}
