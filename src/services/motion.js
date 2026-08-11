import client from "../api/client";

export const getMotionTests = async () => {
  try {
    const response = await client.get("/api/motion/motionTests");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los motion tests:", error);
    throw error;
  }
};

export const getMotionTest = async (id) => {
  try {
    const response = await client.get(`/api/motion/motionTests/${id}`);

    return response.data;
  } catch (error) {
    console.error(`Error al obtener el motion test con ID ${id}:`, error);
    throw error;
  }
};

export const updateMotion = async (id, updatedData) => {
  try {
    const response = await client.put(`/api/motion/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el motion test con ID ${id}:`, error);
    throw error;
  }
};

export const deleteMotion = async (id) => {
  try {
    const response = await client.delete(`/api/motion/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el motion test con ID ${id}:`, error);
    throw error;
  }
};

export const createMotion = async (motionData) => {
  if (!motionData.motionType) {
    throw new Error("El tipo de movimiento es requerido");
  }

  if (!motionData.clientId || !motionData.userId) {
    throw new Error("Se requieren clientId y userId");
  }

  try {
    const response = await client.post("/api/motion/create", motionData, {
      timeout: 45000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error || "Error al guardar la evaluación");
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.error || "Datos inválidos");
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("La conexión tardó demasiado. Verificá tu internet e intentá de nuevo.");
    }
    console.error("Error creando motion test:", error);
    throw error;
  }
};
