// biome-ignore lint/correctness/noUnusedVariables: CloudFront Function
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  // Redirect non-www to www
  if (host === "broccoliapps.com") {
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
