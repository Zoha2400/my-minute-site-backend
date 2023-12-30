import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  password: "05350535",
  host: "2.tcp.eu.ngrok.io",
  port: 12346,
  database: "hundproj",
});

export default client;
