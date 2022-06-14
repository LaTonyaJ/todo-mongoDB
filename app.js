//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todoDB');

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemSchema);

const clean = new Item({
  name: 'clean'
});

const code = new Item({
  name: 'code'
});

const work = new Item({
  name: 'work'
});

const defaultItems = [clean, code, work];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model('List', listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, (err, item) =>{
    
    if(item.length === 0){

      Item.insertMany(defaultItems, (err) =>{
        if(err){
            console.log(err)
          }})
          res.redirect('/')
      }else{

        res.render("list", {listTitle: day, newListItems: item})
      }
      });
      
});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  if(listName === date.getDate()){
    newItem.save();
    res.redirect('/');

  }else{

    List.findOne({name: listName}, (err, foundList) =>{
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/' + listName);

    });
  }

});

app.post('/delete', (req, res) =>{
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === date.getDate()){
    Item.findByIdAndRemove(checkedId, (err) =>{
      if(err){
        console.log(err)
      }else{
        console.log('Delete Successful')
        res.redirect('/')
      }
    });
  }else{

    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}}, (err, foundList) =>{
      res.redirect('/' + listName);
    });
  }

});


app.get('/:name', (req, res) =>{
  const newList = _.capitalize(req.params.name);

  
  List.findOne({name: newList}, (err, foundList) =>{
    if(foundList){
      //console.log('Exist') //Show List

      res.render('list', {listTitle: foundList.name, newListItems: foundList.items});

    }else{
      //console.log('No list') //Create List

      const list = new List({
        name: newList,
        items: defaultItems
      });
    
      list.save();
      res.redirect('/' + newList)
    }
  });

});


app.get("/about", function(req, res){
  res.render("about");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
