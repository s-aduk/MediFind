// JWT Authorizer for API Gateway
// Validates JWT tokens issued by Amazon Cognito
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID; // e.g., us-east-1_abc123
const REGION = process.env.AWS_REGION || process.env.REGION; // e.g., us-east-1
const APP_CLIENT_ID = process.env.APP_CLIENT_ID; // Optional: if you want to validate the audience

// Initialize JWKS client
const client = jwksClient({
  jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
});

// Function to get the signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Verify the token
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      // If you want to validate the audience (app client id), uncomment the next line
      // line and set the audience.
      // audience: APP_CLIENT_ID // Validate the audience (app client id)
    }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

// Generate the policy document for API Gateway
function generatePolicy(principalId, effect, resource, context) {
  const authResponse = {
    principalId: principalId
  };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    };
  }

  // Context values are passed through to event.requestContext.authorizer
  // in downstream Lambda proxy integrations. Values must be flat strings,
  // numbers, or booleans (no nested objects/arrays).
  if (context) {
    authResponse.context = context;
  }

  return authResponse;
}

// Main handler
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Extract the token from the Authorization header
    let token = event.authorizationToken;
    if (event.type === 'TOKEN') {
      // For TOKEN authorizer type
      token = event.authorizationToken;
    } else if (event.type === 'REQUEST') {
      // For REQUEST authorizer type, the token might be in the headers
      token = event.headers.Authorization || event.headers.authorization;
    }

    if (!token) {
      throw new Error('Missing authorization token');
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify the token
    const decoded = await verifyToken(token);

    // Optionally, you can add additional checks here, such as:
    // - Checking token expiration (jwt.verify already does this)
    // - Checking token usage (e.g., token not in a denied list)
    // - Checking custom claims

    // Return an Allow policy, with the caller's identity attached so
    // downstream Lambdas can trust it instead of client-supplied fields.
    return generatePolicy(decoded.sub, 'Allow', event.methodArn, {
      userId: decoded.sub,
      email: decoded.email || '',
      role: decoded['custom:role'] || 'user',
    });
  } catch (error) {
    console.error('Error authorizing request:', error);

    // Return a Deny policy
    return generatePolicy('unauthorized', 'Deny', event.methodArn);
  }
};