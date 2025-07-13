const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const mime = require('mime-types'); // Add this at the top

// POST /api/generate-model
// Body: { imageUrl, modelName }
router.post('/generate-model', async (req, res) => {
  const { imageUrl, modelName } = req.body;
  if (!imageUrl || !modelName) {
    return res.status(400).json({ error: 'imageUrl and modelName are required' });
  }
  const modelsDir = path.join(__dirname, '../../client/public/models');
  const imageDir = path.join(__dirname, '../../client/public/images');
  const modelPath = path.join(modelsDir, modelName);

  // Check if model already exists
  if (fs.existsSync(modelPath)) {
    return res.json({ model: `/models/${modelName}` });
  }

  try {
    // Download image
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imgRes.data, 'binary');
    // save image to disk for AR server
    const imagePath = path.join(imageDir, modelName.replace('.glb', '.jpg'));
    console.log('Saving image to:', imagePath);
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    fs.writeFileSync(imagePath, imageBuffer);

    console.log('Image downloaded successfully, size:', imageBuffer.length);
    if (imageBuffer.length === 0) {
      return res.status(400).json({ error: 'Downloaded image is empty' });
    }

    // Prepare JSON payload for the AR server (no file upload, just URL)
    const payload = {
      imageUrl: process.env.FRONTEND_API_KEY + '/images/' + modelName.replace('.glb', '.jpg'),
    };

    console.log('Payload for AR server:', payload);

    // Send request to AR server as JSON
    const arRes = await axios.post(process.env.AR_SERVER_KEY + '/generate-3d-model', payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5 * 60 * 1000 // 5 minutes timeout
    });

    console.log('AR server response:', arRes.data);
    console.log('AR server response [1]:', arRes.data.data[1]);
    console.log('AR server response [2]:', arRes.data.data[2].url);

    // Assuming the GLB data is returned as the third element (index 2)
    const glbData = arRes.data.data[2] || arRes.data.data.find(item => item && typeof item.url === 'string' && item.url.endsWith('.glb'));
    if (!glbData || !glbData.url) throw new Error("GLB data URL not found in response");
    
    // Download the GLB file from the URL provided by the AR server
    const glbFileResponse = await axios.get(glbData.url, { responseType: 'arraybuffer' });
    const glbFileBuffer = Buffer.from(glbFileResponse.data, 'binary');
    
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
    fs.writeFileSync(modelPath, glbFileBuffer);

    console.log('GLB file saved:', modelPath);
    //delete the image file after model generation
    

    return res.json({ model: `/models/${modelName}` });
    
  } catch (err) {
    console.error('3D model generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate 3D model' });
  }
  finally {
    const imagePath = path.join(imageDir, modelName.replace('.glb', '.jpg'));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('Deleted temporary image file:', imagePath);
    }
  }
});

module.exports = router;
