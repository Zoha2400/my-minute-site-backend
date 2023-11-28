import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: "postgres",
  password: "05350535",
  host: "localhost",
  port: 5432,
  database: "hundproj",
});

export default client;
