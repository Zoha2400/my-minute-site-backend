import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import db from "./db.js";

db.connect();

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
    likes: 0,
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
    likes: 0,
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
app.use(express.json());
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
 * /api/registrate:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Регистрация нового пользователя с использованием email и пароля.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email адрес пользователя.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя.
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

app.post("/api/registrate", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email && password) {
    const newPerson = await db.query(
      "INSERT INTO user_accounts (email, password) values ($1, $2) RETURNING *",
      [email, password]
    );
    db.end();
    res.send(newPerson);
  } else {
    res.status(400).send("Email and password are required");
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
