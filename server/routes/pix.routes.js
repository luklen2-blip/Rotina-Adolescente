import { Router } from 'express';

const router = Router();

export function generatePixPayload({ pixKey, name, city, amount, txId = '***' }) {
  const formatField = (id, value) => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = [
    formatField('00', 'br.gov.bcb.pix'),
    formatField('01', pixKey)
  ].join('');

  const additionalDataField = formatField('05', txId);

  let payload = [
    formatField('00', '01'), // Payload Format Indicator
    formatField('26', merchantAccountInfo), // Merchant Account Info
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Currency BRL
    amount ? formatField('54', Number(amount).toFixed(2)) : '', // Transaction Amount
    formatField('58', 'BR'), // Country Code
    formatField('59', (name || 'RITMO APP').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25)),
    formatField('60', (city || 'SAO PAULO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15)),
    formatField('62', additionalDataField),
    '6304' // CRC16 Indicator
  ].join('');

  // Cálculo CRC-16 / CCITT-FALSE
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

  return payload + crcHex;
}

import QRCode from 'qrcode';

// Gera o payload oficial do produto (R$ 19,90)
export function getOfficialPixPayload() {
  const pixKey = process.env.PIX_CHAVE || 'luklen2@gmail.com';
  const name = 'LUCIANO SANT ANNA';
  const city = 'SAO PAULO';
  const amount = 19.90;
  const txId = 'RTM1990';

  return generatePixPayload({ pixKey, name, city, amount, txId });
}

// GET /api/pix/qrcode.svg - Retorna o QR Code em formato vetorial SVG puro (100% nítido e de resolução infinita)
router.get('/qrcode.svg', async (req, res) => {
  try {
    const emvPayload = getOfficialPixPayload();
    const svg = await QRCode.toString(emvPayload, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    res.status(500).send('<svg xmlns="http://www.w3.org/2000/svg"><text y="20">Erro QR</text></svg>');
  }
});

// GET /api/pix/qrcode.png - Retorna o QR Code em alta resolução PNG (600x600 px, Ultra HD)
router.get('/qrcode.png', async (req, res) => {
  try {
    const emvPayload = getOfficialPixPayload();
    const buffer = await QRCode.toBuffer(emvPayload, {
      width: 600,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Erro ao gerar imagem');
  }
});

// GET & POST /api/pix/create - Retorna dados completos do PIX oficial R$ 19,90
const handlePixInfo = async (req, res) => {
  const emvPayload = getOfficialPixPayload();
  const txId = 'RTM1990';

  res.json({
    success: true,
    data: {
      plan: 'Ritmo Autonomia — Acesso Vitalício',
      amount: 19.90,
      currency: 'BRL',
      txId,
      chavePix: 'luklen2@gmail.com',
      titular: 'Luciano Sant Anna',
      copiaECola: emvPayload,
      qrCodeSvg: '/api/pix/qrcode.svg',
      qrCodePng: '/api/pix/qrcode.png',
      qrCodeUrl: '/api/pix/qrcode.svg',
      notice: 'Aviso Legal: Transação comercial oficial de R$ 19,90 para Acesso Vitalício ao Ritmo Autonomia.'
    }
  });
};

router.get('/', handlePixInfo);
router.get('/create', handlePixInfo);
router.post('/create', handlePixInfo);

export default router;
