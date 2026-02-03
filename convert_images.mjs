import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, "public", "images", "watches");

async function convertImages() {
  try {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const ext = path.extname(file).toLowerCase();
      const name = path.basename(file, ext);

      if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        const outputPath = path.join(directoryPath, `${name}.webp`);
        console.log(`Converting ${file} to ${name}.webp...`);

        await sharp(filePath).webp({ quality: 80 }).toFile(outputPath);

        console.log(`Converted ${file}. Deleting original...`);
        fs.unlinkSync(filePath);
      }
    }
    console.log("All images converted successfully.");
  } catch (err) {
    console.error("Error converting images:", err);
  }
}

convertImages();
