const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const { Schema } = mongoose;
app.use(bodyParser.urlencoded({
    extended: true
}));

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/restaurantDB');
}

const dbSchema = new Schema({
    name: String,
    litre: Number,
    price: Number,
    image: String
});

app.get("/", (req, res) => {
    res.redirect("/data/foo")
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
        })
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
        })()
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
    });

app.listen(4000, () => {
    console.log("localhost is running on port 4000");
});