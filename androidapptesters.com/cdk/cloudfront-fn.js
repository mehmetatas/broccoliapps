// biome-ignore lint/correctness/noUnusedVariables: CloudFront Function
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  var uri = request.uri;

  // Redirect non-www to www
  if (host === "androidapptesters.com") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://www.androidapptesters.com" + uri },
      },
    };
  }

  // URL rewrites
  if (uri === "/") {
    request.uri = "/developers.html";
  } else if (!uri.includes(".")) {
    // Add .html extension for clean URLs (e.g., /about -> /about.html)
    request.uri = uri + ".html";
  }

  return request;
}
