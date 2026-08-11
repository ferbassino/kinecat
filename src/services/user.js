import client from "../api/client";

export const fetchUserClients = async (userId) => {
  try {
    const response = await client.get("/api/clients");

    if (!response.data?.success) {
      throw new Error(
        response.data?.error || "Error en la respuesta del servidor",
      );
    }

    const currentUserClients = (response.data.clients || []).filter((item) =>
      (item.userId || []).some(
        (entry) => String(entry?._id || entry) === String(userId),
      ),
    );

    return currentUserClients;
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);

    if (error.response?.status === 401) {
      const authError = new Error("Sesión expirada");
      authError.status = 401;
      throw authError;
    }

    throw new Error(error.response?.data?.error || "Error al obtener clientes");
  }
};
