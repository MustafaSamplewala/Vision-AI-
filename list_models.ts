
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function listModels() {
    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response: any = await ai.models.list();

        let models = [];
        if (Array.isArray(response)) {
            models = response;
        } else if (response.models) {
            models = response.models;
        } else if (response.pageInternal) {
            models = response.pageInternal;
        }

        const simpleModels = models.map((m: any) => ({
            name: m.name,
            displayName: m.displayName,
            methods: m.supportedGenerationMethods
        }));

        fs.writeFileSync('models.json', JSON.stringify(simpleModels, null, 2));
        console.log(`Written ${simpleModels.length} models to models.json`);

    } catch (error: any) {
        console.error("Error listing models:", error);
    }
}

await listModels();
