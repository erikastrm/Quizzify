const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { media } = require('../models/database');

// Konfigurera multer för filuppladdning
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const mediaType = req.body.media_type || 'image';
    const uploadPath = path.join(__dirname, '../uploads', mediaType + 's');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Filvalidering
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  
  const mediaType = req.body.media_type || 'image';
  
  let allowed = false;
  if (mediaType === 'image' && allowedImageTypes.includes(file.mimetype)) {
    allowed = true;
  } else if (mediaType === 'audio' && allowedAudioTypes.includes(file.mimetype)) {
    allowed = true;
  } else if (mediaType === 'video' && allowedVideoTypes.includes(file.mimetype)) {
    allowed = true;
  }
  
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error(`Filtyp ${file.mimetype} stöds inte för ${mediaType}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  }
});

/**
 * POST /api/media/upload
 * Ladda upp en mediafil
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen fil uppladdad' });
    }

    const mediaType = req.body.media_type || 'image';
    let filePath = `/uploads/${mediaType}s/${req.file.filename}`;
    let filename = req.file.filename;

    // Om det är en bild, optimera den med sharp
    if (mediaType === 'image') {
      const optimizedFilename = 'opt-' + filename;
      const optimizedPath = path.join(__dirname, '../uploads/images', optimizedFilename);
      
      await sharp(req.file.path)
        .resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);
      
      // Ta bort originalfilen och använd den optimerade
      await fs.unlink(req.file.path);
      filename = optimizedFilename;
      filePath = `/uploads/images/${optimizedFilename}`;
    }

    // Spara metadata i databasen
    const fileData = {
      filename: filename,
      original_name: req.file.originalname,
      file_path: filePath,
      media_type: mediaType,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };

    const result = await media.create(fileData);

    res.json({
      success: true,
      file: {
        id: result.id,
        url: filePath,
        ...fileData
      }
    });
  } catch (error) {
    console.error('Uppladdningsfel:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media
 * Hämta alla mediafiler (eller filtrera på typ)
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const files = await media.getAll(type);
    res.json(files);
  } catch (error) {
    console.error('Fel vid hämtning av mediafiler:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/media/:id
 * Hämta en specifik mediafil
 */
router.get('/:id', async (req, res) => {
  try {
    const file = await media.getById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Fil hittades inte' });
    }
    res.json(file);
  } catch (error) {
    console.error('Fel vid hämtning av mediafil:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/media/:id
 * Ta bort en mediafil
 */
router.delete('/:id', async (req, res) => {
  try {
    const file = await media.getById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Fil hittades inte' });
    }

    // Ta bort filen från disk
    const fullPath = path.join(__dirname, '..', file.file_path);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      console.error('Kunde inte ta bort fil från disk:', err);
    }

    // Ta bort från databas
    await media.delete(req.params.id);

    res.json({ success: true, message: 'Fil borttagen' });
  } catch (error) {
    console.error('Fel vid borttagning av mediafil:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
