# MOV to MP4 Converter

Сервис для конвертации видео из формата MOV в MP4.

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

## API

### Загрузка файла
```
POST /upload
Content-Type: multipart/form-data

Параметры:
- video: файл .mov (обязательно)
- resolution: разрешение (опционально, по умолчанию "1280x720")

Пример:
curl -X POST -F "video=@video.mov" -F "resolution=1920x1080" http://localhost:3000/upload
```

### Скачивание файла
```
GET /download/:filename

Пример:
curl http://localhost:3000/download/1638245612345.mp4 -o video.mp4
```