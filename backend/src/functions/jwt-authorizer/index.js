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
      // Validate the audience (app client id) to ensure token was issued for this app
      audience: APP_CLIENT_ID
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

  // Pass user context to backend functions
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

    // Build context with user claims for backend authorization
    const context = {
      sub: decoded.sub,
      email: decoded.email || '',
      role: decoded['custom:role'] || 'user',
      username: decoded.username || ''
    };

    // Return an Allow policy with context
    return generatePolicy(decoded.sub, 'Allow', event.methodArn, context);
  } catch (error) {
    console.error('Error authorizing request:', error);

    // Return a Deny policy
    return generatePolicy('unauthorized', 'Deny', event.methodArn);
  }
};