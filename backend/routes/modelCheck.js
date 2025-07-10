const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/api/model-exists/:modelName', (req, res) => {
  const modelName = req.params.modelName;
  const modelPath = path.join(__dirname, '../../client/public/models', modelName);
  fs.access(modelPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.json({ exists: false });
    }
    return res.json({ exists: true });
  });
});

module.exports = router;