// A custom api handler for sending data to api endpoints
export async function ApiHandler(
  apiUrl: string,
  method: string,
  payload: object,
) {
  const response = await fetch(apiUrl, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response;
}
