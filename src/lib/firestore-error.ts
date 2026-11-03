// Traduce errores de Firestore a mensajes que el usuario pueda entender.
export function describeFirestoreError(err: unknown, fallback: string): string {
  const rawCode =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  // RN Firebase entrega "firestore/permission-denied"; el SDK web "permission-denied".
  const code = rawCode.replace(/^firestore\//, "");

  switch (code) {
    case "permission-denied":
      return "No tienes permiso para esta acción. Revisa las reglas de Firestore.";
    case "unavailable":
      return "Sin conexión con el servidor. Se reintentará automáticamente.";
    case "unauthenticated":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case "failed-precondition":
      return "Falta un índice en Firestore para esta consulta.";
    default:
      return err instanceof Error && err.message ? err.message : fallback;
  }
}
