require("dotenv").config();
require("./libs/instrument");
const express = require("express");
const app = express();
const Sentry = require("@sentry/node");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes/index");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use("/coba", (req, res) => {
  res.send("selamat datang");
});

app.get("/error", (req, res) => {
  throw new Error("INI ERROR");
});

app.use(errorHandler);

Sentry.setupExpressErrorHandler(app);

const server = app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("notification", (message) => {
    io.emit("notification", message);
  });
});
