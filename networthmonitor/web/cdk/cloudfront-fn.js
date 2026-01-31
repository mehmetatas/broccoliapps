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

  // Redirect /privacy and /terms to broccoliapps.com
  if (request.uri === "/privacy" || request.uri === "/terms") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://www.broccoliapps.com" + request.uri },
      },
    };
  }

  return request;
}
