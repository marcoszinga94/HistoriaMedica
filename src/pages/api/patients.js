import { ObjectId } from "mongodb";
import { addPatient } from "../../../server";
import db from "../../lib/db"; // Asegúrate de que la conexión a la base de datos sea correcta

await db.connect();

export async function post({ request }) {
  console.log('Received POST request to /api/patients');

  try {
    const data = await request.json();
    console.log('Received data:', data);

    if (data.isConsultation && data.patientId) {
      const consultation = {
        date: new Date(data.date),
        diagnosis: data.diagnosis,
        notes: data.notes || '',
        createdAt: new Date()
      };

      const result = await db.collection('pacientes').updateOne(
        { _id: new ObjectId(data.patientId) },
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
    }

    if (!data.fullName || !data.age) {
      throw new Error('Datos de paciente incompletos.');
    }

    const patient = {
      fullName: data.fullName,
      age: parseInt(data.age),
      weight: parseFloat(data.weight),
      insuranceProvider: data.insuranceProvider,
      insuranceNumber: data.insuranceNumber,
      consultations: [],
      createdAt: new Date()
    };

    console.log('Parsed patient data:', patient);

    const id = await addPatient(patient);
    console.log('Patient added successfully. Returning response.');

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in POST /api/patients:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Leer pacientes (GET)
export async function get() {
  console.log('Received GET request to /api/patients');
  try {
    const patients = await db.collection('pacientes').find({}).toArray();
    return new Response(JSON.stringify(patients), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Actualizar paciente (PUT)
export async function put({ request, params }) {
  console.log('Received PUT request to /api/patients/:id');
  const { id } = params;
  try {
    const data = await request.json();
    const result = await db.collection('pacientes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { fullName: data.fullName, age: data.age, weight: data.weight, insuranceProvider: data.insuranceProvider, insuranceNumber: data.insuranceNumber } }
    );

    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Paciente no encontrado" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error en PUT /api/patients/:id:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Eliminar paciente (DELETE)
export async function del({ params }) {
  console.log('Received DELETE request to /api/patients/:id');
  const { id } = params;
  try {
    const result = await db.collection('pacientes').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Paciente no encontrado" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error en DELETE /api/patients/:id:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
