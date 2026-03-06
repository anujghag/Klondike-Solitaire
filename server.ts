import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Ensure images directory exists
  const imagesDir = path.join(__dirname, "public", "generated-images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Serve generated images
  app.use("/generated-images", express.static(imagesDir));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/images/save", (req, res) => {
    try {
      const { key, base64Image } = req.body;
      if (!key || !base64Image) {
        return res.status(400).json({ error: "Missing key or base64Image" });
      }

      // Remove the data:image/png;base64, part
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const filePath = path.join(imagesDir, `${key}.png`);

      fs.writeFileSync(filePath, base64Data, "base64");
      
      // Return the public URL
      res.json({ url: `/generated-images/${key}.png` });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  app.get("/api/images/check/:key", (req, res) => {
    const { key } = req.params;
    const filePath = path.join(imagesDir, `${key}.png`);
    
    if (fs.existsSync(filePath)) {
      res.json({ exists: true, url: `/generated-images/${key}.png` });
    } else {
      res.json({ exists: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
