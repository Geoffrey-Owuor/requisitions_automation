// A custom api handler for sending data to api endpoints
export async function ApiHandler(
  apiUrl: string,
  method: string,
  payload?: object,
) {
  const response = await fetch(apiUrl, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response;
}

// A variant for endpoints that accept file uploads (multipart/form-data).
// Content-Type is intentionally left unset so the browser attaches its own
// multipart boundary.
export async function ApiFormHandler(
  apiUrl: string,
  method: string,
  formData: FormData,
) {
  const response = await fetch(apiUrl, {
    method: method,
    body: formData,
  });

  return response;
}
