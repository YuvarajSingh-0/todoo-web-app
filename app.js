const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://yuvarajsingh:Bobbyuvi@cluster-0.jy9ky.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const todoSchema = new mongoose.Schema({
  username: {
    type:String,
    lowercase: true,
    index:true
  },
  password: String,
  todos: [],
});

const users = new mongoose.model("users", todoSchema);
// const user = new users({ username: "nys", password: "nys", todos: [] });
// const user1 = new users({
//   username: "nys1",
//   password: "nys1",
//   todos: ["blah1", "blah2"],
// });
// user.save();

app.set("view-engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("./public"));

// const data = [];
app.get("/", (req, res) => {
  // res.json({val:'LOL'})
  res.render("../public/login.ejs", { msg: "" });
});

app.post("/login", async (req, res) => {
  var userData = await users.find({ username: req.body.username });
  console.log("in /login outside if cond",userData)

  if (userData.length==0) {
    console.log("in /login if cond",userData)
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // userData = [{
    //   username: req.body.username,
    //   password: hashedPassword,
    //   todos: [],
    // }];
    var user = new users({
      username: req.body.username,
      password: hashedPassword,
      todos: [],
    });
    user.save();
    console.log("in /login if cond after saving to database",user);
    res.render("../public/todo.ejs", { values: [], name: user.username });
  } else if (
    (userData[0].username == req.body.username) &&
    (await bcrypt.compare(req.body.password, userData[0].password))
  ) {
    res.render("../public/todo.ejs", {
      values: userData[0].todos,
      name: userData[0].username,
    });
  } else {
    res.render("../public/login.ejs", { msg: "Username already exists" });
  }
});

app.post("/addtask", async (req, res) => {
  // res.render('../public/todo',{values:data});
  console.log("in /addtask req.body",req.body)
  newtask = req.body.task;
  //   console.log(req.body);
  var userData = await users.find({ username: req.body.name });
  console.log("in /addtask\n",userData)
  // userData[0].todos.push(newtask);
  var newtodos=userData[0].todos
  newtodos.push(newtask)
  // var newtodos=userData[0].todos.push(newtask);
  // console.log(newtodos,newtask)
  await users.updateOne({username:req.body.name},{$set:{todos:newtodos}})
  // var user = new users(userData[0]);
  // user.save();
  res.render("../public/todo.ejs", {
    values: userData[0].todos,
    name: userData[0].username,
  });
});
let port = process.env.PORT;

if (port == null || port == "") {
  port = 1100;
}

app.listen(port, async () => {
  console.log(await users.find({username:"nys"}));
  console.log("Server is runnning at port: ",port);
});
