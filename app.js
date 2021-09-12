const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors')
const app = express();
const { Schema } = mongoose;
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors())

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/restaurantDB');
}

function onEveryPost() {
    let namesList = [];
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (let i = 0; i < names.length; i++) {
            // gets only the name and adds it to a list
            const nameOnly = names[i].name;
            namesList.push(nameOnly);
        }
        namesList.forEach((collectionName) => {
            const currentModel = mongoose.model(collectionName, dbSchema);
            currentModel.find({}).then((result) => {
                allData[collectionName] = result
            });
        });
    });
}

let allData = {};

mongoose.connection.on("open", function (ref) {
    console.log("Connected to mongo server.");
    //trying to get collection names
    onEveryPost();
});

const dbSchema = new Schema({
    name: String,
    litre: Number,
    price: Number
});

app.get("/data", (req, res) => {
    res.send(allData)
});

app.route("/data/:collection")
    .get((req, res) => {
        const { params } = req;
        const currentModel = mongoose.model(params.collection, dbSchema);
        currentModel.find((err, result) => {
            if (err) {
                res.send(err)
            } else {
                res.send(result)
            }
        })

    })

    .post((req, res) => {
        const data = req.body;
        const { params: { collection } } = req;
        const currentModel = mongoose.model(collection, dbSchema);
        const newDocument = new currentModel(data);
        newDocument.save(err => {
            if (err) {
                res.send(err)
            } else {
                res.status(200).send("saved!")
            }
        });
        onEveryPost()
    })

    .delete((req, res) => {
        let collection = req.params.collection;
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.deleteMany((err) => {
            if (err) {
                res.send(err);
            } else {
                res.send("collection deleted");
            }
        });
        onEveryPost()
    });

app.route("/data/:collection/:foodName")
    .get((req, res) => {
        const { collection, foodName } = req.params
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.findOne({ name: foodName }, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
        });
    })

    .put((req, res) => {
        const { collection, foodName } = req.params
        const currentModel = mongoose.model(collection, dbSchema);
        (async function () {
            reees = await currentModel.updateOne({ name: foodName }, req.body, { overwrite: true })
            res.send("Success");
        })();
        onEveryPost();
    })
    .delete((req, res) => {
        const { collection, foodName } = req.params
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.deleteOne({ name: foodName }, (err) => {
            if (err) {
                res.send(err);
            } else {
                res.send("Successfully deleted");
            }
        });
        onEveryPost();
    });

app.listen(4000, () => {
    console.log("localhost is running on port 4000");
});