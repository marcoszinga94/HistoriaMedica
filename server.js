import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getPatients,
  getPatient,
  addPatient,
  addConsultation,
  updatePatient,
  deletePatient
} from './src/lib/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de la API
// Obtener todos los pacientes
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await getPatients();
    res.json(patients);
  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
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
    console.error('Error al obtener el paciente:', error);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
});

// Agregar un nuevo paciente
app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    const insertedId = await addPatient(patient);
    res.status(201).json({ success: true, insertedId });
  } catch (error) {
    console.error('Error al agregar paciente:', error);
    res.status(500).json({ success: false, error: 'Error al agregar el paciente' });
  }
});

// Agregar una consulta a un paciente existente
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
    console.error('Error al actualizar el paciente:', error);
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
    console.error('Error al eliminar el paciente:', error);
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
