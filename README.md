# Categories Microservice

This microservice was generated using the Albatross Generator for the **category** project.

Navigate to the api-docs page to view the Swagger page for this service!

## Quick Start

Running this microservice on your local environment:

1. Install npm: https://www.npmjs.com/get-npm
2. Open a terminal at the project location
3. Enter `npm install` - this will install all project dependencies
4. Enter `npm start`
5. Navigate to `localhost:8080/healthcheck` - you'll see the "Success" response

## Architecture Overview

This microservice implements a hierarchical category management system with deeply nested structures. Understanding the architecture is crucial for maintenance and enhancements.

### Data Structure

Categories are stored in a hierarchical (tree) structure:
- Root categories are top-level documents in MongoDB
- Child categories are stored within their parent's `children` array
- Categories can be nested to arbitrary depths

Each category has the following key properties:
- `_id`: MongoDB ObjectID or UUID string
- `name`: Category name
- `active`: Boolean indicating if category is active
- `children`: Array of child categories (nested documents)
- `parent`: Reference to parent category ID (if applicable)
- `createUuid`: UUID string for tracking
- `createdDate`: Creation timestamp
- `modifiedDate`: Last modification timestamp

### Key Components

#### Models (`app/models/`)
- `category.model.ts`: Defines the Category schema and interface

#### Services (`app/services/`)
- `category.service.ts`: Core service implementing category operations
  - Handles CRUD operations for categories
  - Manages nested structures with parent-child relationships
  - Contains specialized methods for flattening nested structures
- `db-micro-service-base.ts`: Base class with common database operations
- `db-service-base.ts`: Low-level database operations
- `database.service.ts`: MongoDB connection and query handling

#### Routes (`app/routes/`)
- `default.api.ts`: Defines the RESTful API endpoints for categories
- `healthcheck.api.ts`: System health monitoring endpoint

### Critical Operations

#### Creating Categories
- Root categories are created directly in the database
- Child categories are added to their parent's `children` array
- Creation operations handle both direct creation and updates to existing categories

#### Deleting Categories
The deletion process is specialized due to the nested structure:
1. For root categories: Delete the document directly
2. For nested categories:
   - Find the parent document 
   - Remove the category from the parent's children array
   - Update the parent document in the database

#### Flattening Categories
The `gridFlatten` method transforms the nested tree structure into a flat array for display in grids/tables.

### Common Issues and Solutions

#### ID Format Issues
- MongoDB ObjectIDs should be used consistently
- If deleting fails, verify ID format matches database

#### Nested Category Operations
- Modifications to nested categories require updating the root document
- Use the provided helper methods for traversing the hierarchy

#### Parent-Child Relationships
- When creating child categories, ensure parent IDs are correctly set
- Child categories without valid parent references become orphaned

## Configuration

### Routes Configuration
Routes are located under `app/routes/<file name>.api.ts`

Group your related routes in a routes file inside the app/routes folder. Albatross will insert a default.api.ts route file upon generation of the microservice with standard routes already included and ready to test.

### Services Configuration
Services are located under `app/services/<file name>.service.ts`

Service files encapsulate the "business" functionality of your microservice through exported functions. Any functions not called directly by routes should be declared private.

### AppDynamics Configuration
AppDynamics is enabled within the `app/server.ts` file and uses the configuration values stored in the `config/app-dynamics.config.ts` file.

Several configuration properties must be set, with most having corresponding environment variables in the vault. The following properties should be customized for this microservice:
- `tierName`
- `nodeName`
- `reuseNodePrefix`

All should be set to a string that uniquely identifies your project.

## Testing

Run tests with:
```
npm test
```

Key test files:
- `app/tests/services/category.service.spec.ts`: Tests for category service functionality
- `app/tests/routes/default.api.spec.ts`: Tests for API endpoints

## Contributing

This microservice base is open to accepting pull requests. If you come across something that can improve the architecture or packages used, please create a separate branch from 'development', make your updates, and create a pull request against 'development'.

## Troubleshooting

### Common Issues

1. **Category not found during deletion**
   - Check if the category ID format matches the database format
   - Verify the category exists within a parent's children array

2. **Changes to nested categories not persisting**
   - Ensure you're updating the root document after modifying nested children
   - Use the provided helper methods for traversing and updating the hierarchy

3. **Performance issues with large category trees**
   - Consider pagination when retrieving large category hierarchies
   - Use the flattening methods for UI display but maintain tree structure for operations

### Debugging

The service includes extensive logging to help diagnose issues:
- Set appropriate logging levels in your environment
- Check logs when operations fail for detailed error information


