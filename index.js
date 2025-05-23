import dotenv from 'dotenv';
dotenv.config();

import { Client, Events, SlashCommandBuilder, GatewayIntentBits } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

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
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to be inverted')
                .setRequired(true));
    
    client.application.commands.create(ping);
    client.application.commands.create(invert);
});

// Listen for slash commands
client.on(Events.InteractionCreate, interaction => {

    // Ping slash command
    if (interaction.commandName === 'ping') {
        interaction.reply('Pong!');
    }

    // inversion slash command
    if (interaction.commandName === 'inversion') {
        const message = interaction.options.get('message').value;
        
        let stack = [];
        let invertedMessage = "";
        
        // Add characters in message to stack
        for (const char of message) {
            stack.push(char);
        }

        // Reverse order of characters from message
        for (let char = 0; stack.length; char++) {
            invertedMessage += stack.pop();
        }

        interaction.reply(invertedMessage);
    }
})

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
