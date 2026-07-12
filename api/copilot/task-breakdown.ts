import { GoogleGenAI, Type } from "@google/genai";

// Standard Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { originalTask } = req.body;
  if (!originalTask || typeof originalTask !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'originalTask' in request body." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not set or contains default placeholder.");
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `Analise a atividade de rotina: "${originalTask}".
Crie uma versão estruturada e amigável para uma criança de 10 anos focada em incentivar o foco, atenção plena e concentração duradoura.
Divida a atividade em pequenos micro-passos concretos (máximo 4 passos), claros e sequenciais, para evitar distrações ou sobrecarga mental.
Forneça um título divertido e positivo, uma descrição curta e encorajadora em português, pontuação sugerida (entre 10 e 20 pontos) e um emoji adequado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "Você é um mentor especialista em psicologia infantil, rotinas saudáveis e desenvolvimento de foco. Seu objetivo é ajudar pais a adaptarem tarefas diárias para que crianças de 10 anos fiquem concentradas, calmas e motivadas, usando linguagem clara, positiva, leve e micro-passos visuais em português brasileiro.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Um título curto, amigável e focado na ação positiva.",
            },
            description: {
              type: Type.STRING,
              description: "Uma frase curta de incentivo positivo para iniciar a tarefa.",
            },
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 4 micro-passos.",
            },
            recommendedPoints: {
              type: Type.INTEGER,
            },
            recommendedEmoji: {
              type: Type.STRING,
            },
          },
          required: ["title", "description", "subtasks", "recommendedPoints", "recommendedEmoji"],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text received from Gemini API.");
    }

    const data = JSON.parse(textOutput.trim());
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Vercel Serverless Function AI Error:", error);
    const isKeyMissing = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY";
    const fallbackData = getSmartFallback(originalTask, isKeyMissing);
    return res.status(200).json(fallbackData);
  }
}

// Smart, context-aware rule-based fallback generator for kids' tasks in Portuguese
function getSmartFallback(originalTask: string, isKeyMissing: boolean) {
  const taskLower = originalTask.toLowerCase();

  if (
    taskLower.includes("café") ||
    taskLower.includes("cafe") ||
    taskLower.includes("comer") ||
    taskLower.includes("almoç") ||
    taskLower.includes("almoc") ||
    taskLower.includes("jantar") ||
    taskLower.includes("lanche") ||
    taskLower.includes("comida") ||
    taskLower.includes("aliment")
  ) {
    return {
      title: "Super Missão: Refeição Saudável 🍳",
      description: "Abasteça seu corpo com energia de verdade para se divertir muito!",
      subtasks: [
        "Pegar o prato, copo e talheres com cuidado",
        "Escolher alimentos saudáveis e nutritivos para colocar na mesa",
        "Sentar e comer devagar, aproveitando a refeição com atenção",
        "Levar a louça para a pia e passar um pano na mesa"
      ],
      recommendedPoints: 15,
      recommendedEmoji: "🍳",
      isFallback: true,
      apiKeyMissing: isKeyMissing
    };
  }

  if (
    taskLower.includes("dente") ||
    taskLower.includes("escovar") ||
    taskLower.includes("banho") ||
    taskLower.includes("lavar") ||
    taskLower.includes("pentear") ||
    taskLower.includes("fio dental") ||
    taskLower.includes("higiene")
  ) {
    const isBath = taskLower.includes("banho") || taskLower.includes("chuveiro");
    return {
      title: isBath ? "Ritual do Banho Refrescante 🧼" : "Operação Sorriso de Super-Herói 🪥",
      description: isBath ? "Hora de relaxar, tirar a sujeira do dia e ficar super cheiroso!" : "Mantenha seus dentes fortes, brilhantes e livres de monstrinhos!",
      subtasks: isBath ? [
        "Preparar a toalha e a roupa limpa antes de ligar o chuveiro",
        "Lavar todo o corpo e o cabelo com sabonete e shampoo",
        "Se secar muito bem com a toalha ao sair",
        "Colocar as roupas sujas no cesto e estender a toalha"
      ] : [
        "Colocar a quantidade certa de pasta (do tamanho de uma ervilha)",
        "Escovar todos os dentes (frente, trás e mastigação) por 2 minutos",
        "Escovar a língua com delicadeza e enxaguar bem a boca",
        "Lavar a escova, secar o rosto e guardar tudo no lugar"
      ],
      recommendedPoints: 12,
      recommendedEmoji: isBath ? "🧼" : "🪥",
      isFallback: true,
      apiKeyMissing: isKeyMissing
    };
  }

  if (
    taskLower.includes("quarto") ||
    taskLower.includes("arrumar") ||
    taskLower.includes("organizar") ||
    taskLower.includes("cama") ||
    taskLower.includes("brinquedo") ||
    taskLower.includes("guardar") ||
    taskLower.includes("limpar") ||
    taskLower.includes("roupa")
  ) {
    const isBed = taskLower.includes("cama");
    return {
      title: isBed ? "Missão Cama Perfeita 🛏️" : "Quartel-General Organizado 🧹",
      description: isBed ? "Esticar o lençol deixa o quarto lindo e pronto para um bom sono!" : "Um espaço organizado ajuda seu cérebro a pensar melhor e achar tudo rápido!",
      subtasks: isBed ? [
        "Retirar travesseiros e bichinhos de pelúcia da cama",
        "Esticar bem o lençol de baixo para tirar todas as dobras",
        "Esticar o edredom ou cobertor por cima de forma alinhada",
        "Colocar o travesseiro de volta no topo com capricho"
      ] : [
        "Juntar e guardar todos os brinquedos nas caixas corretas",
        "Organizar os livros na estante ou mesinha de estudos",
        "Recolher roupas espalhadas e colocar no cesto de roupa suja",
        "Dar uma olhada geral para ver se o chão ficou 100% livre"
      ],
      recommendedPoints: 15,
      recommendedEmoji: isBed ? "🛏️" : "🧹",
      isFallback: true,
      apiKeyMissing: isKeyMissing
    };
  }

  if (
    taskLower.includes("lição") ||
    taskLower.includes("licao") ||
    taskLower.includes("dever") ||
    taskLower.includes("estudar") ||
    taskLower.includes("escola") ||
    taskLower.includes("mochila") ||
    taskLower.includes("caderno") ||
    taskLower.includes("livro") ||
    taskLower.includes("ler") ||
    taskLower.includes("tema") ||
    taskLower.includes("aula") ||
    taskLower.includes("matemática") ||
    taskLower.includes("português")
  ) {
    const isBackpack = taskLower.includes("mochila") || taskLower.includes("escola");
    return {
      title: isBackpack ? "Missão Mochila Pronta 🎒" : "Desafio do Cérebro Ativo 📚",
      description: isBackpack ? "Deixe tudo preparado hoje para sua jornada escolar de amanhã ser incrível!" : "Treine sua mente focando em uma coisa de cada vez para aprender super rápido!",
      subtasks: isBackpack ? [
        "Conferir no estojo se lápis, borracha e canetas estão completos",
        "Olhar o cronograma de aulas e selecionar os livros e cadernos corretos",
        "Colocar a garrafa de água cheia e o lanche na mochila",
        "Fechar todos os zíperes e deixar a mochila perto da porta"
      ] : [
        "Organizar o estojo, caderno e materiais em uma mesa limpa",
        "Desligar as telas (TV, tablet, celular) e evitar distrações",
        "Ler as instruções com calma e responder cada questão com atenção",
        "Revisar o que fez e guardar o material na mochila escolar"
      ],
      recommendedPoints: 20,
      recommendedEmoji: isBackpack ? "🎒" : "📚",
      isFallback: true,
      apiKeyMissing: isKeyMissing
    };
  }

  if (
    taskLower.includes("celular") ||
    taskLower.includes("tablet") ||
    taskLower.includes("tela") ||
    taskLower.includes("videogame") ||
    taskLower.includes("computador") ||
    taskLower.includes("tv") ||
    taskLower.includes("jogo") ||
    taskLower.includes("jogar") ||
    taskLower.includes("eletronic")
  ) {
    return {
      title: "Desafio da Conexão Saudável 📱",
      description: "Aproveite o mundo digital com inteligência, postura e foco total!",
      subtasks: [
        "Definir um alarme com o tempo combinado de tela com os pais",
        "Manter a coluna reta e uma distância saudável de pelo menos um braço da tela",
        "Desligar o aparelho imediatamente assim que o alarme tocar, sem reclamar",
        "Fazer 5 minutos de alongamento ou olhar pela janela para descansar os olhos"
      ],
      recommendedPoints: 12,
      recommendedEmoji: "📱",
      isFallback: true,
      apiKeyMissing: isKeyMissing
    };
  }

  const formattedTitle = originalTask.length > 30 ? originalTask.substring(0, 27) + "..." : originalTask;
  return {
    title: `Desafio: ${formattedTitle} ✨`,
    description: "Vamos realizar essa atividade de forma divertida, um passo de cada vez!",
    subtasks: [
      "Preparar todos os materiais necessários para a tarefa",
      "Iniciar a primeira etapa com atenção total e sem pressa",
      "Revisar se tudo foi concluído com cuidado e capricho",
      "Organizar o espaço de volta e comemorar os pontos obtidos!"
    ],
    recommendedPoints: 15,
    recommendedEmoji: "✨",
    isFallback: true,
    apiKeyMissing: isKeyMissing
  };
}
