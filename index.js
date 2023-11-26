import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

const PORT = 3000;

const app = express();

const fakeBd = [
  {
    pk: 1,
    area: 392,
    size: "13.6x53.6",
    acres: "6.7",
    style: "Неоклассика",
    cost: "7000000",
    data: ".......",
    main_photo: "http://45.153.186.140:3009/static/img/jJngaek0.png",
    images: [
      {
        id: 1,
        photo_path: "http://45.153.186.140:3009/static/img/vrFqKceg.jpg",
      },
      {
        id: 2,
        photo_path: "http://45.153.186.140:3009/static/img/vevRALGw.jpg",
      },
      {
        id: 3,
        photo_path: "http://45.153.186.140:3009/static/img/czf6Mudi.jpg",
      },
      {
        id: 4,
        photo_path: "http://45.153.186.140:3009/static/img/QezgwymL.jpg",
      },
      {
        id: 5,
        photo_path: "http://45.153.186.140:3009/static/img/lamJcjc0.jpg",
      },
    ],
  },
  {
    pk: 2,
    area: 123,
    size: "18.7х20",
    acres: "123",
    style: "Неоклассика",
    cost: "7000000",
    data: "1232131",
    main_photo: "http://45.153.186.140:3009/static/img/5eHTyBWZ.png",
    images: [
      {
        id: 6,
        photo_path: "http://45.153.186.140:3009/static/img/UX8d1Yrj.jpg",
      },
      {
        id: 7,
        photo_path: "http://45.153.186.140:3009/static/img/RmCK2qwf.jpg",
      },
      {
        id: 8,
        photo_path: "http://45.153.186.140:3009/static/img/HM5WGXTe.jpg",
      },
    ],
  },
];
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список недвижимости
 *     description: Получение списка всех объектов недвижимости
 *     responses:
 *       '200':
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             example: fakeBd
 */

/**
 * @swagger
 * /api/reg:
 *   post:
 *     summary: Получить список недвижимости
 *     description: Получение списка всех объектов недвижимости
 *     responses:
 *       '200':
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             example: [{"pk": 1, "area": 392, ...}, {"pk": 2, "area": 123, ...}]
 */

app.get("/api/products", (req, res) => {
  res.json(fakeBd);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
