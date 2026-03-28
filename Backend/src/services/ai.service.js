

import {ChatMistralAI} from '@langchain/mistralai'


export async function  aiChat(data){

    
const aichat = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    maxRetries: 2,

})


const response = await aichat.invoke(`
Generate exactly 2 tags based on the given title and description.

Rules:
- Output ONLY comma-separated tags
- No explanation
- No numbering
- No extra text
- Tags must be lowercase
- Max 1 word per tag

Example output:
react,node

Data:
${JSON.stringify(data)}
`);


return response.content.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)

}




