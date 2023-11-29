import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import db from "./db.js";
import bcrypt from "bcrypt";

db.connect();

const PORT = 3000;

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

app.get("/api/products", (req, res) => {
  res.json(db.query("SELECT * FROM products"));
});

//registration
app.post("/api/registrate", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email && password) {
    const isExist = await db.query(
      "SELECT * FROM user_accounts WHERE email = $1",
      [email]
    );

    if (isExist.rows.length > 0) {
      res.status(409).send("Email already exists");
      db.end();
    } else {
      const hashPassword = await bcrypt.hash(password, 10);
      const newPerson = await db.query(
        "INSERT INTO user_accounts (email, password) values ($1, $2) RETURNING *",
        [email, hashPassword]
      );
      const accountToken = await db.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [email]
      );
      console.log(accountToken.rows[0]);
      db.end();
      res.send(accountToken.rows[0]);
    }
  } else {
    res.status(400).send("Email and password are required");
  }
});

//login - change
app.post("/api/login", async (req, res) => {
  const email = req.body.login;
  const password = await bcrypt.hash(req.body.password, 10);
  const checkPassword = await db.query(
    "SELECT * FROM user_accounts WHERE email = $1",
    [email]
  );

  if (
    checkPassword.rows.length > 1 &&
    password === checkPassword.rows[0].password
  ) {
    res.send(checkPassword.rows[0].token);
  } else {
    res.send(false);
  }
});

//Add for admin panel
app.post("/api/add", (req, res) => {
  res.send("add");
});

//Likes
app.post("/api/likes", async (req, res) => {
  const pk = req.body.pk;
  const state = req.body.state;

  if (state) {
    await db.query("SELECT * FROM products WHERE pk = $1", [pk]);
  }
});

//telegram
app.post("/api/telegram", (req, res) => {
  const { name, number, message } = req.body;
  res.send("Name");
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

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
/**
 * @swagger
 * /api/telegram:
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
/**
 * @swagger
 * /api/likes:
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
