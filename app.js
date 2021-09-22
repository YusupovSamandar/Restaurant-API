const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors')
const app = express();
const { Schema } = mongoose;
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(cors())
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-david:david1031@cluster0.e1tmm.mongodb.net/restaurantDB');
}

function updateAllData() {
    let namesList = [];
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (let i = 0; i < names.length; i++) {
            // gets only the name and adds it to a list
            const nameOnly = names[i].name;
            namesList.push(nameOnly);
        }

        Object.keys(allData).forEach(key => {
            delete allData[key];
        });

        namesList.forEach((collectionName) => {
            const currentModel = mongoose.model(collectionName, dbSchema);
            currentModel.find({}).then((result) => {
                if (collectionName !== "waiters" && collectionName !== "status") {
                    allData[collectionName] = result;
                }
            });
        });
    });
}

let allData = {};


mongoose.connection.on("open", function (ref) {
    console.log("Connected to mongo server.");
    updateAllData();
});

const dbSchema = new Schema({
    name: String,
    litre: Number,
    price: Number,
    phoneNumber: String,
    surname: String
});

const statusSchema = new Schema({
    date: String,
    money: Number
}, { collection: "status" });

const status = mongoose.model("Status", statusSchema, "status");

// Collections
mongoose.model("waiters", dbSchema);

app.get("/data", (req, res) => {
    res.send(allData);
});

app.get("/status", (req, res) => {
    status.find({}).then((result) => {
        res.status(200).send(result);
    });
});

app.post("/status", (req, res) => {
    let data = req.body;
    status.findOne({ date: data.date }).then((result) => {
        if (result) {
            status.updateOne({ date: data.date }, { date: result.date, money: (result.money * 1 + data.money * 1) }).then(() => {
                res.send("updated!")
            })
        } else {
            let newDocument = new status(data);
            newDocument.save((err) => {
                if (err) {
                    res.send(err)
                } else {
                    res.send("success!")
                }
            })
        }
    });

});

app.get("/collections", (req, res) => {
    let namesList = [];
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (let i = 0; i < names.length; i++) {
            // gets only the name and adds it to a list
            const nameOnly = names[i].name;
            if (nameOnly !== "waiters" && nameOnly !== "status") {
                namesList.push(nameOnly);
            }
        }
        let output = namesList.reduce((acc, name) => {
            acc[name] = name
            return acc
        }, {});
        res.send(output);
    });
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
                updateAllData()
                setTimeout(() => {
                    res.status(200).send("saved!")
                }, 1000);
            }
        });

    })

    .delete((req, res) => {
        let collection = req.params.collection;
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.collection.drop().then(() => {
            updateAllData()
            setTimeout(() => {
                res.send(`${collection} collection has been deleted`)
            }, 1000);
        });

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
            currentModel.updateOne({ name: foodName }, req.body).then(() => {
                updateAllData();
                setTimeout(() => {
                    res.send("Success");
                }, 1000);
            })
        })();

    })
    .delete((req, res) => {
        const { collection, foodName } = req.params
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.deleteOne({ name: foodName }, (err) => {
            if (err) {
                res.send(err);
            } else {
                updateAllData();
                setTimeout(() => {
                    res.send("Successfully deleted");
                }, 1000);
            }
        });

    });

app.listen(4000, () => {
    console.log("localhost is running on port 4000");
});