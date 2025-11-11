import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const apiKey = process.env.TOGGL_API_KEY;
const authHeader = {
  Authorization: "Basic " + Buffer.from(`${apiKey}:api_token`).toString("base64"),
};

// Get current Toggl user
router.get("/me", async (req, res) => {
  try {
    const response = await axios.get("https://api.track.toggl.com/api/v9/me", {
      headers: authHeader,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Toggl user:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Toggl user" });
  }
});

// Get recent time entries
router.get("/entries", async (req, res) => {
  try {
    const response = await axios.get("https://api.track.toggl.com/api/v9/me/time_entries", {
      headers: authHeader,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Toggl entries:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Toggl entries" });
  }
});

export default router;
