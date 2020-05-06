const restify = require('restify');
const walk = require('walkdir');
const SolrNode = require('solr-node');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-restify');

// Solr connection
var solr = new SolrNode({
    host: 'solr-mapveu-dev.local.apidb.org',
    port: '7997',
    core: 'vb_popbio',
    protocol: 'https'
});

const server = restify.createServer();
server.use(restify.plugins.queryParser());

const paths = walk.sync('./routes');
paths.filter(jspath => /handler.js$/.test(jspath))
  .forEach(jspath => {
    const { route } = require(jspath);

    // walkdir returns full absolute paths so
    // chop of everything up to the 'routes'
    var routepath = path.dirname(jspath);
    routepath = routepath.replace(/.+?routes/, '');

    // and pass that through to the route handler setter
    route(routepath, server, solr);
  });

// swagger-jsdoc options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MapVEu Data API',
      version: '0.1',
    },
  },
  // Path to the API docs
  apis: ['./routes/**/*.js'],
};

// Initialize swagger-jsdoc -> returns validated swagger (OpenAPI) spec in json format
const swaggerSpec = swaggerJSDoc(options);

// Serve Swagger page
let docPath = '/api-docs';
server.get(docPath, swaggerUi.setup(swaggerSpec, {baseURL: docPath}));
server.get(docPath + '/*', ...swaggerUi.serve);

console.log(server.toString());
server.listen(8081);

