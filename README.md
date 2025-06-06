# About

Discord Nexus is a Discord Bot using Discord.js v14.

Implements several quality-of-life improvements in enhancing the user experience. 

# Getting Started

## Prerequisites

Install the latest version of [Node](https://nodejs.org/en/download/) from here. 
This bot requires Node v16 or above to function.

Create a Discord bot [here](https://discord.com/developers) and have the bot token ready.

You can find the bot token under the "Bot" page for your selected bot. Click "Copy" to copy the bot token to clipboard.

See here for example:
![Bot token page for a Discord bot](https://github.com/ThePhysic/Discord-Butler/assets/57155067/24af185b-5e7d-46dc-aa84-a6af3f3f7770)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/RogueArt/discord-bot-template.git
```

2. Install node modules:
```bash
cd discord-bot-template
npm install
```

3. Configure the bot:
   1. Make a copy of `.env.example` and call it `.env`
   2. Replace the value for `BOT_TOKEN` with your Discord bot's token
   3. Change the prefix to any prefix you want to use for your commands

## Running

To run the bot, simply do `npm run start`. 

To run it in development mode, use `npm run dev` to live reload the bot as the source code changes.

## Remark
This Discord bot was designed with two users on a server in mind. With more than two users, the bot is unlikely to function as expected, and requires a few modifications in the code to accommodate this. 
Additionally, this won't work in a Group or Personal DM. Although slash commands are accessible in DM's, there may be limited capabilities if any additional information within the DM needs to be accessed
from restrictions on the bots due to Discord security policy. 


# Contributing

Feel free to fork this repo and change the code however you like! Make a pull request and I'll review it as soon as I can!

## Project Features & Status

<details>
  <summary>✅ Manually add new tasks to Amazing Marvin app from Discord (Completed)</summary>

  - Add a new task to your Amazing Marvin within Discord via nodemailer.
  - Has slash command implementation for seamless integration into Discord.
  - Execute the `/addtask` command and write the task you want to add (e.g. Clean kitchen +today ~30m).
  - Boolean option labeled as "mirror" to indicate whether you want the task to be created for only yourself (false) or both you and the other user in the chat (true). 
</details>

<details>
  <summary>✅ Auto-creation of thread processing task in Amazing Marvin app for archived threads (Completed)</summary>

  - When a message thread is closed manually or due to inactivity, the bot will send a messages to confirm if you're finished talking in the thread.
  - If you react with a thumbs down emoji the thread will be reopened.
  - If you react with a thumbs up emoji, the thread will stay closed and a new task will be created in both user's Amazing marvin to process the messages in your thread (in case you had any enlightening discussion or valuable insights come about in the thread. 
</details>

<details>
  <summary>✅ Automated titling for new message threads (Completed)</summary>

  - When a new message thread is created, the bot will checck the starter message (i.e. the message the thread is created for) for a title in the form `**THIS IS A TITLE**`. If it finds a title, it will be used as the title for the thread automatically. 
</details>

<details>
  <summary>✅ Message tracker for unresponded to messages (Completed)</summary>

  - Remembering and finding all the messages you may need to respond to in a server can be complex sometimes, so this designates a single message (a message tracker) to keep a list of all of them.
  - Executing the slash command `/review` and giving it the message link to the message you want reviewed (i.e. responded to) will be added to the message tracker, organized by user.
  - Message trackers are newly created when there are currently no other message trackers. Message trackers are pinned in a single channel.
  - Reacting to the message tracker with the ✅ emoji will unpin the message tracker. This indicates to the bot all reviews are finished, and thus any new reviews will be added to a newly created message tracker. 
</details>

<details>
  <summary>❌  Full review of all unresponded to messages (Not started)</summary>

  - Executing `/catalogreview` will result in an exhuastive breakdown of all open threads left unresponded to by each user.
  - This will serve as a check for any messages perhaps missed if you're running a server with many channels and many active threads. 
</details>

<details>
  <summary>More features still in the works!</summary>
</details>

<!-- Continue adding other sections as needed, following the same format -->
