import { extractConversationById } from './parser';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const args = Bun.argv.slice(2);

let chatId: string | undefined = undefined;
let outputFile: string | undefined = undefined;

//parse command line arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && i + 1 < args.length) {
        chatId = args[i + 1];
        i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
        outputFile = resolve(args[i + 1]!);
        console.log(`Output file set to: ${outputFile}`);
        i++;
    } else if (!chatId && args[i] && (args[i])!.includes('-') && (args[i])!.length > 30) {
        chatId = args[i];
    }
}

// input validation
if (!chatId) {
    console.error('Error: Conversation ID is required.');
    console.log('\nUsage: bun run parse --id <conversation_id> [--output <output_file.json>]');
    process.exit(1);
}

// check for conversations.json in the current directory (project root)
const conversationsPath = resolve('conversations.json'); //we assume the file is in the project root and the name is "conversations.json"
if (!existsSync(conversationsPath)) {
    console.error(`Error: conversations.json not found in the project root directory.`);
    console.log(`       Please place the conversations.json file here before running.`);
    process.exit(1);
}

const finalOutputFile = outputFile || resolve(`${chatId}.json`);

console.log(`Starting extraction for Conversation ID: ${chatId}`);
console.log(`Reading ${conversationsPath}...`);
console.log(`Output will be saved to: ${finalOutputFile}`);

try {
    const formattedMessages = await extractConversationById(chatId);

    if (formattedMessages) {

        const outputJsonString = JSON.stringify(formattedMessages, null, 2); //pretty print JSON

        await Bun.write(finalOutputFile, outputJsonString);
        console.log(`\nSuccessfully extracted chat and saved to: ${finalOutputFile}`);
    } else {
        console.log(`\nExtraction failed or conversation not found.`);
        process.exit(1);
    }

} catch (error) {
    console.error('\nAn unexpected error occurred in the main process:', error);
    process.exit(1);
}