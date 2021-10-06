const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const http = require("http");
const app = express();
const socketio = require("socket.io");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const { Schema } = mongoose;
const upload = multer({ storage });

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/uploads', express.static('uploads'));
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
                if (collectionName !== "waiters" && collectionName !== "status" && collectionName !== "orders") {
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
    price07: Number,
    price05: Number,
    phoneNumber: String,
    surname: String,
    productImage: String
});

const statusSchema = new Schema({
    date: String,
    money: Number
}, { collection: "status" });

const status = mongoose.model("Status", statusSchema, "status");

const foodSchema = new Schema({ name: String, quantity: Number, price: Number });

const ordersSchema = new Schema({
    table: Number,
    foods: [foodSchema],
    money: Number
}, { collection: "orders" });

const orders = mongoose.model("Orders", ordersSchema, "orders");

app.get("/orders", (req, res) => {
    orders.find({}).then((result) => {
        res.status(200).send(result);
    });
});

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



app.delete("/status", (req, res) => {
    status.deleteMany({ "date": { "$not": { "$regex": `${new Date().getMonth() + 1}/${new Date().getFullYear()}`, "$options": "i" } } }).then((response) => {
        res.send("success");
    }).catch(err => res.send(err));
});

app.get("/status/:year", (req, res) => {

    status.find({ "date": { "$regex": req.params.year, "$options": "i" } }).then((result) => {
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
            if (nameOnly !== "waiters" && nameOnly !== "status" && nameOnly !== "orders") {
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

    .post(upload.single('productImage'), (req, res) => {
        const data = req.body;
        const { params: { collection } } = req;
        const currentModel = mongoose.model(collection, dbSchema);
        if (!req.files) {
            const newDocument = new currentModel(data);
            newDocument.save(err => {
                if (err) {
                    res.send(err)
                } else {
                    updateAllData()
                    setTimeout(() => {
                        res.status(200).send("saved!")
                    }, 1500);
                }
            });
        } else {
            const newDocument = new currentModel({ ...data, productImage: req.file.path });
            newDocument.save(err => {
                if (err) {
                    res.send(err)
                } else {
                    updateAllData()
                    setTimeout(() => {
                        res.status(200).send("saved!")
                    }, 1500);
                }
            });
        }

    })

    .delete((req, res) => {
        let collection = req.params.collection;
        const currentModel = mongoose.model(collection, dbSchema);
        currentModel.collection.drop().then(() => {
            updateAllData()
            setTimeout(() => {
                res.status(200).send(`${collection} collection has been deleted`)
            }, 1500);
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
                }, 1500);
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
                }, 1500);
            }
        });

    });

io.on("connection", socket => {
    console.log("New WS Connection...");
    socket.on('post-order', (orderObj) => {
        const newDocument = new orders(orderObj);
        newDocument.save(err => {
            if (!err) {
                io.emit('recieve-order', "order sent");
            }
        });
    });
    socket.on('done-order', (tableNumber) => {
        orders.deleteMany({ table: tableNumber }, (err) => {
            if (!err) {
                io.emit('recieve-order', "order deleted");
            }
        })
    });
});

server.listen(4000, () => {
    console.log("localhost is running on port 4000");
});