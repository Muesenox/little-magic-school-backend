const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));

mongoose.connect("mongodb://localhost:27017/littlemagicschool", (err) => {
  if (err) console.log("MongoDB connection error: ", err);
  else console.log("MongoDB is connected.");
});

const userSchema = new mongoose.Schema({
  discordName: { type: String, required: true },
  walletId: { type: String, required: true },
  magicCode: { type: String, required: true },
});
const codeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  isActive: { type: Boolean, required: true },
});

const Users = mongoose.model("users", userSchema);
const Codes = mongoose.model("codes", codeSchema);

const generateErr = (message, code) => ({
  error: {
    message,
    code,
  },
});

app.post("/submit-user", (req, res) => {
  console.log("req = ", req.body);
  const { discordName, walletId, magicCode } = req.body;
  Codes.findOneAndUpdate(
    { code: magicCode },
    { isActive: false },
    async (codeErr, codeData) => {
      if (codeErr) {
        return res.status(500).send(generateErr(codeErr.message, codeErr.code));
      }
      if (codeData === null) {
        return res
          .status(404)
          .send(generateErr("You have entered the wrong code.", 404));
      } else if (!codeData.isActive) {
        return res
          .status(404)
          .send(generateErr("This code has been used.", 404));
      }
      const user = new Users({ discordName, walletId, magicCode });
      const userPromise = await user.save();
      res.status(200).send({ data: userPromise });
    }
  );
});

app.listen(8000, () => {
  console.log("Server listening to port 8000");
});
