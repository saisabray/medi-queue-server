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
      console.log("Successfully connected to MongoDB");
  } catch (error) {
      console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});