// biome-ignore lint/correctness/noUnusedVariables: CloudFront Function
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  // Redirect non-www to www
  if (host === "tasquito.com") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://www.tasquito.com" + request.uri },
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
