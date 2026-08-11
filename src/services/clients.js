import client from "../api/client";

export const getClientByEmail = async (email) => {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new Error("El email no es válido");
  }

  try {
    const response = await client.get(`/api/clients`);

    const clients = response.data.clients;

    const clientByEmail = clients.find((el) => el.email === email);

    if (clientByEmail) {
      return clientByEmail;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};
