async function verModelos() {
  const key = "AIzaSyDFIDaszIQGQENKsXWVpaWTLc_n6BbmXNc";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    console.log("--- Consultando modelos disponibles en Google Cloud ---");
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ ERROR DE GOOGLE:", data.error.message);
      return;
    }

    if (data.models) {
      console.log("✅ MODELOS ENCONTRADOS:");
      data.models.forEach(m => {
        console.log(`- ${m.name.replace('models/', '')}`);
      });
      console.log("\n👉 Usa uno de estos nombres en tu código de Next.js");
    } else {
      console.log("⚠️ Google no devolvió ningún modelo para esta clave.");
    }
  } catch (e) {
    console.error("❌ Error de red:", e.message);
  }
}
verModelos();