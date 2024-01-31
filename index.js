import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import db from "./db.js";
import bcrypt from "bcrypt";
import cors from "cors";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname, extname, join } from "path";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import { URL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pth = "http://89.111.153.226";

const PORT = 3000;

const token = "6986876392:AAG7M6hAmpdPuE3-SxrNV9hgTa2qMDAu4tg";
const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
  { command: "/start", description: "Запустить бота" },
  { command: "/info", description: "Информация о боте" },
  { command: "/hello", description: "Сказать Привет" },
]);

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const chatTitle = msg.chat.title;
  const text = msg.text;
  const nameOfUser = msg.from.first_name;

  console.log(msg);

  // bot.sendMessage(chatId, 'Your message is ' + text);
  switch (text) {
    case "/start":
      await bot.sendMessage(chatId, `Привет ` + nameOfUser + "!");
      break;
    case "/start@zmFirstBotonJs_bot":
      await bot.sendMessage(chatId, `Привет ` + chatTitle + "!");
      break;
    case "/hello":
      await bot.sendMessage(chatId, "Ты пидорас, " + nameOfUser + "!");
      break;
    default:
      await bot.sendMessage(chatId, "Я тебя не понимаю..");
  }
});

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 1024 * 1024 * 1024 }, // Например, установим лимит в 50 МБ
  })
);

app.post("/api/products", async (req, res) => {
  const token = req.body.token;

  console.log("Token:", token);

  if (token) {
    const products = await db.query(
      `
      SELECT
      products.pk,
      products.area,
      products.size,
      products.acres,
      products.style,
      products.cost,
      products.data,
      products.main_photo,
      products.images,
      products.likes,
      CASE
        WHEN cart.id IS NOT NULL THEN true
        ELSE false
      END AS like_state
    FROM
      products
    LEFT JOIN
      cart ON products.pk = cart.id AND cart.token = $1
    ORDER BY
      products.pk
    `,
      [token]
    );

    res.json(products.rows);
  } else {
    res.json(
      (await db.query("SELECT * FROM products ORDER BY products.pk")).rows
    );
  }
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
      res.send(accountToken.rows[0]);
    }
  } else {
    res.status(400).send("Email and password are required");
  }
});

//login - change
app.post("/api/login", async (req, res) => {
  const email = req.body.email;
  const enteredPassword = req.body.password;

  try {
    const user = await db.query(
      "SELECT * FROM user_accounts WHERE email = $1",
      [email]
    );

    if (user.rows.length > 0) {
      const storedHashedPassword = user.rows[0].password;

      const passwordsMatch = await bcrypt.compare(
        enteredPassword,
        storedHashedPassword
      );

      if (passwordsMatch) {
        res.json({ token: user.rows[0].token, email: user.rows[0].email });
      } else {
        res.send(false);
      }
    } else {
      res.send(false);
    }
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    res.status(500).send("Ошибка сервера");
  }
});

//Likes
app.post("/api/likes", async (req, res) => {
  const id = req.body.id;
  const state = req.body.state;
  const token = req.body.token;

  const projectExists = await db.query("SELECT * FROM products WHERE pk = $1", [
    id,
  ]);

  const projectExistsToken = await db.query(
    "SELECT * FROM cart WHERE token = $1 AND id = $2",
    [token, id]
  );

  console.log(projectExists.rows.length, projectExistsToken.rows.length);

  if (projectExists.rows.length > 0) {
    try {
      if (state) {
        await db.query(
          "INSERT INTO cart (id, token) values ($1, $2) RETURNING *",
          [id, token]
        );

        await db.query("UPDATE products SET likes = likes + 1 WHERE pk = $1", [
          id,
        ]);

        res.json("{ок}");
      } else {
        await db.query("DELETE FROM cart WHERE id = $1 AND token = $2", [
          id,
          token,
        ]);

        await db.query("UPDATE products SET likes = likes - 1 WHERE pk = $1", [
          id,
        ]);
        res.json("{ок}");
      }
    } catch (error) {
      console.error("Ошибка при выполнении", error);
      res.status(500).send("Ошибка при работе сервера");
    }
  }
});

//cart
app.post("/api/cart", async (req, res) => {
  const token = req.body.token;

  try {
    const userCart = await db.query(
      `
      SELECT
        pk,
        area,
        size,
        acres,
        style,
        cost,
        data,
        main_photo,
        images,
        likes,
        CASE
          WHEN products.pk = cart.id THEN true
          ELSE false
        END AS like_state
      FROM
        products
      LEFT JOIN
        cart ON products.pk = cart.id
      WHERE
        cart.token = $1
    `,
      [token]
    );

    res.json(userCart.rows);
  } catch (error) {
    console.error("Ошибка при выполнении маршрута:", error);
    res.status(500).send("Ошибка сервера");
  }
});

app.post("/api/add", async (req, res) => {
  // Получаем файлы из запроса
  const { main_photo, photos, ...smth } = req.files;
  const { area, size, acres, style, cost, data } = req.body;

  // Генерируем уникальное имя для файла
  const generateFileName = () => {
    return `${Date.now()}_${Math.floor(Math.random() * 1000)}${extname(
      main_photo.name
    )}`;
  };

  const createWays = (randname) => {
    return join(__dirname, "img", randname);
  };

  // Сохраняем основную фотографию
  const mainName = generateFileName();
  main_photo.mv(createWays(mainName), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json("");
    }
  });

  const php = [];

  if (Array.isArray(photos)) {
    photos.forEach((el) => {
      const rand = generateFileName();
      php.push(`${pth}/img/` + rand);
      el.mv(createWays(rand), (err) => {
        if (err) return res.status(500).json("");
      });
    });
  } else {
    const rand = generateFileName();

    php.push(`${pth}/img/` + rand);
    photos.mv(createWays(rand), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
    });
  }

  const formDataForDB = {
    area: area,
    size: size,
    acres: acres,
    style: style,
    cost: cost,
    data: data,
    main_photo: `${pth}/img/` + mainName,
    photos: { photos: php },
  };

  await db.query(
    "INSERT INTO products (area, size, acres, style, cost, data, main_photo, images, likes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [
      +formDataForDB.area,
      formDataForDB.size,
      formDataForDB.acres,
      formDataForDB.style,
      formDataForDB.cost,
      formDataForDB.data,
      formDataForDB.main_photo,
      JSON.stringify(formDataForDB.photos),
      0,
    ]
  );

  return res.json("true");
});

//telegram
app.post("/api/telegram", (req, res) => {
  const name = req.body.name;
  const number = req.body.number;
  const message = req.body.message;

  // const { name, number, message } = req.body;
  const chatId = -4062555774;

  bot.sendMessage(
    chatId,
    `Имя: ${name}\nНомер телефона: ${number}\nСообщение: ${message}`
  );
  res.send("Name");
});

app.post("/api/telegram/offer", (req, res) => {
  const name = req.body.name;
  const number = req.body.number;
  const pk = req.body.pk;

  // const { name, number, message } = req.body;
  const chatId = -4062555774;

  bot.sendMessage(
    chatId,
    `Оставлена заявка на проект: ${pk}\nИмя: ${name}\nНомер телефона: ${number}`
  );
  res.send("Name");
});

app.post("/api/change/area", async (req, res) => {
  const area = req.body.area;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET area = $1 WHERE pk = $2",

    [+area, pk]
  );

  return res.json("true");
});
app.post("/api/change/size", async (req, res) => {
  const size = req.body.size;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET size = $1 WHERE pk = $2",

    [size, pk]
  );

  return res.json("true");
});

app.post("/api/change/acres", async (req, res) => {
  const acres = req.body.acres;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET acres = $1 WHERE pk = $2",

    [acres, pk]
  );

  return res.json("true");
});

app.post("/api/change/style", async (req, res) => {
  const style = req.body.style;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET style = $1 WHERE pk = $2",

    [style, pk]
  );

  return res.json("true");
});

app.post("/api/change/cost", async (req, res) => {
  const cost = req.body.cost;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET cost = $1 WHERE pk = $2",

    [cost, pk]
  );

  return res.json("true");
});

app.post("/api/change/data", async (req, res) => {
  const data = req.body.data;
  const pk = req.body.pk;

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET data = $1 WHERE pk = $2",

    [data, pk]
  );

  return res.json("true");
});

//main_photo
app.post("/api/change/main_photo", async (req, res) => {
  const main_photo = req.files.main_photo;
  const pk = req.body.pk;

  const oldMpHResult = await db.query(
    "SELECT main_photo FROM products WHERE pk = $1",
    [pk]
  );
  const oldMpH = oldMpHResult.rows[0].main_photo;

  const parsedUrl = new URL(oldMpH);

  const pathH = parsedUrl.pathname; // Это даст вам /img/1702104101996_811.jpg

  const generateFileName = () => {
    return `${Date.now()}_${Math.floor(Math.random() * 1000)}${extname(
      main_photo.name
    )}`;
  };

  const createWays = (randname) => {
    return join(__dirname, "img", randname);
  };

  // Сохраняем основную фотографию
  const mainName = generateFileName();
  main_photo.mv(createWays(mainName), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json("");
    }
  });

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET main_photo = $1 WHERE pk = $2",

    [`${pth}/img/` + mainName, pk]
  );

  fs.unlink(join(__dirname, pathH), (err) => {
    if (err) {
      console.error(`Ошибка при удалении файла: ${err}`);
    } else {
      console.log(`Файл ${join(__dirname, pathH)} успешно удален`);
    }
  });

  return res.json("true");
});

app.post("/api/change/photos", async (req, res) => {
  const photos = req.files?.photos;
  const pk = req.body.pk;

  const oldMpHResult = await db.query(
    "SELECT images FROM products WHERE pk = $1",
    [pk]
  );
  const oldMpH = oldMpHResult.rows[0].images.photos;

  const pathH = [];

  if (oldMpH !== undefined) {
    for (let i = 0; i < oldMpH.length; i++) {
      const oldMpHH = new URL(oldMpH[i]);
      pathH.push(oldMpHH.pathname);
    }
  }

  // const pathH = parsedUrl.pathname; // Это даст вам /img/1702104101996_811.jpg

  const generateFileName = () => {
    return `${Date.now()}_${Math.floor(Math.random() * 1000)}${extname(
      photos[0].name
    )}`;
  };

  const createWays = (randname) => {
    return join(__dirname, "img", randname);
  };

  const php = [];

  if (Array.isArray(photos)) {
    photos.forEach((el) => {
      const rand = generateFileName();
      php.push(`${pth}/img/` + rand);
      el.mv(createWays(rand), (err) => {
        if (err) return res.status(500).json("");
      });
    });
  } else {
    const rand = generateFileName();

    php.push(`${pth}/img/` + rand);
    photos.mv(createWays(rand), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
    });
  }

  await db.query(
    // "UPDATE products SET area = $1, size = $2, acres = $3, style = $4, cost = $5, data = $6, main_photo = $7, images = $8, likes = $9 WHERE pk = $10",
    "UPDATE products SET images = $1 WHERE pk = $2",

    [{ photos: php }, pk]
  );

  if (pathH.length > 0) {
    for (let i = 0; i < pathH.length; i++) {
      fs.unlink(join(__dirname, pathH[i]), (err) => {
        if (err) {
          console.error(`Ошибка при удалении файла: ${err}`);
        } else {
          console.log(`Файл ${join(__dirname, pathH[i])} успешно удален`);
        }
      });
    }
  }

  return res.json("true");
});

app.get("/img/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = join(__dirname, "img", filename);

  // Отправка файла на фронтенд
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error sending file");
    } else {
      console.log("File sent successfully:", filename);
    }
  });
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
 *                 example: "nurbek@gmail.com"
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
 * /api/login:
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
 * /api/cart:
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
 *               token:
 *                 type: string
 *                 format: email
 *                 description: Email адрес пользователя.
 *                 example: "b4b6f81b-f176-4004-90db-ce7911834d44"
 *     responses:
 *       '200':
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             example: {"token": "b4b6f81b-f176-4004-90db-ce7911834d44"}
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
 *               name:
 *                 type: string
 *                 format: email
 *                 description: Имя пользователя.
 *               number:
 *                 type: string
 *                 format: number
 *                 description: Номер телефона.
 *               message:
 *                 type: string
 *                 format: text
 *                 description: Текст сообщения.
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
