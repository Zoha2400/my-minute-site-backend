import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  password: "05350535",
  host: "2.tcp.eu.ngrok.io",
  port: 12346,
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
