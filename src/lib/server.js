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

// Función para conectar a la base de datos
async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('clinica');
  }

  // Verificar si la colección 'pacientes' existe, y si no, crearla
  if (!(await db.listCollections({ name: 'pacientes' }).hasNext())) {
    await db.createCollection('pacientes');
    console.log("Se ha creado la colección 'pacientes'.");
  }

  return db;
}

// Operaciones CRUD

// Obtener todos los pacientes (Read - Leer)
export async function getPatients() {
  const db = await connectToDatabase();
  return await db.collection('pacientes').find({}).toArray();
}

// Obtener un solo paciente por ID (Read - Leer)
export async function getPatient(id) {
  const db = await connectToDatabase();
  return await db.collection('pacientes').findOne({ _id: new ObjectId(id) });
}

// Agregar un nuevo paciente (Create - Crear)
export async function addPatient(patient) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').insertOne(patient);
  return result.insertedId;
}

// Agregar una consulta a un paciente (Update - Actualizar)
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

// Actualizar los datos de un paciente (Update - Actualizar)
export async function updatePatient(id, updatedPatient) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedPatient }
  );
  return result.modifiedCount > 0;
}

// Eliminar un paciente por ID (Delete - Eliminar)
export async function deletePatient(id) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// Rutas de la API

// Obtener todos los pacientes
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
});

// Obtener un paciente por su ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
});

// Agregar un nuevo paciente
app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    const insertedId = await addPatient(patient);
    res.status(201).json({ insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el paciente' });
  }
});

// Agregar una consulta a un paciente existente
app.post('/api/patients/:id/add-consultation', async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = req.body;

    // Verificar que se incluyan la fecha y el diagnóstico
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
    console.error('Error al agregar la consulta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar los datos de un paciente existente
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPatient = req.body;

    const success = await updatePatient(id, updatedPatient);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Paciente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el paciente' });
  }
});

// Eliminar un paciente
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await deletePatient(id);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Paciente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
