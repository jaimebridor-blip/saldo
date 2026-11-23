import { Store } from './store';

export interface LlamarAIOpts {
  json?: boolean;
  clave?: string;
  modelo?: string;
}

export const AI = {
  tieneClave(): boolean {
    return Store.get().ia.clave.trim().length > 0;
  },

  async llamar(prompt: string, opts?: LlamarAIOpts): Promise<string> {
    const estado = Store.get();
    const clave = (opts?.clave ?? estado.ia.clave).trim();
    const modelo = (opts?.modelo ?? estado.ia.modelo).trim() || 'gemini-2.5-flash';

    if (!clave) {
      throw new Error('No hay clave configurada. Añádela en Ajustes si quieres usar la IA opcional.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelo
    )}:generateContent`;

    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (opts?.json) {
      body.generationConfig = {
        responseMimeType: 'application/json',
      };
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clave,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('Sin conexión a internet. Comprueba tu red e inténtalo de nuevo.');
    }

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(
          'Petición inválida (400). Revisa que la clave y el nombre del modelo sean correctos.'
        );
      }
      if (response.status === 403) {
        throw new Error(
          'Clave rechazada o sin permisos (403). En Google AI Studio, restringe la clave a «Generative Language API».'
        );
      }
      if (response.status === 429) {
        throw new Error(
          'Límite de uso gratuito alcanzado (429). Espera unos segundos y vuelve a intentarlo.'
        );
      }
      throw new Error(`Error del servicio (${response.status}). Inténtalo de nuevo más tarde.`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) {
      throw new Error('La respuesta no contiene texto útil.');
    }
    return texto;
  },

  async probar(
    clave?: string,
    modelo?: string
  ): Promise<{ ok: true; texto: string } | { ok: false; error: string }> {
    try {
      const texto = await AI.llamar('Responde únicamente con: OK', { clave, modelo });
      return { ok: true, texto: texto.trim() || 'OK' };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error desconocido al probar la clave.',
      };
    }
  },
};
