const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require('cors');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    const database = client.db("medi-queue");
    //Freture Api
    app.get('/tutors', async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutors = await tutorsCollection.find({}).limit(6).toArray();
      res.json(tutors);
    });
    //All tutors api
    app.get('/tutors/all', async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutors = await tutorsCollection.find({}).toArray();
      res.json(tutors);
    });
    //Add tutor api
    app.post('/tutors/all', async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutor = req.body;
      const result = await tutorsCollection.insertOne(tutor);
      console.log(result);
      res.json(result);
      

    });
  } catch (error) {
      console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});