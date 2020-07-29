const path = require("path");
const edge = require("edge.js");
const expressEdge = require("express-edge");
const express = require("express");
const connectFlash = require("connect-flash");
const auth = require("./middleware/auth");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const connectMongo = require("connect-mongo");
const redirectIfAuthenticated = require("./middleware/redirectIfAuthenticated");
const Post = require("./database/models/Post");
const fileUpload = require("express-fileupload");
const createUserController = require("./controllers/createUser");
const storeUserController = require("./controllers/storeUser");
const loginController = require("./controllers/login");
const loginUserController = require("./controllers/loginUser");
const logoutController = require("./controllers/logout");
const mongoStore = connectMongo(expressSession);
mongoose
  .connect("mongodb://localhost:27017/node-blog", { useNewUrlParser: true })
  .then(() => "You are now connected to Mongo!")
  .catch((err) => console.error("Something went wrong", err));
const app = new express();
require("./controllers/prod")(app);
app.use(fileUpload());
app.use(express.static("public"));
app.use(expressEdge);
app.use(connectFlash());
app.set("views", __dirname + "/views");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  expressSession({
    secret: "secret",
  })
);

app.use(
  expressSession({
    secret: "secret",
    store: new mongoStore({
      mongooseConnection: mongoose.connection,
    }),
  })
);
app.get("/register", redirectIfAuthenticated, createUserController);
app.get("/login", redirectIfAuthenticated, loginController);
app.post("/userlogin", redirectIfAuthenticated, loginUserController);
app.post("/store", redirectIfAuthenticated, storeUserController);
app.get("/logout", logoutController);
app.use("*", (req, res, next) => {
  edge.global("auth", req.session.userId);
  next();
});
app.get("/", async (req, res) => {
  const posts = await Post.find({});
  res.render("index", {
    posts,
  });
});

app.get("/create", auth, (req, res) => {
  if (req.session.userId) {
    return res.render("create");
  }
  res.redirect("/login");
});
app.get("/about", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/about.html"));
});
app.get("/contact", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/contact.html"));
});
app.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.render("post", {
    post,
  });
});
app.post("/posts/store", auth, (req, res) => {
  const { image } = req.files;

  image.mv(path.resolve(__dirname, "public/posts", image.name), (error) => {
    Post.create(
      {
        ...req.body,
        image: `/posts/${image.name}`,
      },
      (error, post) => {
        res.redirect("/");
      }
    );
  });
});
app.listen(4000, () => {
  console.log("App listening on port 4000");
});
