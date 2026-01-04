
import { GoogleGenAI } from "@google/genai";
import { GameMode, Message, RPSubMode } from "../types";

const RP_INSTRUCTIONS: Record<RPSubMode, string> = {
  cyberpunk: "Мы играем в Киберпанк! 🏙️ Неон, дожди, импланты. Ты — Луки, дерзкий мастер игры. Создай атмосферу хай-тека и лоу-лайфа! 😎⚡",
  fantasy: "Мы играем в Фэнтези! 🐉 Мечи, магия, таверны. Ты — Луки, эпичный рассказчик. Начни приключение в мире чародейства! ⚔️✨",
  horror: "Мы играем в Хоррор! 🕯️ Тьма, шорохи, саспенс. Ты — Луки, который пугает, но остается своим бро. Нагоняй жути! 👻💀",
  custom: "Это свободный РП режим! ✍️ Ты — Луки, универсальный мастер. Подожди, пока пользователь опишет сеттинг, и подстройся под него максимально круто! 🚀🔥"
};

const SYSTEM_INSTRUCTIONS: Record<GameMode, string | ((sub: RPSubMode) => string)> = {
  [GameMode.FREE_CHAT]: "Твое имя - Луки АИ. Ты крутой, позитивный и очень общительный ИИ! 😎 Говори как живой человек, используй много эмодзи. Веди себя как лучший друг пользователя. ✨",
  [GameMode.RP_MODE]: (sub: RPSubMode) => `Ты — Луки, мастер ролевых игр. ${RP_INSTRUCTIONS[sub]} Общайся живым языком, используй много эмодзи, будь вовлеченным!`,
  [GameMode.TEXT_GAMES]: "Йоу, я Луки! Давай поиграем в разговорные игры! 🎮 Предложи на выбор: 'Загадки', 'Данетки', 'Города' или 'Словесный детектив'. Веди игру весело! 😉🔥",
  [GameMode.IMAGE_ANALYSIS]: "Я Луки и у меня глаз-алмаз! 👀 Опишу тебе всё, что вижу на фото: стиль, вайб, интересные мелочи. Будто мы обсуждаем крутой кадр вместе! 🎨✨",
  [GameMode.IMAGE_GAMES]: "Ха! Я Луки, и я загадал кое-что на твоем фото! 😉 Давай поиграем. Буду давать хитрые подсказки про объект на картинке. Погнали! 🕵️‍♂️🔥"
};

export async function processInteraction(
  mode: GameMode,
  message: string,
  imageData: string | null,
  history: Message[],
  rpSubMode: RPSubMode = 'cyberpunk'
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  
  const contents: any[] = [];
  
  // Clean history to keep context manageable
  const recentHistory = history.slice(-6); 
  recentHistory.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  const parts: any[] = [{ text: message }];

  // Handle Image Data if present
  if (imageData) {
    const splitData = imageData.split(',');
    if (splitData.length > 1) {
      const mimeType = splitData[0].split(':')[1].split(';')[0];
      const base64Data = splitData[1];
      parts.push({
        inlineData: { data: base64Data, mimeType: mimeType }
      });
    }
  }

  contents.push({ role: 'user', parts: parts });

  const instruction = typeof SYSTEM_INSTRUCTIONS[mode] === 'function' 
    ? (SYSTEM_INSTRUCTIONS[mode] as Function)(rpSubMode)
    : SYSTEM_INSTRUCTIONS[mode];

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: instruction as string,
        temperature: 0.9,
      }
    });

    return result.text || "Луки немного задумался... Можешь повторить? 😅✨";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
