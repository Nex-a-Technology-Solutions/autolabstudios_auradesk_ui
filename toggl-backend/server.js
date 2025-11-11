import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import togglRoutes from "./routes/togglRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://autolabstudios-auradesk-ui.onrender.com"],
  credentials: true,
}));

app.use(express.json());

app.use("/api/toggl", togglRoutes);

app.listen(5000, () => console.log("✅ Toggl microservice running on port 5000"));
