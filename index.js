import dotenv from 'dotenv';
dotenv.config();

import { Client, Events, SlashCommandBuilder, GatewayIntentBits, Partials, InteractionCallback} from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

// Global  variables
const LINK_REGEX = /https:\/\/discord.com\/channels\/(@me|\d{19})\/(\d{18}|\d{19})\/(\d{19})/;
const THREAD_TITLE_REGEX = /(?<=\*\*)(.*?)(?=\*\*)/;
let THREAD_CONFIRMATION_ID = '';
let ARCHIVED_THREAD = '';

// Confirm bot is logged in
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // Create ping slash command
    const ping = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
    
    // Create inversion slash command
    const invert = new SlashCommandBuilder()
        .setName('inversion')
        .setDescription('Inverts the message you send')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to be inverted')
                .setRequired(true));
    
    // Create talking point slash command
    const talkingPoint = new SlashCommandBuilder()
        .setName('tp')
        .setDescription('Sends talking point to talking point channel')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The message link to be sent')
                .setRequired(true)); 
    
    client.application.commands.create(ping);
    client.application.commands.create(invert);
    client.application.commands.create(talkingPoint);

});

// Listen for slash commands
client.on(Events.InteractionCreate, interaction => {

    // Ping slash command
    if (interaction.commandName === 'ping') {
        interaction.reply('Pong!');
    }

    // Inversion slash command
    if (interaction.commandName === 'inversion') {
        const message = interaction.options.get('message').value;
        
        // Reverse string
        let invertedMessage = message.split('').reverse().join('');

        interaction.reply(invertedMessage);
    }
})

// Listen for threads being created
client.on(Events.ThreadCreate, async (thread) => {
    console.log(`Thread created: ${thread.name} in ${thread.parent.name}`);
     
    try {
        // Grab message thread was created
        const threadMessage = await thread.fetchStarterMessage();
        console.log(`Thread created from message: ${threadMessage.content}`);

        // Automate thread title by grabbing from starter message 
        const threadTitleMatch = threadMessage.content.match(THREAD_TITLE_REGEX);
        if (threadTitleMatch && threadTitleMatch[0]) {
            thread.setName(threadTitleMatch[0]);
        }
    } 
    catch (error) {
        console.error('Error fetching starter message:', error);
    }
});

// Listen for threads being archived
client.on(Events.ThreadUpdate, (oldThread, newThread) => {
    if (oldThread.archived === false && newThread.archived === true) {
        console.log(`Thread ${newThread.name} has been archived`);

        // Bot sends confirmation message for archiving thread
        const parentChannel = client.channels.cache.get(newThread.parentId);
        parentChannel.send(`Are you sure you want to archive ${newThread.name}? Confirm you've processed everything`);
        setTimeout(function() {
            console.log(parentChannel.lastMessageId);
            THREAD_CONFIRMATION_ID = parentChannel.lastMessageId;
        }, 1000)
        ARCHIVED_THREAD = newThread;
    }
});

// Listen for reactions to messages
client.on(Events.MessageReactionAdd, async (reaction) => {
    // Check if message reacted to is from bot
    if (reaction.message.author.id === client.user.id && reaction.message.id === THREAD_CONFIRMATION_ID) {
        // Get the emoji
        const emoji = reaction.emoji.name;
        const parentChannel = reaction.message.channel;

        // Check the reaction emoji for thread archival confirmation
        if (emoji === '👍') {
            parentChannel.send(`You've confirmed the archival of the thread`);
        }
        else if (emoji === '👎') {
            parentChannel.send(`You've elected to reopen the thread`);
            ARCHIVED_THREAD.setArchived(false);
        }
    }
});

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
