import dotenv from 'dotenv';
dotenv.config();

import { Client, Events, SlashCommandBuilder, GatewayIntentBits, Partials } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel
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
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
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
        
        // Reverse string
        let invertedMessage = message.split("").reverse().join("");

        interaction.reply(invertedMessage);
    }
})

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
