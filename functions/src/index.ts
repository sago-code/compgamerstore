import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Endpoint HTTP: POST /createProduct
export const createProduct = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { name, price, stock } = req.body ?? {};
    if (!name || typeof price !== 'number' || typeof stock !== 'number') {
      res.status(400).json({ error: 'Campos requeridos: name (string), price (number), stock (number)' });
      return;
    }

    const docRef = await db.collection('products').add({
      name,
      price,
      stock,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    res.status(201).json({ id: docRef.id, data: doc.data() });
  } catch (error) {
    console.error('Error creando producto', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

