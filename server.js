const express = require("express");
const { engine: handlebars } = require("express-handlebars");
const http = require("http");
const { Server } = require("socket.io");
const Productos = require("./Productos");
const Mensajes = require("./Mensajes");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.engine(
  "hbs",
  handlebars({
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
    defaultLayout: "index",
    extname: "hbs",
  })
);

app.set("view engine", "hbs");
app.set("views", __dirname + "/views");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const products = new Productos();

const mensajes = new Mensajes("mensajes.json");

app.get("/", async (req, res) => {
  const productos = products.getAll();

  let messages = await mensajes.getAll();

  res.render("main", { title: "Productos", productos, messages });
});

io.on("connection", socket => {
  console.log("New conection", socket.id);

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
  });

  socket.on("add-product", product => {
    products.addProduct(product);

    io.emit("update-products", product);
  });

  socket.on("message", async message => {
    const data = {
      email: message.email,
      message: message.message,
      date: new Date().toLocaleString(),
    };

    await mensajes.save(data);

    io.emit("message", data);
  });
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ err, message: "Something went wrong, sorry" });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto http://localhost:${PORT}`);
});

server.on("error", err => {
  console.log(`Algo salio mal: ${err}`);
});
