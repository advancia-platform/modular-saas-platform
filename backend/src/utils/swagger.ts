import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Advancia Pay Ledger API",
      version: "1.0.0",
      description: "Modular SaaS Platform API Documentation",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? process.env.API_BASE_URL || "https://api.example.com"
            : "http://localhost:4000",
        description:
          process.env.NODE_ENV === "production" ? "Production" : "Development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    // Scan route files for JSDoc swagger annotations if present
    "./src/routes/**/*.ts",
    "./src/routes/**/*.js",
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Expose Swagger UI at /api-docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Advancia Pay API",
  }));

  // Also expose raw OpenAPI JSON for clients like swagger-ui-react
  app.get("/openapi.json", (_req, res) => {
    res.json(specs);
  });
}
