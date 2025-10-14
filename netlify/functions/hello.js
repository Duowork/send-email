// Save this as: netlify/functions/hello.js

exports.handler = async (event, context) => {
  // Get query parameters
  const { name = 'stranger' } = event.queryStringParameters || {};
  
  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString()
    })
  };
};