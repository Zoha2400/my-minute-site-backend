import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  password: "05350535",
  host: "89.111.153.226",
  port: 5432,
  database: "hundproj",
});

client.connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

export default client;
