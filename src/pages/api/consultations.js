import { ObjectId } from "mongodb";
import db from "../../lib/db"; // Asegúrate de que la conexión a la base de datos sea correcta

await db.connect();

// Crear consulta (POST)
export async function post({ request, params }) {
  console.log('Received POST request to /api/patients/:id/add-consultation');

  try {
    const { id } = params;
    const data = await request.json();

    const consultation = {
      date: new Date(data.date),
      diagnosis: data.diagnosis,
      notes: data.notes || '',
      createdAt: new Date()
    };

    const result = await db.collection('pacientes').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: {
          consultations: {
            ...consultation,
            _id: new ObjectId()
          }
        }
      }
    );

    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('No se pudo agregar la consulta');
    }
  } catch (error) {
    console.error('Error en POST /api/patients/:id/add-consultation:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Leer consultas (GET)
export async function get({ params }) {
  console.log('Received GET request to /api/patients/:id/consultations');
  try {
    const patient = await db.collection('pacientes').findOne({ _id: new ObjectId(params.id) });
    if (!patient) {
      return new Response(JSON.stringify({ success: false, error: "Paciente no encontrado" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(patient.consultations || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error al obtener las consultas:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Actualizar consulta (PUT)
export async function put({ request, params }) {
  console.log('Received PUT request to /api/patients/:patientId/consultations/:consultationId');
  const { patientId, consultationId } = params;
  try {
    const data = await request.json();
    const result = await db.collection('pacientes').updateOne(
      { _id: new ObjectId(patientId), "consultations._id": new ObjectId(consultationId) },
      { $set: { "consultations.$": { date: new Date(data.date), diagnosis: data.diagnosis, notes: data.notes } } }
    );

    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Consulta no encontrada" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error en PUT /api/patients/:patientId/consultations/:consultationId:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Eliminar consulta (DELETE)
export async function del({ params }) {
  console.log('Received DELETE request to /api/patients/:patientId/consultations/:consultationId');
  const { patientId, consultationId } = params;
  try {
    const result = await db.collection('pacientes').updateOne(
      { _id: new ObjectId(patientId) },
      { $pull: { consultations: { _id: new ObjectId(consultationId) } } }
    );

    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Consulta no encontrada" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error en DELETE /api/patients/:patientId/consultations/:consultationId:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
