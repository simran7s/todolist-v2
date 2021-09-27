//jshint esversion:6
const express = require("express");
// const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
require("dotenv").config()


const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const __HOME_ROUTE = "Today"




// Removed these arrays and we will now use Mongo to store them instead
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
mongoose.connect(process.env.MONGO_URL);
const todosSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})
const Todo = mongoose.model("Todo", todosSchema)

// Default TODOS
const todo1 = new Todo({
  name: "Welcome to your new TodoList"
})
const todo2 = new Todo({
  name: "Hit the + button to add a new Task"
})
const todo3 = new Todo({
  name: "⬅️ Hit this button to delete a task"
})

const defaultItems = [todo1, todo2, todo3]
const listSchema = new mongoose.Schema({
  name: String,
  items: [todosSchema]
});

const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {
  //Wont be using anymore
  // const day = date.getDate();


  // return all todos from DB
  Todo.find({}, (err, foundTodos) => {

    // Check if todos array is empty
    if (foundTodos.length === 0) {
      // Inserting those default todos ONLY if db is empty
      Todo.insertMany([todo1, todo2, todo3], err => {
        if (err) {
          console.log(err)
        } else {
          console.log("Added 3 default tasks")
        }
      })
      // Redirect to home route so that todos can be displayed
      res.redirect("/")
    }
    if (err) {
      console.log(err)
    } else {
      // listTitle is just "day" because we want to focus on mongodb instead of date.js
      // we deleted items array now we need to send items in db
      res.render("list", { listTitle: __HOME_ROUTE, newListItems: foundTodos });
    }
  })


});

app.post("/", function (req, res) {

  const todoName = req.body.newItem;
  const listName = req.body.list;

  const newTodo = new Todo({
    name: todoName
  })

  if (listName.trim().toLowerCase() === __HOME_ROUTE.toLowerCase()) {
    newTodo.save()
    // Redirect to reload/update the tasks
    res.redirect("/")
  }
  else if (listName.trim().toLowerCase() === __HOME_ROUTE.toLowerCase()) {
    newTodo.save()
    // Redirect to reload/update the tasks
    res.redirect("/")
  } else {
    List.findOne({
      name: listName.trim().toLowerCase()
    }, (err, foundList) => {
      foundList.items.push(newTodo)
      foundList.save()
      res.redirect("/" + listName.trim())
    })
  }

});

app.post("/delete", (req, res) => {
  const itemID = req.body.checkbox
  const listName = req.body.listName

  if (listName.trim().toLowerCase() === __HOME_ROUTE.toLowerCase()) {
    Todo.deleteOne({ _id: itemID }, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("Deleted: " + req.body.checkbox)
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName.trim().toLowerCase() },
      { $pull: { items: { _id: itemID } } },
      (err, foundList) => {
        if (err) {
          console.log(err)
        } else {
          res.redirect("/" + listName.trim())
        }
      }
    )
  }

})

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;
  const list = new List({
    name: customListName,
    items: defaultItems
  })
  // Makes it so that a custom list cannot be created for "TODAY" (the home route)
  if (customListName.trim().toLowerCase() === __HOME_ROUTE.toLowerCase()) {
    res.redirect("/")
  } else {
    List.findOne({ name: customListName.trim().toLowerCase() }, (err, foundList) => {
      if (err) {
        // ERROR
        console.log(err)
      } else {
        // NO ERROR
        if (!foundList) {
          // Create new list
          list.save()
          res.redirect("/" + customListName)
        } else {
          // Load existing list
          res.render("list", { listTitle: customListName, newListItems: foundList.items });
        }
      }
    })
  }
})

app.get("/about", function (req, res) {
  res.render("about");
});

// If no port setup on heroku, then start on local host 3000
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});
