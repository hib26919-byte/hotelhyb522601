module.exports = (request, response, next) => {
  const adminToken = request.headers["x-admin-token"];

  if (!adminToken && request.method !== "GET") {
    return response.status(401).json({
      message: "Missing admin token for protected backend action.",
    });
  }

  return next();
};

