# gpt-thread-extractor

A simple command-line tool to extract specific conversation threads from your ChatGPT data export into a clean, readable JSON format.

## The Problem

There's no clean way to get a raw format of you specific chats in ChatGPT, OpenAI provides a way by allowing export data which gives you the `conversations.json` file containing *all* your chats. While comprehensive, finding and reading a specific conversation within this large file can be difficult due to its nested structure and inclusion of system/tool messages.

## What This Tool Does

* **Finds Specific Chats:** Locates a conversation thread using its unique ID.
* **Extracts Key Messages:** Pulls out only the messages from the "user" and "assistant" (e.g., ChatGPT or a custom GPT).
* **Cleans Output:** Filters out system messages, tool calls, and other metadata.
* **Outputs Readable JSON:** Saves the cleaned conversation as a new JSON file, containing an array of formatted strings (`["user: Hello!", "assistant: Hi there!"]`).

## Getting Started

### Prerequisites

* [Bun](https://bun.sh) (v1.1.x or later recommended) installed.
* Your ChatGPT data export (specifically the `conversations.json` file).
* The ID of the conversation you wish to extract.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url> gpt-thread-extractor
    cd gpt-thread-extractor
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Setup: Preparing Your Data

1.  **Get Your Export:** Request your data export from OpenAI/ChatGPT settings (`Settings` > `Data Controls` > `Export Data`). You'll receive an email with a download link.
2.  **Unzip:** Download and unzip the exported file.
3.  **Locate File:** Find the `conversations.json` file inside the unzipped folder.
4.  **IMPORTANT: Place File:** Copy or move the `conversations.json` file into the **root directory** of this `gpt-thread-extractor` project (the same directory as `package.json`).
5.  **Find Conversation ID:** Identify the unique ID of the conversation you want. You can usually find this in the ChatGPT URL when viewing the chat:
    ```
    https://chatgpt.com/c/<CHAT_ID>
    ```
    This works for regular chats and chats with custom GPTs.

## Usage

Make sure you are in the project's root directory in your terminal.

Run the script using `bun run parse`, providing the Conversation ID via the `--id` flag:

```bash
#  saves to the project root
bun run parse --id YOUR_CONVERSATION_ID_HERE

# custom output file path/name:
bun run parse --id YOUR_CONVERSATION_ID_HERE --output my_chat.json
```

Things to Improve:
This was made as simple tool for myself, will plan for future improvements.

1. Large File Handling: Currently reads the entire conversations.json into memory. For extremely large export files (many gigabytes), this could be slow or fail. 
2. Better CLI: Use a dedicated library (like minimist or yargs-parser) for more robust command-line argument handling (e.g., -i, -o, --help).
3. Batch Extraction: Add functionality to extract multiple specified conversation IDs or all conversations at once.

# Author
Created by Gerard G. Ripin
