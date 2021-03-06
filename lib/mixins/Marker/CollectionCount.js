const { PointMarker } = require.main.require('./lib/helpers/Marker/PointMarker.js');

// A mixin function which takes a superclass as a parameter and returns a subclass
// extending that superclass.
let CollectionCount = (superclass) => class extends superclass {
  constructor(solr, query) {
    super(solr, query);
    this.query.rows(0);
  }

  parseQueryParams() {
    super.parseQueryParams();
    const params = this.queryParams;

    // outer facet on geography
    const geoField = params.geoField;
    // inner facet on a category such as species or collection_protocol
    const catField = params.catField;

    const commonGeoFacetStats = PointMarker.commonGeoFacetStats();

    if (geoField && catField) {
      this.query.addParams([ { 
        field: "json.facet",
        value:
	`{
  collectionCount: "unique(collection_assay_id_s)",
  geo: {
    type: "terms",
    field: "${geoField}",
    limit: -1,
    mincount: 1,
    sort: "collectionCount desc",

    facet: {
      ${commonGeoFacetStats},
      collectionCount: "unique(collection_assay_id_s)",

      cat: {
        type: "terms",
        field: "${catField}",
        limit: -1,
        mincount: 1,
        sort: "collectionCount desc",

        facet: {
          collectionCount: "unique(collection_assay_id_s)"
        }
      }
    }
  }
}`
      } ]);

    } else {
      console.log("Error: one or both facet fields not given");
      // TO DO: proper error handling
    }

  }
  
  parseResponse(response) {
    return response.facets;
  }

}

exports.CollectionCount = CollectionCount;
