import { GoogleGenAI, Type } from "@google/genai";
import { AIMoveResponse, Player } from '../types';

// Initialize the Gemini API client
// Note: In a production environment, you should proxy this through a backend
// to keep your API key secure. For this demo, we use the client-side env var.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAIMove(
  board: Player[],
  difficulty: string
): Promise<AIMoveResponse> {
  try {
    // Construct a prompt that explains the board state and the goal
    // Represent the board as a simplified array for the model
    const boardRepresentation = board.map((cell, index) => 
      cell === null ? `Index ${index}: Empty` : `Index ${index}: ${cell}`
    ).join(', ');

    let systemInstruction = "You are playing a game of Tic-Tac-Toe. You are 'O'. 'X' is the opponent.";
    
    if (difficulty === 'hard') {
      systemInstruction += " You are a Grandmaster. You MUST play perfectly. If there is a winning move, take it. If you can block the opponent from winning, you MUST block. If neither, play strategically to force a win or draw. Never lose if it can be avoided.";
    } else {
      systemInstruction += " You are a casual player. You should play decently but occasionally make mistakes or play sub-optimally to let the opponent have a chance.";
    }

    const prompt = `
      Current Board State: [${boardRepresentation}]
      
      Analyze the board. Return the best move index (0-8) for 'O'. 
      Also provide a short, witty, 1-sentence comment about your move or the game state.
      If the chosen index is already occupied, you must choose a different empty index.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moveIndex: {
              type: Type.INTEGER,
              description: "The index (0-8) of the grid to place 'O'. Must be an empty spot.",
            },
            comment: {
              type: Type.STRING,
              description: "A short, witty comment about the move.",
            },
          },
          required: ["moveIndex", "comment"],
        },
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text) as AIMoveResponse;
      return result;
    }

    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error getting AI move:", error);
    // Fallback random move if API fails
    const emptyIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null) as number[];
    
    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    
    return {
      moveIndex: randomMove,
      comment: "I'm having trouble thinking... I'll just go here."
    };
  }
}
