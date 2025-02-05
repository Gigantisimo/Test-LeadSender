// app.js
import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const port = 3000;

app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'video/quicktime') {
      cb(new Error('Принимаются только MOV файлы'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});

await fs.mkdir('uploads', { recursive: true });
await fs.mkdir('converted', { recursive: true });
await fs.mkdir('public', { recursive: true });

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const inputPath = req.file.path;
  const outputPath = `converted/${path.parse(req.file.filename).name}.mp4`;
  const resolution = req.body.resolution || '1280x720';

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp4')
        .size(resolution)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    await fs.unlink(inputPath);

    res.json({
      message: 'Конвертация завершена',
      downloadLink: `/download/${path.parse(outputPath).base}`,
      filename: path.parse(outputPath).base
    });
  } catch (error) {
    await fs.unlink(inputPath);
    res.status(500).json({ error: 'Ошибка при конвертации видео' });
  }
});

app.get('/download/:filename', async (req, res) => {
  const filePath = `converted/${req.params.filename}`;
  
  try {
    await fs.access(filePath);
    res.download(filePath, async (err) => {
      if (!err) {
        await fs.unlink(filePath);
      }
    });
  } catch {
    res.status(404).json({ error: 'Файл не найден' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой' });
    }
  }
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});