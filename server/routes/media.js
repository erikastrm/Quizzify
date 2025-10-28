const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { media } = require('../models/database');

// Konfigurera multer för filuppladdning - börja med temp-mapp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Använd uploads-root, vi flyttar filen senare baserat på media_type
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'temp-' + uniqueSuffix + ext);
  }
});

// Filvalidering
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Filtyp ${file.mimetype} stöds inte`), false);
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
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(req.file.originalname);
    
    let finalFilename;
    let finalPath;
    let filePath;

    // Bestäm filnamn och sökväg baserat på mediatyp
    if (mediaType === 'image') {
      // För bilder: optimera med sharp
      finalFilename = `opt-${timestamp}-${uniqueSuffix}.jpg`;
      finalPath = path.join(__dirname, '../uploads/images', finalFilename);
      
      try {
        await sharp(req.file.path)
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toFile(finalPath);
      } catch (sharpError) {
        console.error('Sharp optimization error:', sharpError);
        // Om sharp misslyckas, använd originalfilen
        finalFilename = `${timestamp}-${uniqueSuffix}${ext}`;
        finalPath = path.join(__dirname, '../uploads/images', finalFilename);
        await fs.rename(req.file.path, finalPath);
      }
      
      filePath = `/uploads/images/${finalFilename}`;
    } else if (mediaType === 'audio') {
      // För ljud: flytta till audio-mapp
      finalFilename = `${timestamp}-${uniqueSuffix}${ext}`;
      finalPath = path.join(__dirname, '../uploads/audios', finalFilename);
      await fs.rename(req.file.path, finalPath);
      filePath = `/uploads/audios/${finalFilename}`;
    } else if (mediaType === 'video') {
      // För video: flytta till video-mapp
      finalFilename = `${timestamp}-${uniqueSuffix}${ext}`;
      finalPath = path.join(__dirname, '../uploads/videos', finalFilename);
      await fs.rename(req.file.path, finalPath);
      filePath = `/uploads/videos/${finalFilename}`;
    } else {
      // Okänd typ
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Ogiltig mediatyp' });
    }

    // Ta bort temp-filen om den fortfarande finns
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      // Filen redan borttagen, ignorera
    }

    // Spara metadata i databasen
    const fileData = {
      filename: finalFilename,
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
