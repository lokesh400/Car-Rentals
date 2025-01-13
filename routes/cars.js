const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Car = require("../models/car");

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");

cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret
});

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'uploads/' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use the original file name
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
const Upload = {
  uploadFile: async (filePath) => {
    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto", // Auto-detect file type (image, video, etc.)
      });
      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};

router.get('/admin/add-car', (req, res) => {
    res.render('add-car');
  });
  
  // Handle adding a new car
router.post('/admin/add-car', upload.single("file"), async (req, res) => {
    try {
      const { name, brand, year, pricePerDay } = req.body;
      const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
      const imageUrl = result.secure_url;
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });
      const newCar = new Car({ name, brand, year, price : pricePerDay,photo:imageUrl });
      await newCar.save();
      res.status(200).json({ message: 'Car added successfully!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });
  
  module.exports = router;