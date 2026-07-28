// Common response headers for all Lambda functions
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

// Standard success response
function successResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

// Standard error response
function errorResponse(statusCode, error, message = undefined) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      error,
      message: message || undefined
    })
  };
}

// Validation error response
function validationError(field) {
  return errorResponse(400, `Missing required field: ${field}`);
}

// Not found response
function notFound(resource) {
  return errorResponse(404, `${resource} not found`);
}

// Internal server error
function internalError(error, isDev = false) {
  return errorResponse(500, 'Internal server error', isDev ? error.message : undefined);
}

module.exports = {
  corsHeaders,
  successResponse,
  errorResponse,
  validationError,
  notFound,
  internalError
};