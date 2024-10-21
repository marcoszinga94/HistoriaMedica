import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const uri = process.env.MONGODB_URI;
let client;
let db;

app.use(cors());
app.use(express.json());

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('clinica');
  }

  if (!(await db.listCollections({ name: 'pacientes' }).hasNext())) {
    await db.createCollection('pacientes');
    console.log("Created 'pacientes' collection.");
  }

  return db;
}

export async function getPatients() {
  const db = await connectToDatabase();
  return await db.collection('pacientes').find({}).toArray();
}

export async function getPatient(id) {
  const db = await connectToDatabase();
  return await db.collection('pacientes').findOne({ _id: new ObjectId(id) });
}

export async function addPatient(patient) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').insertOne(patient);
  return result.insertedId;
}

// Nueva función para agregar consultas
export async function addConsultation(patientId, consultation) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').updateOne(
    { _id: new ObjectId(patientId) },
    {
      $push: {
        consultations: {
          ...consultation,
          _id: new ObjectId(),
          date: new Date(consultation.date)
        }
      }
    }
  );
  return result.modifiedCount > 0;
}

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching patient' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    const insertedId = await addPatient(patient);
    res.status(201).json({ insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Error adding patient' });
  }
});

// Nueva ruta para agregar consultas
app.post('/api/patients/:id/add-consultation', async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = req.body;

    if (!consultation.date || !consultation.diagnosis) {
      return res.status(400).json({
        error: 'Fecha y diagnóstico son requeridos'
      });
    }

    const success = await addConsultation(id, consultation);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        error: 'No se pudo agregar la consulta'
      });
    }
  } catch (error) {
    console.error('Error adding consultation:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});