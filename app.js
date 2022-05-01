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

app.set("view-engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("./public"));

app.get("/", (req,res)=>{
  res.redirect("/login")
})

app.get("/login", (req, res) => {
  res.render("../public/login.ejs", { msg: "" });
});

app.get("/deletetask",(req,res)=>{
  res.redirect("/login");
})

app.get("/addtask",(req,res)=>{
  res.redirect("/login");
})

app.post("/login", async (req, res) => {
  var userData = await users.find({ username: req.body.username });

  if (userData.length==0) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    var user = new users({
      username: req.body.username,
      password: hashedPassword,
      todos: [],
    });
    user.save();
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
  newtask = req.body.task;
  var userData = await users.find({ username: req.body.name });
  if(!req.body.task){
    return res.render("../public/todo.ejs", {
      values: userData[0].todos,
      name: userData[0].username,
    });  
  }
  var newtodos=userData[0].todos
  newtodos.push(newtask)
  await users.updateOne({username:req.body.name},{$set:{todos:newtodos}})
  res.render("../public/todo.ejs", {
    values: userData[0].todos,
    name: userData[0].username,
  });
});




app.post("/deletetask", async (req,res)=>{
  let user=await users.findOne({username:req.body.name})
  old_todos=user.todos;
  var updated_todos=old_todos.filter( todo =>{ return todo!=req.body.value})
  await users.updateOne({username:req.body.name}, {$set:{todos:updated_todos}})
  res.render('../public/todo.ejs',{name:user.username,values:updated_todos})
})


let port = process.env.PORT;

if (port == null || port == "") {
  port = 1100;
}

app.listen(port, async () => {
  console.log("Server is runnning at : localhost:"+port+"/");
});
