const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());


// --- Upload config ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});


app.post('/api/pdf/edit', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier PDF fourni.' });
    }

    const mode = (req.query.mode || 'modified').toString();
    const originalBuffer = req.file.buffer;

    if (mode === 'original') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="original.pdf"');
      return res.send(originalBuffer);
    }

    // Exemple de modification avec pdf-lib : on ajoute un texte de watermark sur la première page.
    const pdfDoc = await PDFDocument.load(originalBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { height } = firstPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    firstPage.drawText('Modifié avec PDFWRITER', {
      x: 40,
      y: height - 60,
      size: 18,
      font,
      color: rgb(0.2, 0.2, 0.8),
    });

    const modifiedBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="modified.pdf"');
    return res.send(Buffer.from(modifiedBytes));
  } catch (err) {
    console.error('Erreur traitement PDF:', err);
    return res.status(500).json({ error: 'Erreur lors du traitement du PDF.' });
  }
});


app.post('/api/pdf/annotate', upload.single('file'), async (req, res) => {
    console.log("Route ANNOTATE");
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier PDF fourni.' })
      }
  
      let instructions = []
      if (req.body?.instructions) {
        try {
          instructions = JSON.parse(req.body.instructions)
        } catch {
          return res.status(400).json({ error: 'Instructions JSON invalides.' })
        }
      }
  
      const pdfDoc = await PDFDocument.load(req.file.buffer)
  
      // ✅ cache fonts
      const fontCache = new Map()
  
      async function getFont(instr) {
        const family = String(instr.fontFamily || '').toLowerCase()
        const bold = !!instr.isBold
        const italic = !!instr.isItalic
  
        let group = 'helvetica'
        if (family.includes('times')) group = 'times'
        if (family.includes('courier')) group = 'courier'
  
        const cacheKey = `${group}-${bold ? 'b' : 'n'}-${italic ? 'i' : 'n'}`
        if (fontCache.has(cacheKey)) return fontCache.get(cacheKey)
  
        let fontName = StandardFonts.Helvetica
  
        if (group === 'times') {
          fontName =
            bold && italic
              ? StandardFonts.TimesBoldItalic
              : bold
                ? StandardFonts.TimesBold
                : italic
                  ? StandardFonts.TimesItalic
                  : StandardFonts.TimesRoman
        }
  
        if (group === 'courier') {
          fontName =
            bold && italic
              ? StandardFonts.CourierBoldOblique
              : bold
                ? StandardFonts.CourierBold
                : italic
                  ? StandardFonts.CourierOblique
                  : StandardFonts.Courier
        }
  
        if (group === 'helvetica') {
          fontName =
            bold && italic
              ? StandardFonts.HelveticaBoldOblique
              : bold
                ? StandardFonts.HelveticaBold
                : italic
                  ? StandardFonts.HelveticaOblique
                  : StandardFonts.Helvetica
        }
  
        const font = await pdfDoc.embedFont(fontName)
        fontCache.set(cacheKey, font)
        return font
      }
  
      const pages = pdfDoc.getPages()
  
      const padX = 12
      const padY = 4
      const minHideWidth = 260
      
  
      for (const instr of instructions) {
        const pageIndex = typeof instr.page === 'number' ? instr.page - 1 : 0
        if (pageIndex < 0 || pageIndex >= pages.length) continue
  
        const page = pages[pageIndex]
        const { height: pageHeight } = page.getSize()
  
        // -------------------------
        // ✅ TEXT
        // -------------------------
        if (instr.type === 'text') {
          const x = typeof instr.x === 'number' ? instr.x : 40
          const yTop = typeof instr.y === 'number' ? instr.y : 80
  
          const boxWidth =
            typeof instr.originalWidth === 'number' ? instr.originalWidth : 50
          const boxHeight =
            typeof instr.originalHeight === 'number' ? instr.originalHeight : 12
  
          const size = typeof instr.fontSize === 'number' ? instr.fontSize : boxHeight
  
          const colorInput = instr.color || { r: 0, g: 0, b: 0 }
          const color = rgb(
            Math.max(0, Math.min(1, colorInput.r)),
            Math.max(0, Math.min(1, colorInput.g)),
            Math.max(0, Math.min(1, colorInput.b)),
          )
  
          const font = await getFont(instr)
  
          const oldText = typeof instr.originalText === 'string' ? instr.originalText : ''
          const newText = typeof instr.text === 'string' ? instr.text : ''
  
          // ✅ largeur réelle du texte avec la font utilisée
          const oldTextWidth = oldText ? font.widthOfTextAtSize(oldText, size) : 0
          const newTextWidth = newText ? font.widthOfTextAtSize(newText, size) : 0
  
          // ✅ largeur de masquage intelligente
          const hideW =
            Math.max(boxWidth, oldTextWidth, newTextWidth, minHideWidth) + padX * 2
          const hideH = boxHeight + padY * 2
  
          // ✅ masque
          if (instr.hideOriginal) {
            page.drawRectangle({
              x: x - padX,
              y: pageHeight - yTop - boxHeight - padY,
              width: hideW,
              height: hideH,
              color: rgb(1, 1, 1),
            })
          }

          // yTop est le TOP de la box, baseline = bottom de la box
          const baselineY = pageHeight - yTop - boxHeight
  
          page.drawText(newText, {
            x,
            y: baselineY,
            size,
            font,
            color,
          })
        }
  
        // -------------------------
        // ✅ IMAGE
        // -------------------------
        if (instr.type === 'image' && typeof instr.dataUrl === 'string') {
          const matches = instr.dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
          if (!matches) continue
          const mimeType = matches[1]
          const base64Data = matches[2]
          const imageBytes = Buffer.from(base64Data, 'base64')
  
          let embeddedImage
          if (mimeType === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          }
  
          const pngDims = embeddedImage.scale(1)
          const width = typeof instr.width === 'number' ? instr.width : pngDims.width
          const heightImg = typeof instr.height === 'number' ? instr.height : pngDims.height
  
          page.drawImage(embeddedImage, {
            x: typeof instr.x === 'number' ? instr.x : 40,
            y:
              typeof instr.y === 'number'
                ? pageHeight - instr.y - heightImg
                : 40,
            width,
            height: heightImg,
          })
        }
      }
  
      const bytes = await pdfDoc.save()
  
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="annotated.pdf"')
      return res.send(Buffer.from(bytes))
    } catch (err) {
      console.error('Erreur annotation PDF:', err)
      return res.status(500).json({ error: 'Erreur lors de l’annotation du PDF.' })
    }
  })
  
  
  

app.listen(port, () => {
  console.log(`PDF backend listening on http://localhost:${port}`);
});
