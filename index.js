const express = require("express");
const dotenv = require("dotenv");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
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
const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  console.log("Authorization Header:", authHeader);
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log("JWT Payload:", payload);
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(403).json({ message: "Forbidden" });
  }
};
  
async function run() {
  try {
    await client.connect();
    const database = client.db("medi-queue");
    //Freature Api
    app.get("/tutors", async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutors = await tutorsCollection.find({}).limit(6).toArray();
      res.json(tutors);
    });
    //All tutors api
    app.get("/tutors/all", verifyToken, async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutors = await tutorsCollection.find({}).toArray();
      res.json(tutors);
    });
    //Add tutor api
    app.post("/tutors/all", verifyToken, async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const tutor = req.body;
      const result = await tutorsCollection.insertOne(tutor);
      console.log(result);
      res.json(result);
    });

    //Tutor details api
    app.get("/tutors/all/:id", verifyToken, async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const { id } = req.params;
      const tutor = await tutorsCollection.findOne({ _id: new ObjectId(id) });
      res.json(tutor);
    });
    //Patch tutor api
    app.patch("/tutors/all/:id", verifyToken, async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const { id } = req.params;
      const updatedData = req.body;

      console.log("PATCH BODY:", updatedData);

      const result = await tutorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.json(result);
    });
    //UserId api
    app.get("/tutors/:userId", verifyToken, async (req, res) => {
      try {
        const tutorsCollection = database.collection("tutors");
        const userId = req.params.userId;

        const tutors = await tutorsCollection.find({ userId }).toArray();

        res.json(tutors);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });
    //Delete tutor api
    app.delete("/tutors/all/:id", verifyToken, async (req, res) => {
      const tutorsCollection = database.collection("tutors");
      const { id } = req.params;
      const result = await tutorsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });
    
    //Booking api
    app.post("/bookings", verifyToken, async (req, res) => {
      try {
        const bookingsCollection = database.collection("bookings");
        const tutorsCollection = database.collection("tutors");

        const booking = req.body;

        if (!booking.tutorId) {
          return res.status(400).json({ error: "Tutor ID is required" });
        }
        const tutor = await tutorsCollection.findOne({
          _id: new ObjectId(booking.tutorId),
        });

        if (!tutor) {
          return res.status(404).json({ error: "Tutor not found" });
        }
        const totalSlot = Number(tutor.totalSlot);

        if (totalSlot <= 0) {
          return res.status(400).json({
            message:
              "This session is fully booked. You can’t join at the moment.",
          });
        }
        const currentDate = new Date();
        const sessionDate = new Date(tutor.sessionDate);
        if (currentDate < sessionDate) {
          return res.status(400).json({
            message: "Booking is not available yet for this tutor",
          });
        }
        const result = await bookingsCollection.insertOne(booking);
        await tutorsCollection.updateOne(
          { _id: new ObjectId(booking.tutorId) },
          { $inc: { totalSlot: -1 } },
        );
        return res.status(200).json({
          success: true,
          message: "Booking successful",
          data: result,
        });
      } catch (error) {
        console.error("Booking error:", error);
        return res.status(500).json({
          error: "Internal server error",
        });
      }
    });

  //Get bookings api by email
  
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
