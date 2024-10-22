import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

// Función para conectar a la base de datos
async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db('clinica');
    console.log("Conectado a la base de datos");
  }
  return db;
}

// Operaciones CRUD

// Obtener todos los pacientes (Read)
export async function getPatients() {
  const db = await connectToDatabase();
  return await db.collection('pacientes').find({}).toArray();
}

// Obtener un solo paciente por ID (Read)
export async function getPatient(id) {
  const db = await connectToDatabase();
  return await db.collection('pacientes').findOne({ _id: new ObjectId(id) });
}

// Agregar un nuevo paciente (Create)
export async function addPatient(patient) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').insertOne(patient);
  return result.insertedId;
}

// Agregar una consulta a un paciente (Update)
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

// Actualizar los datos de un paciente (Update)
export async function updatePatient(id, updatedPatient) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedPatient }
  );
  return result.modifiedCount > 0;
}

// Eliminar un paciente por ID (Delete)
export async function deletePatient(id) {
  const db = await connectToDatabase();
  const result = await db.collection('pacientes').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
