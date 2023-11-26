import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API",
      version: "1.0.0",
      description: "Your API description",
    },
  },
  apis: ["./index.js"], // Укажите путь к вашему файлу с роутами
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
