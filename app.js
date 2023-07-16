import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from "dotenv";

import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config({path: "secrets.env"});

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect(process.env.url+'todolistDB');

const taskSchema = {
    name: {
        type: String,
        required: [true, "Task cannot be empty"]
    }
};

const listSchema = {
    name: {
        type: String,
        required: [true, "List name cannot be empty"]
    },
    tasks: [taskSchema]
};

const Task = mongoose.model('Task', taskSchema);

const List = mongoose.model('List', listSchema);

app.get("/", async (req, res) => {

    Task.find().exec().then( tasks => {
        res.render("list", {listTitle: "Today", items: tasks});
    }).catch((err) => {console.log(err);});

});

app.get("/:listName", async (req, res) => {

    const listName = _.capitalize(req.params.listName);

    List.findOne({name: listName}).then(found => {
        if (found){
            res.render("list", {listTitle: found.name, items: found.tasks});
        } else {
            const list = new List({
                name: listName,
                items: []
            });

            list.save()
            .then(res.redirect("/lists/"+listName));
        }
    });

});

app.post("/", async (req, res) => {

    const taskName = req.body.item;
    const listName = req.body.list;
    
    const task =  new Task({
        name: taskName
    });

    if (listName === "Today"){
        task.save().then(res.redirect("/"));
    } else {
        List.findOne({name: listName}).then(found => {
            found.tasks.push(task);
            found.save().then(res.redirect("/"+listName));
        });
    }
});

app.post("/delete", async (req, res) => {

    const taskId = req.body.checkbox;
    const listName = req.body.list;

    if (listName === "Today"){
        Task.deleteOne({_id: taskId})
        .then(res.redirect("/"))
        .catch((err) => {console.log(err);});
    } else {
        List.findOneAndUpdate({name: listName}, 
            {$pull: {tasks: {_id: taskId}}})
            .then(res.redirect("/"+listName));
    }

});

app.listen(3000, () => {
    console.log("server running on port 3000");
});
