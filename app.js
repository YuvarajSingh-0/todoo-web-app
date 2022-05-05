const express = require("express");
const ejs = require("ejs");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const popup =require( 'node-popup');
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((e) => console.log(e));

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "currentSessions",
});

app.set("view-engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("./public"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const todoSchema = new mongoose.Schema({
  username: {
    type: String,
    index: true,
  },
  password: String,
  todos: [],
});
const users = new mongoose.model("users", todoSchema);

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("../public/login.ejs", { msg: "" });
});

app.get("/todos", async (req, res) => {
  console.log(req.session.usern);
  const user = await users.findOne({ username: req.session.usern });
  if (req.session.isAuth) {
    res.render("../public/todo.ejs", {
      values: user.todos,
      name: user.username,
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/login", async (req, res) => {
  var userData = await users.findOne({ username: req.body.username });

  if (userData) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    var user = new users({
      username: req.body.username,
      password: hashedPassword,
      todos: [],
    });
    user.save();
    req.session.usern = user.username;
    req.session.isAuth = true;
    res.redirect("/todos");
  } else if (
    userData.username == req.body.username &&
    (await bcrypt.compare(req.body.password, userData.password))
  ) {
    req.session.usern = userData.username;
    req.session.isAuth = true;
    res.redirect("/todos");
  } else {
    res.render("../public/login.ejs", { msg: "Username already exists" });
  }
});

app.post("/addtask", async (req, res) => {
  if (!req.body.task) {
    return res.redirect("/todos");
  }
  newtask = req.body.task;
  var userData = await users.findOne({ username: req.body.name });
  var newtodos = userData.todos;
  if (newtodos.indexOf(newtask) == -1) {
    newtodos.push(newtask);
  }
  await users.updateOne(
    { username: req.body.name },
    { $set: { todos: newtodos } }
  );
  res.redirect("/todos");
});

app.post("/deletetask", async (req, res) => {
  let user = await users.findOne({ username: req.body.name });
  old_todos = user.todos;
  var updated_todos = old_todos.filter((todo) => {
    return todo != req.body.value;
  });
  await users.updateOne(
    { username: req.body.name },
    { $set: { todos: updated_todos } }
  );
  // res.render('../public/todo.ejs',{name:user.username,values:updated_todos})
  res.redirect("/todos");
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

let port = process.env.PORT;

if (port == null || port == "") {
  port = 1100;
}

app.listen(port, async () => {
  console.log("Server started");
});
